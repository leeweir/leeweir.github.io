---
title: "django singal post update"
slug: "django-singal-post-update"
date: "2018-01-30T20:32"
tags: ["python"]
description: "前不久一个新人问我如何在 django 的 singal 中实现 post update，可是默认 queryset 的 update 是直接调用 sql 的，不会使用 django orm 中的 save 方法，signal 中默认只有 post save 的方法。最后大致实现如下:"
---

前不久一个新人问我如何在 django 的 singal 中实现 post update，可是默认 queryset 的 update 是直接调用 sql 的，不会使用 django orm 中的 save 方法，signal 中默认只有 post save 的方法。最后大致实现如下:

[updating-multiple-objects-at-once](https://docs.djangoproject.com/en/dev/topics/db/queries/#updating-multiple-objects-at-once)

> update() is converted directly to an SQL statement; it doesn’t call save() on the model instances, and so the pre\_save and post\_save signals aren’t emitted. If you want your signal receivers to be called, you should loop over the queryset, and for each model instance, make your changes and call save() yourself.

singals.py文件

```python
# 自定义 singal
from django.dispatch import Signal
post_update = Signal(providing_args=["user"])
```

models.py文件

```python
# 对某个 model，override 其 queryset 中的 update 方法
# 引入自定义的signal文件
from tools import signals

class MyCustomQuerySet(models.query.QuerySet):
    def update(self, **kwargs):
        super(MyCustomQuerySet, self).update(**kwargs)
        //update被调用时， 发送该singal
        signals.post_update.send(sender=self.model, user="xxx")
        print("finished!")

class MyCustomManager(models.Manager):
    def get_queryset(self):
        return MyCustomQuerySet(self.model, using=self._db)

class crontab_ping(models.Model):
    name = models.CharField(max_length=64, blank=True, null=True)
    objects = MyCustomManager()
```

callback.py文件：

```python
#接收signal，触发操作
from tools.signals import post_update

@receiver(post_update)
def post_update_callback(sender, **kwargs):
    print(kwargs['user'])
    print("post_update_success")
```
