import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#08080c',        // page base
        surface: '#0e0e14',     // raised panels
        raised: '#15151d',      // cards / popovers
        line: 'rgba(255,255,255,0.07)',       // hairline borders
        'line-strong': 'rgba(255,255,255,0.16)',
        accent: {
          DEFAULT: '#7c5cff',
          soft: '#a794ff',
          deep: '#4b36c4',
        },
        cyan: {
          DEFAULT: '#4cc9f0',
          soft: '#8fdff8',
        },
        ink: {
          DEFAULT: '#f4f3f8',
          mid: '#b4b2c2',
          dim: '#78768a',
          faint: '#4c4a5c',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        panel: '14px',
        shell: '20px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'msg-in': 'msg-in 0.5s cubic-bezier(0.22, 1.2, 0.36, 1) both',
        'status-in': 'status-in 0.4s cubic-bezier(0.22, 1.2, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease both',
      },
      keyframes: {
        'msg-in': {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'status-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
