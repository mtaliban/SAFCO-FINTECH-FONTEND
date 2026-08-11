import type { Config } from 'tailwindcss';

/**
 * SAFCO FINTECH brand palette
 * Navy blue (primary) + orange (accent) taken from the official logo.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand navy (from SAFCO logo)
        navy: {
          50:  '#eaf0f8',
          100: '#c9d7ea',
          200: '#93b0d5',
          300: '#5d89c0',
          400: '#2c65a8',
          500: '#0f2a50',   // MAIN — matches logo
          600: '#0d2547',
          700: '#0a1e3b',
          800: '#08182f',
          900: '#050f1f',
          950: '#020913',
        },

        // Accent orange (from SAFCO logo "FinTech" text)
        orange: {
          50:  '#fff8ec',
          100: '#ffedc9',
          200: '#ffd88e',
          300: '#ffbe4d',
          400: '#ffa724',
          500: '#f5a623',   // MAIN — matches logo
          600: '#d98a10',
          700: '#b46b10',
          800: '#925514',
          900: '#784616',
          950: '#452408',
        },

        // Alias `brand` -> navy so existing components keep working
        brand: {
          50:  '#eaf0f8',
          100: '#c9d7ea',
          200: '#93b0d5',
          300: '#5d89c0',
          400: '#2c65a8',
          500: '#0f2a50',
          600: '#0d2547',
          700: '#0a1e3b',
          800: '#08182f',
          900: '#050f1f',
          950: '#020913',
        },

        // Kahoot answer palette (unchanged for quiz play buttons)
        kahoot: {
          red:    '#e21b3c',
          blue:   '#1368ce',
          yellow: '#d89e00',
          green:  '#26890c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 250ms ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};

export default config;
