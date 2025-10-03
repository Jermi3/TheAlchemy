/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ramen: {
          red: '#D7263D',
          dark: '#0B0A0A',
          charcoal: '#111113',
          cream: '#FFF3E0',
          beige: '#F7E7CE',
          gold: '#E0A106',
          sesame: '#D1C7B7',
          seaweed: '#1F2937',
          kimchi: '#B81D24'
        },
        alchemy: {
          ember: '#a0352c',
          emberDeep: '#611717',
          dusk: '#1b1010',
          night: '#0c0708',
          wine: '#521f26',
          copper: '#c46a4a',
          gold: '#d8b26e',
          cream: '#f8efe1',
          smoke: '#362424'
        }
      },
      fontFamily: {
        inter: ['"Inter"', 'system-ui', 'sans-serif'],
        pretendard: ['"Inter"', 'system-ui', 'sans-serif'],
        noto: ['"Playfair Display"', 'Georgia', 'serif'],
        'noto-kr': ['"Playfair Display"', 'Georgia', 'serif'],
        playfair: ['"Cormorant Garamond"', 'Times New Roman', 'serif'],
        accent: ['"Cormorant Garamond"', 'Times New Roman', 'serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
};
