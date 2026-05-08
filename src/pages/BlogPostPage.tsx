import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, User, Share2, ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import { parseBlogPost, BlogPost } from '../services/blog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Breadcrumb } from '../components/Breadcrumb';
import { generateArticleSchema, renderSchema } from '../utils/schemaMarkup';

const ReadingTime: React.FC<{ text: string }> = ({ text }) => {
  const stats = useMemo(() => {
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 200);
    return time;
  }, [text]);

  return (
    <span className="flex items-center gap-1.5">
      <Clock className="w-4 h-4 text-emerald-500" />
      {stats} min read
    </span>
  );
};

interface LinkRendererProps {
  href?: string;
  children?: React.ReactNode;
}

const LinkRenderer: React.FC<LinkRendererProps> = ({ href, children }) => {
  const isInternal = href && !href.startsWith('http') && !href.startsWith('https') && !href.startsWith('//');
  
  if (isInternal) {
    return <Link to={`/blog/${href}`} className="text-blue-600 dark:text-dark-primary font-bold hover:underline decoration-2 underline-offset-4">{children}</Link>;
  }
  
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-dark-primary font-bold hover:underline decoration-2 underline-offset-4">
      {children}
    </a>
  );
};

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
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

  useEffect(() => {
    const loadPosts = async () => {
      const files = import.meta.glob('/public/blog-posts/*.md', { query: '?raw', import: 'default' });

      const postPromises = Object.entries(files).map(async ([path, loader]) => {
        const slug = path.split('/').pop()?.replace('.md', '') || '';
        const content = await (loader as () => Promise<string>)();
        return parseBlogPost(slug, content);
      });

      const allPosts = await Promise.all(postPromises);
      allPosts.sort((a, b) => new Date(b.attributes.date).getTime() - new Date(a.attributes.date).getTime());
      setPosts(allPosts);
    };

    loadPosts();
  }, []);

  const relatedPosts = useMemo(() => {
    if (!post || posts.length === 0) {
      return [];
    }

    const normalizeTerms = (text: string) =>
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

    const currentTerms = new Set<string>([
      ...(post.attributes.keywords?.split(',').map((keyword) => keyword.trim().toLowerCase()) ?? []),
      ...normalizeTerms(post.attributes.title),
    ]);

    const scored = posts
      .filter((item) => item.slug !== post.slug)
      .map((item) => {
        const itemTerms = new Set<string>([
          ...(item.attributes.keywords?.split(',').map((keyword) => keyword.trim().toLowerCase()) ?? []),
          ...normalizeTerms(item.attributes.title),
        ]);

        const score = [...currentTerms].reduce((count, term) => (itemTerms.has(term) ? count + 1 : count), 0);
        return { item, score };
      });

    const matches = scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.item.attributes.date).getTime() - new Date(a.item.attributes.date).getTime())
      .map(({ item }) => item)
      .slice(0, 3);

    if (matches.length > 0) {
      return matches;
    }

    return posts.filter((item) => item.slug !== post.slug).slice(0, 3);
  }, [post, posts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-blue-600 dark:border-dark-border dark:border-t-dark-primary"></div>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-dark-text-secondary">Unfolding the story...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-dark-background p-4">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-text mb-2">Post not found</h1>
        <p className="text-slate-500 dark:text-dark-text-secondary mb-8">We couldn't find the article you were looking for.</p>
        <Link to="/blog" className="bg-slate-900 dark:bg-dark-primary text-white dark:text-black px-8 py-3 rounded-2xl font-black transition-all hover:scale-105">
          Back to Blog
        </Link>
      </div>
    );
  }

  const { attributes, body } = post;
  const postUrl = window.location.href;
  const origin = window.location.origin;
  
  const getFullImageUrl = (imagePath?: string) => {
    if (!imagePath) return `${origin}/images/lunchhub-og-image.png`;
    if (imagePath.startsWith('http')) return imagePath;
    return `${origin}${imagePath}`;
  };

  const coverImageUrl = getFullImageUrl(attributes.cover_image);
  const articleSchema = generateArticleSchema(
    attributes.title,
    attributes.description,
    postUrl,
    new Date(attributes.date).toISOString(),
    coverImageUrl,
    'Lunch Hub Team'
  );

  return (
    <main className="min-h-screen bg-white dark:bg-dark-background pb-24">
      <Helmet>
        <title>{`${attributes.title} - Lunch Hub Blog`}</title>
        <meta name="description" content={attributes.description} />
        {attributes.keywords && <meta name="keywords" content={attributes.keywords} />}
        <link rel="canonical" href={postUrl} />
        <meta property="og:title" content={attributes.title} />
        <meta property="og:description" content={attributes.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:image" content={coverImageUrl} />
        <meta property="article:published_time" content={new Date(attributes.date).toISOString()} />
        <meta property="article:author" content="Lunch Hub Team" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{renderSchema(articleSchema)}</script>
      </Helmet>

      {/* Article Hero */}
      <div className="relative w-full h-[50vh] sm:h-[60vh] overflow-hidden bg-slate-900">
        {attributes.cover_image && (
          <img 
            src={attributes.cover_image} 
            alt={attributes.title} 
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-dark-background via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full pb-12 sm:pb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-600 dark:bg-dark-primary text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                Lunch Journal
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-dark-text leading-[1.1] mb-6">
              {attributes.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500 dark:text-dark-text-secondary uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500 dark:text-dark-primary" />
                {new Date(attributes.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <ReadingTime text={body} />
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500 dark:text-dark-primary" />
                Lunch Hub Team
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
        <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: attributes.title }]} className="mb-12" />
        
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <article className="lg:col-span-8">
            <div className="prose prose-lg dark:prose-invert max-w-none 
              prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-dark-text
              prose-p:text-slate-600 dark:prose-p:text-dark-text-secondary prose-p:leading-relaxed prose-p:font-medium
              prose-strong:text-slate-900 dark:prose-strong:text-dark-text prose-strong:font-black
              prose-blockquote:border-l-8 prose-blockquote:border-blue-600 dark:prose-blockquote:border-dark-primary prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-dark-card prose-blockquote:rounded-2xl prose-blockquote:p-8 prose-blockquote:italic
              prose-img:rounded-[2rem] prose-img:shadow-2xl">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: LinkRenderer,
                  h2: ({...props}) => <h2 className="text-3xl mt-16 mb-8" {...props} />,
                  h3: ({...props}) => <h3 className="text-2xl mt-12 mb-6" {...props} />,
                }}
              >
                {body}
              </ReactMarkdown>
            </div>

            {/* Post Footer */}
            <footer className="mt-20 pt-12 border-t border-slate-100 dark:border-dark-border">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 flex items-center justify-center text-white dark:text-black">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-dark-text">Lunch Hub Team</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-dark-text-secondary">Curating the best dining experiences.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: attributes.title, text: attributes.description, url: postUrl });
                    } else {
                      navigator.clipboard.writeText(postUrl);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-dark-card text-white font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                >
                  <Share2 className="w-5 h-5" />
                  Share This Post
                </button>
              </div>
            </footer>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            <div className="sticky top-24 space-y-12">
              {/* Back to Blog */}
              <Link to="/blog" className="group flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 dark:hover:text-dark-primary transition-colors">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to all posts
              </Link>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <section>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-dark-text mb-8 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-dark-primary rounded-full" />
                    Read Next
                  </h3>
                  <div className="space-y-8">
                    {relatedPosts.map((related) => (
                      <Link
                        key={related.slug}
                        to={`/blog/${related.slug}`}
                        className="group block"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{new Date(related.attributes.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-colors leading-snug">
                          {related.attributes.title}
                        </h4>
                        <div className="mt-3 flex items-center gap-2 text-xs font-black text-blue-600 dark:text-dark-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          View Post <ArrowRight className="w-4 h-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Newsletter CTA Style */}
              <div className="bg-slate-50 dark:bg-dark-card p-8 rounded-[2rem] border border-slate-100 dark:border-dark-border">
                <h3 className="text-xl font-black text-slate-900 dark:text-dark-text mb-4">Never Miss a Meal</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-dark-text-secondary mb-6 leading-relaxed">
                  Join our community to get the best lunch spots delivered to your home screen.
                </p>
                <Link to="/restaurants" className="block w-full bg-slate-900 dark:bg-dark-primary text-white dark:text-black text-center font-black py-4 rounded-2xl transition-all hover:opacity-90">
                  Try Lunch Hub
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default BlogPostPage;
