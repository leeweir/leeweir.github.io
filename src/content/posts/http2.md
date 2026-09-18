---
title: "HTTP/2 介绍"
slug: "http2"
date: "2018-02-06T13:58"
tags: ["http2","https"]
description: "2017年公司全面切换到了https和http/2，以前也陆续整理了些材料，这里算做一下总结。"
---

2017年公司全面切换到了https和http/2，以前也陆续整理了些材料，这里算做一下总结。

> HTTP/2 is a replacement for how HTTP is expressed “on the wire.” It is not a ground-up rewrite of the protocol; HTTP methods, status codes and semantics are the same, and it should be possible to use the same APIs as HTTP/1.x (possibly with some small additions) to represent the protocol.

HTTP/2是现行HTTP协议（HTTP/1.x）的替代，但它不是重写，HTTP方法/状态码/语义都与HTTP/1.x一样。HTTP/2基于SPDY3，专注于性能，最大的一个目标是在用户和网站间只用一个连接（connection）。

HTTP/2由两个规范（Specification）组成：

-   Hypertext Transfer Protocol version 2 - RFC7540
-   HPACK - Header Compression for HTTP/2 - RFC7541

## 为什么需要HTTP/2 {#为什么需要HTTP-2}

我们知道，影响一个HTTP网络请求的因素主要有两个：带宽和延迟。在今天的网络情况下，带宽一般不再是瓶颈，所以我们主要讨论下延迟。延迟一般有下面几个因素：

> 浏览器阻塞（Head-Of-Line Blocking）：浏览器会因为一些原因阻塞请求。  
> DNS查询。  
> 建立连接（Initial connection）：HTTP基于 TCP 协议，TCP的3次握手和慢启动极大增加延迟。

说完背景，我们讨论下HTTP/1.x中到底存在哪些问题？

### HTTP/1.x的缺陷 {#HTTP-1-x的缺陷}

#### 连接无法复用 {#连接无法复用}

连接无法复用会导致每次请求都经历三次握手和慢启动。三次握手在高延迟的场景下影响较明显，慢启动则对文件类大请求影响较大。

-   HTTP/1.0传输数据时，每次都需要重新建立连接，增加延迟。
-   1.1虽然加入keep-alive可以复用一部分连接，但域名分片等情况下仍然需要建立多个connection，耗费资源，给服务器带来性能压力。

#### Head-Of-Line Blocking {#Head-Of-Line-Blocking}

导致带宽无法被充分利用，以及后续健康请求被阻塞。HOLB是指一系列包（package）因为第一个包被阻塞；HTTP/1.x中，由于服务器必须按接受请求的顺序发送响应的规则限制，那么假设浏览器在一个（tcp）连接上发送了两个请求，那么服务器必须等第一个请求响应完毕才能发送第二个响应——HOLB。

-   虽然现代浏览器允许每个origin建立6个connection，但大量网页动辄几十个资源，HOLB依然是主要问题。

#### 协议开销大 {#协议开销大}

HTTP/1.x中header内容过大（每次请求header基本不怎么变化），增加了传输的成本。

#### 安全因素 {#安全因素}

HTTP/1.x中传输的内容都是明文，客户端和服务端双方无法验证身份。

## HTTP/2的新特性 {#HTTP-2的新特性}

因为HTTP/1.x的问题，人们提出了各种解决方案。比如希望复用连接的长链接/http long-polling/websocket等等，解决HOLB的Domain Sharding（域名分片）/inline资源/css sprite等等。

不过以上优化都绕开了协议，直到谷歌推出SPDY，才算是正式改造HTTP协议本身。降低延迟，压缩header等等，SPDY的实践证明了这些优化的效果，也最终带来HTTP/2的诞生。

### 新的二进制格式（Binary Format） {#新的二进制格式（Binary-Format）}

http1.x诞生的时候是明文协议，其格式由三部分组成：start line（request line或者status line），header，body。要识别这3部分就要做协议解析，http1.x的解析是基于文本。基于文本协议的格式解析存在天然缺陷，文本的表现形式有多样性，要做到健壮性考虑的场景必然很多，二进制则不同，只认0和1的组合。基于这种考虑http2.0的协议解析决定采用二进制格式，实现方便且健壮。

![](/posts/http2/1.png "This is an image")

http2的格式定义十分高效且精简。length定义了整个frame的大小，type定义frame的类型（一共10种），flags用bit位定义一些重要的参数，stream id用作流控制，payload就是request的正文。

![](/posts/http2/2.png "This is an image")

### Header压缩 {#Header压缩}

http1.x的header由于cookie和user agent很容易膨胀，而且每次都要重复发送。

http2.0使用encoder来减少需要传输的header大小，通讯双方各自cache一份header fields表，既避免了重复header的传输，又减小了需要传输的大小。高效的压缩算法可以很大的压缩header，减少发送包的数量从而降低延迟。

### 流（stream）和多路复用（MultiPlexing） {#流（stream）和多路复用（MultiPlexing）}

什么是stream？

> Multiplexing of requests is achieved by having each HTTP request/response exchange associated with its own stream. Streams are largely independent of each other, so a blocked or stalled request or response does not prevent progress on other streams.

> A “stream” is an independent, bidirectional sequence of frames exchanged between the client and server within an HTTP/2 connection.

> A client sends an HTTP request on a new stream, using a previously unused stream identifier. A server sends an HTTP response on the same stream as the request.  
> Multiplexing of requests is achieved by having each HTTP request/response exchange associated with its own stream.

翻译下，stream就是在HTTP/2连接上的双向帧序列。每个http request都会新建自己的stream，response在同一个stream上返回。

多路复用（MultiPlexing），即连接共享。之所以可以复用，是因为每个stream高度独立，堵塞的stream不会影响其它stream的处理。一个连接上可以有多个stream，每个stream的frame可以随机的混杂在一起，接收方可以根据stream id将frame再归属到各自不同的request里面。

### 流量控制（Flow Control） {#流量控制（Flow-Control）}

类似TCP协议通过sliding window的算法来做流量控制，http2.0使用 WINDOW\_UPDATE frame 来做流量控制。每个stream都有流量控制，这保证了数据接收方可以只让自己需要的数据被传输。

![](/posts/http2/3.png "This is an image")

### 流优先级（Stream Priority） {#流优先级（Stream-Priority）}

每个流可以设置优先级。优先级的目标是允许终端高速对端（当对端处理并发流时）怎么分配资源。

更重要的是，当传输能力有限时，优先级可以用来挑选哪些流（高优先级）优先传输——这是优化浏览器渲染的关键，即服务端负责设置优先级，使重要的资源优先加载，加速页面渲染。

### Server Push {#Server-Push}

Server Push即服务端能通过push的方式将客户端需要的内容预先推送过去，也叫“cache push”。

![](/posts/http2/4.png "This is an image")

参考:  
[https://imququ.com/post/http2-resource.html](https://imququ.com/post/http2-resource.html)  
[http://www.alloyteam.com/2016/07/httphttp2-0spdyhttps-reading-this-is-enough/](http://www.alloyteam.com/2016/07/httphttp2-0spdyhttps-reading-this-is-enough/)
