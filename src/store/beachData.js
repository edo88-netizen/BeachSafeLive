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

// Generates a simple rectangular swim zone centered on a beach's coordinates,
// for beaches that haven't had a custom shape hand-drawn by an admin yet.
// Real, hand-drawn zones (like Bondi's) still take precedence wherever set.
function makeSwimZone(lat, lng, halfWidthDeg = 0.0012) {
  return {
    id: `sz-${lat}-${lng}`,
    points: [
      [lat - halfWidthDeg, lng - halfWidthDeg],
      [lat - halfWidthDeg, lng + halfWidthDeg],
      [lat + halfWidthDeg, lng + halfWidthDeg],
      [lat + halfWidthDeg, lng - halfWidthDeg],
    ],
  };
}

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
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 8, lastUpdated: "Just now", adminManaged: true,
    mapFeatures: {
      swimZone: null,
      closedZones: [{ id: "cz-surfers-1", points: [[-28.0010, 153.4133], [-28.0010, 153.4157], [-28.0036, 153.4157], [-28.0036, 153.4133]] }],
      hazardMarkers: [
        { id: "hm-surfers-1", lat: -28.0023, lng: 153.4148, type: "submerged", label: "Dangerous surf — submerged sandbank drop-offs" },
        { id: "hm-surfers-2", lat: -28.0016, lng: 153.4140, type: "other", label: "Lightning risk — seek shelter immediately" },
      ],
    },
  },
  {
    id: "bronte", name: "Bronte Beach", state: "NSW", lat: -33.9026, lng: 151.2645, distanceKm: 2.4, flagStatus: "patrolled",
    hazards: ["Rocky points at both ends of the beach"],
    conditions: { waveHeightM: 1.0, waterTempC: 21, uvIndex: 8, windKmh: 16, windDir: "NE" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 3, lastUpdated: "6 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-33.9026, 151.2645), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "coogee", name: "Coogee Beach", state: "NSW", lat: -33.9205, lng: 151.2577, distanceKm: 4.1, flagStatus: "patrolled",
    hazards: ["Occasional bluebottles"],
    conditions: { waveHeightM: 0.9, waterTempC: 21, uvIndex: 8, windKmh: 15, windDir: "E" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 4, lastUpdated: "9 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-33.9205, 151.2577), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "cronulla", name: "Cronulla Beach", state: "NSW", lat: -34.0287, lng: 151.1522, distanceKm: 18.9, flagStatus: "patrolled",
    hazards: ["Rip currents near the Point"],
    conditions: { waveHeightM: 1.1, waterTempC: 20, uvIndex: 8, windKmh: 20, windDir: "SE" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 5, lastUpdated: "4 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-34.0287, 151.1522), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "maroubra", name: "Maroubra Beach", state: "NSW", lat: -33.9500, lng: 151.2577, distanceKm: 7.6, flagStatus: "caution",
    hazards: ["Strong rip currents — Sydney's most rip-prone beach"],
    conditions: { waveHeightM: 1.4, waterTempC: 20, uvIndex: 8, windKmh: 22, windDir: "E" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 4, lastUpdated: "3 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-33.9500, 151.2577), closedZones: [], hazardMarkers: [
      { id: "hm-maroubra-1", lat: -33.9508, lng: 151.2584, type: "rip", label: "Persistent rip current — swim between the flags only" },
    ] },
  },
  {
    id: "newcastle", name: "Newcastle Beach", state: "NSW", lat: -32.9283, lng: 151.7817, distanceKm: 162.0, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 1.3, waterTempC: 19, uvIndex: 7, windKmh: 19, windDir: "NE" },
    patrolHours: "7:00 AM – 6:00 PM", lifeguardsOnDuty: 4, lastUpdated: "12 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-32.9283, 151.7817), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "wollongong", name: "North Wollongong Beach", state: "NSW", lat: -34.4145, lng: 150.8994, distanceKm: 84.0, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 1.0, waterTempC: 19, uvIndex: 7, windKmh: 17, windDir: "S" },
    patrolHours: "9:00 AM – 5:00 PM", lifeguardsOnDuty: 3, lastUpdated: "20 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-34.4145, 150.8994), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "brighton", name: "Brighton Beach", state: "VIC", lat: -37.9061, lng: 145.0011, distanceKm: 11.2, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 0.3, waterTempC: 16, uvIndex: 5, windKmh: 13, windDir: "S" },
    patrolHours: "11:00 AM – 5:00 PM", lifeguardsOnDuty: 2, lastUpdated: "15 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-37.9061, 145.0011), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "torquay", name: "Torquay Beach", state: "VIC", lat: -38.3350, lng: 144.3250, distanceKm: 96.0, flagStatus: "caution",
    hazards: ["Powerful surf breaks nearby — experienced surfers only outside flags"],
    conditions: { waveHeightM: 1.8, waterTempC: 15, uvIndex: 6, windKmh: 26, windDir: "SW" },
    patrolHours: "10:30 AM – 5:00 PM", lifeguardsOnDuty: 3, lastUpdated: "7 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-38.3350, 144.3250), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "burleigh", name: "Burleigh Heads Beach", state: "QLD", lat: -28.0958, lng: 153.4489, distanceKm: 78.0, flagStatus: "patrolled",
    hazards: ["Rocky headland at southern end"],
    conditions: { waveHeightM: 1.2, waterTempC: 25, uvIndex: 10, windKmh: 18, windDir: "E" },
    patrolHours: "7:00 AM – 5:00 PM", lifeguardsOnDuty: 5, lastUpdated: "5 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-28.0958, 153.4489), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "noosa", name: "Noosa Main Beach", state: "QLD", lat: -26.3985, lng: 153.0925, distanceKm: 145.0, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 0.6, waterTempC: 25, uvIndex: 10, windKmh: 14, windDir: "NE" },
    patrolHours: "7:00 AM – 5:00 PM", lifeguardsOnDuty: 4, lastUpdated: "10 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-26.3985, 153.0925), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "mooloolaba", name: "Mooloolaba Beach", state: "QLD", lat: -26.6822, lng: 153.1157, distanceKm: 100.0, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 0.8, waterTempC: 24, uvIndex: 9, windKmh: 16, windDir: "E" },
    patrolHours: "7:00 AM – 5:00 PM", lifeguardsOnDuty: 4, lastUpdated: "8 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-26.6822, 153.1157), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "coolangatta", name: "Coolangatta Beach", state: "QLD", lat: -28.1667, lng: 153.5378, distanceKm: 95.0, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 1.0, waterTempC: 24, uvIndex: 9, windKmh: 17, windDir: "E" },
    patrolHours: "7:00 AM – 5:00 PM", lifeguardsOnDuty: 4, lastUpdated: "14 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-28.1667, 153.5378), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "scarborough", name: "Scarborough Beach", state: "WA", lat: -31.8946, lng: 115.7581, distanceKm: 12.0, flagStatus: "patrolled",
    hazards: ["Strong swell popular with surfers — care advised for swimmers"],
    conditions: { waveHeightM: 1.5, waterTempC: 20, uvIndex: 8, windKmh: 22, windDir: "SW" },
    patrolHours: "8:00 AM – 6:00 PM", lifeguardsOnDuty: 4, lastUpdated: "6 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-31.8946, 115.7581), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "citybeach", name: "City Beach", state: "WA", lat: -31.9410, lng: 115.7590, distanceKm: 15.5, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 0.7, waterTempC: 20, uvIndex: 7, windKmh: 19, windDir: "SW" },
    patrolHours: "8:00 AM – 6:00 PM", lifeguardsOnDuty: 3, lastUpdated: "11 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-31.9410, 115.7590), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "glenelg", name: "Glenelg Beach", state: "SA", lat: -34.9805, lng: 138.5178, distanceKm: 11.0, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 0.3, waterTempC: 18, uvIndex: 6, windKmh: 15, windDir: "SW" },
    patrolHours: "11:00 AM – 5:00 PM", lifeguardsOnDuty: 2, lastUpdated: "16 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-34.9805, 138.5178), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "henley", name: "Henley Beach", state: "SA", lat: -34.9210, lng: 138.4970, distanceKm: 13.5, flagStatus: "patrolled",
    hazards: [],
    conditions: { waveHeightM: 0.3, waterTempC: 18, uvIndex: 6, windKmh: 14, windDir: "SW" },
    patrolHours: "11:00 AM – 5:00 PM", lifeguardsOnDuty: 2, lastUpdated: "19 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-34.9210, 138.4970), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "clifton", name: "Clifton Beach", state: "TAS", lat: -43.0167, lng: 147.5167, distanceKm: 22.0, flagStatus: "patrolled",
    hazards: ["Cold water year-round — hypothermia risk for long swims"],
    conditions: { waveHeightM: 1.1, waterTempC: 14, uvIndex: 4, windKmh: 21, windDir: "S" },
    patrolHours: "11:00 AM – 5:00 PM (summer weekends)", lifeguardsOnDuty: 2, lastUpdated: "25 min ago", adminManaged: true,
    mapFeatures: { swimZone: makeSwimZone(-43.0167, 147.5167), closedZones: [], hazardMarkers: [] },
  },
  {
    id: "casuarina", name: "Casuarina Beach", state: "NT", lat: -12.3833, lng: 130.8730, distanceKm: 3150.0, flagStatus: "caution",
    hazards: ["Marine stinger season (Oct–May) — wear a stinger suit", "Crocodile sightings possible — check signage before swimming"],
    conditions: { waveHeightM: 0.2, waterTempC: 29, uvIndex: 11, windKmh: 12, windDir: "NE" },
    patrolHours: "6:00 AM – 6:00 PM", lifeguardsOnDuty: 2, lastUpdated: "13 min ago", adminManaged: true,
    mapFeatures: { swimZone: null, closedZones: [], hazardMarkers: [
      { id: "hm-casuarina-1", lat: -12.3840, lng: 130.8738, type: "marine", label: "Crocodile warning — check with lifeguards before entering the water" },
    ] },
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
  closure: { label: "Closure", bg: "bg-stone-900", soft: "bg-stone-100", ring: "ring-stone-300", text: "text-stone-800" },
};

// severity -> effect on the public flag status shown to tourists
export const SEVERITY_FLAG_EFFECT = { danger: "closed", closure: "closed", caution: "caution", info: null };

export const FLAG_STATUS = {
  patrolled: { label: "Patrolled", short: "Safe to swim", flagColors: ["bg-red-600", "bg-yellow-400"], flagHex: ["#dc2626", "#facc15"], text: "text-teal-700", bg: "bg-teal-50", dot: "bg-teal-500" },
  caution: { label: "Caution", short: "Swim with caution", flagColors: ["bg-red-600", "bg-yellow-400"], flagHex: ["#dc2626", "#facc15"], text: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  closed: { label: "Closed", short: "Closed to swimmers", flagColors: ["bg-red-600", "bg-red-600"], flagHex: ["#dc2626", "#dc2626"], text: "text-red-700", bg: "bg-red-50", dot: "bg-red-600" },
  unpatrolled: { label: "Unpatrolled", short: "No lifeguards", flagColors: ["bg-stone-300", "bg-stone-300"], flagHex: ["#a8a29e", "#a8a29e"], text: "text-stone-600", bg: "bg-stone-100", dot: "bg-stone-400" },
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
