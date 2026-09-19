# Weir's Note

个人技术博客，记录 Linux、网络、云原生与系统设计等内容。

- 在线访问：<https://leeweir.github.io>
- RSS 订阅：<https://leeweir.github.io/rss.xml>

基于 **Astro 7 + TypeScript + Markdown** 构建，生成纯静态站点，通过 GitHub Actions 部署到 GitHub Pages。

## 功能

- 随机名言首页（中国作者、外国作者各 50 条）、文章列表与分页
- 文章归档、标签索引与搜索
- Markdown 文章与代码语法高亮
- RSS、站点地图与页面 SEO 元信息

## 本地开发

需要 Node.js **22.12.0 或更高版本**及 npm；项目的 `.nvmrc` 使用 Node.js 22。

```bash
# 如果使用 nvm
nvm install
nvm use

# 安装依赖并启动开发服务器
npm ci
npm run dev
```

默认访问 <http://localhost:4321>，实际地址以终端输出为准。

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run check` | 运行 Astro 与 TypeScript 检查 |
| `npm run build` | 构建静态站点，输出到 `dist/` |
| `npm run preview` | 本地预览构建产物，需先执行构建 |

## 目录结构

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages 构建与部署
├── astro.config.mjs             # 站点地址、Markdown 与 sitemap 配置
├── public/
│   ├── fonts/                   # 首页名言字体子集、许可证及维护说明
│   ├── img/                     # 站点公共图片
│   └── posts/                   # 文章图片及附件
├── src/
│   ├── components/              # 文章列表、分页等组件
│   ├── content/posts/           # Markdown 文章
│   ├── content.config.ts        # 文章集合与元数据校验
│   ├── layouts/                 # 页面公共布局
│   ├── lib/                     # 文章工具与 Markdown 扩展
│   ├── pages/                   # 页面路由、RSS 与搜索索引
│   └── styles/                  # 全局样式
└── package.json
```

## 首页名言

名言维护在 `src/lib/quotes.ts`，分为 `chineseQuotes` 和 `foreignQuotes` 两组，各 50 条。外国名言以中文译文展示，并记录出处及对应原文。刷新首页随机展示一条，避免连续出现相同内容。

首页默认使用自托管的霞鹜文楷子集，并提供朱雀仿宋对比：访问 `/?font=wenkai` 或 `/?font=fangsong`，两版会展示同一句名言。新增名言字符时，请按 [`public/fonts/README.md`](public/fonts/README.md) 更新字体。

## 编写文章

在 `src/content/posts/` 下创建 Markdown 文件，例如 `hello-world.md`：

```markdown
---
title: "我的第一篇文章"
date: "2026-01-01T10:00"
tags: ["Linux", "随笔"]
description: "这篇文章的简短介绍。"
---

## 开始

在这里编写正文。
```

元数据说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | 带引号的日期字符串，支持 `YYYY-MM-DD`、`YYYY-MM-DDTHH:mm` 或 `YYYY-MM-DDTHH:mm:ss` |
| `tags` | 是 | 标签字符串数组，无标签时使用 `[]` |
| `description` | 是 | 文章摘要 |
| `cover` | 否 | 封面图片路径 |

文章按日期倒序排列。建议使用小写英文和连字符命名文件；上述文件对应的文章地址为 `/posts/hello-world/`。

将图片或附件放在 `public/posts/hello-world/` 中，使用不带 `public` 前缀的路径引用：

```markdown
![示例图片](/posts/hello-world/example.png)
```

发布前运行：

```bash
npm run check
npm run build
```

## 部署

仓库已配置 GitHub Pages 自动部署：

1. 在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中，将来源设为 **GitHub Actions**。
2. 将代码推送到 `master` 分支，或在 Actions 页面手动运行部署工作流。
3. 工作流会依次安装依赖、检查代码、构建站点，并将 `dist/` 发布到 GitHub Pages。

当前配置使用站点根路径。若更换域名，请更新 `astro.config.mjs` 中的 `site` 及 `public/robots.txt` 等相关地址。若部署到 `/仓库名/` 子路径，还需配置 Astro 的 `base`，并调整页面及资源中的根路径链接。
