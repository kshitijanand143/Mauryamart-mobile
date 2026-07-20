/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // primary orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f9fafb',
          card:  '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / .08), 0 1px 2px -1px rgb(0 0 0 / .08)',
        modal: '0 20px 60px -12px rgb(0 0 0 / .25)',
        float: '0 8px 24px -4px rgb(0 0 0 / .12)',
      },
      borderRadius: { xl: '12px', '2xl': '16px', '3xl': '24px' },
      screens: { xs: '375px' },
      animation: {
        'slide-up':    'slideUp .25s ease-out',
        'fade-in':     'fadeIn .2s ease-out',
        'skeleton':    'skeleton 1.4s ease-in-out infinite',
        'spin-slow':   'spin 2s linear infinite',
      },
      keyframes: {
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        skeleton: { '0%,100%': { opacity: 1 }, '50%': { opacity: .5 } },
      },
    },
  },
  plugins: [],
};
