---
title: "测试几个公共 DNS 的性能"
slug: "common-local-dns"
date: "2018-04-08T11:36"
tags: ["dns"]
description: "最近CloudFlare推出了自己的免费DNS解析器：1.1.1.1，可以说CloudFlare是我比较喜欢的一个公司之一，当时在想具体性能怎么样，所以找了个工具本地测试了下。Shell脚本测试公共dns的性能，可以测试各个dns server的解析速度，标准输出如下："
---

最近CloudFlare推出了自己的免费DNS解析器：1.1.1.1，可以说CloudFlare是我比较喜欢的一个公司之一，当时在想具体性能怎么样，所以找了个工具本地测试了下。  
Shell脚本测试公共dns的性能，可以测试各个dns server的解析速度，标准输出如下：

```shell
{ dnsperftest } master » bash ./dnstest.sh |sort -k 22 -n
                  test1   test2   test3   test4   test5   test6   test7   test8   test9   test10  Average
norton            32 ms   32 ms   32 ms   32 ms   29 ms   31 ms   31 ms   31 ms   37 ms   33 ms     32.00
google            7 ms    50 ms   6 ms    4 ms    62 ms   225 ms  6 ms    48 ms   5 ms    48 ms     46.10
opendns           6 ms    73 ms   4 ms    4 ms    71 ms   342 ms  5 ms    74 ms   5 ms    73 ms     65.70
neustar           28 ms   117 ms  28 ms   26 ms   112 ms  117 ms  26 ms   116 ms  28 ms   113 ms    71.10
quad9             27 ms   199 ms  24 ms   25 ms   182 ms  191 ms  26 ms   185 ms  24 ms   191 ms    107.40
cleanbrowsing     4 ms    217 ms  5 ms    5 ms    219 ms  219 ms  4 ms    219 ms  4 ms    219 ms    111.50
cloudflare        4 ms    234 ms  4 ms    4 ms    226 ms  226 ms  3 ms    258 ms  3 ms    232 ms    119.40
yandex            5 ms    212 ms  4 ms    5 ms    265 ms  251 ms  4 ms    205 ms  5 ms    241 ms    119.70
adguard           7 ms    258 ms  7 ms    6 ms    233 ms  242 ms  7 ms    234 ms  5 ms    257 ms    125.60
comodo            4 ms    281 ms  4 ms    4 ms    326 ms  327 ms  6 ms    325 ms  6 ms    324 ms    160.70
```

具体脚本：

```shell
#!/usr/bin/env bash

command -v bc > /dev/null || { echo "bc was not found. Please install bc."; exit 1; }
{ command -v drill > /dev/null && dig=drill; } || { command -v dig > /dev/null && dig=dig; } || { echo "dig was not found. Please install dnsutils."; exit 1; }



NAMESERVERS=`cat /etc/resolv.conf | grep ^nameserver | cut -d " " -f 2 | sed 's/\(.*\)/&#&/'`

PROVIDERS="
1.1.1.1#cloudflare
4.2.2.1#level3
8.8.8.8#google
9.9.9.9#quad9
80.80.80.80#freenom
208.67.222.123#opendns
199.85.126.20#norton
185.228.168.168#cleanbrowsing
77.88.8.7#yandex
176.103.130.132#adguard
156.154.70.3#neustar
8.26.56.26#comodo
"

# Domains to test. Duplicated domains are ok
DOMAINS2TEST="www.google.com amazon.com facebook.com www.youtube.com www.reddit.com  wikipedia.org twitter.com gmail.com www.google.com whatsapp.com"


totaldomains=0
printf "%-18s" ""
for d in $DOMAINS2TEST; do
    totaldomains=$((totaldomains + 1))
    printf "%-8s" "test$totaldomains"
done
printf "%-8s" "Average"
echo ""


for p in $NAMESERVERS $PROVIDERS; do
    pip=${p%%#*}
    pname=${p##*#}
    ftime=0

    printf "%-18s" "$pname"
    for d in $DOMAINS2TEST; do
        ttime=`$dig +tries=1 +time=2 +stats @$pip $d |grep "Query time:" | cut -d : -f 2- | cut -d " " -f 2`
        if [ -z "$ttime" ]; then
	        #let's have time out be 1s = 1000ms
	        ttime=1000
        elif [ "x$ttime" = "x0" ]; then
	        ttime=1
	    fi

        printf "%-8s" "$ttime ms"
        ftime=$((ftime + ttime))
    done
    avg=`bc -lq <<< "scale=2; $ftime/$totaldomains"`

    echo "  $avg"
done


exit 0;
```

参考：  
[https://blog.cloudflare.com/announcing-1111/](https://blog.cloudflare.com/announcing-1111/)
