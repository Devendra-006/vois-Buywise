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
        background: "#FAF8F5",
        surface: "#FFFFFF",
        border: "#E7E2DA",
        ink: {
          DEFAULT: "#14130F",
          secondary: "#5C574F",
          muted: "#8C867D"
        },
        brand: {
          green: "#1F6F54",
          "green-light": "#E9F5F1",
          amber: "#B7791F",
          "amber-light": "#FEF7EC",
          red: "#C53030",
          "red-light": "#FDF2F2"
        }
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"]
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px"
      }
    },
  },
  plugins: [],
};
