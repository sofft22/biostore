/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        bg: "#FBF9F5",
        soft: "#F4EFE7",
        card: "#FFFFFF",
        ink: "#1A1A1A",
        muted: "rgba(26,26,26,0.55)",
        faint: "#9A948C",
        line: "#EDE8E0",
        green: "#0F7A4A",
        "green-soft": "rgba(15,122,74,0.10)",
        panel: "#1A1A1A",
        mat: "#EFEAE2",
      },
      borderRadius: {
        btn: "12px",
      },
    },
  },
  plugins: [],
};