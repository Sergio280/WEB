/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta dark premium con acentos azul corporativo BIMS
        ink: {
          950: '#060a14', // fondo base
          900: '#0a0f1c',
          800: '#0e1525',
          700: '#141d31',
          600: '#1c2740',
        },
        brand: {
          50: '#eaf3ff',
          100: '#cfe2ff',
          300: '#7db3ff',
          400: '#4d93ff',
          500: '#2d7dff', // azul principal
          600: '#1a6ac8',
          700: '#0f4d9e',
          800: '#093566',
        },
        accent: {
          green: '#4ade80',
          emerald: '#1a8a4a',
          amber: '#fbbf24',
          violet: '#8b5cf6',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(45,125,255,.18), 0 18px 60px -12px rgba(45,125,255,.35)',
        'glow-lg': '0 0 0 1px rgba(45,125,255,.22), 0 30px 90px -20px rgba(45,125,255,.45)',
        card: '0 1px 0 0 rgba(255,255,255,.04) inset, 0 20px 50px -24px rgba(0,0,0,.7)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'pulse-ring': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(45,125,255,.45)' },
          '50%': { boxShadow: '0 0 0 16px rgba(45,125,255,0)' },
        },
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        'marquee-slow': 'marquee 48s linear infinite',
        floaty: 'floaty 7s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
