import fm from 'front-matter';

export interface BlogPostAttributes {
  title: string;
  date: string;
  description: string;
  cover_image?: string;
  keywords?: string;
}

export interface BlogPost {
  slug: string;
  attributes: BlogPostAttributes;
  body: string;
}

export function parseBlogPost(slug: string, markdownContent: string): BlogPost {
  const { attributes, body } = fm<BlogPostAttributes>(markdownContent);
  return { slug, attributes, body };
}

let cachedAllPostsPromise: Promise<BlogPost[]> | null = null;

export function loadAllBlogPosts(): Promise<BlogPost[]> {
  if (cachedAllPostsPromise) {
    return cachedAllPostsPromise;
  }
  cachedAllPostsPromise = (async () => {
    const files = import.meta.glob('/public/blog-posts/*.md', { query: '?raw', import: 'default' });
    const postPromises = Object.entries(files).map(async ([path, loader]) => {
      const slug = path.split('/').pop()?.replace('.md', '') || '';
      const content = await (loader as () => Promise<string>)();
      return parseBlogPost(slug, content);
    });
    const allPosts = await Promise.all(postPromises);
    allPosts.sort((a, b) => new Date(b.attributes.date).getTime() - new Date(a.attributes.date).getTime());
    return allPosts;
  })();
  return cachedAllPostsPromise;
}
