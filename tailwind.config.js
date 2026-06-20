/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kresla: {
          primary: '#0F6E56',
          accent: '#1D9E75',
          dark: '#0b3c3c',
          light: '#f4f7f7',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        pulseStock: 'pulseStock 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulseStock: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
