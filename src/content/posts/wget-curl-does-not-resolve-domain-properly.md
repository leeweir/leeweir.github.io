---
title: "wget 或者 curl 无法正确解析域名，而 ping 可以"
slug: "wget-curl-does-not-resolve-domain-properly"
date: "2018-02-01T14:17"
tags: ["sre"]
description: "刚才用户反馈服务器上不能wget一个资源，我这边具体测试了下，现象如下"
---

## 现象 {#现象}

刚才用户反馈服务器上不能wget一个资源，我这边具体测试了下，现象如下

> 指定IPV4可以正常访问  
> 指定IPV6无法访问  
> 不指定的时候看到域名对应的解析地址不对，正确的是10.x.x.51，而这个是10.x.x.110。

经过排查，这个域名在上周做过域名指向调整，从10.x.x.110修改为10.x.x.51

```text
[admin@xx ~]$ curl -4 -avo /dev/null http://meta.xxx.com/metaserver/servers
* About to connect() to meta.xxx.com port 80 (#0)
*   Trying 10.x.x.51... connected
* Connected to meta.xxx.com (10.x.x.51) port 80 (#0)
> GET /metaserver/servers HTTP/1.1
> User-Agent: curl/7.19.7 (x86_64-redhat-linux-gnu) libcurl/7.19.7 NSS/3.13.6.0 zlib/1.2.3 libidn/1.18 libssh2/1.4.2
> Host: meta.xxx.com
> Accept: */*
>
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0< HTTP/1.1 200 OK
< Server: Apache-Coyote/1.1
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, DELETE, PUT
< Access-Control-Allow-Headers: X-Requested-With, Content-Type, X-Codingpedia
< Content-Type: application/json;charset=utf-8
< Content-Length: 405
< Date: Thu, 01 Feb 2018 06:15:02 GMT
<
{ [data not shown]
101   405  101   405    0     0   239k      0 --:--:-- --:--:-- --:--:--  395k* Connection #0 to host meta.xxx.com left intact

* Closing connection #0


[admin@xx ~]$ curl -6 -avo /dev/null http://meta.xxx.com/metaserver/servers
* getaddrinfo(3) failed for meta.xxx.com:80
* Couldn't resolve host 'meta.xxx.com'
* Closing connection #0

curl: (6) Couldn't resolve host 'meta.xxx.com'


[admin@xx ~]$ curl -avo /dev/null http://meta.xxx.com/metaserver/servers
* About to connect() to meta.xxx.com port 80 (#0)
*   Trying 10.x.x.110... No route to host
* couldn't connect to host
* Closing connection #0

curl: (7) couldn't connect to host
```

## 排查过程 {#排查过程}

网上查了些资料，通过curl(依赖libcurl)的程序，如果开启了IPv6，curl默认会优先解析IPv6，在对应域名没有IPv6的情况下，会等待IPv6dns解析失败timeout之后才按以前的正常流程去找IPv4原因。但是比较奇怪的是，即使是这样，顶多是访问慢，但是为什么会解析到上周已经切换到的一个IP呢？  
我分别strace了下  
不指定ipv4/6，直接wget meta.xxx.com

```text
write(2, "Resolving meta.xxx"..., 42Resolving meta.xxx.com... ) = 42
socket(PF_NETLINK, SOCK_RAW, 0) = 3
bind(3, {sa_family=AF_NETLINK, pid=0, groups=00000000}, 12) = 0
getsockname(3, {sa_family=AF_NETLINK, pid=32303, groups=00000000}, [12]) = 0
sendto(3, "\24\0\0\0\26\0\1\3@\301rZ\0\0\0\0\0\0\0\0", 20, 0, {sa_family=AF_NETLINK, pid=0, groups=00000000}, 12) = 20
recvmsg(3, {msg_name(12)={sa_family=AF_NETLINK, pid=0, groups=00000000}, msg_iov(1)=[{"0\0\0\0\24\0\2\0@\301rZ/~\0\0\2\10\200\376\1\0\0\0\10\0\1\0\177\0\0\1"..., 4096}], msg_controllen=0, msg_flags=0}, 0) = 108
recvmsg(3, {msg_name(12)={sa_family=AF_NETLINK, pid=0, groups=00000000}, msg_iov(1)=[{"@\0\0\0\24\0\2\0@\301rZ/~\0\0\n\200\200\376\1\0\0\0\24\0\1\0\0\0\0\0"..., 4096}], msg_controllen=0, msg_flags=0}, 0) = 128
recvmsg(3, {msg_name(12)={sa_family=AF_NETLINK, pid=0, groups=00000000}, msg_iov(1)=[{"\24\0\0\0\3\0\2\0@\301rZ/~\0\0\0\0\0\0\1\0\0\0\24\0\1\0\0\0\0\0"..., 4096}], msg_controllen=0, msg_flags=0}, 0) = 20
close(3) = 0
socket(PF_FILE, SOCK_STREAM|SOCK_CLOEXEC|SOCK_NONBLOCK, 0) = 3
connect(3, {sa_family=AF_FILE, path="/var/run/nscd/socket"}, 110) = 0
sendto(3, "\2\0\0\0\r\0\0\0\6\0\0\0hosts\0", 18, MSG_NOSIGNAL, NULL, 0) = 18
poll([{fd=3, events=POLLIN|POLLERR|POLLHUP}], 1, 5000) = 1 ([{fd=3, revents=POLLIN|POLLHUP}])
recvmsg(3, {msg_name(0)=NULL, msg_iov(2)=[{" PS2\0\0", 6}, {"\201\320;X\0\0\0\0", 8}], msg_controllen=0, msg_flags=MSG_CMSG_CLOEXEC}, MSG_CMSG_CLOEXEC) = 0
close(3) = 0
socket(PF_FILE, SOCK_STREAM|SOCK_CLOEXEC|SOCK_NONBLOCK, 0) = 3
connect(3, {sa_family=AF_FILE, path="/var/run/nscd/socket"}, 110) = 0
sendto(3, "\2\0\0\0\16\0\0\0\35\0\0\0meta.xxxip"..., 41, MSG_NOSIGNAL, NULL, 0) = 41
poll([{fd=3, events=POLLIN|POLLERR|POLLHUP}], 1, 5000) = 1 ([{fd=3, revents=POLLIN|POLLHUP}])
read(3, "\2\0\0\0\1\0\0\0\1\0\0\0\4\0\0\0!\0\0\0\0\0\0\0", 24) = 24
read(3, "\n\10\224n\2meta.hermes.fx.sh2.ctripcor"..., 38) = 38
close(3) = 0
write(2, "10.x.x.110", 1210.x.x.110) = 12
write(2, "\n", 1
) = 1
write(2, "Connecting to meta.xxx"..., 63Connecting to meta.xxx.com|10.x.x.110|:80... ) = 63
```

指定ipv4

```text
write(2, "Resolving meta.xxxipco"..., 42Resolving meta.xxx.com... ) = 42
socket(PF_NETLINK, SOCK_RAW, 0) = 3
bind(3, {sa_family=AF_NETLINK, pid=0, groups=00000000}, 12) = 0
getsockname(3, {sa_family=AF_NETLINK, pid=9267, groups=00000000}, [12]) = 0
sendto(3, "\24\0\0\0\26\0\1\3\303\304rZ\0\0\0\0\0\0\0\0", 20, 0, {sa_family=AF_NETLINK, pid=0, groups=00000000}, 12) = 20
recvmsg(3, {msg_name(12)={sa_family=AF_NETLINK, pid=0, groups=00000000}, msg_iov(1)=[{"0\0\0\0\24\0\2\0\303\304rZ3$\0\0\2\10\200\376\1\0\0\0\10\0\1\0\177\0\0\1"..., 4096}], msg_controllen=0, msg_flags=0}, 0) = 108
recvmsg(3, {msg_name(12)={sa_family=AF_NETLINK, pid=0, groups=00000000}, msg_iov(1)=[{"@\0\0\0\24\0\2\0\303\304rZ3$\0\0\n\200\200\376\1\0\0\0\24\0\1\0\0\0\0\0"..., 4096}], msg_controllen=0, msg_flags=0}, 0) = 128
recvmsg(3, {msg_name(12)={sa_family=AF_NETLINK, pid=0, groups=00000000}, msg_iov(1)=[{"\24\0\0\0\3\0\2\0\303\304rZ3$\0\0\0\0\0\0\1\0\0\0\24\0\1\0\0\0\0\0"..., 4096}], msg_controllen=0, msg_flags=0}, 0) = 20
close(3) = 0
open("/etc/resolv.conf", O_RDONLY) = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=43, ...}) = 0
mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f15151ad000
read(3, "nameserver 10.8.86.1\nnameserver "..., 4096) = 43
read(3, "", 4096) = 0
close(3) = 0
munmap(0x7f15151ad000, 4096) = 0
uname({sys="Linux", node="SVR13350HW1288", ...}) = 0
socket(PF_FILE, SOCK_STREAM|SOCK_CLOEXEC|SOCK_NONBLOCK, 0) = 3
connect(3, {sa_family=AF_FILE, path="/var/run/nscd/socket"}, 110) = 0
sendto(3, "\2\0\0\0\r\0\0\0\6\0\0\0hosts\0", 18, MSG_NOSIGNAL, NULL, 0) = 18
poll([{fd=3, events=POLLIN|POLLERR|POLLHUP}], 1, 5000) = 1 ([{fd=3, revents=POLLIN|POLLHUP}])
recvmsg(3, {msg_name(0)=NULL, msg_iov(2)=[{"\20\337\1\0\3\0", 6}, {"\1\0\0\0\0\0\0\0", 8}], msg_controllen=0, msg_flags=MSG_CMSG_CLOEXEC}, MSG_CMSG_CLOEXEC) = 0
close(3) = 0
socket(PF_FILE, SOCK_STREAM|SOCK_CLOEXEC|SOCK_NONBLOCK, 0) = 3
connect(3, {sa_family=AF_FILE, path="/var/run/nscd/socket"}, 110) = 0
sendto(3, "\2\0\0\0\4\0\0\0\35\0\0\0meta.xxxip"..., 41, MSG_NOSIGNAL, NULL, 0) = 41
poll([{fd=3, events=POLLIN|POLLERR|POLLHUP}], 1, 5000) = 1 ([{fd=3, revents=POLLIN|POLLHUP}])
read(3, "\2\0\0\0\1\0\0\0!\0\0\0\1\0\0\0\2\0\0\0\4\0\0\0\1\0\0\0\0\0\0\0", 32) = 32
readv(3, [{"meta.xxxgslb.com"..., 33}, {"\35\0\0\0", 4}, {"\n\10u3", 4}], 3) = 41
read(3, "meta.xxx.com\0", 29) = 29
close(3) = 0
write(2, "10.x.x.51", 1110.x.x.51) = 11
write(2, "\n", 1
) = 1
```

发现指定ipv4的情况下，多了下面这段trace，刚开始猜测是不是ipv4的会发起dns query，而不指定的话不会发起，实际验证下来不是这个原因。  
最后可以看到都是nscd缓存返回的结果，因为nscd的缓存内容不能直接查看，为了解决问题，我就先把nscd服务重启了下。

```text
open("/etc/resolv.conf", O_RDONLY) = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=43, ...}) = 0
mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f15151ad000
read(3, "nameserver 10.8.86.1\nnameserver "..., 4096) = 43
read(3, "", 4096) = 0
close(3) = 0
```

然后直接用curl访问，已经可以正常返回结果了

```text
[admin@xx ~]$ curl -4 -avo /dev/null http://meta.xxx.com/metaserver/servers
* About to connect() to meta.xxx.com port 80 (#0)
*   Trying 10.15.200.27... connected
* Connected to meta.xxx.com (10.15.200.27) port 80 (#0)
> GET /metaserver/servers HTTP/1.1
> User-Agent: curl/7.19.7 (x86_64-redhat-linux-gnu) libcurl/7.19.7 NSS/3.13.6.0 zlib/1.2.3 libidn/1.18 libssh2/1.4.2
> Host: meta.xxx.com
> Accept: */*
>
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0< HTTP/1.1 200 OK
< Server: Apache-Coyote/1.1
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, DELETE, PUT
< Access-Control-Allow-Headers: X-Requested-With, Content-Type, X-Codingpedia
< Content-Type: application/json;charset=utf-8
< Content-Length: 405
< Date: Thu, 01 Feb 2018 10:02:23 GMT
<
{ [data not shown]
101   405  101   405    0     0  75729      0 --:--:-- --:--:-- --:--:--   98k* Connection #0 to host meta.xxx.com left intact

* Closing connection #0
```

## 根因 {#根因}

其实这个只是暂时解决了问题，但是不指定协议访问的时候，为什么直接从缓存里返回了结果而不做dns解析，还是要具体从libcurl的实现上去分析，后面有空把这段内容补上。不过说回来，dns client cache确实很坑，缓存了上周的一个ip地址，这些问题都需要再深入排查。
