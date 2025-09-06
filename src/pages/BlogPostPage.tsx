import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
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
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>{postContent ? postContent.split('\n')[0].replace(/^#\s*/, '') + ' - Lunch Hub Blog' : 'Blog Post - Lunch Hub'}</title>
        <meta name="description" content={postContent ? postContent.split('\n')[2] : 'Read our latest blog post.'} />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8 pt-16 prose dark:prose-invert max-w-3xl lg:max-w-4xl">
        <nav className="text-sm" aria-label="breadcrumb">
          <ol className="inline-flex items-center space-x-2 not-prose text-gray-500 dark:text-gray-400 list-none mb-6">
            <li className="inline-flex items-center">
              <Link to="/blog" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Blog</Link>
            </li>
            <li>
              <span className="mx-2 text-gray-400 dark:text-gray-600">/</span>
            </li>
            <li className="inline-flex items-center text-gray-800 dark:text-gray-100 font-semibold" aria-current="page">
              {postContent ? postContent.split('\n')[0].replace(/^#\s*/, '') : 'Blog Post'}
            </li>
          </ol>
        </nav>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {postContent}
        </ReactMarkdown>
      </div>
    </main>
  );
};

export default BlogPostPage;
