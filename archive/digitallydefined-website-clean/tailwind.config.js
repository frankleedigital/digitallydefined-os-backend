/** @type {import('tailwindcss').Config} */
// DigitallyDefined brand kit — sourced from the dashboard's index.css tokens so the
// public site and the dashboard read as one system.
//
// Light mode only. Squared edges, thin black frames, no shadows.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',        // Ink / Black
        slate: '#2D3748',      // Deep Slate Text
        orange: {
          DEFAULT: '#F18B25',  // Brand Orange Accent
          soft: '#FDF0E0',
        },
        cream: '#FFFCF9',       // Soft Cream Background
        white: '#FFFFFF',
        danger: '#8B1A0A',      // Danger Red
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],   // body
        heading: ['Inter', 'system-ui', 'sans-serif'],    // headings + wordmark
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      boxShadow: {
        none: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
      maxWidth: {
        container: '1100px',
      },
    },
  },
  plugins: [],
};

