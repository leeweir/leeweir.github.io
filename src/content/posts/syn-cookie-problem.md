---
title: "谈谈 syn cookie 的问题"
slug: "syn-cookie-problem"
date: "2018-03-23T14:05"
tags: ["sre","tcp"]
description: "Syn Flood是常见的一种拒绝服务（DOS）攻击方式，所谓的拒绝服务攻击就是通过攻击，使受害主机或者网络不能提供良好的服务，从而达到攻击的目的。"
---

## 先讲讲Syn Flood攻击 {#先讲讲Syn-Flood攻击}

Syn Flood是常见的一种拒绝服务（DOS）攻击方式，所谓的拒绝服务攻击就是通过攻击，使受害主机或者网络不能提供良好的服务，从而达到攻击的目的。

SYN Flood攻击利用的是IPv4中TCP协议的三次握手(Three-Way Handshake)过程进行的攻击。TCP服务器收到TCP SYN request包时，在发送TCP SYN + ACK包回客户机前，TCP服务器要先分配好一个数据区专门服务于这个即将形成的TCP连接。一般把收到SYN包而还未收到ACK包时的连接状态称为半打开连接(Half-open Connection)。

在最常见的SYN Flood攻击中，攻击者在短时间内发送大量的TCP SYN包给受害者。受害者(服务器)为每个TCP SYN包分配一个特定的数据区，只要这些SYN包具有不同的源地址(攻击者很容易伪造)。这将给TCP服务器造成很大的系统负担，最终导致系统不能正常工作。

## 再说下Syn Cookie {#再说下Syn-Cookie}

SYN Cookie是对TCP服务器端的三次握手做一些修改，专门用来防范SYN Flood攻击的一种手段。它的原理是，在TCP服务器接收到TCP SYN包并返回TCP SYN + ACK包时，不分配一个专门的数据区，而是根据这个SYN包计算出一个cookie值。这个cookie作为将要返回的SYN ACK包的初始序列号。当客户端返回一个ACK包时，根据包头信息计算cookie，与返回的确认序列号(初始序列号 + 1)进行对比，如果相同，则是一个正常连接，然后，分配资源，建立连接。  
SYN Cookie机制的核心就是避免攻击造成的大量构造无用的连接请求块，导致内存耗尽，而无法处理正常的连接请求。即使开启该机制并不意味着所有的连接都是用SYN cookies机制来完成连接的建立，只有在半连接队列已满的情况下才会触发SYN cookies机制。

## 看一些问题 {#看一些问题}

我们有用户报障在上传文件的时候失败，客户端收到大量的reset。对应应用在我们的硬件设备NetScaler上，我们抓包如下：

![](/posts/syn-cookie-problem/cap1.jpg "This is an image")

可以看到在三次握手建连后，因为请求包乱序，NetScaler直接回复了reset。当时第一反应是因为timestamp导致的。但是NetScaler上默认timestamp是关闭的。  
最后和NetScaler tech一起分析了下，发现是因为Syn Cookie引起，我们线上的NetScaler设备默认启用了Syn Cookie。  
我们再来看下Syn Cookie的问题，SYN cookies机制本身严重违背TCP协议，不允许使用TCP扩展，所以一般来说，可以使用Timestamp区域来存放这些数据，所以当Syn Cookie开启的时候，一般需要开启TCP Timestamp。

![](/posts/syn-cookie-problem/cloudflare.jpg "This is an image")

另外，和本身NetScaler的处理机制也有问题，默认情况下，NetScaler会在收到HTTP的request之后再给这个request分配资源。大部分HTTP request一个包就能搞定，但是这个请求被分成了多个包，加上乱序，所以导致了NetScaler分配资源时认为收到了非法的包，导致错误。

参考：  
[https://blog.cloudflare.com/syn-packet-handling-in-the-wild/](https://blog.cloudflare.com/syn-packet-handling-in-the-wild/)  
[https://blog.csdn.net/justlinux2010/article/details/12619761](https://blog.csdn.net/justlinux2010/article/details/12619761)
