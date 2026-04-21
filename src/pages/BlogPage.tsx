import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { parseBlogPost, BlogPost } from '../services/blog';

const BlogPage: React.FC = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.lunchhub.com';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9; // Use 9 for a 3-column grid

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
          className={`mx-1 px-4 py-2 rounded-lg shadow-sm transition-colors ${ currentPage === i ? 'bg-blue-600 text-white scale-105' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>Lunch Hub Blog — Tips, Reviews & Meal Inspiration</title>
        <meta name="description" content="Get lunch ideas, restaurant picks, and meal planning tips from the Lunch Hub team. Explore our latest posts and discover new places to eat." />
        <link rel="canonical" href={`${origin}/blog`} />
        <meta property="og:title" content="Lunch Hub Blog — Tips, Reviews & Meal Inspiration" />
        <meta property="og:description" content="Get lunch ideas, restaurant picks, and meal planning tips from the Lunch Hub team. Explore our latest posts and discover new places to eat." />
        <meta property="og:image" content={`${origin}/images/lunchhub-og-image.png`} />
        <meta property="og:url" content={`${origin}/blog`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8 pt-20">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">Lunch Hub Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentPosts.map((post) => (
            <div key={post.slug} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <div className="p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{new Date(post.attributes.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h2 className="text-2xl font-semibold mb-3 h-24 overflow-hidden">
                  <Link to={`/blog/${post.slug}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    {post.attributes.title}
                  </Link>
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4 h-20 overflow-hidden">{post.attributes.description}</p>
                <Link to={`/blog/${post.slug}`} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  Read More &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center mt-10">
            {renderPaginationButtons()}
          </div>
        )}
      </div>
    </main>
  );
};


export default BlogPage;
