/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0a0a0f',
          surface: '#12121a',
          border: '#23232f',
          accent: '#6366f1',
          'accent-hover': '#818cf8',
          text: '#e5e7eb',
          muted: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};
