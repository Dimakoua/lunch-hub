
import fm from 'front-matter';

export interface BlogPostAttributes {
  title: string;
  date: string;
  description: string;
  cover_image?: string;
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
