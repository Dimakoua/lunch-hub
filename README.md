# 🗺️ Lunch Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://react.dev)
[![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20to-Cloudflare%20Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)

**Lunch Hub** is an ad-free, tracking-free, privacy-first web application designed to help individuals and office teams discover local lunch spots nearby and make group dining decisions without the friction. 

Whether you're trying to figure out where to go solo, coordinating takeout orders for the team, or playing a quick game of Swipe-to-Match with friends, Lunch Hub eliminates the *"where do you want to go?"* debate.

---

## 🚀 Key Features

*   **🔥 Swipe Match ("Tinder for Food"):** Start a swipe matchroom, share the link, and swipe right or left on nearby restaurants. The moment your group hits consensus, the screen matches with confetti!
*   **🗳️ No-Login Group Polls:** Select 2-5 restaurants from your map results and generate a lightweight sharing link for instant voting. No registration or account setup required.
*   **📍 Privacy-First Restaurant Discovery:** Discover nearby dining options using OpenStreetMap (OSM) data. Drag the pin anywhere to explore new areas, and search with custom radius limits.
*   **🎯 Quick Deciders:**
    *   **Spin Wheel:** Enter your nearby options on a wheel and spin to let fate decide.
    *   **Random Picker:** Instantly get a single, highly-rated recommendation in one tap.
*   **🛠️ Smart Custom Filters:** Filter by cuisines (e.g. Italian, Sushi), amenities (e.g. Pub, Cafe), or toggle *Open Now* status. Exclude specific tags or chains you don't feel like eating today.
*   **📱 Installable PWA:** Install directly to your iOS or Android home screen for instant native app access on the go.

---

## 🖼️ Screenshots

| Home Page | Map View & Directions | Swipe Matchmaker |
|-----------|----------|--------------|
| ![Home](public/readme/Screenshot%202026-01-28%20at%2010.58.56%E2%80%AFAM.png) | ![Map](public/readme/Screenshot%202026-01-28%20at%2010.59.24%E2%80%AFAM.png) | ![Swipe Match](public/readme/Screenshot%202026-01-28%20at%2010.59.33%E2%80%AFAM.png) |

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (Responsive Desktop/Mobile Layout)
- **Backend:** Cloudflare Workers (Handling Polls & Swipe room sync)
- **Database:** Cloudflare KV Namespace (Key-Value edge storage)
- **Data Source:** OpenStreetMap / Overpass API (Live geolocation-based directory)
- **SEO/Metadata:** Static prerendering engine (Puppeteer-based) with automatic sitemap generation for maximum search visibility

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A Cloudflare Account (for serverless edge database deployment)

### Local Development

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Dimakoua/lunch-hub.git
   cd lunch-hub
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Start local development servers:**
   ```sh
   npm run dev
   ```
   *This starts both the Vite local server (for frontend) and the wrangler dev worker (for polls/swipe APIs) concurrently.*

---

## ☁️ Production Deployment (Cloudflare Worker)

Lunch Hub uses a unified deployment model where both the React frontend assets and the backend API logic run from a single Cloudflare Worker.

1. **Log in to Cloudflare:**
   ```sh
   npx wrangler login
   ```

2. **Deploy the stack:**
   ```sh
   npm run deploy
   ```
   *Wrangler will compile the static assets, prerender the routes for SEO, package the worker API code, and ask you to bind/create the `POLLS` KV database namespace automatically if it's your first run.*

3. **Connect Custom Domain (`thelunchub.com`):**
   Go to your Cloudflare Dashboard -> **Workers & Pages** -> **lunch-hub** -> **Settings** -> **Domains & Routes** -> **Add Custom Domain** and input your domain.

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or enhancements:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.
