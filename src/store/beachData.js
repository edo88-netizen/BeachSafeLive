/* ============================================================================
   SHARED DATA LAYER
   This is the single source of truth both apps read from and write to.
   FUTURE: this whole file becomes API calls to a real backend — the shape
   of the data (beaches, alerts, users) stays the same either way, so the
   components that consume it via BeachDataContext won't need to change.
   ============================================================================ */

import {
  Fish, Waves, RefreshCcw, Ban, AlertTriangle, Mountain,
} from "lucide-react";

// FUTURE: replace with real auth (SSO / org login)
export const USERS = [
  { id: "u1", name: "Sarah Chen", pin: "1234", role: "Lifesaver", assignedBeachIds: ["bondi"] },
  { id: "u2", name: "Jake Wilson", pin: "2345", role: "Lifesaver", assignedBeachIds: ["manly"] },
  { id: "u3", name: "Priya Nair", pin: "3456", role: "Patrol Supervisor", assignedBeachIds: ["bondi", "manly", "stkilda"] },
];

// Real coordinates so distance can be computed from the user's actual GPS
// position. `distanceKm` below is only a fallback shown before location is
// available (or if it's denied/unsupported) — see calculateDistanceKm().
export const INITIAL_BEACHES = [
  {
    id: "bondi", name: "Bondi Beach", state: "NSW", lat: -33.8908, lng: 151.2743, distanceKm: 1.2, flagStatus: "patrolled",
    hazards: ["Rip currents near rocks (south end)", "Strong shore break at high tide"],
    conditions: { waveHeightM: 1.2, waterTempC: 21, uvIndex: 9, windKmh: 18, windDir: "NE" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 6, lastUpdated: "2 min ago", adminManaged: true,
    mapFeatures: {
      swimZone: { id: "sz-bondi", points: [[-33.8888, 151.2733], [-33.8888, 151.2756], [-33.8926, 151.2756], [-33.8926, 151.2733]] },
      closedZones: [],
      hazardMarkers: [
        { id: "hm-bondi-1", lat: -33.8929, lng: 151.2749, type: "rocks", label: "Rocks near south end — avoid at low tide" },
        { id: "hm-bondi-2", lat: -33.8904, lng: 151.2751, type: "rip", label: "Rip current forms here at mid-to-high tide" },
      ],
    },
  },
  {
    id: "manly", name: "Manly Beach", state: "NSW", lat: -33.7969, lng: 151.2882, distanceKm: 3.8, flagStatus: "caution",
    hazards: ["Increased rip activity", "Bluebottles reported"],
    conditions: { waveHeightM: 1.5, waterTempC: 20, uvIndex: 8, windKmh: 24, windDir: "E" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 4, lastUpdated: "5 min ago", adminManaged: true,
    mapFeatures: {
      swimZone: { id: "sz-manly", points: [[-33.7955, 151.2872], [-33.7955, 151.2894], [-33.7985, 151.2894], [-33.7985, 151.2872]] },
      closedZones: [],
      hazardMarkers: [
        { id: "hm-manly-1", lat: -33.7962, lng: 151.2887, type: "rip", label: "Increased rip activity reported today" },
        { id: "hm-manly-2", lat: -33.7978, lng: 151.2879, type: "marine", label: "Bluebottle jellyfish sighted here" },
      ],
    },
  },
  {
    id: "stkilda", name: "St Kilda Beach", state: "VIC", lat: -37.8678, lng: 144.9800, distanceKm: 9.4, flagStatus: "patrolled",
    hazards: ["Boat traffic near pier"],
    conditions: { waveHeightM: 0.4, waterTempC: 17, uvIndex: 6, windKmh: 14, windDir: "S" },
    patrolHours: "10:30 AM – 5:00 PM", lifeguardsOnDuty: 3, lastUpdated: "1 min ago", adminManaged: true,
    mapFeatures: {
      swimZone: { id: "sz-stkilda", points: [[-37.8665, 144.9788], [-37.8665, 144.9812], [-37.8690, 144.9812], [-37.8690, 144.9788]] },
      closedZones: [],
      hazardMarkers: [
        { id: "hm-stkilda-1", lat: -37.8672, lng: 144.9815, type: "other", label: "Boat traffic near the pier — keep clear" },
      ],
    },
  },
  {
    id: "cottesloe", name: "Cottesloe Beach", state: "WA", lat: -31.9959, lng: 115.7581, distanceKm: 14.7, flagStatus: "unpatrolled",
    hazards: ["No lifeguards outside patrol season"],
    conditions: { waveHeightM: 0.8, waterTempC: 19, uvIndex: 7, windKmh: 20, windDir: "SW" },
    patrolHours: "Not patrolled today", lifeguardsOnDuty: 0, lastUpdated: "18 min ago", adminManaged: false,
    mapFeatures: {
      swimZone: null,
      closedZones: [],
      hazardMarkers: [
        { id: "hm-cottesloe-1", lat: -31.9959, lng: 115.7575, type: "other", label: "No lifeguards on duty outside patrol season" },
      ],
    },
  },
  {
    id: "surfers", name: "Surfers Paradise", state: "QLD", lat: -28.0023, lng: 153.4145, distanceKm: 22.1, flagStatus: "closed",
    hazards: ["Dangerous surf — beach closed to swimmers", "Lightning risk"],
    conditions: { waveHeightM: 2.4, waterTempC: 24, uvIndex: 10, windKmh: 32, windDir: "NE" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 8, lastUpdated: "Just now", adminManaged: false,
    mapFeatures: {
      swimZone: null,
      closedZones: [{ id: "cz-surfers-1", points: [[-28.0010, 153.4133], [-28.0010, 153.4157], [-28.0036, 153.4157], [-28.0036, 153.4133]] }],
      hazardMarkers: [
        { id: "hm-surfers-1", lat: -28.0023, lng: 153.4148, type: "submerged", label: "Dangerous surf — submerged sandbank drop-offs" },
        { id: "hm-surfers-2", lat: -28.0016, lng: 153.4140, type: "other", label: "Lightning risk — seek shelter immediately" },
      ],
    },
  },
];

// Haversine formula — great-circle distance between two lat/lng points in km.
// FUTURE: for very precise "walking distance," swap for a real routing API
// (Google Directions, Mapbox Directions); this is straight-line distance.
export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Point-hazard types placeable on the beach map. Colors are plain hex here
// (not Tailwind classes) because Leaflet draws them directly onto canvas/SVG
// map panes, outside Tailwind's reach.
export const HAZARD_TYPES = {
  rip: { label: "Rip Current", icon: RefreshCcw, color: "#f59e0b" },
  rocks: { label: "Rocks", icon: Mountain, color: "#78716c" },
  marine: { label: "Marine Life", icon: Fish, color: "#dc2626" },
  submerged: { label: "Submerged Hazard", icon: AlertTriangle, color: "#dc2626" },
  other: { label: "Other Hazard", icon: AlertTriangle, color: "#f59e0b" },
};

export const PRESETS = [
  { key: "shark", label: "Shark Sighting", icon: Fish, severity: "danger", expiryMin: 60,
    text: "Shark sighted in the water. All swimmers must exit immediately and stay clear of the water." },
  { key: "swell", label: "Dangerous Swell", icon: Waves, severity: "caution", expiryMin: 120,
    text: "Dangerous swell conditions. Large waves and strong swell — swim with extra caution." },
  { key: "rip", label: "Rip Current Change", icon: RefreshCcw, severity: "caution", expiryMin: 90,
    text: "Rip current conditions have changed. Check flag positions before entering the water." },
  { key: "closure", label: "Beach Closure", icon: Ban, severity: "closure", expiryMin: 240,
    text: "Beach closed to swimmers until further notice. Please leave the water now." },
  { key: "hazard", label: "General Hazard", icon: AlertTriangle, severity: "caution", expiryMin: 60,
    text: "Hazard reported on the beach. Please follow lifeguard instructions." },
];

export const SEVERITY = {
  info: { label: "Info", bg: "bg-blue-600", soft: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700" },
  caution: { label: "Caution", bg: "bg-amber-500", soft: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700" },
  danger: { label: "Danger", bg: "bg-red-600", soft: "bg-red-50", ring: "ring-red-200", text: "text-red-700" },
  closure: { label: "Closure", bg: "bg-slate-900", soft: "bg-slate-100", ring: "ring-slate-300", text: "text-slate-800" },
};

// severity -> effect on the public flag status shown to tourists
export const SEVERITY_FLAG_EFFECT = { danger: "closed", closure: "closed", caution: "caution", info: null };

export const FLAG_STATUS = {
  patrolled: { label: "Patrolled", short: "Safe to swim", flagColors: ["bg-red-600", "bg-yellow-400"], text: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  caution: { label: "Caution", short: "Swim with caution", flagColors: ["bg-red-600", "bg-yellow-400"], text: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  closed: { label: "Closed", short: "Closed to swimmers", flagColors: ["bg-red-600", "bg-red-600"], text: "text-red-700", bg: "bg-red-50", dot: "bg-red-600" },
  unpatrolled: { label: "Unpatrolled", short: "No lifeguards", flagColors: ["bg-slate-300", "bg-slate-300"], text: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" },
};

// FUTURE: swap for a real translation API — kept keyed by preset so custom
// edits fall back gracefully rather than showing a mistranslation.
export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
];

export const PRESET_TRANSLATIONS = {
  shark: {
    zh: "水域中发现鲨鱼。所有游泳者请立即离开水域并远离该区域。",
    ja: "海中でサメが目撃されました。遊泳者は直ちに海から出て離れてください。",
    ko: "물속에서 상어가 목격되었습니다. 모든 수영객은 즉시 물 밖으로 나와야 합니다.",
    es: "Se ha avistado un tiburón en el agua. Todos los bañistas deben salir de inmediato.",
    fr: "Un requin a été aperçu. Tous les baigneurs doivent sortir de l'eau immédiatement.",
  },
  swell: {
    zh: "涌浪危险。浪大流急，请谨慎游泳。",
    es: "Condiciones de oleaje peligrosas. Nade con precaución adicional.",
  },
  rip: {
    zh: "离岸流情况已改变。下水前请查看旗帜位置。",
    ja: "離岸流の状況が変化しました。入水前に旗の位置を確認してください。",
  },
  closure: {
    zh: "沙滩暂时关闭，禁止游泳，请立即离开水域。",
    fr: "Plage fermée à la baignade jusqu'à nouvel ordre. Merci de sortir de l'eau.",
  },
  hazard: {
    es: "Se ha reportado un peligro en la playa. Siga las instrucciones del socorrista.",
  },
};

// Given a published alert and a target language, return translated text and
// whether we had to fall back to English. Only unedited preset text is
// translated — a custom-edited message always shows original + fallback note.
export function translateAlert(alert, langCode) {
  if (langCode === "en") return { text: alert.text, isFallback: false };
  const isUnedited = PRESETS.find((p) => p.key === alert.presetKey)?.text === alert.text;
  const dict = PRESET_TRANSLATIONS[alert.presetKey];
  if (isUnedited && dict && dict[langCode]) return { text: dict[langCode], isFallback: false };
  return { text: alert.text, isFallback: true };
}

export function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
export function fmtClock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
