---
title: "DomContentLoaded 和 Load 的区别"
slug: "DomContentLoaded-and-Load"
date: "2018-02-05T11:17"
tags: ["sre","frontend"]
description: "前两天排查了一个用户访问的问题，从而对DomContentLoaded和load进行了一下了解，首先看下chrome上的network："
---

前两天排查了一个用户访问的问题，从而对DomContentLoaded和load进行了一下了解，首先看下chrome上的network：

![](/posts/DomContentLoaded-and-Load/chrome_network.jpg "This is an image")

可以看到分别有一根蓝线和红线对应DomContentLoaded和load，那分别什么意思呢  
**DomContentLoaded**

> The DOMContentLoaded event is fired when the initial HTML document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading.

**Load**

> The load event is fired when a resource and its dependent resources have finished loading.

DomContentLoaded表示整个dom内容加载完毕，我们看下浏览器的渲染原理：

> 当我们在浏览器地址输入URL时，浏览器会发送请求到服务器，服务器将请求的HTML文档发送回浏览器，浏览器将文档下载下来后，便开始从上到下解析，解析完成之后，会生成DOM。如果页面中有css，会根据css的内容形成CSSOM，然后DOM和CSSOM会生成一个渲染树，最后浏览器会根据渲染树的内容计算出各个节点在页面中的确切大小和位置，并将其绘制在浏览器上。

![](/posts/DomContentLoaded-and-Load/browser.png "This is an image")

再看下具体的执行

![](/posts/DomContentLoaded-and-Load/chrome_performence.jpg "This is an image")

看chrome上的performance，我们可以发现：

> 在解析html的过程中，html的解析会被中断，这是因为javascript会阻塞dom的解析。当解析过程中遇到script标签的时候，便会停止解析过程，转而去处理脚本，如果脚本是内联的，浏览器会先去执行这段内联的脚本，如果是外链的，那么先会去加载脚本，然后执行。在处理完脚本之后，浏览器便继续解析HTML文档。同时javascript的执行会受到标签前面样式文件的影响。如果在标签前面有样式文件，需要样式文件加载并解析完毕后才执行脚本.

所以可以明确DOMContentLoaded所计算的时间，当文档中没有脚本时，浏览器解析完文档便能触发 DOMContentLoaded 事件；如果文档中包含脚本，则脚本会阻塞文档的解析，而脚本需要等位于脚本前面的css加载完才能执行。在任何情况下，DOMContentLoaded 的触发不需要等待图片等其他资源加载完成。而load就是整个资源全部都加载好，包括images，scripts、iframe等等。

参考：  
[https://developers.google.com/web/tools/chrome-devtools/network-performance/resource-loading?hl=zh-cn](https://developers.google.com/web/tools/chrome-devtools/network-performance/resource-loading?hl=zh-cn)  
[https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded](https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded)  
[https://developer.mozilla.org/en-US/docs/Web/Events/load](https://developer.mozilla.org/en-US/docs/Web/Events/load)  
[http://javascript.info/onload-ondomcontentloaded](http://javascript.info/onload-ondomcontentloaded)  
[http://www.cnblogs.com/caizhenbo/p/6679478.html](http://www.cnblogs.com/caizhenbo/p/6679478.html)
