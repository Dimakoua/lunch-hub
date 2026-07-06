# Lunch Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


Lunch Hub is your team's central place for planning group meals, coordinating takeout orders, and discovering new places to eat. It also helps individuals and teams discover restaurants nearby with a modern, user-friendly interface.


## 🚀 Core Features

- **Find Nearby Restaurants:** Enter your address or use your location to discover restaurants within a chosen radius.
- **Search & Filters:** Filter restaurants by name, keyword, cuisine, or amenity. Exclude brands or types (e.g., coffee shops) to tailor your suggestions. Toggle to show only open restaurants.
- **Multiple Views:**
    - **Map View:** See restaurants plotted on an interactive map.
    - **List View:** Browse a list of restaurants with details.
    - **Random Picker:** Can't decide? Let Lunch Hub pick a restaurant for you at random.
    - **Spin Wheel:** Use a fun wheel to choose your meal.
    - **History:** Review your recent picks and searches.
- **Modern UI:** Clean, dark and light themes with intuitive navigation and controls.
- **Group/Team Creation:** Create or join teams (e.g., "Marketing Dept," "Frontend Devs") to plan lunches with colleagues.
- **Restaurant Polling:** Propose restaurant options and let team members vote. Polls can have deadlines, and the winner is announced automatically.
- **Order Aggregation:** For takeout, team members add their orders, and the organizer gets a consolidated list for easy ordering.
- **Morning Coffee Runs:** Organize group coffee orders to kickstart the day.


## 🖼️ Screenshots

| Home Page | Map View | Random Picker |
|-----------|----------|--------------|
| ![Home](public/readme/Screenshot%202026-01-28%20at%2010.58.56%E2%80%AFAM.png) | ![Map](public/readme/Screenshot%202026-01-28%20at%2010.59.24%E2%80%AFAM.png) | ![Random](public/readme/Screenshot%202026-01-28%20at%2010.59.33%E2%80%AFAM.png) |

| Filters & Controls |
|-------------------|
| ![Filters](public/readme/Screenshot%202026-01-28%20at%2010.59.45%E2%80%AFAM.png) |


## 🛠️ Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** [Cloudflare Workers](https://workers.cloudflare.com/)

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (installed automatically via npm scripts)
- A Cloudflare Account (for production deployment)

### Installation & Local Development

1. Clone the repo:
   ```sh
   git clone https://github.com/your_username/lunch-hub.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server (runs both Vite frontend and Wrangler backend concurrently):
   ```sh
   npm run dev
   ```

---

## ☁️ Deployment

### 1. Deploy the Backend (Cloudflare Workers)

The polling feature uses a lightweight Cloudflare Worker backed by a KV (Key-Value) store to manage team polls without a database.

1. **Login to Cloudflare** via Wrangler:
   ```sh
   npx wrangler login
   ```
2. **Deploy the Worker:**
   ```sh
   cd workers
   npx wrangler deploy
   ```
   *(Wrangler will detect the `POLLS` KV namespace binding configuration in `wrangler.toml` and guide you to create it automatically if it doesn't already exist in your account).*

### 2. Deploy the Frontend (Cloudflare Pages / Static Hosting)

You can host the React frontend on Cloudflare Pages or any static provider.

#### Routing the API (Same Domain Setup)
To avoid CORS issues and keep everything under the same domain (`https://thelunchub.com/`), route the API requests directly through Cloudflare:
1. In your Cloudflare Dashboard, go to your **Website / Domain** -> **Workers Routes**.
2. Click **Add route**.
3. Set the route path to `thelunchub.com/api/polls*` and select your `lunch-hub-api` worker.

*Alternatively, if hosting the frontend and backend on separate domains, set the environment variable `VITE_POLLS_API_URL` to your Worker URL (e.g. `https://lunch-hub-api.yourusername.workers.dev`) when building the frontend.*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
