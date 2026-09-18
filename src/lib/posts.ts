import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export const PAGE_SIZE = 10;

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('posts')).sort(
    (a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id),
  );
}

export function postUrl(post: Post): string {
  return `/posts/${post.id}/`;
}

export function tagUrl(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}/`;
}

// The old site did not store a timezone. Keep its calendar date unchanged.
export function formatDate(date: string): string {
  return date.slice(0, 10).replaceAll('-', '.');
}
