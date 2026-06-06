/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sui: {
          bg: "#030712",
          card: "#0a0f1e",
          border: "#1e3a5f",
          accent: "#4DA2FF",
          muted: "#94a3b8",
          glow: "#2563eb",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(77, 162, 255, 0.25)",
        "glow-lg": "0 0 40px rgba(77, 162, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
