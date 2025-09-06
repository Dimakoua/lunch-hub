/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          background: '#000000',
          primary: '#ff9900',
          text: '#ffffff',
          'text-secondary': '#a0a0a0',
          border: '#333333',
          card: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
};
