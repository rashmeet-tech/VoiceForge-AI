/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F8FC',
        card: '#FFFFFF',
        primary: {
          DEFAULT: '#5855DB',
          hover: '#4744C2',
          light: '#7270E4',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          light: '#A78BFA',
        },
        aiLavender: {
          DEFAULT: '#EEECFF',
          dark: '#DDD9FF',
        },
        mainText: '#172033',
        mutedText: '#667085',
        borderMuted: '#E5E7EB',
        successBg: '#E7F7EF',
        successText: '#0E7A4E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        'card-hover': '0 8px 24px rgba(88, 85, 219, 0.12), 0 2px 6px rgba(16, 24, 40, 0.06)',
        dropdown: '0 10px 30px rgba(23, 32, 51, 0.12)',
      },
    },
  },
  plugins: [],
}
