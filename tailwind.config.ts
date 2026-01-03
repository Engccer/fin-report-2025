import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#2563eb", // Blue-600
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#4b5563", // Gray-600
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#059669", // Emerald-600
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#d97706", // Amber-600
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "#dc2626", // Red-600
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};
export default config;
