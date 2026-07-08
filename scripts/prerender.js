import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const sitemapPath = path.join(distDir, 'sitemap.xml'); // We need to make sure sitemap is in dist

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function getPathsFromSitemap() {
  if (!fs.existsSync(sitemapPath)) {
    console.warn(`Sitemap not found at ${sitemapPath}. Make sure to generate sitemap before prerendering.`);
    return ['/', '/restaurants', '/blog', '/guide'];
  }
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
  // Simple regex to extract URLs
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  const paths = [];
  while ((match = regex.exec(sitemapContent)) !== null) {
    const url = new URL(match[1]);
    paths.push(url.pathname);
  }
  return paths;
}

async function startServer() {
  const app = express();
  app.use(express.static(distDir));
  // SPA fallback
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => resolve(server));
  });
}

// wait for timeout function since page.waitForTimeout is deprecated in newer puppeteer
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function prerender() {
  console.log('Starting prerender server...');
  const server = await startServer();

  try {
    const paths = await getPathsFromSitemap();
    console.log(`Found ${paths.length} paths to prerender.`);

    // Launch with standard sandbox flags for Docker/Linux environments
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    for (const p of paths) {
      console.log(`Prerendering ${p}...`);
      const page = await browser.newPage();
      try {
        await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle0', timeout: 30000 });
        // Wait for helmet to inject meta tags
        await wait(500);

        let content = await page.content();
        
        const filePath = p === '/' ? 'index.html' : `${p}/index.html`.replace(/^\//, '');
        const fullFilePath = path.join(distDir, filePath);
        const fileDir = path.dirname(fullFilePath);
        
        fs.mkdirSync(fileDir, { recursive: true });
        fs.writeFileSync(fullFilePath, content);
        console.log(`✓ Saved ${filePath}`);
      } catch (e) {
        console.error(`✗ Error prerendering ${p}:`, e);
      } finally {
        await page.close();
      }
    }

    await browser.close();
  } catch (e) {
    console.error('✗ Prerendering engine failed to start:', e.message);
    console.warn('⚠️ Dev Environment is missing Chromium system dependencies. Skipping pre-generation.');
    console.warn('⚠️ The application will build and deploy as a standard client-side React SPA.');
  } finally {
    server.close();
    console.log('Prerendering step finished!');
  }
}

prerender().catch(console.error);
