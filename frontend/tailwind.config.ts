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
          950: "#131c57",
        },
        // Terra / âmbar — cor de destaque/accent
        terra: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        // Neutros
        surface: {
          DEFAULT: "#ffffff",
          muted:   "#f8f9fc",
          border:  "#e4e7ef",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(19,28,87,0.08)",
        "card-hover": "0 8px 24px 0 rgba(19,28,87,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
