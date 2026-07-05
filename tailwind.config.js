/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm beach-sand neutrals for page backgrounds — replaces the
        // cooler stone/slate gray used before, to evoke sand in summer
        // light rather than a generic app dashboard.
        sand: {
          50: "#FDF8F0",
          100: "#FAF0DD",
          200: "#F3E1BE",
          300: "#EACB93",
          400: "#DFAE68",
          500: "#D08F44",
          600: "#B06F30",
          700: "#8A5527",
          800: "#6B4322",
          900: "#57371F",
        },
      },
      fontFamily: {
        // Body copy — clean and highly legible for dense, small-text UI.
        sans: ["Inter", "system-ui", "sans-serif"],
        // Headings and titles — bold, wide, confident: reads like real
        // beach-safety signage rather than a generic app font.
        display: ["Archivo", "system-ui", "sans-serif"],
        // Numeric readouts (wave height, wind, countdowns) — gives these an
        // "instrument panel" feel that reinforces this is safety data, not
        // decorative copy.
        data: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
