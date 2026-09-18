---
title: "Dockerfile ENV 的问题"
slug: "dockerfile-env"
date: "2020-05-28T16:08"
tags: ["cloud-native","docker"]
description: "今天遇见一个小问题，大概是这样，我们的镜像是分层的，在 base 镜像里设置了一个 ENV，然后在后面一层镜像的时候 unset 掉了，但是实际运行的时候发现这个 ENV 一直存在，导致应用启动失败。花了一些时间查问题，其实本身也是 dockerfile 的设计，之前没有体系化的去看，所以这篇就记录下关于 ENV 的最"
---

今天遇见一个小问题，大概是这样，我们的镜像是分层的，在 base 镜像里设置了一个 `ENV`，然后在后面一层镜像的时候 unset 掉了，但是实际运行的时候发现这个 `ENV` 一直存在，导致应用启动失败。花了一些时间查问题，其实本身也是 dockerfile 的设计，之前没有体系化的去看，所以这篇就记录下关于 `ENV` 的最佳实践。

[Dockerfile reference for the ENV instruction](https://docs.docker.com/engine/reference/builder/#env)

为了使新软件更易于运行，您可以使用 `ENV` 为你的容器更新 `PATH` 环境变量。例如，`ENV PATH /usr/local/nginx/bin:$PATH` 确保 `CMD ["nginx"]` 正常工作。

`ENV` 指令对于提供所需的环境变量也很有用，这些变量特定于您希望容器化的服务，例如 Postgres 的 PGDATA。

最后，还可以使用 `ENV` 设置常用的版本号，以便更容易维护版本，如下面的示例所示：

```dockerfile
ENV PG_MAJOR 9.3
ENV PG_VERSION 9.3.4
RUN curl -SL http://example.com/postgres-$PG_VERSION.tar.xz | tar -xJC /usr/src/postgress && …
ENV PATH /usr/local/postgres-$PG_MAJOR/bin:$PATH
```

类似于在程序中具有常量变量（而不是硬编码的值），这种方法允许您更改单个 `ENV` 指令，以自动地在容器中加载软件的版本。。

每条 `ENV` 行都会创建一个新的中间层，就像 `RUN` 命令一样。这意味着，即使您在以后的层中取消环境变量，它也仍将保留在该层中，并且其值也无法清掉. 您可以通过创建如下所示的 Dockerfile，然后对其进行构建来进行测试。

```dockerfile
FROM alpine
ENV ADMIN_USER="mark"
RUN echo $ADMIN_USER > ./mark
RUN unset ADMIN_USER
```

```shell
$ docker run --rm test sh -c 'echo $ADMIN_USER'

mark
```

为避免这种情况，并真正取消对环境变量的设置，可以使用带有 shell 命令的 `RUN` 命令，在一个单独的层中设置、使用和取消对环境变量的设置。你可以用 `;` 和 `&&` 来分隔命令。如果您使用第二种方法，并且其中一个命令失败，docker 构建也会失败。在 Linux Dockerfiles 中使用 `\` 作为行连续字符可以提高可读性。您还可以将所有命令放入一个 shell 脚本中，并让 `RUN` 命令直接运行该 shell 脚本。

```dockerfile
FROM alpine
RUN export ADMIN_USER="mark" \
    && echo $ADMIN_USER > ./mark \
    && unset ADMIN_USER
CMD sh
```

```shell
$ docker run --rm test sh -c 'echo $ADMIN_USER'
```
