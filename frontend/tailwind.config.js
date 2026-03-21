/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#151515',
        parchment: '#f6efe4',
        ember: '#cb5c36',
        moss: '#44593f',
        gold: '#ce9f36',
        slate: '#274754'
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Source Serif 4"', 'serif']
      },
      boxShadow: {
        card: '0 18px 45px rgba(21, 21, 21, 0.12)'
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        rise: 'rise 0.45s ease-out'
      }
    }
  },
  plugins: []
};
