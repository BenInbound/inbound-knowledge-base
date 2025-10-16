import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-tt-hoves)", "system-ui", "sans-serif"],
      },
      colors: {
        // Inbound design system colors (to be extracted from Figma)
        primary: {
          50: "#faf8f5",
          100: "#f5f1ea",
          200: "#ebe3d5",
          300: "#e0d5c0",
          400: "#d6c7ab",
          500: "#ccb996",
          600: "#a39478",
          700: "#7a6f5a",
          800: "#524a3c",
          900: "#29251e",
        },
        accent: {
          50: "#fff0f5",
          100: "#ffe1eb",
          200: "#ffc3d7",
          300: "#ffa5c3",
          400: "#ff87af",
          500: "#ff6b9d",
          600: "#cc567e",
          700: "#99415e",
          800: "#662b3f",
          900: "#33161f",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
