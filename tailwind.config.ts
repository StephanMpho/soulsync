import type { Config } from "tailwindcss";

// Design tokens ported 1:1 from the soulsync-app.jsx prototype's `C` palette.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        burgundy: "#6D2E46",
        burgundyDeep: "#4F2033",
        rose: "#D8A7B1",
        gold: "#D6B370",
        ivory: "#FAF7F3",
        linen: "#F3EEE8",
        sage: "#A8B8A5",
        emerald: "#3F7D58",
        navy: "#415A77",
        charcoal: "#2D2D2D",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
