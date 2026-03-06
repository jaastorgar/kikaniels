/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tu paleta de morados corporativa
        primary: {
          DEFAULT: '#4A008B', // --primary-purple
          dark: '#38006B',    // --hover-dark-purple
          light: '#F3E8FF',   // --light-purple
        },
        secondary: {
          DEFAULT: '#7B1FA2', // --secondary-purple
          light: '#E0B3FF',   // --hover-light-purple
        },
        // Tu color de acento turquesa
        accent: {
          DEFAULT: '#0AE8C6', // --turquoise
        },
        // Colores de interfaz y texto
        dark: '#343A40',      // --dark-text
        muted: '#555555',     // --muted-text
        header: '#2C0140',    // --header-footer-bg
        border: '#e6e6e6',    // --border-color
      },
      fontFamily: {
        // Tus tipografías específicas
        sans: ['HankenGrotesk', 'sans-serif'], // Regular y Light
        tight: ['InterTight', 'sans-serif'],   // Bold y Light
      },
      boxShadow: {
        // Tus sombras personalizadas
        'soft': '0 2px 10px rgba(0,0,0,.08)',  // --shadow-1
        'medium': '0 8px 22px rgba(0,0,0,.14)', // --shadow-2
        'high': '0 18px 44px rgba(0,0,0,.22)',  // --shadow-3
      }
    },
  },
  plugins: [],
}