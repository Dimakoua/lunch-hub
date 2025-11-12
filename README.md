# Lunch Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Your team's central place for planning group meals, coordinating takeout orders, and discovering new places to eat.

## 🚀 Core Features

- **Group/Team Creation:** Users can create or join teams (e.g., "Marketing Dept," "Frontend Devs") to plan lunches with specific groups of colleagues.
- **Restaurant Polling:** A user can propose a few restaurant options, and team members can vote for their preference. The poll can have a deadline, after which the winning restaurant is announced.
- **Order Aggregation:** For takeout, once a restaurant is chosen, team members can add their specific orders. The organizer gets a consolidated list, making it easy to place the order by phone or online.
- **Morning Coffee Runs:** Not just for lunch! Organize group coffee orders to kickstart the day.

## 📝 Implementation Plan: Morning Coffee Runs

This is the high-level plan for building the "Morning Coffee Runs" feature.

### I. Backend (Cloudflare Workers)

1.  **Project Setup:**
    *   Configure `wrangler.toml` for the project.
    *   Set up local development with the Wrangler CLI.

2.  **Data Storage (Cloudflare D1):**
    *   **`coffee_runs` table:** `id`, `host_email`, `created_at`, `status` (`open`, `ordering`, `closed`), `restaurant`, `session_link_secret`.
    *   **`orders` table:** `id`, `coffee_run_id`, `user_email`, `order_details`, `created_at`.

3.  **API Endpoints:**
    *   `POST /api/runs`: Create a new coffee run.
        *   Body: `{ "host_email": "...", "restaurant": "..." }`
        *   Action: Creates a run, generates a unique session link, and sends an email to the host.
    *   `GET /api/runs/:id`: Get details for a specific coffee run (including all orders).
    *   `POST /api/runs/:id/orders`: Add a new order to a run.
        *   Body: `{ "user_email": "...", "order_details": "..." }`
    *   `PUT /api/runs/:id/status`: Update the status of a run (e.g., to `closed`).
        *   Body: `{ "status": "closed" }`
        *   Action: Notifies users in the email chain that the run is complete.

4.  **Data Retention Policy:**
    *   Implement a mechanism (e.g., Cloudflare Workers Cron Trigger) to automatically remove `coffee_runs` and their associated `orders` that are older than 7 days.
5.  **Email Notifications:**
    *   Use a service like Mailgun or SendGrid via the Worker.
    *   **On Run Creation:** Send an email to the host with a unique session link to share.
    *   **On Status Update:** When the run is closed, send an update to the same email chain.

### II. Frontend (UI)

1.  **Host View (`/run/:id`):**
    *   Display the session link to share.
    *   Show a list of current orders.
    *   Button to "Close Orders & Notify".
    *   Button to "Copy All Orders" which formats them nicely for a clipboard.

2.  **User View (`/run/:id`):**
    *   Simple form to add an order: Name/Email and Order Details.
    *   Display the list of existing orders.

### III. Future Enhancements

1.  **Third-Party Integrations:**
    *   Research APIs for services like Tim Hortons or Starbucks.
    *   If an API exists, add a feature to place the consolidated order programmatically.
    *   If not, provide a view that makes it easy to manually place the order on their website/app.

## �️ Tech Stack

- **Frontend:** TBD (e.g., React, Svelte, Vue)
- **Backend:** [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/)

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/lunch-hub.git
   ```
2. _(Setup steps will be added here)_

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
