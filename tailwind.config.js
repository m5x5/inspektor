/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,hbs}',
    './app/index.html',
  ],
  theme: {
    extend: {
      colors: {
        'material-purple': {
          50: '#f3e5f5',
          100: '#e1bee7',
          200: '#ce93d8',
          300: '#ba68c8',
          400: '#ab47bc',
          500: '#9c27b0',
          600: '#8e24aa',
          700: '#7b1fa2',
          800: '#6750a4',
          900: '#4a148c',
        },
      },
      borderRadius: {
        'material': '28px',
      },
      padding: {
        'safe': 'max(0.5rem, env(safe-area-inset-bottom))',
      },
      zIndex: {
        '100': '100',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.pb-safe': {
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        },
        '.pb-nav-space': {
          paddingBottom: 'calc(80px + max(0.5rem, env(safe-area-inset-bottom)))',
        },
      })
    },
  ],
}
