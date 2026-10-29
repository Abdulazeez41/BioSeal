import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAF7F1",
        surface: "#FFFFFF",
        "surface-soft": "#F4EFE7",
        "surface-muted": "#EDE6DA",
        primary: {
          DEFAULT: "#0F766E",
          hover: "#0D655E",
          light: "#E6F4F2",
          dark: "#0B4F4A",
        },
        ink: {
          primary: "#161513",
          secondary: "#5F5B54",
          muted: "#8C867D",
        },
        border: {
          DEFAULT: "#E5DFD4",
          light: "#F0EBE2",
          strong: "#D4CCBF",
        },
        status: {
          success: "#15803D",
          "success-soft": "#DCFCE7",
          warning: "#B45309",
          "warning-soft": "#FEF3C7",
          critical: "#B91C1C",
          "critical-soft": "#FEE2E2",
          neutral: "#334155",
          "neutral-soft": "#F1F5F9",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        heading: [
          "Inter Tight",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        display: ["64px", { lineHeight: "1.05", fontWeight: "600" }],
        h2: ["36px", { lineHeight: "1.15", fontWeight: "600" }],
        h3: ["22px", { lineHeight: "1.25", fontWeight: "600" }],
        body: ["17px", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        label: ["12px", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      borderRadius: {
        card: "16px",
        input: "12px",
        pill: "999px",
      },
      maxWidth: {
        content: "100%",
        wide: "100%",
      },
      boxShadow: {
        // Redesign direction: solid white surfaces with 1px border and no shadow, glass only on navbar and camera control
        none: "none",
        glass: "0 20px 60px rgba(22, 21, 19, 0.08)",
      },
      backdropBlur: {
        glass: "20px",
      },
      transitionDuration: {
        DEFAULT: "240ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
