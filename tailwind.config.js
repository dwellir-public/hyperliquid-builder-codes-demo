/** @type {import('tailwindcss').Config} */

function withAlpha(varName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${varName}), ${opacityValue})`;
    }
    return `rgb(var(${varName}))`;
  };
}

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-family-heading)"],
        body: ["var(--font-family-body)"],
      },
      colors: {
        hl: {
          green: withAlpha("--primary"),
          red: withAlpha("--errorColor"),
          bg: withAlpha("--background"),
          card: withAlpha("--cardBackground"),
          border: withAlpha("--borderColor"),
          text: withAlpha("--text"),
          muted: withAlpha("--inputPlaceholder"),
          "primary-light": withAlpha("--primary-light"),
          "primary-dark": withAlpha("--primary-dark"),
          secondary: withAlpha("--secondary"),
          warning: withAlpha("--warningColor"),
          "input-bg": withAlpha("--inputBackground"),
        },
      },
      boxShadow: {
        "dw-md": "var(--shadow-md)",
        "dw-lg": "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
