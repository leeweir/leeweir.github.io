# 首页名言字体

首页默认使用 **霞鹜文楷 Regular**，另提供 **朱雀仿宋 Regular** 供对比。两款字体均按名言库裁剪为 WOFF2，自托管，不请求外部字体服务；每次只加载当前选中的一款。加载失败时回退到系统楷体或仿宋。

| 文件 | 上游版本 | 许可证 |
| --- | --- | --- |
| `quote-wenkai.woff2` | [霞鹜文楷 v1.522](https://github.com/lxgw/LxgwWenKai/releases/tag/v1.522) | `OFL-WenKai.txt` |
| `quote-fangsong.woff2` | [朱雀仿宋 v0.212（预发布版）](https://github.com/TrionesType/zhuque/releases/tag/v0.212) | `OFL-Zhuque.txt` |

均使用 SIL Open Font License 1.1。子集字符来自 `src/lib/quotes.ts`，另加基本 ASCII、破折号和间隔号。

## 对比预览

- `/?font=wenkai`：霞鹜文楷
- `/?font=fangsong`：朱雀仿宋

对比链接默认展示同一句苏轼名言。可添加 `&quote=57` 切换到第 57 条名言；编号范围为 1–100，前 50 条为中国作者，后 50 条为外国作者。无效编号使用默认对比名言。

不带 `font` 参数时仍随机展示，并避免连续重复。参数仅用于字体对比，不持久保存偏好，也不增加首页控件。对比功能需要 JavaScript；禁用 JavaScript 时仍显示默认文楷和首条名言。

## 更新子集

新增字符后需要重新生成子集，否则新字符会回退到系统字体。以下命令在仓库根目录运行；仅维护字体时需要 Python 和 FontTools，正常开发、构建不依赖它们。

```bash
python3 -m venv /tmp/weir-quote-font-env
/tmp/weir-quote-font-env/bin/pip install 'fonttools[woff]' brotli

curl -L --fail \
  'https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Regular.ttf' \
  -o /tmp/LXGWWenKai-Regular.ttf

curl -L --fail \
  'https://github.com/TrionesType/zhuque/releases/download/v0.212/ZhuqueFangsong-v0.212.zip' \
  -o /tmp/ZhuqueFangsong.zip
unzip -o /tmp/ZhuqueFangsong.zip -d /tmp/weir-zhuque

/tmp/weir-quote-font-env/bin/pyftsubset /tmp/LXGWWenKai-Regular.ttf \
  --text-file=src/lib/quotes.ts --unicodes=U+0020-007E,U+2014,U+00B7 \
  --flavor=woff2 --layout-features='*' --no-hinting \
  --output-file=public/fonts/quote-wenkai.woff2

/tmp/weir-quote-font-env/bin/pyftsubset /tmp/weir-zhuque/ZhuqueFangsong-Regular.ttf \
  --text-file=src/lib/quotes.ts --unicodes=U+0020-007E,U+2014,U+00B7 \
  --flavor=woff2 --layout-features='*' --no-hinting \
  --output-file=public/fonts/quote-fangsong.woff2
```

保留对应字体许可证，并将更新后的 WOFF2 文件一同提交。
