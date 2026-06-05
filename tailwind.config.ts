import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#F5F5EE",
          secondary: "#FFFFFF",
        },
        text: {
          primary: "#111111",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        border: "#E5E7EB",
        accent: {
          primary: "#FF6600",
          hover: "#E65C00",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "hero": ["72px", { lineHeight: "0.95", letterSpacing: "-0.04em", fontWeight: "700" }],
        "section": ["48px", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "650" }],
      },
      borderRadius: {
        sm: "12px",
        md: "18px",
        lg: "24px",
        xl: "32px",
      },
      maxWidth: {
        container: "1280px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.03)",
        card: "0 1px 2px rgba(0,0,0,0.03)",
      },
    },
  },
  plugins: [],
};
export default config;
