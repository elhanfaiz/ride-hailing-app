/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090b",
        slateglass: "rgba(15, 23, 42, 0.72)",
        accent: "#bef264",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        glow: "0 24px 80px rgba(132, 204, 22, 0.18)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(190,242,100,0.18), transparent 28%), radial-gradient(circle at top right, rgba(59,130,246,0.15), transparent 24%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,1))",
      },
    },
  },
  plugins: [],
};

