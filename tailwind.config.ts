import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#1a1b26",
        bg2: "#16171f",
        bg3: "#13141c",
        bg4: "#0f1017",
        borderDark: "#2a2d3e",
        border2: "#3a3d52",
        dim: "#414868",
        fg: "#a9b1d6",
        whiteTheme: "#c0caf5",
        cyanTheme: "#7dcfff",
        blueTheme: "#7aa2f7",
        magentaTheme: "#bb9af7",
        greenTheme: "#9ece6a",
        yellowTheme: "#e0af68",
        redTheme: "#f7768e",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
} satisfies Config;
