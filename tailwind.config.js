/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        gmail: {
          red: "#ea4335",
          blue: "#1a73e8",
          yellow: "#fbbc04",
          green: "#34a853",
          hover: "#f2f6fc",
          selected: "#c2e7ff",
          border: "#e5e7eb",
          text: "#1f1f1f",
          secondary: "#444746",
          sidebarBg: "#f6f8fc",
        },
      },
    },
  },
  plugins: [],
};

