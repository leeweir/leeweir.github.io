---
title: "LIVENESS PROBE 的问题"
slug: "liveness-probe-problem"
date: "2020-06-28T11:55"
tags: ["cloud-native","best-practive"]
description: "Kubernetes 提供了两种功能 Readiness and Liveness Probes，它们可以定期执行操作（例如发出 HTTP 请求，打开 TCP 连接或在您的容器中运行命令），以确认您的应用程序按预期工作。"
---

## Readiness and Liveness Probes {#Readiness-and-Liveness-Probes}

Kubernetes 提供了两种功能 [Readiness and Liveness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)，它们可以定期执行操作（例如发出 HTTP 请求，打开 TCP 连接或在您的容器中运行命令），以确认您的应用程序按预期工作。

Kubernetes 使用 Readiness Probes 来了解容器何时准备开始接受流量。当 Pod 的所有容器都准备就绪时，即视为准备就绪。该功能的一种用法是控制将哪些 Pod 用作 Kubernetes Services（尤其是Ingress）的后端。

Kubernetes 使用 Liveness Probes 知道何时重新启动容器。例如，Liveness Probes 可能会遇到一个死锁，即应用程序 Hang 死了。在存在这种状态的情况下重新启动容器可以帮助使应用程序在存在错误的情况下快速恢复，但是重新启动也可能导致级联失败。

### Example {#Example}

Readiness Probe 通过默认设置（间隔：10 秒，超时：1 秒，成功阈值：1，故障阈值：3）通过 HTTP 访问 /health 路径：

```yaml
# part of a larger deployment/stack definition
podTemplate:
  spec:
    containers:
    - name: my-container
      # ...
      readinessProbe:
        httpGet:
          path: /health
          port: 8080
```

## 最佳实践 {#最佳实践}

### 应该做的 {#应该做的}

-   对于提供 HTTP endpoint 的微服务来说，请始终定义一个 Readiness Probes，以检查您的应用程序（Pod）是否已准备好接收流量
-   确保 Readiness Probes 覆盖了实际 Web 服务器端口的就绪状态
    -   使用 admin 或 management 端口（例如 9090）进行 readinessProbe 时，请确保只有在主 HTTP 端口（例如 8080）准备好接受流量时，端点才返回 OK
    -   为 Readiness Probes 设置不同的端口，一般不能检测主端口上的线程拥塞问题（主服务器线程池已满，但运行状况检查仍然可以确定）
-   确保 Readiness Probes 包括数据库初始化/迁移
    -   仅数据库初始化完成之后启动HTTP服务器侦听
-   使用 `httpGet` 来探测 Readiness Probes 设置的检测地址（例如 /health）
-   了解探针的默认行为（间隔：10s，超时：1s，successThreshold：1，failureThreshold：3）
    -   默认值表示 Pod 将在约 30 秒后变为未就绪状态（3 次运行状况检查失败）
-   如果您的技术栈（例如 Java/Spring）允许此端口将管理运行状况和指标与正常流量分开，请使用其他 admin 或 management 端口
-   您可以根据需要使用 Readiness Probe 进行预热/缓存加载，并返回503 状态代码，直到应用容器预热完成

### 不应该做的 {#不应该做的}

-   Readiness/Liveness Probes 不依赖外部依赖项（例如数据存储），因为这可能会导致级联失败
    -   例如，具有 10 个 Pod 的有状态 REST 服务，它依赖于一个 PostgresSQL 数据库：当您的探针依赖于一个有效的数据库连接时，如果数据库/网络出现抖动，则所有 10 个 Pod 都将 down，这通常会使影响变得更糟
    -   请注意，Spring Data 的默认行为是检查数据库连接
    -   在这种情况下，“外部”也可能意味着同一应用程序的其他 Pod，即，理想情况下，您的探针不应依赖于同一集群中其他 Pod 的状态以防止级联故障
-   除非您了解后果以及为什么需要 Liveness Probes，否则请勿对您的 Pods 使用 Liveness Probes
    -   Liveness Probes 可以帮助恢复“卡住”的容器，但是当您完全拥有应用程序时，不应期望“卡住”进程和死锁之类的东西-一种更好的选择是故意崩溃以恢复到已知的良好状态
    -   Liveness Probes 失败将导致容器重新启动，从而有可能使与负载相关的错误的影响更严重：容器重新启动将导致停机（至少您的应用启动时间，例如 30s+），从而导致其他容器接受更多的流量，导致更多的错误
    -   Liveness Probes 与外部依赖项相结合是导致连锁故障的最坏情况：单个数据库故障将重新启动所有容器
-   如果您使用 Liveness Probes ，请不要和 Readiness Probes 设置相同的规范
    -   您可以使用具有相同运行状况检查的 Liveness Probes，但故障阈值较高（例如，在 3 次尝试后标记为未就绪，而在 10 次尝试后标记为 Liveness Probes 失败）
-   不要使用 `exec` 探针，因为已知的问题会导致僵尸进程
    -   [failure stories by Datadog](https://www.youtube.com/watch?v=QKI-JRs2RIE)

## 总结 {#总结}

-   使用适用于您的 Web 应用程序的 Readiness Probes 来确定 Pod 何时应接收流量
-   仅在有真实的用例的情况下才使用 Liveness Probes
-   错误使用 Readiness/Liveness Probes 可能会导致可用性降低和级联故障
