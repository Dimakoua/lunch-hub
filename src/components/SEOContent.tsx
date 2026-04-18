import React from 'react';

export const SEOContent: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 prose dark:prose-invert">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text mb-8">
        Lunch Hub - The Ultimate Lunch Picker for Every Craving
      </h1>

      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border mb-12">
        <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-none p-0 m-0">
          <li><a href="#what-is" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">1. What Is Lunch Hub?</a></li>
          <li><a href="#how-to" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">2. How to Use It?</a></li>
          <li><a href="#features" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">3. Key Features & Customization</a></li>
          <li><a href="#smart-filters" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">4. Smart Filters & Routing</a></li>
          <li><a href="#sharing" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">5. Sharing and Exporting</a></li>
          <li><a href="#when-to-use" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">6. When to Use This Lunch Picker?</a></li>
          <li><a href="#feedback" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">7. Feedback</a></li>
          <li><a href="#alternatives" className="text-blue-600 dark:text-dark-primary no-underline hover:underline">8. Alternatives</a></li>
        </ul>
      </div>

      <section id="what-is" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          1. What Is Lunch Hub?
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          Lunch Hub is your go-to <strong>lunch picker</strong> designed to take the stress out of mealtime decisions. Whether you're stuck in a cubicle or exploring a new city, our tool helps you discover the best nearby eateries in seconds. It combines powerful search capabilities with fun, interactive elements to turn the daily "what's for lunch?" struggle into an exciting experience.
        </p>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          The tool offers multiple ways to browse: a clean list view for quick scanning, an interactive map for spatial orientation, and specialized decision-making modes. If you're feeling adventurous, you can use our "Spin to Win" wheel or the high-speed "Random Picker" to let fate decide your next meal.
        </p>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Specific modes like the "History" tab ensure you don't keep visiting the same place twice—unless you want to! Lunch Hub is built for speed and simplicity, ensuring you spend less time searching and more time eating.
        </p>
      </section>

      <section id="how-to" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          2. How to Use It?
        </h2>
        <ol className="space-y-6">
          <li className="text-gray-600 dark:text-dark-text-secondary">
            <strong>Enter Your Location:</strong> Type your address, street name, or city into the search bar. Alternatively, click the "Map Pin" icon to use your current GPS location for instant results.
            <div className="mt-2 text-center">
              <img src="/images/main-page/search.png" alt="Lunch Hub Search Interface" className="rounded-lg shadow-md mx-auto" />
            </div>
          </li>
          <li className="text-gray-600 dark:text-dark-text-secondary">
            <strong>Adjust Your Search Radius:</strong> Click the "Filters" icon (the sliders) to expand the search options. Choose a radius between 500m and 5km depending on how far you're willing to walk or drive.
            <div className="mt-2 text-center">
              <img src="/images/main-page/filters.png" alt="Search Filters" className="rounded-lg shadow-md mx-auto" />
            </div>
          </li>
          <li className="text-gray-600 dark:text-dark-text-secondary">
            <strong>Browse Your Results:</strong> Explore the suggestions in the list view, or switch to the Map tab to see exactly where each restaurant is located. Use the "Open Now" toggle to filter out places that are currently closed.
          </li>
          <li className="text-gray-600 dark:text-dark-text-secondary">
            <strong>Let the Wheel Decide:</strong> Feeling indecisive? Head over to the "Wheel" or "Random" tabs. Click the "Spin" button or "Pick a Restaurant" to start the interactive selection process.
            <div className="mt-2 text-center">
              <img src="/images/main-page/wheel.png" alt="Lunch Hub Spin Wheel" className="rounded-lg shadow-md mx-auto" />
            </div>
          </li>
          <li className="text-gray-600 dark:text-dark-text-secondary">
            <strong>Get Directions:</strong> Once a restaurant is selected, Lunch Hub shows you the estimated walking distance and time. Click the Google Maps or Apple Maps links to get turn-by-turn navigation.
            <div className="mt-2 text-center">
              <img src="/images/main-page/map-with-route.png" alt="Restaurant Selection and Navigation" className="rounded-lg shadow-md mx-auto" />
            </div>
          </li>
        </ol>
      </section>

      <section id="features" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          3. Key Features & Customization
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          Lunch Hub is packed with features that make it more than just a search engine:
        </p>
        <ul className="space-y-2 text-gray-600 dark:text-dark-text-secondary">
          <li><strong>Interactive Selection Tools:</strong> Use the Spin Wheel or the Random Reel for a gamified decision experience.</li>
          <li><strong>Smart Filtering:</strong> Filter by cuisine type, name, or amenities to narrow down your choices.</li>
          <li><strong>Persistent History:</strong> Automatically track visited restaurants so you can rediscover them later or exclude them from future searches.</li>
          <li><strong>Theme Customization:</strong> Toggle between Light and Dark modes to suit your environment and save battery life.</li>
          <li><strong>PWA Support:</strong> Install Lunch Hub on your home screen for a native app-like experience without needing an app store.</li>
        </ul>
      </section>

      <section id="smart-filters" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          4. Smart Filters & Real-time Routing
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          One of the unique features of Lunch Hub is its integration with live routing data. When you select a target restaurant, the tool doesn't just show you a dot on the map; it calculates the optimal walking path and gives you real-time distance and duration estimates. This helps you manage your lunch break effectively, ensuring you have enough time to get there, eat, and get back.
        </p>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Additionally, our "Open Now" filter is highly accurate, checking the current day and time against the restaurant's specific opening hours. No more arriving at a "Closed" sign!
        </p>
      </section>

      <section id="sharing" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          5. Sharing and Exporting
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Found a great spot and want to invite your friends? Lunch Hub makes sharing simple. When a restaurant is selected, you'll see a "Share" button that opens your device's native sharing menu. You can send the restaurant's name, address, and a direct link to its location via SMS, WhatsApp, Email, or any other social app.
        </p>
      </section>

      <section id="when-to-use" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          6. When to Use This Lunch Picker?
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          Decision fatigue is real, especially when you're hungry. Using a dedicated lunch picker helps you stay fair and efficient. Here are some common scenarios where Lunch Hub shines:
        </p>
        <ul className="space-y-2 text-gray-600 dark:text-dark-text-secondary">
          <li><strong>Colleague Consensus:</strong> Use the spin wheel to fairly decide where the whole office goes for lunch.</li>
          <li><strong>New Neighborhoods:</strong> Quickly find top-rated spots when you're in an unfamiliar part of town.</li>
          <li><strong>Breaking the Routine:</strong> Use the history exclusion feature to force yourself to try something new.</li>
          <li><strong>Time Management:</strong> Find the closest open spots when you only have a 30-minute break.</li>
          <li><strong>Travel Planning:</strong> Scout out unique dining options before you even arrive at your destination.</li>
        </ul>
      </section>

      <section id="feedback" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          7. We Want to Hear Your Feedback
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          We are constantly improving Lunch Hub to make it the best decision-making tool on the web. If you encounter a bug, find incorrect data, or have a brilliant idea for a new feature, please don't hesitate to reach out! Your feedback helps us grow.
        </p>
      </section>

      <section id="alternatives" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 border-b border-gray-100 dark:border-dark-border pb-2">
          8. Need an Alternative Tool?
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-8">
          If you're looking for exhaustive reviews and user photos, you might want to check out Yelp or Google Maps. While those tools are great for deep research, Lunch Hub is designed specifically for quick discovery and fun decision-making.
        </p>
        <p className="text-gray-900 dark:text-dark-text font-bold italic">
          Happy Dining!
        </p>
      </section>
    </div>
  );
};
