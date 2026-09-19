import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postUrl } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: "Weir's Note",
    description: '应无所住而生其心',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: postUrl(post),
      // RSS requires a timezone; expose only the known calendar day at UTC midnight.
      pubDate: new Date(`${post.data.date.slice(0, 10)}T00:00:00Z`),
      categories: post.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
