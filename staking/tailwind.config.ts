import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0f0f",
        surface: "rgba(255,255,255,0.03)",
        border: "rgba(255,255,255,0.08)",
        accent: {
          purple: "#a855f7",
          cyan: "#22d3ee",
        },
      },
      backgroundImage: {
        "gradient-accent":
          "linear-gradient(135deg, #a855f7 0%, #22d3ee 100%)",
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(168, 85, 247, 0.4)",
        "glow-cyan": "0 0 40px -10px rgba(34, 211, 238, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
