/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./views/**/*.{html,js}",
    "./server.js"
  ],
  theme: {
    extend: {
      colors: {
        'muraz-blue': '#1e40af',
        'muraz-green': '#059669',
        'muraz-orange': '#ea580c',
        'muraz-red': '#dc2626'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
