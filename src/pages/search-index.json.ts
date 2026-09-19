import { getPosts, postUrl } from '../lib/posts';
import { tagLabel } from '../lib/tags';

export async function GET() {
  const posts = await getPosts();
  return Response.json(posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    tags: [...new Set(post.data.tags.flatMap((tag) => [tag, tagLabel(tag)]))],
    url: postUrl(post),
    content: post.body ?? '',
  })));
}
