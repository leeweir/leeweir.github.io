---
title: "TLS1.3 初探"
slug: "tls13"
date: "2018-10-16T16:25"
tags: ["https"]
description: "openssl1.1.1 final正式发布后，准备在线上开始灰度了。虽然之前有一些了解，但是其实没有准确的认知，所以需要再好好的分析一下："
---

openssl1.1.1 final正式发布后，准备在线上开始灰度了。虽然之前有一些了解，但是其实没有准确的认知，所以需要再好好的分析一下：

# 大体上的区别 {#大体上的区别}

我们先看下tls1.3和tls1.2有什么区别：  
tls1.3：

![](/posts/tls13/tls1-3-cap.jpg "This is an image")

tls1.2：

![](/posts/tls13/tls1-2-cap.jpg "This is an image")

从这两张图就可以明显的看出tls1.3和tls1.2的数据包的不同，在tls1.3中，自从ServerHello之后全是Application Data了，甚至一度怀疑是不是wireshark这个软件是不是实现有问题。

我们看下[tls1.3 rfc](https://tools.ietf.org/html/rfc8446)，如下整理了下  
tls1.3完整握手:

![](/posts/tls13/tls1-3.jpg "This is an image")

tls1.2完整握手：

![](/posts/tls13/tls1-2.jpg "This is an image")

通过tls1.3和tls1.2的握手流程图对比，可以明显的看见tls1.3的握手流程比tls1.2的要少两次握手。虽然握手少了两次，但是像服务器证书这些必要的信息并没有减少提供，只是说在tls1.3中通过ClientHello和ServerHello这两步信息交换，就已经完成了tls1.2上的ServerKeyExchange和ClientKeyExchange这两个密钥交换的操作，在tls1.3的ServerHello之后的信息都已经走了加密通道。

# 解析ClientHello {#解析ClientHello}

先看一下使用openssl进行tls1.3握手的ClientHello的数据包结构：

![](/posts/tls13/tls1-3-clienthello.jpg "This is an image")

看一下rfc中对ClientHello的结构定义：

```c
uint16 ProtocolVersion;
     opaque Random[32];

     uint8 CipherSuite[2];    /* Cryptographic suite selector */

     struct {
         ProtocolVersion legacy_version = 0x0303;    /* TLS v1.2 */
         Random random;
         opaque legacy_session_id<0..32>;
         CipherSuite cipher_suites<2..2^16-2>;
         opaque legacy_compression_methods<1..2^8-1>;
         Extension extensions<8..2^16-1>;
     } ClientHello;
```

需要注意的是，在rfc文档中已经说明，legacy\_version的值必须是0x0303(TLS1.2)，并且session\_id的长度必须设置为0

<a id="more"></a>

现在在看一下tls1.2的ClientHello数据包：

![](/posts/tls13/tls1-2-clienthello.jpg "This is an image")

在这里我首先注意到的是两个Version后面的值，这两个值tls1.3和tls1.2是没有区别的，那么又是如何区分出是tls1.2还tls1.3的clientHello呢？在tls1.3的rfc中有说明：

```text
The "supported_versions" ClientHello extension can be used to
      negotiate the version of TLS to use, in preference to the
      legacy_version field of the ClientHello.
```

在区分出tls1.3或tls1.2的数据包是通过supported\_versions这个扩展字段中区分出来的:

![](/posts/tls13/support-versions.jpg "This is an image")

tls1.3的ClientHello增加了很多的扩展，这些扩展先暂时放一边，看一下我感觉最差异的地方：Cipher Suites。

## Cipher Suites {#Cipher-Suites}

tls1.3现在支持的Cipher\_Suites如下：

```text
+------------------------------+-------------+
| Description                  | Value       |
+------------------------------+-------------+
| TLS_AES_128_GCM_SHA256       | {0x13,0x01} |
|                              |             |
| TLS_AES_256_GCM_SHA384       | {0x13,0x02} |
|                              |             |
| TLS_CHACHA20_POLY1305_SHA256 | {0x13,0x03} |
|                              |             |
| TLS_AES_128_CCM_SHA256       | {0x13,0x04} |
|                              |             |
| TLS_AES_128_CCM_8_SHA256     | {0x13,0x05} |
+------------------------------+-------------+
```

tls1.3 目前定义了这5个密钥套件，从表面上看已经隐藏了密钥交换算法了，因为都是使用ECDH算法。

## 更多的扩展 {#更多的扩展}

通过openssl抓包，可以看见多的扩展有这些：

```text
supported_versions
pre_shared_key
key_share
```

### supported\_versions {#supported-versions}

客户端使用这个扩展表示它能够支持哪些版本的tls，按照这个扩展中的列举的tls版本进行顺序选择。并且如果该扩展存在那么服务器端必须忽略ClientHello.legacy\_version的值（就是那个规定必须写成0x0303的），仅使用supported\_versions中的扩展中存在的tls版本，并且忽略该扩展中任何未知的版本。

### pre\_shared\_key {#pre-shared-key}

该扩展是用来标识在PSK握手中的共享密钥。（ps： 该扩展在使用openssl进行tls1.3握手的时候，没有获取到)

### key\_share {#key-share}

在该扩展中包含端点的密码参数。  
在rfc中是这样定义的：

```c
struct {
         NamedGroup group;
         opaque key_exchange<1..2^16-1>;
     } KeyShareEntry
```

在上面的的key\_share中选用x25519DH参数。还有可以使用类似secp256r1、secp384r1、secp521r1的DH参数

# 解析ServerHello信息 {#解析ServerHello信息}

先看一下openssl响应的ServerHello信息：

![](/posts/tls13/tls1-3-serverhello.jpg "This is an image")

在这里可以可以看到服务器端选择了TLS\_AES\_256\_GCM\_SHA384这个加密套件，并且只返回了key\_share这个扩展信息，并没有pre\_shared\_key扩展，因此根据rfc文档，那么服务端选择的就是(EC)DHE ，

在看一眼key\_share中的结构,和ClientHello中的key\_share结构是一致的，到这里，Client和Server已经完成了密钥交换了，剩下的信息就全部通过加密通道进行传输了。

## 如何做密码协商 {#如何做密码协商}

Client一般通过ClientHello信息提供这些信息：

客户端支持的加密套件 （Cipher Suites）  
客户端支持的椭圆算法：(Supported Groups)  
客户端支持的签名算法：(Signature\_algorithms)  
客户端支持的可能和PSK一起使用的密钥交换模式：(psk\_key\_exchange\_modes)

密码协商有两种方式：

```text
PSK
DHE
```

如果服务器选择是使用DHE的协商模式，那么，服务器支持的加密套件、椭圆算法和签名算法必须和客户端提供的存在交集（三者都需要）。

如果服务器选择是使用PSK的协商模式，那么，服务器必须从客户端的psk\_key\_exchange\_modes的扩展中提供的支持的模式。

如果服务器使用的是PSK模式，那么就会在ServerHello的扩展中添加pre\_shared\_key这个扩展。

如果服务器使用的是EC(DHE)模式，那么服务器会在ServerHello的扩展中添加key\_share扩展。

# 总结 {#总结}

总体介绍大概是这样，后面我会再介绍下session reuse的区别，和如何做到0 RTT。
