/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#FFFCF9',
          white: '#FFFFFF',
          ink: '#111111',
          orange: '#F18B25',
          orangeHover: '#D97706',
          blue: '#47B7D4',
          red: '#8B1A0A',
          border: '#111111',
          text: '#111111',
          muted: '#555555',
        },
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'none': '0',
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #111111',
        'hard-sm': '2px 2px 0px 0px #111111',
      },
    },
  },
  plugins: [],
};
