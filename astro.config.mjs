import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import explicitHeadingIds from './src/lib/explicit-heading-ids.mjs';

export default defineConfig({
  site: 'https://leeweir.github.io',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    processor: unified({ remarkPlugins: [explicitHeadingIds], smartypants: false }),
    shikiConfig: { theme: 'github-light' },
  },
});
