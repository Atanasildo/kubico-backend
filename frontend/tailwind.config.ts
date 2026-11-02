import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul profundo — cor primária
        primary: {
          50:  "#eef4ff",
          100: "#d9e8ff",
          200: "#bcd4ff",
          300: "#8eb6ff",
          400: "#598dff",
          500: "#3366ff",
          600: "#1a45f5",
          700: "#1433e1",
          800: "#172bb6",
          900: "#192a8f",
          950: "#0d1535",
        },
        // Laranja / âmbar — accent premium
        terra: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea6c0a",
          700: "#c2570a",
          800: "#9a3d0a",
          900: "#7c330f",
          950: "#431705",
        },
        // Neutros — light mode
        surface: {
          DEFAULT: "#ffffff",
          muted:   "#f4f6fa",
          warm:    "#f8f7f4",
          border:  "#e4e7ef",
        },
        // Dark mode — azul escuro profundo
        dark: {
          bg:       "#070d1f",
          surface:  "#0f1b35",
          card:     "#14233f",
          elevated: "#1a2d50",
          border:   "#1f3460",
          muted:    "#152845",
        },
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card:       "0 2px 8px 0 rgba(19,28,87,0.08)",
        "card-hover":"0 8px 24px 0 rgba(19,28,87,0.14)",
        "dark-card": "0 2px 12px 0 rgba(0,0,0,0.4)",
        "dark-hover":"0 8px 32px 0 rgba(0,0,0,0.6)",
        "glow-terra":"0 0 40px rgba(249,115,22,0.25)",
        "glow-primary":"0 0 40px rgba(26,69,245,0.3)",
      },
      keyframes: {
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-out-left": {
          "0%":   { transform: "translateX(0)",    opacity: "1" },
          "100%": { transform: "translateX(-100%)",opacity: "0" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "marquee": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(249,115,22,0)" },
          "50%":       { boxShadow: "0 0 24px 4px rgba(249,115,22,0.3)" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16,1,0.3,1)",
        "fade-in":        "fade-in 0.5s ease",
        "marquee":        "marquee 40s linear infinite",
        "marquee-fast":   "marquee 20s linear infinite",
        "pulse-glow":     "pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
