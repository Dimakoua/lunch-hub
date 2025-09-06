import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

/**
 * Utility function to parse metadata from Markdown content.
 * Assumes format:
 * # Title
 * **Date:** YYYY-MM-DD
 * Excerpt line
 */
function parseMarkdownMeta(slug: string, content: string): BlogPostMeta {
  const lines = content.split('\n');
  const title = lines[0]?.replace(/^#\s*/, '') || 'Untitled';
  const dateMatch = lines[2]?.match(/\*\*Date:\*\*\s*(.*)/);
  const date = dateMatch ? dateMatch[1] : 'Unknown Date';
  const excerpt = lines[4] || '';

  return { slug, title, date, excerpt };
}

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10; // Display 10 blogs per page

  useEffect(() => {
    const loadPosts = async () => {
      // Vite automatically imports all files in the folder
      const files = import.meta.glob('/public/blog-posts/*.md', { query: '?raw', import: 'default' });

      const postPromises = Object.entries(files).map(async ([path, loader]) => {
        const slug = path.split('/').pop()?.replace('.md', '') || '';
        const content = await (loader as () => Promise<string>)();
        return parseMarkdownMeta(slug, content);
      });

      let postsData = await Promise.all(postPromises);
      // ✅ Sort posts from newest to oldest
      postsData = postsData.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // descending
      });

      setPosts(postsData);
    };

    loadPosts();
  }, []);

  // Get current posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(posts.length / postsPerPage);

  const renderPaginationButtons = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`mx-1 px-3 py-1 rounded ${ currentPage === i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>Our Blog - Lunch Hub</title>
        <meta name="description" content="Read the latest articles and updates from Lunch Hub." />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8 pt-16">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPosts.map((post) => (
            <div key={post.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">
                <Link to={`/blog/${post.slug}`} className="text-blue-600 hover:underline dark:text-blue-400">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{post.date}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                Read More
              </Link>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            {renderPaginationButtons()}
          </div>
        )}
      </div>
    </main>
  );
};

export default BlogPage;
