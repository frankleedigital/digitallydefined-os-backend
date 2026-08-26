/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // === DigitallyDefined Brand System ===
      colors: {
        bone: '#FFFCF9',        // Background (never pure white)
        ink: '#2D3748',         // Body text, headings
        white: '#FFFFFF',       // Text on dark backgrounds
        orange: '#F18B25',      // Primary actions, CTAs, logo "Defined"
        blue: '#47B7D4',        // Secondary accents
        red: '#C20F0A',         // Alerts, warnings, urgency
        black: '#000000',       // Borders, stark contrast
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.7' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.5' }],
      },
      spacing: {
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        '2xl': '4rem',
      },
      // === Layout ===
      maxWidth: {
        'narrow': '720px',
        'content': '1100px',
      },
      // === Borders ===
      borderWidth: {
        'thin': '1px',
        'thick': '2px',
      },
      // === Border Color ===
      borderColor: {
        black: '#000000',
        orange: '#F18B25',
      },
      // === Transitions ===
      transitionDuration: {
        'fast': '100ms',
        'med': '150ms',
      },
      transitionTimingFunction: {
        'ease': 'ease',
      },
    },
  },
  plugins: [],
}
