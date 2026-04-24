/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ttokLightPink: "#FFAFAF",
        ttokPink: "#FF9191",
        ttokGray: "#5F5F5F",
      },
    },
  },
  plugins: [],
};
