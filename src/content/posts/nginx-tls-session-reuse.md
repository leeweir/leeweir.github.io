---
title: "Nginx TLS Session 复用"
slug: "nginx-tls-session-reuse"
date: "2018-01-31T12:09"
tags: ["https","nginx"]
description: "Session 复用，是指将握手时算出来的对称密钥存起来，后续请求中直接使用。这样可以节省证书传送等开销，也可以将 TLS 握手所需 RTT 减少到一个，如下："
---

## 概要 {#概要}

Session 复用，是指将握手时算出来的对称密钥存起来，后续请求中直接使用。这样可以节省证书传送等开销，也可以将 TLS 握手所需 RTT 减少到一个，如下：

![](/posts/nginx-tls-session-reuse/tls.jpg "This is an image")

可以看到 Session 复用的时候，双方不需要重新协商密钥了。

> Session Identifier  
> Session Ticket

主要有上面两个方法，我会简单介绍下原理，主要讲 Nginx 的具体配置

## Session Identifier {#Session-Identifier}

客户端保存 Session ID，在发起 Client Hello 时将上次使用的 Session ID 发送给服务端，服务端根据收到的 Session ID 找到保存好的对称密钥。这里有个问题，线上服务器都是集群部署的，不止一台，当客户端两次请求没有落到同一台服务器上时就无法使会话复用机制生效。所以想要 TLS 会话复用生效，需要让集群中的多台服务器共享 Session 信息。lua-nginx-redis 可以让我们把 Session id 的内容放到redis中。

Dependencies：

> lua-nginx-module  
> lua-resty-core  
> lua-nginx-redis

具体配置：

```text
lua_package_path "/home/work/nginx/modules/lua-resty-core/lib/?.lua;/home/work/nginx/modules/lua-resty-redis/lib/?.lua;site-enable/lua/?.lua;;";
ssl_session_fetch_by_lua_file site-enable/lua/fetch.lua;
ssl_session_store_by_lua_file site-enable/lua/store.lua;
ssl_session_timeout 7200m;
ssl_session_tickets off;
```

## Session Ticket {#Session-Ticket}

Session Ticket 是用只有服务端知道的安全密钥加密过的会话信息，最终保存在浏览器端。浏览器如果在 ClientHello 时带上了 Session Ticket，只要服务器能成功解密就可以完成快速握手。  
具体配置：

```text
ssl_session_tickets on;
ssl_session_ticket_key /opt/app/nginx/conf/ticket/sessionTicket.key;
```
