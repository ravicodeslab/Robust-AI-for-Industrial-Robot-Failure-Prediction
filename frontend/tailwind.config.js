/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#0b0f17',
          900: '#111827',
          850: '#151e2e',
          800: '#1f2937',
          750: '#283548',
          700: '#374151',
          600: '#4b5563',
          500: '#6b7280',
        },
        hazard: {
          yellow: '#f59e0b',
          amber: '#d97706',
          red: '#ef4444',
          crimson: '#b91c1c',
          green: '#10b981',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
