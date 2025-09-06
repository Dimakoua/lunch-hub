import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [postContent, setPostContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Fetch the markdown file from the public directory
        const response = await fetch(`/blog-posts/${slug}.md`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setPostContent(text);
      } catch (err) {
        setError('Failed to load blog post.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading blog post...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!postContent) {
    return <div className="container mx-auto p-4">Blog post not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 prose dark:prose-invert max-w-3xl lg:max-w-4xl">
      <Link to="/blog" className="text-blue-600 hover:underline dark:text-blue-400 mb-4 block">&larr; Back to Blog</Link>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {postContent}
      </ReactMarkdown>
    </div>
  );
};

export default BlogPostPage;
