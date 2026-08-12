/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#07060f",
          900: "#0c0a18",
          850: "#11101f",
          800: "#171526",
        },
        accent: {
          blue: "#5b7fff",
          purple: "#9b6bff",
          cyan: "#5be3ff",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 0%, rgba(91,127,255,0.18), transparent 45%), radial-gradient(circle at 85% 15%, rgba(155,107,255,0.15), transparent 40%)",
        "accent-gradient": "linear-gradient(135deg, #5b7fff 0%, #9b6bff 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(91,127,255,0.45)",
      },
    },
  },
  plugins: [],
};
