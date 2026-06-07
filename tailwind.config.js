/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        body: ['Noto Sans KR', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0a0b0f',
          800: '#10121a',
          700: '#161824',
          600: '#1e2130',
          500: '#252840',
          400: '#2e3248',
        },
        accent: {
          blue: '#4a9eff',
          purple: '#7c5cfc',
          cyan: '#00e5ff',
          green: '#00d68f',
          red: '#ff4757',
          orange: '#ff6b35',
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
