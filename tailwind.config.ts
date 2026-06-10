import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        solva: {
          blue: "#0b5cff",
          ink: "#08111f",
          line: "#dbe4f0",
          soft: "#f6f8fb"
        }
      },
      boxShadow: {
        panel: "0 1px 2px rgba(8,17,31,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
