/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class', // controlado pelo nosso próprio botão de alternar, não só o sistema
  theme: {
    extend: {
      colors: {
        fundo: 'var(--cor-fundo)',
        botao: 'var(--cor-botao)',
        texto: 'var(--cor-texto)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
