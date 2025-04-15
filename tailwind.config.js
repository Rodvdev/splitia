/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#66e3a5", /* Mint Green - Brand Primary */
          foreground: "#000000",
        },
        background: {
          DEFAULT: 'hsl(0 0% 100%)',
          dark: 'hsl(240 10% 3.9%)'
        },
        foreground: {
          DEFAULT: 'hsl(240 10% 3.9%)',
          dark: 'hsl(0 0% 98%)'
        }
      },
    },
  },
  plugins: [],
}

