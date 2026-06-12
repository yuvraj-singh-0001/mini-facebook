import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "fb-blue": "#1877f2",
        "fb-blue-hover": "#166fe5",
        "fb-bg": "#f0f2f5",
        "fb-dark": "#242526",
        "fb-dark-bg": "#18191a",
        "fb-dark-panel": "#242526",
        "fb-text-dark": "#050505",
        "fb-text-light": "#e4e6eb",
        "fb-gray": "#65676b",
        "fb-gray-dark": "#b0b3b8",
        "fb-gray-bg": "#e4e6eb",
        "fb-gray-bg-dark": "#3a3b3c",
      },
    },
  },
};

export default config;
