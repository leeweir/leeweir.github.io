---
title: "谈谈证书链的问题"
slug: "cert-chain"
date: "2018-03-09T10:39"
tags: ["sre","https"]
description: "这两天公司遇到影响比较大的故障，是因为服务端证书给的证书链上配置的中间证书错了，导致一部分android用户访问失败。完整的证书内容一般分为3级，服务端证书-中间证书-根证书。其中Root CA是信任锚点，一条证书链中只能有一个。Intermediate CA可以有多个。Root CA通常不直接签发用户证书，而是签发I"
---

这两天公司遇到影响比较大的故障，是因为服务端证书给的证书链上配置的中间证书错了，导致一部分android用户访问失败。  
完整的证书内容一般分为3级，服务端证书-中间证书-根证书。其中Root CA是信任锚点，一条证书链中只能有一个。Intermediate CA可以有多个。Root CA通常不直接签发用户证书，而是签发Intermediate CA，由Intermediate CA来签发终用户书。它们之间的关系如下图所示：

![](/posts/cert-chain/%E8%AF%81%E4%B9%A6%E9%93%BE%E9%AA%8C%E8%AF%81.png "This is an image")

系统或浏览器中预置了一些受信任的根证书颁发机构和某些中间证书颁发机构，ssl证书在被验证时最终要验证其根证书是否可信，网站证书的根证书在浏览器可信任根证书列表里才会被信任或者中间证书颁发机构可信其证书也是可信的，否则浏览器则会报告网站的证书来自未知授权中心。可是证书一般是由三级或多级结构构成，浏览器是不能通过用户证书直接验证其根证书的，这时中间证书即证书链文件起了作用，证书链文件告诉了浏览器用户证书的上级证书机构即中间证书，浏览器再通过中间证书验证其上级根证书是否为可信。

<a id="more"></a>

在证书里面，我们可以找到**证书颁发信息访问**，通过里面的URL，我们可以获取到整个中间证书。也就是说我们在部署SSL证书的时候没有把中间证书放进去，浏览器依然可以通过证书上面的url信息访问到中间证书，继而建立完整的信用链。

![](/posts/cert-chain/%E8%AF%81%E4%B9%A6%E9%A2%81%E5%8F%91%E6%9C%BA%E6%9E%84%E4%BF%A1%E6%81%AF%E8%AE%BF%E9%97%AE.jpg "This is an image")

大部分浏览器都能这样建立信用链，但是android手机不支持这种方式获取中间证书，所以android访问的时候就会提示证书不受信任。

![](/posts/cert-chain/ssl-miui.png "This is an image")

所以考虑到兼容性，我们现在的证书都需要把证书链打包进去，最佳实践是需要包含中间证书+站点证书，不需要把根证书放进去，这样可以提高ssl握手的效率。

再回到这个case，当时出现异常的时候，我第一反应也是缺少了中间证书，通过openssl查看了下证书链

```text
openssl s_client -connect xxx.com -servername xxx.com
```

发现是有中间证书，当时排查的时候以为是好的。后来分析的时候发现，xxx.com的站点证书的颁发机构应该是DigiCert SHA2 Secure Server CA，而第二张证书竟然是RapidSSL RSA CA 2018，这就会导致无法建立正确的证书链，从而导致访问时提示证书不受信任。

```text
Certificate chain
 0 s:/C=CN/L=Shanghai/O=Shanghai XXX Commerce Co., Ltd./OU=IT dept./CN=xxx.com
   i:/C=US/O=DigiCert Inc/CN=DigiCert SHA2 Secure Server CA
 1 s:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=RapidSSL RSA CA 2018
   i:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
```

参考：  
[https://developer.android.com/training/articles/security-ssl.html?hl=zh-cn#MissingCa](https://developer.android.com/training/articles/security-ssl.html?hl=zh-cn#MissingCa)
