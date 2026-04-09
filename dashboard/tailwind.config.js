/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        syra: {
          bg: "hsl(var(--background))",
          card: "hsl(var(--card))",
          primary: "hsl(var(--primary))",
          accent: "hsl(var(--ring))",
        },
      },
      boxShadow: {
        "primary-glow": "0 0 16px hsl(var(--primary) / 0.12)",
        "primary-glow-md": "0 0 24px hsl(var(--primary) / 0.18)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.12)" },
          "50%": { boxShadow: "0 0 20px 2px hsl(var(--primary) / 0.08)" },
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
        shine: "200% 100%",
      },
    },
  },
  plugins: [],
};
