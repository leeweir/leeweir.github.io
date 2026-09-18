---
title: "[译] A deep dive into Kubernetes controllers"
slug: "a-deep-dive-into-kubernetes-controllers"
date: "2020-03-06T17:24"
tags: ["cloud-native"]
description: "原文地址"
---

> [原文地址](https://engineering.bitnami.com/articles/a-deep-dive-into-kubernetes-controllers.html)

Kubernetes 运行一组控制器，它们负责处理日常任务，以确保集群的期望状态与观察到的状态一致。例如，[Replica Sets](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/) 维护在集群中运行的正确数量的 pods。[Node Controller](https://kubernetes.io/docs/concepts/architecture/nodes/#node-controller) 查找服务器的状态，并在服务器宕机时做出响应。基本上，每个控制器负责 Kubernetes 世界中的特定资源。对于用户管理他们的集群，用户理解 Kubernetes 中每个控制器的角色是很重要的。然而，你曾经想过 Kubernetes 的控制器是如何工作的吗？更令人兴奋的是，您是否考虑过编写自己的自定义控制器？

这是两篇系列文章的第一篇，在这篇文章中，我将概述 Kubernetes 控制器的内部结构、基本组件及其工作方式。在第二篇文章中，我将指导您实践如何编写自己的控制器来为集群构建一个简单的通知系统。

## 控制器模式 {#控制器模式}

Kubernetes 控制器的最佳解释可以在 Kubernetes 官方文档网页中找到：

> In applications of robotics and automation, a control loop is a non-terminating loop that regulates the state of the system. In Kubernetes, a controller is a control loop that watches the shared state of the cluster through the API server and makes changes attempting to move the current state towards the desired state. Examples of controllers that ship with Kubernetes today are the replication controller, endpoints controller, namespace controller, and serviceaccounts controller.

> Kubernetes 官方文档, [Kube-controller-manager](https://kubernetes.io/docs/admin/kube-controller-manager/)

为了降低复杂性，所有的控制器都打包在一个名为 kube-controller-manager 的守护进程中。控制器最简单的实现是循环：

```go
for {
  desired := getDesiredState()
  current := getCurrentState()
  makeChanges(desired, current)
}
```

## 控制器组件 {#控制器组件}

一个控制器有两个主要组件： Informer/SharedInformer 和 Workqueue。  
Informer/SharedInformer 监视 Kubernetes 对象当前状态的变化，并将事件发送到 Workqueue，然后 worker(s) 进行消费处理。

### Informer {#Informer}

Kubernetes 控制器的关键作用是观察对象的期望状态和实际状态，然后发送指令使实际状态更接近期望状态。为了检索对象的当前状态，控制器会向 Kubernetes API server 发送一个请求。

但是，从 API server 反复检索信息可能会变得非常昂贵。因此，为了在代码中多次获取和列出对象，Kubernetes 开发人员最终使用了 client-go 库已经提供的缓存。此外，控制器并不想连续发送请求。它只关心对象被创建、修改或删除时的事件。client-go 库提供 Listwatcher 接口，该接口执行初始列表并启动对特定资源的监视：

```go
lw := cache.NewListWatchFromClient(
      client,
      &v1.Pod{},
      api.NamespaceAll,
      fieldSelector)
```

这些消息都被 Informer 消费。Informer 的一般结构描述如下：

```go
store, controller := cache.NewInformer {
    &cache.ListWatch{},
    &v1.Pod{},
    resyncPeriod,
    cache.ResourceEventHandlerFuncs{},
```

尽管 Informer 在当前的 Kubernetes 中并没有被大量使用(而是使用 SharedInformer，我将在稍后解释)，但它仍然是一个需要理解的基本概念，特别是当您希望编写自定义控制器时。以下是用于构造 Informer 的三种模式：

#### LISTWATCHER {#LISTWATCHER}

Listwatcher 是针对特定 namespace 中的特定资源的 list 函数和 watch 函数的组合。这有助于控制器只关注它想要查看的特定资源。fieldSelector 是一种筛选器，它缩小了搜索资源的结果范围，就像控制器希望检索与特定字段匹配的资源一样。Listwatcher的结构描述如下：

```go
cache.ListWatch {
    listFunc := func(options metav1.ListOptions) (runtime.Object, error) {
        return client.Get().
            Namespace(namespace).
            Resource(resource).
            VersionedParams(&options, metav1.ParameterCodec).
            FieldsSelectorParam(fieldSelector).
            Do().
            Get()
    }
    watchFunc := func(options metav1.ListOptions) (watch.Interface, error) {
        options.Watch = true
        return client.Get().
            Namespace(namespace).
            Resource(resource).
            VersionedParams(&options, metav1.ParameterCodec).
            FieldsSelectorParam(fieldSelector).
            Watch()
    }
}
```

#### RESOURCE EVENT HANDLER {#RESOURCE-EVENT-HANDLER}

Resource Event Handler 是控制器接收到变更消息后处理特定资源的地方：

```go
type ResourceEventHandlerFuncs struct {
    AddFunc    func(obj interface{})
    UpdateFunc func(oldObj, newObj interface{})
    DeleteFunc func(obj interface{})
}
```

-   AddFunc 在一个新的资源创建时被调用。
-   UpdateFunc 在已有的资源被修改时被调用。oldObj 是资源的最后一个已知状态。当重新同步发生时，UpdateFunc 也会被调用，即使没有任何变化，它也会被调用。
-   DeleteFunc 在已有资源被删除的时候被调用。它获取资源的最终状态(如果它是已知的)。否则，它将获取类型为 DeletedFinalStateUnknown 的对象。比如 watch 关闭并错过了删除事件，而控制器直到后面重新 watch 才注意到删除事件，就会发生这种情况。

#### RESYNCPERIOD {#RESYNCPERIOD}

ResyncPeriod 定义了控制器遍历缓存中所有对象的频率，同时它会调用 UpdateFunc。这提供了一种配置，用于周期性地验证当前状态，并使其和所需的状态保持一致。

它在控制器可能错过更新或之前的操作失败的情况下非常有用。但是，如果构建自定义控制器，则必须注意 CPU 负载(如果周期太短)。

### SharedInformer {#SharedInformer}

Informer 创建一组仅由自己使用的资源的本地缓存。但是，在Kubernetes中，有一组控制器在运行并关心多种资源，这意味着会有重叠——一个资源由多个控制器管理。

在本例中，SharedInformer 帮助在控制器之间创建单个共享缓存。这意味着缓存的资源不会被复制，这样做可以减少系统的内存开销。此外，每个 SharedInformer 只在上游服务器上创建一个表，而不管有多少下游消费者正在消费，这也减少了上游服务器的负载，这对于拥有如此多内部控制器的 kube-controller-manager 是很有用的。

SharedInformer 已经提供了钩子来接收添加、更新和删除特定资源的通知，它还提供了访问共享缓存和确定何时启动缓存的函数。这为我们节省了与 API Server 的连接、服务器端序列化、反序列化以及缓存的重复开销。

```go
lw := cache.NewListWatchFromClient(…)
sharedInformer := cache.NewSharedInformer(lw, &api.Pod{}, resyncPeriod)
```

### Workqueue {#Workqueue}

SharedInformer 不能跟踪每个控制器的位置(因为它是共享的)，所以控制器必须提供自己的队列和重试机制(如果需要)。因此，大多数 Resource Event Handlers 只是将项放置到每个使用者的 Workqueue 中。

当一个资源更新时，Resource Event Handler 会往 Workqueue 写入一个 key。key 使用 `<resource_namespace>/<resource_name>` 格式，如果 `<resource_namespace>` 为空，那就是 `<resource_name>`。通过这样做，事件通过 key 分解，因此每个使用者都可以使用 worker(s) 来拿到 key，并按顺序处理。这将保证没有多个 workers 在同一时间在同一个 key 上处理。

Workqueue 在 client-go 中的 `client-go/util/workqueue`。 现在支持多种 queue 的类型，包括 delayed queue, timed queue 和 rate limiting queue。

下面是一个创建 rate limiting queue 的例子：

```go
queue :=
workqueue.NewRateLimitingQueue(workqueue.DefaultControllerRateLimiter())
```

Workqueue 提供一个便利的函数去管理这些 keys。下面这个图描述 Workqueue 里 key 的生命周期：

![](/posts/a-deep-dive-into-kubernetes-controllers/key-lifecicle-workqueue.png "This is an image")

在处理事件失败的情况下，控制器调用 AddRateLimited() 函数，将它的 key 退回到 Workqueue，以便稍后使用预定义的重试次数继续工作。反之，如果进程成功，则可以通过调用 Forget() 函数从 Workqueue 中删除 key。但是，该函数只会阻止 Workqueue 跟踪事件的历史。为了从 Workqueue 中完全删除事件，控制器必须触发 Done() 函数。

因此，Workqueue 可以处理来自缓存的通知，但问题是，控制器何时应该启动 workers 处理 Workqueue?为了获得最新的状态，控制器应该等待直到缓存完全同步，这有两个原因：

1.  在缓存完成同步之前，列出所有资源是不准确的。
    
2.  缓存/队列会将对单个资源的多次快速更新折叠为最新版本。因此，它必须等到缓存变为空闲后才能实际处理项目，以免浪费中间状态。
    

下面这段伪代码描述了这个逻辑：

```go
controller.informer = cache.NewSharedInformer(...)
controller.queue = workqueue.NewRateLimitingQueue(workqueue.DefaultControllerRateLimiter())

controller.informer.Run(stopCh)

if !cache.WaitForCacheSync(stopCh, controller.HasSynched)
{
    log.Errorf("Timed out waiting for caches to sync"))
}

// Now start processing
controller.runWorker()
```

## What’s next {#What’s-next}

到目前为止，我只是给你一个 Kubernetes 控制器的概述：它是什么，它是用来做什么的，它是由什么组件构成的，它是如何工作的。最令人兴奋的是 Kubernetes 允许用户集成他们自己的控制器。第二部分更有趣，我将向您展示一个自定义控制器的用例，并指导您用几行代码编写它：

-   [Part II: Kubewatch, an example of Kubernetes custom controller](https://engineering.bitnami.com/articles/kubewatch-an-example-of-kubernetes-custom-controller.html)

让我们继续！
