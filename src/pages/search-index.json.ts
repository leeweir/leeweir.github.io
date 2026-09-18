import { getPosts, postUrl } from '../lib/posts';

export async function GET() {
  const posts = await getPosts();
  return Response.json(posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags,
    url: postUrl(post),
    content: post.body ?? '',
  })));
}
