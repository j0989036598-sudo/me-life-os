import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Noto Sans TC"', 'sans-serif'] },
      colors: {
        dark: {
          900: 'var(--bg-900)',
          800: 'var(--bg-800)',
          700: 'var(--bg-700)',
          600: 'var(--bg-600)',
        },
        gold: { 400: '#fbbf24', 500: '#f59e0b' },
        xp: { 400: '#a78bfa', 500: '#8b5cf6' },
        sp: { 400: '#34d399', 500: '#10b981' },
        fire: { 400: '#fb923c', 500: '#f97316' },
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseSlow: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
      },
      animation: {
        fade: 'fadeIn 0.4s ease-out',
        float: 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
