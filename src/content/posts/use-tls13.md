---
title: "在 OpenSSL 中使用 TLSv1.3"
slug: "use-tls13"
date: "2018-03-01T20:14"
tags: ["https"]
description: "即将到来的OpenSSL 1.1.1版本将支持TLSv1.3。这个新版本将兼容OpenSSL 1.1.0版本的二进制文件和API。理论上，如果你的应用程序支持OpenSSL 1.1.0，那么当更新可用时，TLSv1.3版本也将自动得到支持，你不需要专门进行安装。但有一些问题仍需要应用程序开发人员和部署人员了解。在这篇博"
---

即将到来的OpenSSL 1.1.1版本将支持TLSv1.3。这个新版本将兼容OpenSSL 1.1.0版本的二进制文件和API。理论上，如果你的应用程序支持OpenSSL 1.1.0，那么当更新可用时，TLSv1.3版本也将自动得到支持，你不需要专门进行安装。但有一些问题仍需要应用程序开发人员和部署人员了解。在这篇博客中，我将谈谈其中的一些问题。

---

## 与TLS1.2及更早版本的对比 {#与TLS1-2及更早版本的对比}

TLSv1.3版本是对规范的重大修改。它到底应该叫TLSv2.0还是现在的名字TLSv1.3，还存在一些争论。该版本有重大变化，一些工作方式也非常不同。下面是你可能需要注意的一些问题，简明扼要，不过并不太全面。

-   有一些新的密码套件仅在TLSv1.3下工作。一些旧的密码套件无法用于TLSv1.3连接。
-   新的密码套件定义方式不同，且并未详细规定证书类型（如RSA、DSA、ECDSA）或密钥交换机制（如DHE或ECHDE）。这对密码套件的配置有暗示作用。
-   客户端在客户问候消息（ClientHello）中提供一个“key\_share”。这会对“组”配置产生影响。
-   直到主握手完成以后，会话才会建立。在握手结束和会话建立之间可能会有一个间隙（理论上，会话可能根本不会建立），并可能对会话恢复代码产生影响。
-   在TLSv1.3版本中，重新磋商是不可能的。
-   现在大部分握手都会被加密。
-   更多类型的消息现在可以有扩展（这对定制扩展API和证书透明系统有影响）。
-   在TLSv1.3连接中不再允许使用DSA证书。

注意，在这一阶段，只支持TLSv1.3。因DTLSv1.3版本的规范刚刚开始制定，目前并不支持OpenSSL。

---

## TLSv1.3标准目前的状态 {#TLSv1-3标准目前的状态}

到我写这篇文章时，TLSv1.3仍是一个草案。TLS工作团队定期会发布该标准的新版草案。实际中，需要对草案进行部署来识别他们使用的具体版本，基于不同草案版本的实现之间无法交互。

OpenSSL 1.1.1至少不会在TLSv1.3发布之前完成。同时，OpenSSL的git主分支包含了我们的TLSv1.3开发代码，可以用于测试（即不用于生产）。你可以在任意OpenSSL版本中通过头文件tls1.h中的宏TLS1\_3\_VERSION\_DRAFT\_TXT的值来查看部署的TLSv1.3草案的版本。在该标准的最终版发布后，这个宏会被删除。

TLSv1.3在最新的开发分支上默认是启用的（不需要单独开启）。如果需要禁用，你必须要在“config”或者“configure”的时候指定“no-tls1.3”选项。

当前OpenSSL是按照“draft-23”实现的TLSv1.3。其他支持TLSv1.3的应用可能使用老的draft版本。这在交互上有问题，如果两个程序（一个浏览器、一个服务端程序）支持不同的TLSv1.3 draft版本尝试沟通的话，可能都被降级到TLSv1.2

---

## 密码套件 {#密码套件}

OpenSSL已支持以下5种TLS 1.3的密码套件：

-   TLS13-AES-256-GCM-SHA384
-   TLS13-CHACHA20-POLY1305-SHA256
-   TLS13-AES-128-GCM-SHA256
-   TLS13-AES-128-CCM-8-SHA256
-   TLS13-AES-128-CCM-SHA256

其中，前三个是在默认密码套件组中。这意味着如果你没有主动对密码套件进行配置，那么你会自动使用这三个密码套件，并可以进行TLS 1.3磋商。

所有TLS 1.3密码套件也都出现在别名HIGH中。正如你预计的那样，CHACHA20、AES、AES128、AES256、AESGCM、AESCCM和AESCCM8这些密码套件别名都像它们的名称一样，且包含这些密码套件的一个子集。密钥交换和认证属性是TLS 1.2及以前版本中密码套件定义的一部分。在TLS 1.3中不再如此，所以密码套件别名（如ECHHE、ECDSA、RSA及其它相似别名）都不包含任何TLS 1.3密码套件。

如果你主动配置了你的密码套件，那么应该注意确保你没有不小心排除掉所有兼容TLS 1.3的密码套件。如果一个客户端启用了TLS 1.3而未配置TLS 1.3密码套件，那么会立即报错（即使服务器不支持TLS 1.3），出现以下提示：

```text
140460646909376:error:141A90B5:SSL routines:ssl_cipher_list_to_bytes:no ciphers available:ssl/statem/statem_clnt.c:3562:No ciphers enabled for max supported SSL/TLS version
```

类似地，如果一个服务器启用了TLS 1.3而未配置TLS 1.3密码套件，那么也会立即报错，即使客户端不支持TLS 1.3，提示如下：

```text
140547390854592:error:141FC0B5:SSL routines:tls_setup_handshake:no ciphers available:ssl/statem/statem_lib.c:108:No ciphers enabled for max supported SSL/TLS version
```

例如，默认设置一个密码套件选择字符串ECDHE:!COMPLEMENTOFDEFAULT，还使用ECDHE进行密钥交换。但是，ECDHE组中没有TLS 1.3密码套件，所以如果启用了TLS 1.3，那么这种密码套件配置在OpenSSL 1.1.1中将会出错。你可能要指定你想使用的TLS 1.3密码套件来避免出现问题。例如：

```text
TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-256-GCM-SHA384:ECDHE:!COMPLEMENTOFDEFAULT
```

你可以使用openssl ciphers -s -v命令来测试，在给定的密码套件选择字符串中包含那个密码套件：

```text
$ openssl ciphers -s -v "ECDHE:!COMPLEMENTOFDEFAULT"
```

确保至少有一个密码套件支持TLS 1.3

---

## 组 {#组}

在TLS 1.3中，客户端选择一个“组”用来进行密钥交换。在我撰文时，OpenSSL仅支持ECDHE组（当OpenSSL 1.1.1自动发布时，可能就会支持DHE组了）。客户端会在客户端问候消息中为其所选的组发送“key\_share”信息到服务器。

支持的组的名单是可配置的。一个客户端可能会选择一个服务器不支持的组。在这种情况下，服务器请求客户端发送一个其新支持的key\_share。这意味着仍会建立连接（假设存在一个互相支持的组），会引入一个额外的服务器双向连接——所以会对性能产生影响。在理想情况下，客户端将在第一个实例中选择一个服务器支持的组。

实际上，多数客户端都会为它们的首个key\_share使用 X25519或P-256。为实现性能最大化，建议对服务器进行配置，使其至少支持这两个组，客户端为其首个key\_share使用其中一个组。这是默认的情况（OpenSSL客户端将使用X25519）。

组配置还控制着TLS 1.2及以前版本中允许的组。如果应用程序在OpenSSL 1.1.0中曾配置过它们的组，那么你应该重新检查配置，以确保其对TLS 1.3仍然有效。第一个被指定的组（即最偏好的组）将会被一个OpenSSL客户端在其首次key\_share中使用。

应用程序可以使用SSL\_CTX\_set1\_groups（）或一个相似的函数（看[这里](https://www.openssl.org/docs/manmaster/man3/SSL_CTX_set1_groups.html)）配置组列表。如果应用程序使用SSL\_CONF风格配置文件，则可以使用Groups或Curves命令（看[这里](https://www.openssl.org/docs/manmaster/man3/SSL_CONF_cmd.html#SUPPORTED-CONFIGURATION-FILE-COMMANDS)）来进行配置。

---

## 会话 {#会话}

在TLS 1.2及以前版本中，一个会话的建立是握手的一部分。这个会话就可以在后续连接中被使用，以实现一个简单握手。一般，在握手完成后，应用程序可能通过使用SSL\_get1\_session（）函数（或类似函数）从会话上得到一个句柄。更多细节请看[这里](https://www.openssl.org/docs/manmaster/man3/SSL_get1_session.html)。

在TLS 1.3中，直到主握手完成后，会话才会建立。服务器发送一个独立的握手后消息（包含会话细节）到客户端。通常，这会发生在握手结束后不久，也可能会稍晚一些（甚至根本不发生）。

按照规范，建议应用程序每次只使用一个会话（即使不是强制性的）。由于这个原因，一些服务器会向一个客户端发送多个会话消息。为执行“每次使用一个”的建议，应用程序可以使用SSL\_CTX\_remove\_session（）把一个使用过的会话标记为不可恢复（从缓存中将其删除）。旧的SSL\_get1\_session（）和相似API可能像TLS 1.2及以前版本中一样运行。具体来说，如果一个客户端应用程序在收到包含会话细节的服务器消息之前就调用SSL\_get1\_session（），那么仍将返回一个SSL\_SESSION对象，任何试图恢复的企图都不会成功，而是会产生一个完整的握手。在服务器发送多个会话的情况下，只有最后一个会话被SSL\_get1\_session（）返回。

客户端应用程序开发者应该考虑使用SSL\_CTX\_sess\_set\_new\_cb（） API（看[这里](https://www.openssl.org/docs/manmaster/man3/SSL_CTX_sess_set_new_cb.html)）。这提供一个回调机制，每次新的会话建立时该机制都会被调用。如果服务器发送多个会话消息，就可以为一个连接调用多次。

注意，SSL\_CTX\_sess\_set\_new\_cb（）在OpenSSL 1.1.0中仍然可用。已使用的那个API应用程序仍可以工作，但它们可能会发现，回调机制被调用的时机变了，变成了在握手之后发生。

在主握手完成后，一个OpenSSL服务器将立即尝试发生会话细节到客户端。对服务器应用程序来说，这一握手后的阶段看起来像是主握手的一部分，所以对SSL\_get1\_session（）的调用应该像以前一样继续工作。

---

## 定制扩展和证书透明系统 {#定制扩展和证书透明系统}

在TLS 1.2及以前版本中，首次客户端问候信息和服务器问候信息可以包括“扩展”。这允许基础规定可以被添加很多额外特性，这些特性可能无法在所有情况下使用，或者在制定基础规定时无法预见。OpenSSL支持大量“内置”扩展。

此外，定制扩展API还为应用程序开发人员提供一些基本功能，以支持没有内置在OpenSSL中的新扩展。

建立在定制扩展API顶层的是“服务器信息”API。这提供了一个更加基础性的接口，可以在运行时进行配置。例如证书透明系统。OpenSSL为证书透明系统的客户端提供内置支持，但没有内置服务器端支持。但是，用“服务器信息”文件就很容易实现。一个包含证书透明系统信息的服务器信息文件可以在OpenSSL中配置，再被正确地发回客户端。

在TLS 1.3中，扩展的使用显著增加，有很多消息包含扩展。此外，一些支持TLS 1.2及以前版本的扩展在TLS 1.3中不再被支持，一些扩展从服务器问候消息转移到了加密扩展消息中。旧的定制扩展API没有能力指定扩展应该关联的消息。

由于这个原因，需要有一个新的定制扩展API。

旧API仍在工作，但定制扩展将只在TLS 1.2及以前版本环境下被添加。想要为所有TLS版本添加定制扩展，应用程序开发人员就需要把他们的应用程序更新到新的API（更多详情看[这里](https://www.openssl.org/docs/manmaster/man3/SSL_CTX_add_custom_ext.html)）。

“服务器信息”数据格式也已被更新，以包含额外的关于扩展所关联的消息的信息。使用“服务器信息”文件的应用程序可能需要更新到“版本2”的文件格式，才能在TLS 1.3中运行（更多细节看[这里](https://www.openssl.org/docs/manmaster/man3/SSL_CTX_use_serverinfo.html)和[这里](https://www.openssl.org/docs/manmaster/man3/SSL_CTX_use_serverinfo_file.html)）。

---

## 重新磋商 {#重新磋商}

TLS 1.3没有重新磋商机制，所以在TLS 1.3环境下，对SSL\_renegotiate（）和SSL\_renegotiate\_abbreviated（）的调用会立即失败。

重新磋商最常见的例子是更新连接密钥。再TLS 1.3中，函数SSL\_key\_update（）可以用于的这个目的（看这里）。

另外一个场景是从客户端请求一个整数，这个可以使用TLSv1.3中的SSL\_verify\_client\_post\_handshake()方法完成（获取详细信息点[这里](https://www.openssl.org/docs/manmaster/man3/SSL_verify_client_post_handshake.html)）。

---

## DSA证书 {#DSA证书}

TLS 1.3中不再允许DSA证书。如果你的服务器应用程序正在使用DSA证书，那么TLS 1.3连接将会失败，提示如下：

```text
140348850206144:error:14201076:SSL routines:tls_choose_sigalg:no suitable signature algorithm:ssl/t1_lib.c:2308:
```

请使用ECDSA或RSA证书。

---

## Middlebox Compatibility Mode {#Middlebox-Compatibility-Mode}

During development of the TLSv1.3 standard it became apparent that in some cases, even if a client and server both support TLSv1.3, connections could sometimes still fail. This is because middleboxes on the network between the two peers do not understand the new protocol and prevent the connection from taking place. In order to work around this problem the TLSv1.3 specification introduced a “middlebox compatibility” mode. This made a few optional changes to the protocol to make it appear more like TLSv1.2 so that middleboxes would let it through. Largely these changes are superficial in nature but do include sending some small but unneccessary messages. OpenSSL has middlebox compatibility mode on by default, so most users should not need to worry about this. However applications may choose to switch it off by calling the function SSL\_CTX\_clear\_options() and passing SSL\_OP\_ENABLE\_MIDDLEBOX\_COMPAT as an argument (see [here](https://www.openssl.org/docs/manmaster/man3/SSL_CTX_clear_options.html) for further details).

If the remote peer is not using middlebox compatibility mode and there are problematic middleboxes on the network path then this could cause spurious connection failures.

## 总结 {#总结}

TLS 1.3代表着一次重大进步，它有一些激动人心的特性，但对粗心的人来说，在更新时可能会有一些风险。大部分时候，这些问题都会有直接的解决办法。应用程序开发人员应该重新检查他们的代码，并考虑为更高效地使用TLS 1.3，是否应该安装所有更新。类似地，部署人员也应该重新检查他们的配置。

参考：  
[https://www.openssl.org/blog/blog/2018/02/08/tlsv1.3/](https://www.openssl.org/blog/blog/2018/02/08/tlsv1.3/)
