import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Pop theme text colors for blue background
    'text-white',
    'text-white/90',
    'text-white/70',
    'text-white/60',
    'hover:text-white',
    // Pop theme navigation colors
    'text-bridezilla-orange',
    // Heirloom theme button colors
    'bg-ksmt-brown',
    'hover:bg-ksmt-brown-hover',
    'text-ksmt-crimson',
  ],
  theme: {
    extend: {
      colors: {
        'bridezilla-blue': '#5B9BD5',
        'bridezilla-pink': '#ec4899',
        'bridezilla-orange': '#f97316',
        'bridezilla-light-pink': '#FDE6F1',
        'bridezilla-light-blue': '#E3F2FD',
        'ksmt': {
          brown:          '#2b2421',
          'brown-hover':  '#3d342e',
          crimson:        '#922b24',
          slate:          '#2B2D42',
          mist:           '#8D99AE',
          cream:          '#FAF9F6',
        },
        'everafter': {
          cream: '#FAF9F6',
          stone: {
            50: '#fafaf9',
            100: '#f5f5f4',
            200: '#e7e5e4',
            400: '#a8a29e',
            500: '#78716c',
            800: '#292524',
            900: '#1c1917',
          },
          emerald: {
            50: '#d1fae5',
            600: '#059669',
            700: '#047857',
          },
          amber: {
            50: '#fef3c7',
            600: '#d97706',
            700: '#b45309',
          },
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        yellow: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
        playful: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-bebas)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        cormorant: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        montserrat: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        bodoni: ["'Bodoni FLF'", "'Bodoni 72'", "'Bodoni MT'", 'serif'],
      },
    },
  },
  plugins: [],
}
export default config

