/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#192E33',
        'brand-primary': '#3D7BA3',
        'brand-secondary': '#80C3ED',
        'brand-light': '#E4F7FE',
        'brand-accent': '#FCC98A',
        'brand-alert': '#FF9940',
      },
    },
  },
  plugins: [],
}
