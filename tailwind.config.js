/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'promptus-base': '#191533',
        'promptus-dark': '#191533',
        'promptus-surface': '#232043',
        'promptus-border': '#353158',
        'promptus-accent': '#5844ED',
        'promptus-accent-hover': '#715FF5',
        'promptus-glow-blue': '#00f0ff',
        'promptus-glow-pink': '#ff00e0',
        'promptus-glow-green': '#00ffb3',
        'promptus-glow-yellow': '#fff700',
        'promptus-card': '#232036',
        'promptus-text-primary': '#F2F2F2',
        'promptus-text-secondary': '#A9A6BE',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 0.8, transform: 'scale(1)', boxShadow: '0 0 10px var(--glow-color, #FFF)' },
          '50%': { opacity: 1, transform: 'scale(1.05)', boxShadow: '0 0 18px var(--glow-color, #FFF)' },
        }
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
