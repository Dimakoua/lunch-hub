import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import remarkGfm from 'remark-gfm';
import { parseBlogPost, BlogPost } from '../services/blog';
import {LoadingSpinner} from '../components/LoadingSpinner';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        const response = await fetch(`/blog-posts/${slug}.md`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdownContent = await response.text();
        const parsedPost = parseBlogPost(slug, markdownContent);
        setPost(parsedPost);
      } catch (err) {
        setError('Failed to load blog post.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!post) {
    return <div className="container mx-auto p-4 text-center">Blog post not found.</div>;
  }

  const { attributes, body } = post;
  const postUrl = window.location.href;
  const coverImageUrl = attributes.cover_image ? `${window.location.origin}${attributes.cover_image}` : `${window.location.origin}/images/lunchhub-og-image.png`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>{`${attributes.title} - Lunch Hub Blog`}</title>
        <meta name="description" content={attributes.description} />
        <link rel="canonical" href={postUrl} />

        {/* Open Graph Tags */}
        <meta property="og:title" content={attributes.title} />
        <meta property="og:description" content={attributes.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:image" content={coverImageUrl} />
        <meta property="article:published_time" content={new Date(attributes.date).toISOString()} />
        <meta property="article:author" content="Lunch Hub Team" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={attributes.title} />
        <meta name="twitter:description" content={attributes.description} />
        <meta name="twitter:image" content={coverImageUrl} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": "${attributes.title}",
              "description": "${attributes.description}",
              "image": "${coverImageUrl}",
              "url": "${postUrl}",
              "datePublished": "${new Date(attributes.date).toISOString()}",
              "author": {
                "@type": "Organization",
                "name": "Lunch Hub"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Lunch Hub",
                "logo": {
                  "@type": "ImageObject",
                  "url": "${window.location.origin}/images/lunchhub-og-image.png"
                }
              }
            }
          `}
        </script>
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
              {attributes.title}
            </li>
          </ol>
        </nav>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {body}
        </ReactMarkdown>
      </div>
    </main>
  );
};


export default BlogPostPage;
