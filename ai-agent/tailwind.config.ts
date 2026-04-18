import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neon: {
          purple: "hsl(var(--neon-purple))",
          "purple-glow": "hsl(var(--neon-purple-glow))",
          blue: "hsl(var(--neon-blue))",
          "blue-glow": "hsl(var(--neon-blue-glow))",
        },
        glass: {
          bg: "hsl(var(--glass-bg))",
          border: "hsl(var(--glass-border))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        message: {
          user: "hsl(var(--message-user))",
          agent: "hsl(var(--message-agent))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        glow: "0 0 40px -10px hsl(var(--primary) / 0.4)",
        "glow-sm": "0 0 20px -5px hsl(var(--primary) / 0.3)",
        soft: "0 2px 8px -2px hsl(var(--foreground) / 0.08)",
        medium: "0 4px 16px -4px hsl(var(--foreground) / 0.12)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        /** Wallet → agent cue in fuel modal (vertical stack). */
        "deposit-flow-up": {
          "0%, 100%": { transform: "translateY(2px)", opacity: "0.35" },
          "50%": { transform: "translateY(-5px)", opacity: "1" },
        },
        /** Wallet → agent cue in fuel modal (horizontal). */
        "deposit-flow-left": {
          "0%, 100%": { transform: "translateX(4px)", opacity: "0.35" },
          "50%": { transform: "translateX(-4px)", opacity: "1" },
        },
        /** Agent → wallet cue in fuel modal (vertical stack). */
        "withdraw-flow-down": {
          "0%, 100%": { transform: "translateY(-2px)", opacity: "0.35" },
          "50%": { transform: "translateY(5px)", opacity: "1" },
        },
        /** Agent → wallet cue in fuel modal (horizontal). */
        "withdraw-flow-right": {
          "0%, 100%": { transform: "translateX(-4px)", opacity: "0.35" },
          "50%": { transform: "translateX(4px)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        spin: "spin 1s linear infinite",
        "deposit-flow-up": "deposit-flow-up 1.35s ease-in-out infinite",
        "deposit-flow-left": "deposit-flow-left 1.35s ease-in-out infinite",
        "withdraw-flow-down": "withdraw-flow-down 1.35s ease-in-out infinite",
        "withdraw-flow-right": "withdraw-flow-right 1.35s ease-in-out infinite",
      },
      spacing: {
        sidebar: "var(--sidebar-width)",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    /** Default `:root` tokens are dark; `html.light` switches to light — pair with `light:` utilities. */
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
} satisfies Config;
