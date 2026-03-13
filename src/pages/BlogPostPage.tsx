import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import remarkGfm from 'remark-gfm';
import { parseBlogPost, BlogPost } from '../services/blog';
import {LoadingSpinner} from '../components/LoadingSpinner';

const ReadingTime: React.FC<{ text: string }> = ({ text }) => {
  const stats = useMemo(() => {
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 200);
    return time;
  }, [text]);

  return (
    <span className="flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      {stats} min read
    </span>
  );
};

const LinkRenderer: React.FC<any> = ({ href, children }) => {
  const isInternal = href && !href.startsWith('http') && !href.startsWith('https') && !href.startsWith('//');
  
  if (isInternal) {
    return <Link to={`/blog/${href}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">{children}</Link>;
  }
  
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
      {children}
    </a>
  );
};

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
  
  // Handle absolute Unsplash URLs or relative local paths
  const getFullImageUrl = (imagePath?: string) => {
    if (!imagePath) return `${window.location.origin}/images/lunchhub-og-image.png`;
    if (imagePath.startsWith('http')) return imagePath;
    return `${window.location.origin}${imagePath}`;
  };

  const coverImageUrl = getFullImageUrl(attributes.cover_image);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>{`${attributes.title} - Lunch Hub Blog`}</title>
        <meta name="description" content={attributes.description} />
        {attributes.keywords && <meta name="keywords" content={attributes.keywords} />}
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
      <div className="relative z-10 container mx-auto px-4 py-8 pt-16 max-w-3xl lg:max-w-4xl">
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
        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-12">
          {attributes.cover_image && (
            <img 
              src={attributes.cover_image} 
              alt={attributes.title} 
              className="w-full h-auto rounded-xl mb-8 object-cover max-h-[400px]"
            />
          )}
          <header className="mb-8 border-b pb-8 border-gray-100 dark:border-gray-700">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 line-tight leading-tight">
              {attributes.title}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <time dateTime={new Date(attributes.date).toISOString()} className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                {new Date(attributes.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <span className="mx-3 hidden sm:inline">•</span>
              <ReadingTime text={body} />
              <span className="mx-3 hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Lunch Hub Team
              </span>
            </div>
          </header>
          
          <div className="prose prose-lg dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
            prose-p:text-gray-700 dark:prose-p:text-gray-300
            prose-a:no-underline prose-strong:text-gray-900 dark:prose-strong:text-white">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: LinkRenderer,
                h2: ({node, ...props}) => <h2 className="text-2xl mt-12 mb-6 pb-2 border-b border-gray-100 dark:border-gray-700" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl mt-8 mb-4 font-semibold" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-4 italic my-8 bg-emerald-50 dark:bg-emerald-900/20 py-4 rounded-r-lg" {...props} />,
              }}
            >
              {body}
            </ReactMarkdown>
          </div>
          
          <footer className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Lunch Hub Team</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Curating the best dining experiences.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: attributes.title,
                        text: attributes.description,
                        url: postUrl,
                      });
                    } else {
                      navigator.clipboard.writeText(postUrl);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all duration-200 text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                  Share Post
                </button>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
};


export default BlogPostPage;
