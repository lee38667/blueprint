module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        backdrop: '#0a0a0a',
        electric: '#00ffff',
        neon: '#b300ff',
        teal: '#00ffcc',
        textLight: '#f0f0f0'
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}
