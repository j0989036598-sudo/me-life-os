import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
        'pixel-body': ['"DotGothic16"', '"Noto Sans TC"', 'monospace'],
      },
      colors: {
        dark: {
          900: 'var(--bg-900)',
          800: 'var(--bg-800)',
          700: 'var(--bg-700)',
          600: 'var(--bg-600)',
        },
        wood: {
          darkest: 'var(--wood-darkest)',
          dark: 'var(--wood-dark)',
          mid: 'var(--wood-mid)',
          frame: 'var(--wood-frame)',
          light: 'var(--wood-light)',
          highlight: 'var(--wood-highlight)',
          shine: 'var(--wood-shine)',
        },
        gold: { 400: '#e8c840', 500: '#c8a830' },
        xp: { 400: '#b878e8', 500: '#a060d0' },
        sp: { 400: '#50d858', 500: '#40c848' },
        fire: { 400: '#f09030', 500: '#e07820' },
        rpg: {
          red: '#e04030',
          green: '#40c848',
          cyan: '#40b8d8',
          purple: '#a060d0',
          pink: '#d060a0',
        },
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseSlow: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
        coinSpin: { '0%, 100%': { transform: 'scaleX(1)' }, '50%': { transform: 'scaleX(0.3)' } },
      },
      animation: {
        fade: 'fadeIn 0.4s ease-out',
        float: 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 2s ease-in-out infinite',
        'coin-spin': 'coinSpin 2s ease-in-out infinite',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
}
export default config
