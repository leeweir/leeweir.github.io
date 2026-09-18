---
title: "[译] Linux bcc/eBPF tcpdrop"
slug: "linux-bcc-tcpdrop"
date: "2019-10-25T11:05"
tags: ["sre","tcp","kernel"]
description: "最近在看 eBPF 的一些材料，看到 Brendan Gregg 的博客，后面想陆续针对一些主题翻译下，这一篇主要自介绍 tcpdrop，文章比较短，原文地址"
---

> 最近在看 eBPF 的一些材料，看到 Brendan Gregg 的博客，后面想陆续针对一些主题翻译下，这一篇主要自介绍 tcpdrop，文章比较短，[原文地址](http://www.brendangregg.com/blog/2018-05-31/linux-tcpdrop.html)

在调试基于内核的 TCP 数据包丢弃的生产问题时，我记得在Linux 4.7中 Eric Dumazet（Google) 添加了一个名为 tcp\_drop() 的新功能，我可以使用 kprobes 和 bcc/eBPF 进行跟踪。

这需要获得了更多的上下文来解释为什么发生这些丢包。例如：

```text
# tcpdrop
TIME     PID    IP SADDR:SPORT          > DADDR:DPORT          STATE (FLAGS)
05:46:07 82093  4  10.74.40.245:50010   > 10.74.40.245:58484   ESTABLISHED (ACK)
    tcp_drop+0x1
    tcp_rcv_established+0x1d5
    tcp_v4_do_rcv+0x141
    tcp_v4_rcv+0x9b8
    ip_local_deliver_finish+0x9b
    ip_local_deliver+0x6f
    ip_rcv_finish+0x124
    ip_rcv+0x291
    __netif_receive_skb_core+0x554
    __netif_receive_skb+0x18
    process_backlog+0xba
    net_rx_action+0x265
    __softirqentry_text_start+0xf2
    irq_exit+0xb6
    xen_evtchn_do_upcall+0x30
    xen_hvm_callback_vector+0x1af

05:46:07 85153  4  10.74.40.245:50010   > 10.74.40.245:58446   ESTABLISHED (ACK)
    tcp_drop+0x1
    tcp_rcv_established+0x1d5
    tcp_v4_do_rcv+0x141
    tcp_v4_rcv+0x9b8
    ip_local_deliver_finish+0x9b
    ip_local_deliver+0x6f
    ip_rcv_finish+0x124
    ip_rcv+0x291
    __netif_receive_skb_core+0x554
    __netif_receive_skb+0x18
    process_backlog+0xba
    net_rx_action+0x265
    __softirqentry_text_start+0xf2
    irq_exit+0xb6
    xen_evtchn_do_upcall+0x30
    xen_hvm_callback_vector+0x1af

[...]
```

这是 [tcpdrop](https://github.com/iovisor/bcc/pull/1790)，一个我为开源 [bcc](https://github.com/iovisor/bcc) 项目编写的新工具。它显示了源包和目标包的详细信息，以及 TCP 会话状态(来自内核)、TCP 标志(来自包 TCP 报头)和导致这次丢包的内核堆栈跟踪。堆栈跟踪有助于回答为什么(您需要查看这些函数背后的代码才能理解它)。这也是网上没有的信息，所以你也不会通过使用包嗅探器( libpcap , tcpdump 等)看到这些。

我不得不强调Eric补丁中的这个小而重要的变化( [tcp: increment sk drop for dropped rx packages](https://patchwork.ozlabs.org/patch/604910/) )

```c
@@ -6054,7 +6061,7 @@  int tcp_rcv_state_process(struct sock *sk, struct sk_buff *skb)
 
    if (!queued) {
 discard:
-       __kfree_skb(skb);
+       tcp_drop(sk, skb);
    }
    return 0;
```

从许多路径调用 \_\_kfree\_skb() 来释放套接字缓冲区，包括日常的代码路径。跟踪它干扰太多: 你的丢包的代码路径在许多正常路径中很难查找。但是使用新的 tcp\_drop() 函数，我可以只跟踪 TCP 丢包。今天在 netcon18 上，我已经对 Eric 提了一些增强的建议，比如在某个地方添加一个 “reason” 参数，以便对丢包的原因进行更人性化的描述。也许 tcp\_drop() 也应该成为一个跟踪点。

这里还有一些值得一提的代码，我的 tcpdrop 工具中的一些 eBPF/C 代码：

```c
[...]
    // pull in details from the packet headers and the sock struct
    u16 family = sk->__sk_common.skc_family;
    char state = sk->__sk_common.skc_state;
    u16 sport = 0, dport = 0;
    u8 tcpflags = 0;
    struct tcphdr *tcp = skb_to_tcphdr(skb);
    struct iphdr *ip = skb_to_iphdr(skb);
    bpf_probe_read(&sport, sizeof(sport), &tcp->source);
    bpf_probe_read(&dport, sizeof(dport), &tcp->dest);
    bpf_probe_read(&tcpflags, sizeof(tcpflags), &tcp_flag_byte(tcp));
    sport = ntohs(sport);
    dport = ntohs(dport);

    if (family == AF_INET) {
        struct ipv4_data_t data4 = {.pid = pid, .ip = 4};
        bpf_probe_read(&data4.saddr, sizeof(u32), &ip->saddr);
        bpf_probe_read(&data4.daddr, sizeof(u32), &ip->daddr);
        data4.dport = dport;
        data4.sport = sport;
        data4.state = state;
        data4.tcpflags = tcpflags;
        data4.stack_id = stack_traces.get_stackid(ctx, 0);
        ipv4_events.perf_submit(ctx, &data4, sizeof(data4));
[...]
```

我以前在 bcc 中的 tcp 工具只能使用 struct sock 成员(如 tcplife )。但是这一次我需要数据包信息来查看 TCP 标志和数据包的方向。这是我第一次在 eBPF 中访问 TCP 和 IP 报头。我在 tcpdrop 中添加 skb\_to\_tcphdr() 和 skb\_to\_iphdr() 以帮助实现这一点，并为以后的 Python 处理添加了一个新的 tcp bcc 库。我相信随着时间的推移，这些代码会被重用(并得到改进)。
