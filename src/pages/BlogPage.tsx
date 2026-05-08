import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { parseBlogPost, BlogPost } from '../services/blog';
import { Breadcrumb } from '../components/Breadcrumb';

const BlogPage: React.FC = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thelunchub.com';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;

  useEffect(() => {
    const loadPosts = async () => {
      const files = import.meta.glob('/public/blog-posts/*.md', { query: '?raw', import: 'default' });

      const postPromises = Object.entries(files).map(async ([path, loader]) => {
        const slug = path.split('/').pop()?.replace('.md', '') || '';
        const content = await (loader as () => Promise<string>)();
        return parseBlogPost(slug, content);
      });

      const postsData = await Promise.all(postPromises);
      postsData.sort((a, b) => new Date(b.attributes.date).getTime() - new Date(a.attributes.date).getTime());

      setPosts(postsData);
    };

    loadPosts();
  }, []);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(posts.length / postsPerPage);

  const renderPaginationButtons = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`mx-1 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
            currentPage === i
              ? 'bg-slate-900 dark:bg-dark-primary text-white dark:text-black scale-110'
              : 'bg-white dark:bg-dark-card text-slate-600 dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-dark-border'
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  const GradientText = ({ children }: { children: React.ReactNode }) => (
    <span className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 bg-clip-text text-transparent">
      {children}
    </span>
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-dark-background">
      <Helmet>
        <title>Lunch Hub Blog — Tips, Reviews & Meal Inspiration</title>
        <meta name="description" content="Get lunch ideas, restaurant picks, and meal planning tips from the Lunch Hub team. Explore our latest posts and discover new places to eat." />
        <meta name="keywords" content="lunch blog, restaurant reviews, food tips, meal inspiration, lunch hub blog" />
        <link rel="canonical" href={`${origin}/blog`} />
        <meta property="og:title" content="Lunch Hub Blog — Tips, Reviews & Meal Inspiration" />
        <meta property="og:description" content="Get lunch ideas, restaurant picks, and meal planning tips from the Lunch Hub team. Explore our latest posts and discover new places to eat." />
        <meta property="og:image" content={`${origin}/images/lunchhub-og-image.png`} />
        <meta property="og:url" content={`${origin}/blog`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Header Section */}
      <div className="bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent dark:from-dark-primary/5 dark:to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center sm:text-left">
          <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Blog' }]} className="mb-8 justify-center sm:justify-start" />
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 dark:bg-dark-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white dark:text-black" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.3em] text-blue-600 dark:text-dark-primary">Journal</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-dark-text mb-8 leading-[0.9]">
            Food for <br /><GradientText>Thought</GradientText>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-500 dark:text-dark-text-secondary max-w-3xl leading-relaxed font-medium">
            Meal inspiration, neighborhood guides, and culinary tips from the Lunch Hub team.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-[2.5rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-none hover:-translate-y-1"
            >
              <Link to={`/blog/${post.slug}`} className="block relative h-64 overflow-hidden">
                {post.attributes.cover_image ? (
                  <img
                    src={post.attributes.cover_image}
                    alt={post.attributes.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-dark-background flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-dark-border" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <span className="text-white font-bold flex items-center gap-2">
                    Read Article <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>
              
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-dark-text-secondary mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-blue-500 dark:text-dark-primary" />
                    {new Date(post.attributes.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-500 dark:text-dark-primary" />
                    {Math.ceil(post.body.split(/\s+/).length / 200)} min read
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold mb-4 line-clamp-2 h-16 group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-colors leading-tight">
                  <Link to={`/blog/${post.slug}`}>
                    {post.attributes.title}
                  </Link>
                </h2>
                
                <p className="text-slate-500 dark:text-dark-text-secondary font-medium mb-8 line-clamp-3 leading-relaxed">
                  {post.attributes.description}
                </p>
                
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-auto inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-dark-text uppercase tracking-widest hover:text-blue-600 dark:hover:text-dark-primary transition-colors"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-16 gap-2">
            {renderPaginationButtons()}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-24 bg-slate-900 dark:bg-dark-card rounded-[3rem] p-8 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-emerald-600/20 pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 relative z-10">Hungry for more?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Discover our curated city guides or use our live map to find the best-rated lunch spots near you right now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              to="/guide"
              className="w-full sm:w-auto bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-[1.05] active:scale-[0.95]"
            >
              Browse Guides
            </Link>
            <Link
              to="/restaurants"
              className="w-full sm:w-auto bg-slate-800 text-white border border-slate-700 px-10 py-5 rounded-2xl font-black text-lg transition-all hover:bg-slate-700"
            >
              Open Map
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlogPage;
