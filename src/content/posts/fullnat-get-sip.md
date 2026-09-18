---
title: "解决 fullnat 下获取用户源 IP"
slug: "fullnat-get-sip"
date: "2018-01-31T10:39"
tags: ["tcp"]
description: "在设计L4负载均衡架构的时候，往往选择fnat，它支持LB和RS垮vlan通信。LB位于客户端和后端服务之间，对于客户端的请求报文，将目的地址替换成后端服务的地址，源地址替换成LB的本地地址，对于后端服务的响应报文，将目的地址替换成客户端地址，源地址替换成LB的VIP地址。这样就带来一个问题，后端RS上就看不到客户端的"
---

## 概要 {#概要}

在设计L4负载均衡架构的时候，往往选择fnat，它支持LB和RS垮vlan通信。LB位于客户端和后端服务之间，对于客户端的请求报文，将目的地址替换成后端服务的地址，源地址替换成LB的本地地址，对于后端服务的响应报文，将目的地址替换成客户端地址，源地址替换成LB的VIP地址。  
这样就带来一个问题，后端RS上就看不到客户端的源IP了，业内比较常见的有两种解决方案：

> TOA，将客户端源IP插入到TCP Option中  
> Proxy Protocol，将客户端IP插入到TCP payload中

下面分别介绍

## TOA，将客户端源IP插入到TCP Option中 {#TOA，将客户端源IP插入到TCP-Option中}

TOA是linux的一个内核模块，在tcp协议里面多添加了个option字段，LB把源ip和端口改为16进制然后加到里面一起传到后端RS，然后后端RS通过内核模块toa就可以让应用层程序获取真实的客户端地址。  
相对来说这块介绍比较多，我这边就不介绍详细细节，可以参考 [LVS FULLNAT模式下客户端真实地址的传递](http://www.just4coding.com/blog/2015/11/16/toa/)

这里说一下，Toa模块对系统的函数进行了修改，但是tcpdump之类的网络层是读取不到用户原始IP，需要应用层用getpeername函数进行自动识别。

## Proxy Protocol，将客户端ip插入到TCP payload中 {#Proxy-Protocol，将客户端ip插入到TCP-payload中}

代理协议即 PROXY protocol,是haproxy的作者Willy Tarreau于2010年开发和设计的一个Internet协议，通过为tcp添加一个很小的头信息，来方便的传递客户端信息（协议栈、源IP、目的IP、源端口、目的端口等)，在网络情况复杂又需要获取客户IP时非常有用，具体协议设计如下

```text
Format
 - PROXY_STRING + single space + INET_PROTOCOL + single space + CLIENT_IP + single space + PROXY_IP + single space + CLIENT_PORT + single space + PROXY_PORT + "\r\n"

IPV4 Sample
 - PROXY TCP4 198.51.100.22 203.0.113.7 35646 80\r\n

IPv6 Sample
 - PROXY TCP6 2001:DB8::21f:5bff:febf:ce22:8a2e 2001:DB8::12f:8baa:eafc:ce29:6b2e 35646 80\r\n
```

目前支持的后端应用

-   Elastic Load Balancing, since July 2013, AWS’ Load-Balancer
-   haproxy, since 1.5-dev3, reverse-proxy load-balancer
-   nginx, since 1.5.12 in HTTP server client side only, Web server, HTTP + Mail reverve-proxy
-   Percona DB Server, since 5.6.25-73.0, DataBase server
-   postfix, since 2.10, SMTP MTA
-   apache HTTPD, web server, use the module myfixip, for both apache 2.2 and 2.4
-   varnish, HTTP reverse-proxy cache, since version 4.1 d0a2

nginx配置参考，可以通过$proxy\_protocol\_addr获取用户的源ip

```text
server {
    listen 80 proxy_protocol;
    location / {
    add_header Content-Type text/html;
    return 200 $proxy_protocol_addr;
    }
}
```

有个问题是，你开启了proxy protocol后，你就无法对RS进行直接访问测试了，可以说也是将LB和后端RS做了耦合，解决方案是，可以专门搭建一个代理服务器做proxy protocol来测试后端RS
