---
title: "一个 Connect Timeout 故障排查"
slug: "connect-timeout-problem"
date: "2019-10-21T11:28"
tags: ["sre","tcp"]
description: "有用户反馈在dubbo的应用发布后，过几分钟之后，调用方会出现大量的connectTimeout。当时在服务端容器上进行了抓包，看到在故障期间，客户端发了syn，但是服务端没有任何响应。"
---

## 问题描述 {#问题描述}

有用户反馈在dubbo的应用发布后，过几分钟之后，调用方会出现大量的connectTimeout。当时在服务端容器上进行了抓包，看到在故障期间，客户端发了syn，但是服务端没有任何响应。

![](/posts/connect-timeout-problem/1.png "This is an image")

## 分析问题 {#分析问题}

正常的TCP三次握手：

![](/posts/connect-timeout-problem/2.png "This is an image")

-   客户端发送syn给服务端发起握手
    
-   服务端收到syn后回复syn+ack
    
-   客户端收到syn+ack后，回复ack给服务端，此时客户端上这个连接，进入established
    

从问题描述看，客户端发的sys包到服务端后直接没响应了，我初步猜测是syn队列满了，通过netstat -s去查看队列的情况：

```text
3220 times the listen queue of a socket overflowed
3220 SYNs to LISTEN sockets dropped
```

### syn队列和accept队列 {#syn队列和accept队列}

这里先解释下syn队列和accept队列：

![](/posts/connect-timeout-problem/3.png "This is an image")

上图结合三次握手来说看

-   客户端使用connect()向服务端发起连接请求（发送syn包），此时客户端的TCP的状态为 SYN\_SENT
    
-   服务端在收到SYN包后，将TCP相关信息放到 syn队列中，同时向客户端发送syn+ack。服务端TCP的状态为SYN\_RCVD
    
-   客户端收到服务端的syn+ack后，向服务端发送ack，此时客户端的TCP的状态为 ESTABLISHED。服务端收到ack确认后，从 syn队列里将 TCP 信息取出，并放到 accept队列中，此时服务端的TCP的状态为 ESTABLISHED
    

我们可以大概了解了syn队列和accept队列，那再看上面的问题，overflowed代表accept队列溢出，droped代表syn队列溢出，发现 3220 SYNs to LISTEN sockets dropped，这个就是代表syn队列溢出吗？

### overflowed和dropped为什么一样多 {#overflowed和dropped为什么一样多}

这里又引出一个问题，可以看到overflowed和dropped竟然一样多，翻看[内核源码](https://elixir.bootlin.com/linux/v4.14.67/source/net/ipv4/tcp_ipv4.c#L1414):

![](/posts/connect-timeout-problem/4.png "This is an image")

可以看到overflow的时候，tcp dropped也会增加，也就是dropped一定大于等于overflowed。这样看，overflowed和dropped是一样的，只能说明accept队列溢出了，而syn队列溢出为0（3220-3220）。

### 进一步分析 {#进一步分析}

但是按照syn队列和accept队列的设计，accept队列满了应该不影响syn响应，即不影响三次握手。带着这个疑问我们再次翻看了[内核源码](https://elixir.bootlin.com/linux/v4.14.67/source/net/ipv4/tcp_input.c#L6335)

![](/posts/connect-timeout-problem/5.png "This is an image")

可以看到在建连的时候，会判断accept队列，如果accept队列满了，就会drop，即把这个syn包丢掉了。到这里，基本上原因已经查明了。

### 如何优化 {#如何优化}

按照之前的分析，大概定位到是因为accept队列满了，我们通过ss -lnt查看下：

```text
State      Recv-Q Send-Q                                 Local Address:Port                                   Peer Address:Port 
LISTEN     0      50                                                 *:20990                                             *:*
```

上面看到的第二列Send-Q 表示第三列的listen端口上的accept队列最大为50，第一列Recv-Q为accept队列当前使用了多少。

> accept队列的大小取决于：min(backlog, somaxconn) . backlog是在socket创建的时候传入的，somaxconn是一个os级别的系统参数。

> syn队列的大小取决于：max(64, /proc/sys/net/ipv4/tcp\_max\_syn\_backlog)。 不同版本的os会有些差异。

在这个case中，因为用户的程序发布拉入后，有大量的客户端发起请求，从而导致应用的accept队列满了，然后导致syn被丢弃。用户的应用上配置的backlog为50，所以发现这个现象后，通知研发去更新了dubbo应用的backlog，同时进行发布验证，发现问题已经消失了，至此问题解决。

## 总结 {#总结}

通过文章对故障的分析，大家了解了syn队列和accept队列的一些知识，同时也了解了如何去观测和优化。其实在生产环境中，这种问题比较常见，也很容易被忽视，希望这篇分析对大家有所帮助。

最后引用下阿里童鞋的一句话：

> 每个具体问题都是最好学习的机会，光看书理解肯定是不够深刻的，请珍惜每个具体问题，碰到后能够把来龙去脉弄清楚。
