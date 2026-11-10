/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lena: {
          light: '#ecfdf5',
          border: '#a7f3d0',
          DEFAULT: '#10b981',
          dark: '#047857',
        },
        dena: {
          light: '#fef2f2',
          border: '#fecaca',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        }
      }
    },
  },
  plugins: [],
}

