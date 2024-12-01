/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          500: '#5A67D8',
        },
        purple: {
          500: '#9F7AEA',
        },
        blue: {
          600: '#3182CE',
          900: '#2A4365',
        },
      },
    },
  },
  plugins: [],
};
