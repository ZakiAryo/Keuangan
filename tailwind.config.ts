import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070b12",
        panel: "#0d1420",
        line: "#1c2838",
        muted: "#8b9bb0",
        accent: "#70e1b0",
        danger: "#fb7185",
      },
      boxShadow: {
        glow: "0 0 40px rgba(112, 225, 176, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
