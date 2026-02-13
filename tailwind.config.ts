import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cherry: "#f83f72",
        peach: "#ff9e7a",
        mint: "#74f2ce",
        ink: "#1d1635"
      },
      boxShadow: {
        glow: "0 10px 40px rgba(248, 63, 114, 0.35)"
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Nunito", "ui-sans-serif", "system-ui"]
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.75" },
          "100%": { transform: "scale(1.08)", opacity: "0" }
        }
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        pulseRing: "pulseRing 1.2s ease-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
