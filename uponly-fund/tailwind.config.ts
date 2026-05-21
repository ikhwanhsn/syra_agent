import type { Config } from "tailwindcss";

/**
 * Floorsniffer-style screener palette + Up Only Fund landing accent.
 * Two font stacks:
 *   - `font-sans` (default body): Rethink Sans → Inter → system. Picked for
 *     dense dashboard tables; high x-height, tabular nums look clean.
 *   - `font-display` (landing only): Outfit, retained so marketing pages
 *     keep their existing typographic identity.
 *   - `font-mono`: JetBrains Mono for addresses/hashes.
 */
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
        sans: ["Rethink Sans", "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        space: ["Rethink Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Rethink Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
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
        uof: {
          DEFAULT: "hsl(var(--uof))",
          foreground: "hsl(var(--uof-foreground))",
        },
        neon: {
          cyan: "hsl(var(--neon-cyan))",
          blue: "hsl(var(--neon-blue))",
          purple: "hsl(var(--neon-purple))",
          gold: "hsl(var(--neon-gold))",
          "purple-glow": "hsl(var(--neon-purple-glow))",
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
        // Floorsniffer-parity screener semantics. Use these in dashboard chrome
        // instead of hard-coding `emerald-500` / `red-500` so light + dark work.
        ds: {
          canvas: "var(--ds-canvas)",
          panel: "var(--ds-panel)",
          surface: {
            1: "var(--ds-surface-1)",
            2: "var(--ds-surface-2)",
            3: "var(--ds-surface-3)",
          },
          border: "var(--ds-border)",
          divider: "var(--ds-divider)",
          text: {
            display: "var(--ds-text-display)",
            primary: "var(--ds-text-primary)",
            secondary: "var(--ds-text-secondary)",
            tertiary: "var(--ds-text-tertiary)",
            muted: "var(--ds-text-muted)",
          },
          positive: "var(--ds-positive)",
          "positive-soft": "var(--ds-positive-soft)",
          "positive-border": "var(--ds-positive-border)",
          negative: "var(--ds-negative)",
          "negative-soft": "var(--ds-negative-soft)",
          "negative-border": "var(--ds-negative-border)",
          warning: "var(--ds-warning)",
          "warning-soft": "var(--ds-warning-soft)",
          "warning-border": "var(--ds-warning-border)",
          info: "var(--ds-info)",
          "info-soft": "var(--ds-info-soft)",
          "info-border": "var(--ds-info-border)",
          special: "var(--ds-special)",
          "special-soft": "var(--ds-special-soft)",
          "special-border": "var(--ds-special-border)",
          accent: "var(--ds-accent)",
          "accent-soft": "var(--ds-accent-soft)",
          "accent-border": "var(--ds-accent-border)",
        },
      },
      transitionDuration: {
        400: "400ms",
      },
      transitionTimingFunction: {
        "dialog-enter": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 50s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
