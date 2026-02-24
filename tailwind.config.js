/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hl: {
          green: "#50fa7b",
          red: "#ff5555",
          blue: "#6272a4",
          bg: "#0d1117",
          card: "#161b22",
          border: "#30363d",
          text: "#e6edf3",
          muted: "#8b949e",
        },
      },
    },
  },
  plugins: [],
};
