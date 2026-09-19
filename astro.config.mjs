import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import explicitHeadingIds from './src/lib/explicit-heading-ids.mjs';
import { TAG_ALIASES } from './src/lib/tags.ts';

export default defineConfig({
  site: 'https://leeweir.github.io',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  redirects: Object.fromEntries(
    Object.entries(TAG_ALIASES).map(([alias, tag]) => [`/tags/${alias}/`, `/tags/${tag}/`]),
  ),
  markdown: {
    processor: unified({ remarkPlugins: [explicitHeadingIds], smartypants: false }),
    shikiConfig: { theme: 'github-light' },
  },
});
