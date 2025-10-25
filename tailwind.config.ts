import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Jetlag scoring colors
        jetlag: {
          low: '#22c55e',    // green - minimal jetlag
          moderate: '#eab308', // yellow
          high: '#f97316',   // orange
          severe: '#ef4444',  // red - severe jetlag
        },
      },
    },
  },
  plugins: [],
};

export default config;
