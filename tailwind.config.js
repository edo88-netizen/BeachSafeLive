/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
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
