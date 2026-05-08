import type { Config } from "tailwindcss";

// Note: content-bg variable removed as we're using unified theme backgrounds

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
        cg: {
          gold: "hsl(var(--cg-gold))",
          premium: "hsl(var(--cg-premium))",
          success: "hsl(var(--cg-success))",
        },
        cineverse: {
          red: "#e50914",
          gray: "#9ca3af",
        },
        "content-bg": "hsl(var(--content-bg))",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "nav-bounce": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(0.85)" },
          "60%": { transform: "scale(1.15)" },
          "80%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "letter-fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "lamp-drop": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "50%": { opacity: "1", transform: "translateY(2px)" },
          "70%": { transform: "translateY(-3px)" },
          "85%": { transform: "translateY(1px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "letter-squish": {
          "0%": { transform: "scaleY(1) scaleX(1)" },
          "40%": { transform: "scaleY(0.5) scaleX(1.2)" },
          "70%": { transform: "scaleY(1.15) scaleX(0.9)" },
          "85%": { transform: "scaleY(0.95) scaleX(1.02)" },
          "100%": { transform: "scaleY(1) scaleX(1)" },
        },
        "lamp-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 6px hsl(45 93% 47% / 0.6)) drop-shadow(0 0 12px hsl(45 93% 47% / 0.3))" },
          "50%": { filter: "drop-shadow(0 0 14px hsl(45 93% 47% / 0.9)) drop-shadow(0 0 24px hsl(45 93% 47% / 0.5))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        marquee: "marquee 20s linear infinite",
        "marquee-slow": "marquee 30s linear infinite",
        "marquee-fast": "marquee 10s linear infinite",
        "nav-bounce": "nav-bounce 0.4s ease-out",
        "letter-fade-up": "letter-fade-up 0.4s ease-out forwards",
        "lamp-drop": "lamp-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "letter-squish": "letter-fade-up 0.4s ease-out forwards, letter-squish 0.4s ease-out 500ms",
        "lamp-glow": "lamp-glow 2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
