import React, { useId } from "react";
import { FLAG_STATUS } from "../store/beachData";

/* ============================================================================
   This is the app's signature visual element. Real Australian surf
   lifesaving flags ARE the universal safety signal on a beach — a tourist
   who can't read the language can still recognize red-and-yellow flags.
   So instead of a flat two-color block, this renders an actual pennant
   silhouette with a wind-blown wavy trailing edge, used consistently
   everywhere a flag status appears in either app.
   ============================================================================ */

const SIZES = {
  sm: "w-5 h-4",
  md: "w-7 h-5",
  lg: "w-11 h-8",
};

// The wavy trailing edge is one clipPath shared by every instance; useId()
// keeps each rendered flag's clipPath id unique so multiple flags on one
// screen (e.g. a beach list) don't collide.
const FLAG_PATH = "M6 3 L30 3 C25 7 35 12 30 16 C25 20 35 25 30 29 L6 29 Z";

export default function FlagIcon({ status, size = "md" }) {
  const uid = useId();
  const cfg = FLAG_STATUS[status] || FLAG_STATUS.unpatrolled;
  const [topColor, bottomColor] = cfg.flagHex;
  const clipId = `flagclip-${uid}`;

  return (
    <svg
      viewBox="0 0 40 32"
      className={SIZES[size] || SIZES.md}
      style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={FLAG_PATH} />
        </clipPath>
      </defs>
      {/* pole */}
      <rect x="2" y="1" width="3" height="30" rx="1" fill="#44403c" />
      {/* the two flag bands, clipped to the wavy pennant silhouette */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="40" height="16" fill={topColor} />
        <rect x="0" y="16" width="40" height="16" fill={bottomColor} />
        {/* subtle fabric sheen so it doesn't read as flat color blocks */}
        <rect x="0" y="0" width="40" height="32" fill="white" opacity="0.08" />
      </g>
    </svg>
  );
}
