import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        // In a real application, you might fetch this from an API or a generated index
        // For now, we'll simulate fetching a list of posts
        const fetchedPosts: BlogPostMeta[] = [
          {
            slug: 'my-first-blog-post',
            title: 'My First Blog Post',
            date: '2025-09-06',
            excerpt: 'This is the excerpt for my very first blog post. It introduces the topic and gives a brief overview.'
          },
          {
            slug: 'delicious-lunch-spots',
            title: 'Discovering Delicious Lunch Spots',
            date: '2025-09-01',
            excerpt: 'A guide to finding the best lunch spots in your city using Lunch Hub.'
          }
        ];
        setPosts(fetchedPosts);
      } catch (err) {
        setError('Failed to load blog posts.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading blog posts...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Our Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
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
    </div>
  );
};

export default BlogPage;
