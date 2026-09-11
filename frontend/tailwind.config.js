/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          900: '#0c4a6e',
        },
        status: {
          green: '#10b981',
          'green-bg': '#ecfdf5',
          'green-border': '#a7f3d0',
          'green-text': '#065f46',
          amber: '#f59e0b',
          'amber-bg': '#fffbeb',
          'amber-border': '#fde68a',
          'amber-text': '#92400e',
          red: '#ef4444',
          'red-bg': '#fef2f2',
          'red-border': '#fecaca',
          'red-text': '#991b1b',
        },
      },
    },
  },
  plugins: [],
};
