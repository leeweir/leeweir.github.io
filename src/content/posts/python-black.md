---
title: "Python 格式化工具 Black"
slug: "python-black"
date: "2018-07-20T15:46"
tags: ["python"]
description: "Black是facebook提供的一个python formatter工具，体验了下确实很不错，现在默认编码格式化就用它了。 名字的是来自福特公司当年说过的一句话："
---

Black是facebook提供的一个python formatter工具，体验了下确实很不错，现在默认编码格式化就用它了。 名字的是来自福特公司当年说过的一句话：

> Any customer can have a car painted any color that he wants so long as it is black.

具体的code style我就不介绍了，可以查看：[https://black.readthedocs.io/en/stable/](https://black.readthedocs.io/en/stable/)

我这边主要讲一下pycharm上的配置：

1.  安装Black
    
    ```text
    $ pip install black
    ```
    
2.  查找Black的安装路径
    
    ```text
    (python3) λ which black
    /c/ProgramData/Anaconda2/envs/python3/Scripts/black
    ```
    
3.  打开pycharm，`File -> Settings -> Tools -> External Tools`
    

<a id="more"></a>

4.  点击”+”增加tool，具体配置如下:
    
    ```text
    Name: Black
    Description: Black is the uncompromising Python code formatter.
    Program: c:/ProgramData/Anaconda2/envs/python3/Scripts/black
    Arguments: $FilePath$ --line-length 79
    ```
    
    ![](/posts/python-black/pycharm_tool_config.jpg "This is an image")
5.  通过工具栏上的 `Tools -> External Tools -> black.` 点击format，也可以增加快捷键来操作
    

效果： format前：

```python
x = {  'a':37,'b':42,

'c':927}

y = 'hello ''world'
z = 'hello '+'world'
a = 'hello {}'.format('world')
class foo  (     object  ):
  def f    (self   ):
    return       37*-+2
  def g(self, x,y=42):
      return y
def f  (   a ) :
  return      37+-+a[42-x :  y**3]
```

format后：

```python
x = {'a': 37, 'b': 42, 'c': 927}

y = 'hello ' 'world'
z = 'hello ' + 'world'
a = 'hello {}'.format('world')


class foo(object):
    def f(self):
        return 37 * -+2

    def g(self, x, y=42):
        return y


def f(a):
    return 37 + -+a[42 - x:y**3]
```
