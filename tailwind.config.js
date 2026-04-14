/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg:      '#05080f',
        surface: '#0a0f1c',
        card:    '#0d1525',
        border:  '#162033',
        accent:  '#3b82f6',
        accent2: '#60a5fa',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
