/** @type {import('tailwindcss').Config} */
module.exports = {
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
      },
    },
  },
  plugins: [],
}

