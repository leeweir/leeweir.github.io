---
title: "DNS 缓存介绍: NSCD"
slug: "dns-cache-nscd"
date: "2019-02-02T16:13"
tags: ["sre","dns"]
description: "NSCD（name service cache daemon）是我们在linux上最常用的DNS缓存服务，它是glibc网络库的一个组件。基本上来讲我们能见到的一些编程语言和开发框架最终均会调用到glibc的网络解析的函数（如GETHOSTBYNAME or GETHOSTBYADDR等），因此绝大部分程序能够使用NS"
---

## 前言 {#前言}

NSCD（name service cache daemon）是我们在linux上最常用的DNS缓存服务，它是glibc网络库的一个组件。基本上来讲我们能见到的一些编程语言和开发框架最终均会调用到glibc的网络解析的函数（如GETHOSTBYNAME or GETHOSTBYADDR等），因此绝大部分程序能够使用NSCD提供的缓存服务。当然如果是应用端自己用socket编写了一个网络client做DNS解析就无法使用NSCD提供的缓存服务，比如DNS领域常见的dig命令不会使用NSCD提供的缓存，相反ping得到的DNS解析结果将使用NSCD提供的缓存。

当然NSCD不止为DNS提供缓存服务，博客主要介绍DNS（hosts）的缓存。

## NSCD配置 {#NSCD配置}

先看下核心配置：

```text
reload-count unlimited | number        #注意下文会具体说明
enable-cache hosts <yes|no>            #Enables or disables the specified service cache. The default is no.
positive-time-to-live hosts value      #success缓存的响应时间，注意，下文会具体说明
negative-time-to-live hosts value      #非success缓存的响应时间，注意，下文会具体说明
```

## 关于缓存时间 {#关于缓存时间}

首先最重要的两个配置：

```text
positive-time-to-live hosts 60
negative-time-to-live hosts 10
```

原来我们大部分人都认为，NSCD的缓存是看positive-time-to-live，比如上面配置了60s，那认为DNS会缓存60s。实际查看了代码和测试验证下来，发现配置positive-time-to-live hosts并没有什么用处，代码中hstcache.c主流程中会直接读取DNS报文中的TTL并赋值给需要计算的timeout

```c
/* Compute the timeout time.  */
dataset->head.ttl = ttl == INT32_MAX ? db->postimeout : ttl;
timeout = dataset->head.timeout = t + dataset->head.ttl;
```

这说明NSCD的DNS缓存控制是以DNS应答的TTL为主，这个positive-time-to-live配置实际无效。那为什么要有这个配置呢，因为NSCD不止处理DNS同时也处理passwd/group等，其实老版本的NSCD忽略了DNS存在TTL，直到某一个版本（glibc 2.08）中把DNS的TTL给加入了。

<a id="more"></a>

## 关于reload count {#关于reload-count}

```text
reload-count 5
```

这个配置其实刚开始看的时候觉得还是比较特别的，我们先看下官方的说明：

```text
Limit on the number of times a cached entry gets reloaded without being used before it gets removed. The default is 5.
```

意思是说，一个域名在不被使用的情况下，NSCD会主动发起DNS请求，如果期间发生解析结果变更会将结果主动更新至NSCD缓存。  
那多久reload一次呢，再看下源码：

```c
  if (first && prune_wakeup)
    {
      /* Perhaps the prune thread for the table is not running in a long
	 time.  Wake it if necessary.  */
      pthread_mutex_lock (&table->prune_lock);
      time_t next_wakeup = table->wakeup_time;
      bool do_wakeup = false;
      if (next_wakeup > packet->timeout + CACHE_PRUNE_INTERVAL)
	{
	  table->wakeup_time = packet->timeout;
	  do_wakeup = true;
	}
      pthread_mutex_unlock (&table->prune_lock);
      if (do_wakeup)
	pthread_cond_signal (&table->prune_cond);
    }

  return 0;
}
```

我们发现是ttl+CACHE\_PRUNE\_INTERVAL，再看下CACHE\_PRUNE\_INTERVAL的定义：

```c
#define CACHE_PRUNE_INTERVAL    15
```

所以当一个域名的ttl是60s，那你访问了一次以后，这个缓存会存在 （60 + 15） \* （5 + 1） 的时间。

我们打开NSCD日志验证了下我们的分析：

```text
Sat 02 Feb 2019 04:27:07 PM CST - 16771: GETHOSTBYNAME (awx.ops.xxx.com)
Sat 02 Feb 2019 04:27:07 PM CST - 16771: Haven't found "awx.ops.xxx.com" in hosts cache!
Sat 02 Feb 2019 04:27:07 PM CST - 16771: add new entry "awx.ops.xxx.com" of type GETHOSTBYNAME for hosts to cache (first)
Sat 02 Feb 2019 04:27:29 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096087
Sat 02 Feb 2019 04:28:07 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096087
Sat 02 Feb 2019 04:28:22 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096087
Sat 02 Feb 2019 04:28:22 PM CST - 16771: Reloading "awx.ops.xxx.com" in hosts cache!
Sat 02 Feb 2019 04:29:22 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096162
Sat 02 Feb 2019 04:29:37 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096162
Sat 02 Feb 2019 04:29:37 PM CST - 16771: Reloading "awx.ops.xxx.com" in hosts cache!
Sat 02 Feb 2019 04:29:52 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096237
Sat 02 Feb 2019 04:30:07 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096237
Sat 02 Feb 2019 04:30:22 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096237
Sat 02 Feb 2019 04:30:37 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096237
Sat 02 Feb 2019 04:30:52 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096237
Sat 02 Feb 2019 04:30:52 PM CST - 16771: Reloading "awx.ops.xxx.com" in hosts cache!
Sat 02 Feb 2019 04:31:07 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096312
Sat 02 Feb 2019 04:31:22 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096312
Sat 02 Feb 2019 04:31:37 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096312
Sat 02 Feb 2019 04:31:52 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096312
Sat 02 Feb 2019 04:32:07 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096312
Sat 02 Feb 2019 04:32:07 PM CST - 16771: Reloading "awx.ops.xxx.com" in hosts cache!
Sat 02 Feb 2019 04:32:22 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096387
Sat 02 Feb 2019 04:32:37 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096387
Sat 02 Feb 2019 04:32:52 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096387
Sat 02 Feb 2019 04:33:07 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096387
Sat 02 Feb 2019 04:33:22 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096387
Sat 02 Feb 2019 04:33:22 PM CST - 16771: Reloading "awx.ops.xxx.com" in hosts cache!
Sat 02 Feb 2019 04:33:37 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096462
Sat 02 Feb 2019 04:33:52 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096462
Sat 02 Feb 2019 04:34:07 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096462
Sat 02 Feb 2019 04:34:22 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096462
Sat 02 Feb 2019 04:34:37 PM CST - 16771: considering GETHOSTBYNAME entry "awx.ops.xxx.com", timeout 1549096462
Sat 02 Feb 2019 04:34:37 PM CST - 16771: remove GETHOSTBYNAME entry "awx.ops.xxx.com"
```

## 关于非success域名的缓存 {#关于非success域名的缓存}

查看代码发现对于非success域名的缓存，NSCD会读取配置中的negative-time-to-live，将缓存一个negative-time-to-live + CACHE\_PRUNE\_INTERVAL的时间

```c
dataset->head.ttl = ttl == INT32_MAX ? db->negtimeout : ttl;
  timeout = dataset->head.timeout = t + dataset->head.ttl;
```

假如你配置了negative-time-to-live 10，那只能等25秒后NSCD才会发起新的解析。  
当时当你配置negative-time-to-live 0的时候，默认不会缓存negative cahce，那每次都会向DNS server发起请求，像我们的一些互联网服务场景，强烈要求设置

```text
negative-time-to-live 0
```

## 关于CNAME+A的结果 {#关于CNAME-A的结果}

GLIBC的GETHOSTBYNAME/GETHOSTBYADD返回的TTL中直接读取的是A类型的TTL，代码中并没有针对CNAME的TTL做特殊处理，因此在有CNAME+A的级联应答结果中，缓存的timeout将只会读取对应的A记录的TTL。  
当DNS应答结果只有CNAME时，DNS请求将被判定为失败，这时CNAME的TTL将不起作用，缓存的时间将遵循非success域名的timeout计算。

```c
return ((qtype == T_A || qtype == T_AAAA) && ap != host_data->aliases
           ? NSS_STATUS_NOTFOUND : NSS_STATUS_TRYAGAIN);
```

## 总结 {#总结}

使用NSCD对于提升域名解析性能、降低DNS并发数量，对于一部分缺乏DNS缓存的开发框架有辅助作用，但是其也存在明显的缺点：比如域名生效时间要持续一个ttl+15s，对于一部分讲究变更快速生效的域名而言有一定的变更生效延误；做DNS RR的域名将会失去轮询的能力。

所以对于任何一个服务或者软件，你只有充分的了解它，你才能更好的使用它。

参考：  
[https://github.com/lattera/glibc](https://github.com/lattera/glibc)
