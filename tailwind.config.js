/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0D10",
        surface: {
          1: "#11151B",
          2: "#141A22",
          3: "#1A2230",
        },
        border: {
          DEFAULT: "#263041",
          hairline: "#1B2330",
        },
        text: {
          primary: "#E7EAF0",
          secondary: "#A7B0C0",
          muted: "#6E788A",
        },
        accent: "#D6B36A",
        success: "#2ECC71",
        warning: "#F5C451",
        danger: "#FF5A6A",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

