/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom volleyball-inspired colors
        'volleyball-orange': 'oklch(0.62 0.18 35)',
        'electric-blue': 'oklch(0.55 0.15 240)',
        'vibrant-teal': 'oklch(0.65 0.12 200)',
      },
      boxShadow: {
        'glow-orange': '0 4px 14px 0 oklch(0.62 0.18 35 / 0.25)',
        'glow-blue': '0 4px 14px 0 oklch(0.55 0.15 240 / 0.25)',
        'glow-teal': '0 4px 14px 0 oklch(0.65 0.12 200 / 0.25)',
      },
    },
  },
  plugins: [],
}
