/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        syra: {
          bg: "#0a0b0f",
          card: "#0f1117",
          primary: "#00d4ff",
          accent: "#8b5cf6",
        },
      },
      keyframes: {
        "gate-fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gate-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "gate-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "gate-shine": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "wallet-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 212, 255, 0.25)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(0, 212, 255, 0.15)" },
        },
      },
      animation: {
        "gate-fade-in": "gate-fade-in 0.5s ease-out forwards",
        "gate-scale-in": "gate-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "gate-glow": "gate-glow 3s ease-in-out infinite",
        "gate-shine": "gate-shine 2.5s ease-in-out infinite",
        "wallet-float": "wallet-float 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      backgroundSize: {
        "shine": "200% 100%",
      },
    },
  },
  plugins: [],
};
