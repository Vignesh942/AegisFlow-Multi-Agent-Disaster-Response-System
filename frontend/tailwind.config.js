/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        command: {
          950: "#071013",
          900: "#0b171a",
          850: "#102025",
          800: "#14272d",
          line: "#263a40",
        },
        signal: {
          red: "#ff4d5e",
          amber: "#f6b73c",
          cyan: "#29d3c2",
          green: "#3ee47b",
        },
      },
      boxShadow: {
        glow: "0 0 32px rgba(41, 211, 194, 0.14)",
        alert: "0 0 30px rgba(255, 77, 94, 0.16)",
      },
    },
  },
  plugins: [],
}
