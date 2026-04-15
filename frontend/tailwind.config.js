export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        surfaceHover: '#1c1c1c',
        border: '#2a2a2a',
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        text: {
          primary: '#ededed',
          secondary: '#a1a1aa',
          muted: '#71717a',
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
        'surface': 'inset 0 1px 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'fade-to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
