module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        backdrop: '#000000', // Deep black base
        'off-black': '#0A0A0A', // Slightly lighter black for gradients/cards
        electric: '#00E5FF', // Electric blue
        neon: '#B300FF', // Neon purple
        teal: '#00FFCC', // Teal/cyan
        'minimal-white': '#EDEDED',
        'minimal-gray': '#C7C7C7',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Space Grotesk', 'sans-serif'],
      }
    }
  },
  plugins: []
}
