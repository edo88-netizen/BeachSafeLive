import React, { useState, useEffect } from "react";
import {
  MapPin, Waves, Radio, Languages, AlertTriangle, Phone, ChevronLeft,
  Wind, Thermometer, Sun, Clock, Megaphone, ShieldAlert, CheckCircle2,
  Circle, ChevronRight, Volume2, Navigation, Users, Info
} from "lucide-react";

/* ============================================================================
   MOCK DATA LAYER
   Everything below is sample data standing in for real feeds. Each block is
   shaped the way a real API response would be, so swapping in a live feed
   later just means replacing the fetch, not the components that consume it.
   ============================================================================ */

// FUTURE: replace with GPS-based sort (navigator.geolocation + distance calc)
const BEACHES = [
  {
    id: "bondi",
    name: "Bondi Beach",
    state: "NSW",
    distanceKm: 1.2,
    patrolled: true,
    flagStatus: "patrolled", // patrolled | caution | closed | unpatrolled
    hazards: ["Rip currents near rocks (south end)", "Strong shore break at high tide"],
    conditions: { waveHeightM: 1.2, waterTempC: 21, uvIndex: 9, windKmh: 18, windDir: "NE" },
    patrolHours: "7:00 AM – 6:00 PM",
    lifeguardsOnDuty: 6,
    lastUpdated: "2 min ago",
  },
  {
    id: "manly",
    name: "Manly Beach",
    state: "NSW",
    distanceKm: 3.8,
    patrolled: true,
    flagStatus: "caution",
    hazards: ["Increased rip activity", "Bluebottles reported"],
    conditions: { waveHeightM: 1.5, waterTempC: 20, uvIndex: 8, windKmh: 24, windDir: "E" },
    patrolHours: "7:00 AM – 6:00 PM",
    lifeguardsOnDuty: 4,
    lastUpdated: "5 min ago",
  },
  {
    id: "stkilda",
    name: "St Kilda Beach",
    state: "VIC",
    distanceKm: 9.4,
    patrolled: true,
    flagStatus: "patrolled",
    hazards: ["Boat traffic near pier"],
    conditions: { waveHeightM: 0.4, waterTempC: 17, uvIndex: 6, windKmh: 14, windDir: "S" },
    patrolHours: "10:30 AM – 5:00 PM",
    lifeguardsOnDuty: 3,
    lastUpdated: "1 min ago",
  },
  {
    id: "cottesloe",
    name: "Cottesloe Beach",
    state: "WA",
    distanceKm: 14.7,
    patrolled: false,
    flagStatus: "unpatrolled",
    hazards: ["No lifeguards outside patrol season"],
    conditions: { waveHeightM: 0.8, waterTempC: 19, uvIndex: 7, windKmh: 20, windDir: "SW" },
    patrolHours: "Not patrolled today",
    lifeguardsOnDuty: 0,
    lastUpdated: "18 min ago",
  },
  {
    id: "surfers",
    name: "Surfers Paradise",
    state: "QLD",
    distanceKm: 22.1,
    patrolled: true,
    flagStatus: "closed",
    hazards: ["Dangerous surf — beach closed to swimmers", "Lightning risk"],
    conditions: { waveHeightM: 2.4, waterTempC: 24, uvIndex: 10, windKmh: 32, windDir: "NE" },
    patrolHours: "7:00 AM – 6:00 PM",
    lifeguardsOnDuty: 8,
    lastUpdated: "Just now",
  },
];

// FUTURE: replace with a live websocket / push feed from the lifeguard tower
const LIVE_MESSAGES = [
  {
    id: 1,
    time: "10:42 AM",
    level: "danger",
    text: "Strong rip current forming at the southern flag. Please swim between the flags only.",
  },
  {
    id: 2,
    time: "10:31 AM",
    level: "info",
    text: "UV index is extreme. Reapply sunscreen and seek shade between 11am and 3pm.",
  },
  {
    id: 3,
    time: "10:15 AM",
    level: "warning",
    text: "Bluebottle jellyfish sighted near the northern rocks. Avoid that area.",
  },
  {
    id: 4,
    time: "9:58 AM",
    level: "info",
    text: "Good morning! Flags are up and lifeguards are on patrol until 6pm today.",
  },
];

// FUTURE: swap for a real translation API (e.g. server-side call). Structure
// is kept so only this lookup needs to change — components stay the same.
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

const TRANSLATIONS = {
  "Strong rip current forming at the southern flag. Please swim between the flags only.": {
    zh: "南侧旗帜附近正在形成强烈离岸流。请仅在两旗之间游泳。",
    ja: "南側の旗の近くで強い離岸流が発生しています。旗の間でのみ泳いでください。",
    ko: "남쪽 깃발 근처에 강한 이안류가 형성되고 있습니다. 깃발 사이에서만 수영하세요.",
    es: "Se está formando una fuerte corriente de resaca junto a la bandera sur. Nade solo entre las banderas.",
    fr: "Un fort courant d'arrachement se forme près du drapeau sud. Nagez uniquement entre les drapeaux.",
    de: "Am südlichen Fahnenposten bildet sich eine starke Rückströmung. Schwimmen Sie nur zwischen den Fahnen.",
  },
  "UV index is extreme. Reapply sunscreen and seek shade between 11am and 3pm.": {
    zh: "紫外线指数极高。请补涂防晒霜，并在上午11点至下午3点间寻找阴凉处。",
    es: "El índice UV es extremo. Vuelva a aplicarse protector solar y busque sombra entre las 11am y las 3pm.",
    fr: "L'indice UV est extrême. Réappliquez de la crème solaire et cherchez de l'ombre entre 11h et 15h.",
  },
  "Bluebottle jellyfish sighted near the northern rocks. Avoid that area.": {
    zh: "在北侧岩石附近发现僧帽水母。请避开该区域。",
    ja: "北側の岩場付近でカツオノエボシが目撃されました。その区域を避けてください。",
  },
  "Good morning! Flags are up and lifeguards are on patrol until 6pm today.": {
    zh: "早上好！旗帜已升起，救生员今天巡逻至下午6点。",
    es: "¡Buenos días! Las banderas están izadas y los socorristas patrullan hasta las 6pm hoy.",
  },
};

function translate(text, langCode) {
  if (langCode === "en") return { text, isFallback: false };
  const entry = TRANSLATIONS[text];
  if (entry && entry[langCode]) return { text: entry[langCode], isFallback: false };
  return { text, isFallback: true }; // FUTURE: real API would rarely hit this
}

/* ============================================================================
   FLAG STATUS CONFIG — the surf-lifesaving flag system, the core safety
   signal used throughout the app.
   ============================================================================ */

const FLAG_STATUS = {
  patrolled: {
    label: "Patrolled — swim between the flags",
    short: "Safe to swim",
    ring: "ring-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    flagColors: ["bg-red-600", "bg-yellow-400"],
  },
  caution: {
    label: "Patrolled — caution advised",
    short: "Swim with caution",
    ring: "ring-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    flagColors: ["bg-red-600", "bg-yellow-400"],
  },
  closed: {
    label: "Beach closed — no swimming",
    short: "Closed to swimmers",
    ring: "ring-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-600",
    flagColors: ["bg-red-600", "bg-red-600"],
  },
  unpatrolled: {
    label: "Unpatrolled — no lifeguards on duty",
    short: "No lifeguards",
    ring: "ring-slate-400",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    flagColors: ["bg-slate-300", "bg-slate-300"],
  },
};

function FlagIcon({ status, size = "md" }) {
  const cfg = FLAG_STATUS[status];
  const dims = size === "lg" ? "w-10 h-7" : "w-6 h-4";
  return (
    <div className={`flex rounded-sm overflow-hidden ring-1 ring-black/10 ${dims}`}>
      <div className={`w-1/2 h-full ${cfg.flagColors[0]}`} />
      <div className={`w-1/2 h-full ${cfg.flagColors[1]}`} />
    </div>
  );
}

/* ============================================================================
   SHARED UI PIECES
   ============================================================================ */

function StatusPill({ status }) {
  const cfg = FLAG_STATUS[status];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bg}`}>
      <FlagIcon status={status} />
      <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.short}</span>
    </div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div className="sticky top-0 z-20 bg-blue-900 text-white px-4 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 rounded-full active:bg-blue-800" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <span className="text-lg font-bold truncate">{title}</span>
      </div>
      {right}
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const items = [
    { id: "home", label: "Beaches", icon: MapPin },
    { id: "live", label: "Live", icon: Radio },
    { id: "language", label: "Language", icon: Languages },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-20 max-w-md mx-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${active ? "text-blue-800" : "text-slate-400"}`}
          >
            <Icon className={`w-6 h-6 ${active ? "fill-blue-100" : ""}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-xs ${active ? "font-bold" : "font-medium"}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SOSButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 max-w-md bg-red-600 text-white rounded-full w-16 h-16 shadow-lg shadow-red-900/30 flex flex-col items-center justify-center active:scale-95 transition-transform"
      aria-label="Emergency"
    >
      <ShieldAlert className="w-6 h-6" />
      <span className="text-[10px] font-bold leading-none mt-0.5">SOS</span>
    </button>
  );
}

/* ============================================================================
   HOME SCREEN — beach list, nearest first
   ============================================================================ */

function HomeScreen({ beaches, onSelectBeach, language }) {
  const sorted = [...beaches].sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = sorted[0];

  return (
    <div className="pb-24">
      <TopBar
        title="BeachSafe Live"
        right={
          <div className="flex items-center gap-1 bg-blue-800 rounded-full px-2.5 py-1 text-xs font-medium">
            <Languages className="w-3.5 h-3.5" />
            {LANGUAGES.find((l) => l.code === language)?.native}
          </div>
        }
      />

      {/* Map placeholder — FUTURE: real map SDK (Mapbox/Google Maps) with live pins */}
      <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden h-44 bg-gradient-to-b from-sky-300 to-blue-500">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.4) 8px, rgba(255,255,255,0.4) 9px)" }} />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-yellow-100/90" />
        {sorted.slice(0, 5).map((b, i) => (
          <div
            key={b.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${18 + i * 16}%`, top: `${30 + (i % 3) * 18}%` }}
          >
            <div className={`w-3 h-3 rounded-full ${FLAG_STATUS[b.flagStatus].dot} ring-2 ring-white shadow`} />
          </div>
        ))}
        <div className="absolute top-3 left-3 bg-white/90 rounded-full px-3 py-1 flex items-center gap-1 text-xs font-semibold text-blue-900">
          <Navigation className="w-3.5 h-3.5" /> Live map
        </div>
      </div>

      {/* Nearest beach highlight */}
      <div className="px-4 mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Nearest to you</p>
        <button
          onClick={() => onSelectBeach(nearest.id)}
          className="w-full text-left bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-100 flex items-center justify-between active:bg-slate-50"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 truncate">{nearest.name}</h2>
              <span className="text-xs text-slate-400 font-medium">{nearest.distanceKm} km</span>
            </div>
            <div className="mt-2"><StatusPill status={nearest.flagStatus} /></div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>
      </div>

      {/* Full list */}
      <div className="px-4 mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">All patrolled beaches</p>
        <div className="space-y-2">
          {sorted.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBeach(b.id)}
              className="w-full text-left bg-white rounded-xl p-3.5 shadow-sm ring-1 ring-slate-100 flex items-center justify-between active:bg-slate-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FlagIcon status={b.flagStatus} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.state} · {b.distanceKm} km away</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   BEACH DETAIL SCREEN
   ============================================================================ */

function BeachDetailScreen({ beach, onBack, onGoLive }) {
  const cfg = FLAG_STATUS[beach.flagStatus];
  return (
    <div className="pb-24">
      <TopBar title={beach.name} onBack={onBack} />

      <div className={`mx-4 mt-4 rounded-2xl p-5 ${cfg.bg} ring-1 ${cfg.ring}`}>
        <div className="flex items-center gap-3">
          <FlagIcon status={beach.flagStatus} size="lg" />
          <div>
            <p className={`font-bold text-lg ${cfg.text}`}>{cfg.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">Updated {beach.lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 ring-1 ring-slate-100">
          <Clock className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-slate-400">Patrol hours</p>
          <p className="font-semibold text-slate-800 text-sm">{beach.patrolHours}</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-slate-100">
          <Users className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-slate-400">Lifeguards on duty</p>
          <p className="font-semibold text-slate-800 text-sm">{beach.lifeguardsOnDuty}</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-slate-100">
          <Waves className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-slate-400">Wave height</p>
          <p className="font-semibold text-slate-800 text-sm">{beach.conditions.waveHeightM} m</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-slate-100">
          <Thermometer className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-slate-400">Water temp</p>
          <p className="font-semibold text-slate-800 text-sm">{beach.conditions.waterTempC}°C</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-slate-100">
          <Sun className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-slate-400">UV index</p>
          <p className="font-semibold text-slate-800 text-sm">{beach.conditions.uvIndex} (extreme)</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-slate-100">
          <Wind className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-slate-400">Wind</p>
          <p className="font-semibold text-slate-800 text-sm">{beach.conditions.windKmh} km/h {beach.conditions.windDir}</p>
        </div>
      </div>

      {beach.hazards.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Current hazards</p>
          <div className="bg-white rounded-xl ring-1 ring-slate-100 divide-y divide-slate-100">
            {beach.hazards.map((h, i) => (
              <div key={i} className="flex items-start gap-2 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">{h}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-5">
        <button
          onClick={onGoLive}
          className="w-full bg-blue-800 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:bg-blue-900"
        >
          <Megaphone className="w-5 h-5" /> Listen to live lifeguard updates
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   LIVE BROADCAST SCREEN
   ============================================================================ */

const LEVEL_STYLES = {
  danger: { bg: "bg-red-50", ring: "ring-red-200", text: "text-red-700", icon: AlertTriangle },
  warning: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700", icon: AlertTriangle },
  info: { bg: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700", icon: Info },
};

function LiveBroadcastScreen({ beach, messages, language, onBack }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pb-24">
      <TopBar
        title={beach ? `${beach.name} · Live` : "Live broadcast"}
        onBack={onBack}
        right={
          <div className="flex items-center gap-1.5 bg-red-600 rounded-full px-2.5 py-1 text-xs font-bold">
            <span className={`w-1.5 h-1.5 rounded-full bg-white ${pulse ? "opacity-100" : "opacity-30"}`} />
            LIVE
          </div>
        }
      />

      <div className="px-4 mt-4">
        <div className="bg-blue-900 text-white rounded-xl p-3.5 flex items-center gap-3">
          <Volume2 className="w-5 h-5 shrink-0" />
          <p className="text-sm leading-snug">
            Announcements from the lifeguard tower appear here in real time, translated into{" "}
            <span className="font-semibold">{LANGUAGES.find((l) => l.code === language)?.label}</span>.
          </p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {messages.map((m) => {
          const style = LEVEL_STYLES[m.level];
          const Icon = style.icon;
          const { text, isFallback } = translate(m.text, language);
          return (
            <div key={m.id} className={`rounded-xl p-3.5 ring-1 ${style.bg} ${style.ring}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase ${style.text}`}>
                  <Icon className="w-3.5 h-3.5" /> {m.level}
                </div>
                <span className="text-xs text-slate-400">{m.time}</span>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">{text}</p>
              {isFallback && (
                <p className="text-xs text-slate-400 mt-1.5 italic">
                  Translation unavailable right now — showing original English text.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   LANGUAGE SCREEN
   ============================================================================ */

function LanguageScreen({ language, setLanguage }) {
  const sample = "Strong rip current forming at the southern flag. Please swim between the flags only.";
  const preview = translate(sample, language);

  return (
    <div className="pb-24">
      <TopBar title="Language" />
      <div className="px-4 mt-4">
        <p className="text-sm text-slate-500 mb-3">
          Choose your language. All lifeguard alerts and live broadcasts will be translated instantly.
        </p>

        <div className="bg-white rounded-xl ring-1 ring-slate-100 p-3.5 mb-4">
          <p className="text-xs font-bold uppercase text-slate-400 mb-1.5">Preview</p>
          <p className="text-sm text-slate-800">{preview.text}</p>
          {preview.isFallback && (
            <p className="text-xs text-slate-400 mt-1.5 italic">Showing original English — translation not yet available for this phrase.</p>
          )}
        </div>

        <div className="space-y-2">
          {LANGUAGES.map((l) => {
            const active = language === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`w-full flex items-center justify-between rounded-xl p-3.5 ring-1 ${
                  active ? "bg-blue-50 ring-blue-300" : "bg-white ring-slate-100"
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold text-slate-800">{l.native}</p>
                  <p className="text-xs text-slate-400">{l.label}</p>
                </div>
                {active ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   EMERGENCY SCREEN
   ============================================================================ */

function EmergencyScreen({ beach, onBack }) {
  const [alerted, setAlerted] = useState(false);
  return (
    <div className="pb-10 bg-red-600 min-h-screen text-white">
      <TopBar title="Emergency" onBack={onBack} right={null} />
      <div className="px-4 mt-4">
        <div className="bg-white/10 rounded-2xl p-4 mb-5">
          <p className="text-sm text-red-50">
            If someone is in immediate danger in the water, call 000 now. Australia's emergency number
            works for police, fire, and ambulance.
          </p>
        </div>

        <a
          href="tel:000"
          className="w-full flex items-center justify-center gap-3 bg-white text-red-700 rounded-2xl py-5 font-extrabold text-2xl shadow-lg mb-3"
        >
          <Phone className="w-7 h-7" /> Call 000
        </a>

        <button
          onClick={() => setAlerted(true)}
          disabled={alerted}
          className="w-full flex items-center justify-center gap-2 bg-red-800 rounded-2xl py-4 font-bold text-lg disabled:opacity-70"
        >
          <Megaphone className="w-5 h-5" />
          {alerted ? "Nearest tower alerted" : "Alert nearest lifeguard tower"}
        </button>
        {alerted && (
          <p className="text-center text-sm text-red-50 mt-2">
            {/* FUTURE: real push to patrol tower device */}
            A lifeguard has been notified of your location at {beach ? beach.name : "your beach"}.
          </p>
        )}

        <div className="bg-white/10 rounded-2xl p-4 mt-6">
          <p className="text-xs uppercase font-bold text-red-100 mb-1">Your location</p>
          <p className="font-semibold">{beach ? beach.name : "Location unavailable"}</p>
          {/* FUTURE: live GPS coordinates shared automatically with 000 / lifeguards */}
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase font-bold text-red-100 mb-2">While you wait</p>
          <ul className="space-y-2 text-sm text-red-50">
            <li>• Keep the person in sight at all times.</li>
            <li>• Do not enter the water yourself unless trained.</li>
            <li>• Wave both arms above your head to signal a lifeguard.</li>
            <li>• Send someone to the nearest red-and-yellow flag tower.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ROOT APP
   ============================================================================ */

export default function TouristApp() {
  const [screen, setScreen] = useState("home"); // home | detail | live | language | emergency
  const [previousScreen, setPreviousScreen] = useState("home");
  const [selectedBeachId, setSelectedBeachId] = useState(null);
  const [language, setLanguage] = useState("en");

  const selectedBeach = BEACHES.find((b) => b.id === selectedBeachId) || null;

  function goTo(next, opts = {}) {
    setPreviousScreen(screen);
    setScreen(next);
    if (opts.beachId) setSelectedBeachId(opts.beachId);
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 font-sans relative">
      {screen === "home" && (
        <HomeScreen
          beaches={BEACHES}
          language={language}
          onSelectBeach={(id) => goTo("detail", { beachId: id })}
        />
      )}

      {screen === "detail" && selectedBeach && (
        <BeachDetailScreen
          beach={selectedBeach}
          onBack={() => goTo("home")}
          onGoLive={() => goTo("live")}
        />
      )}

      {screen === "live" && (
        <LiveBroadcastScreen
          beach={selectedBeach}
          messages={LIVE_MESSAGES}
          language={language}
          onBack={() => goTo(previousScreen === "live" ? "home" : previousScreen)}
        />
      )}

      {screen === "language" && (
        <LanguageScreen language={language} setLanguage={setLanguage} />
      )}

      {screen === "emergency" && (
        <EmergencyScreen beach={selectedBeach} onBack={() => goTo(previousScreen === "emergency" ? "home" : previousScreen)} />
      )}

      {screen !== "emergency" && (
        <>
          <SOSButton onClick={() => goTo("emergency")} />
          <BottomNav screen={screen === "detail" ? "home" : screen} setScreen={goTo} />
        </>
      )}
    </div>
  );
}
