import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#1F4E79', // Azul Luker (Semaforo Azul)
          600: '#1A4368',
          700: '#143857',
        },
        semantic: {
          success: '#375623', // Verde
          warning: '#BF8F00', // Amarillo
          alert: '#7F5B00',   // Amarillo Oscuro
          error: '#C00000',   // Rojo
          critical: '#7B0000',// Rojo Critico
        }
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        'hover': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
