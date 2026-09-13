/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Brand tokens (kept as `garawol-*` class names for compatibility)
        garawol: {
          green: "#0B2F6B", // navy blue (primary)
          greenDark: "#071E47",
          greenSoft: "#E8EFF8",
          sand: "#F3F6FA",
          clay: "#C9A227", // gold accent
          claySoft: "#F8F1D6",
          ink: "#0B1220",
          muted: "#4A5568",
          soft: "#718096",
          line: "#D5DEEA",
          mist: "#F5F7FB",
          sky: "#E4EEF8",
          skyInk: "#0B2F6B",
          gold: "#E8D48B",
          goldInk: "#6B5520",
        },
      },
      fontFamily: {
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.75rem", { lineHeight: "1.125rem" }],
        xs: ["0.875rem", { lineHeight: "1.25rem" }],
        sm: ["1rem", { lineHeight: "1.5rem" }],
        base: ["1.125rem", { lineHeight: "1.65rem" }],
        lg: ["1.25rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.625rem", { lineHeight: "2rem" }],
        "3xl": ["2rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.5rem", { lineHeight: "2.75rem" }],
      },
      boxShadow: {
        sm: "0 0 0 1px #D5DEEA",
        DEFAULT: "0 0 0 1px #D5DEEA",
        md: "0 0 0 1px #D5DEEA",
        lg: "0 0 0 1px #D5DEEA",
        xl: "0 0 0 1px #D5DEEA",
        "2xl": "0 0 0 1px #D5DEEA",
        inner: "none",
        card: "0 0 0 1px #D5DEEA",
        lift: "0 0 0 1px #0B2F6B",
      },
    },
  },
  plugins: [],
};
