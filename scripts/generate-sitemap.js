import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function generateSitemap() {
  // Read city-cuisines.json
  const cityCuisinesPath = path.join(rootDir, 'public/data/city-cuisines.json');
  const cityCuisinesData = JSON.parse(fs.readFileSync(cityCuisinesPath, 'utf-8'));

  // Get all blog posts
  const blogPostsDir = path.join(rootDir, 'public/blog-posts');
  const blogFiles = fs.readdirSync(blogPostsDir).filter(file => file.endsWith('.md'));

  // Base URL - update this to your production domain
  const baseUrl = process.env.SITE_URL || 'https://thelunchub.com';

  // Create sitemap stream
  const sitemapStream = new SitemapStream({ hostname: baseUrl });
  const writeStream = createWriteStream(path.join(rootDir, 'public/sitemap.xml'));
  sitemapStream.pipe(writeStream);

  // Add main pages
  sitemapStream.write({
    url: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date().toISOString(),
  });

  sitemapStream.write({
    url: '/restaurants',
    changefreq: 'daily',
    priority: 0.9,
    lastmod: new Date().toISOString(),
  });

  // Add blog pages
  sitemapStream.write({
    url: '/blog',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString(),
  });

  // Add individual blog posts
  blogFiles.forEach((file) => {
    const slug = file.replace('.md', '');
    sitemapStream.write({
      url: `/blog/${slug}`,
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    });
  });

  // Add guide pages
  sitemapStream.write({
    url: '/guide',
    changefreq: 'weekly',
    priority: 0.6,
    lastmod: new Date().toISOString(),
  });

  // Add city pages and city+cuisine pages
  const cities = cityCuisinesData.cities;
  const cuisines = cityCuisinesData.cuisines;

  cities.forEach((city) => {
    // Add city guide page
    sitemapStream.write({
      url: `/guide/${city.slug}`,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    });

    // Add city+cuisine combinations
    if (city.cuisines && Array.isArray(city.cuisines)) {
      city.cuisines.forEach((cuisineName) => {
        const cuisine = cuisines.find(c => c.name === cuisineName);
        if (cuisine) {
          sitemapStream.write({
            url: `/guide/${city.slug}/${cuisine.id}`,
            changefreq: 'weekly',
            priority: 0.8,
            lastmod: new Date().toISOString(),
          });
        }
      });
    }
  });

  // End the stream
  sitemapStream.end();

  // Wait for the stream to finish
  return streamToPromise(sitemapStream);
}

generateSitemap()
  .then(() => {
    console.log('✓ Sitemap generated successfully at public/sitemap.xml');
  })
  .catch((err) => {
    console.error('✗ Error generating sitemap:', err);
    process.exit(1);
  });
