/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        cafe: {
          50: '#fdf8f0',
          100: '#f8ecd8',
          200: '#f0d5aa',
          300: '#e6ba77',
          400: '#dc9d4a',
          500: '#c8842a',
          600: '#b16d20',
          700: '#94551b',
          800: '#7a451c',
          900: '#653a1a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
