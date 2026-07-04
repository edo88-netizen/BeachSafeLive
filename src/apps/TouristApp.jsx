import React, { useState, useEffect } from "react";
import {
  MapPin, Waves, Radio, Languages, AlertTriangle, Phone, ChevronLeft,
  Wind, Thermometer, Sun, Clock, Megaphone, ShieldAlert, CheckCircle2,
  Circle, ChevronRight, Volume2, Navigation, Users, Info
} from "lucide-react";
import { useBeachData } from "../store/BeachDataContext";
import { FLAG_STATUS, LANGUAGES, PRESETS, SEVERITY, translateAlert, fmtTime, calculateDistanceKm } from "../store/beachData";
import { useGeolocation } from "../hooks/useGeolocation";

/* ============================================================================
   This app now reads live data from BeachDataContext (shared with AdminApp)
   instead of its own local mock copy. Anything a lifesaver publishes in the
   admin composer appears here automatically — same state tree, no refresh.
   ============================================================================ */

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

/* ---- Home ---- */

function LocationBanner({ geo }) {
  if (geo.status === "granted") {
    return (
      <div className="mx-4 mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
        <Navigation className="w-4 h-4 shrink-0" />
        Using your location — distances below are accurate.
      </div>
    );
  }
  if (geo.status === "loading" || geo.status === "idle") {
    return (
      <div className="mx-4 mt-4 flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
        <Navigation className="w-4 h-4 shrink-0 animate-pulse" />
        Finding your location...
      </div>
    );
  }
  const message =
    geo.status === "unavailable"
      ? "Location isn't supported on this device."
      : "Location access needed for accurate distances.";
  return (
    <div className="mx-4 mt-4 flex items-center justify-between gap-2 bg-amber-50 text-amber-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
      <div className="flex items-center gap-2 min-w-0">
        <Navigation className="w-4 h-4 shrink-0" />
        <span>{message} Showing estimated distances.</span>
      </div>
      {geo.status !== "unavailable" && (
        <button onClick={geo.retry} className="shrink-0 underline font-bold">Retry</button>
      )}
    </div>
  );
}

function HomeScreen({ beaches, onSelectBeach, language, geo }) {
  const beachesWithDistance = beaches.map((b) => {
    if (geo.status === "granted" && geo.coords) {
      return { ...b, liveDistanceKm: calculateDistanceKm(geo.coords.lat, geo.coords.lng, b.lat, b.lng), isLive: true };
    }
    return { ...b, liveDistanceKm: b.distanceKm, isLive: false };
  });
  const sorted = [...beachesWithDistance].sort((a, b) => a.liveDistanceKm - b.liveDistanceKm);
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

      <LocationBanner geo={geo} />

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

      <div className="px-4 mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Nearest to you</p>
        <button
          onClick={() => onSelectBeach(nearest.id)}
          className="w-full text-left bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-100 flex items-center justify-between active:bg-slate-50"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 truncate">{nearest.name}</h2>
              <span className="text-xs text-slate-400 font-medium">
                {nearest.isLive ? "" : "~"}{nearest.liveDistanceKm.toFixed(1)} km
              </span>
            </div>
            <div className="mt-2"><StatusPill status={nearest.flagStatus} /></div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>
      </div>

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
                  <p className="text-xs text-slate-400">{b.state} · {b.isLive ? "" : "~"}{b.liveDistanceKm.toFixed(1)} km away</p>
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

/* ---- Beach detail ---- */

function BeachDetailScreen({ beach, onBack, onGoLive }) {
  const cfg = FLAG_STATUS[beach.flagStatus];
  return (
    <div className="pb-24">
      <TopBar title={beach.name} onBack={onBack} />

      <div className={`mx-4 mt-4 rounded-2xl p-5 ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <FlagIcon status={beach.flagStatus} size="lg" />
          <div>
            <p className={`font-bold text-lg ${cfg.text}`}>{cfg.label} {beach.adminManaged ? "" : "(unpatrolled beach)"}</p>
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
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Known hazards</p>
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
          <Megaphone className="w-5 h-5" /> Live lifeguard alerts & broadcast
        </button>
      </div>
    </div>
  );
}

/* ---- Live broadcast — now driven by real published alerts ---- */

const LEVEL_STYLES = {
  danger: { bg: "bg-red-50", ring: "ring-red-200", text: "text-red-700", icon: AlertTriangle, label: "danger" },
  closure: { bg: "bg-slate-100", ring: "ring-slate-300", text: "text-slate-800", icon: AlertTriangle, label: "closure" },
  caution: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700", icon: AlertTriangle, label: "caution" },
  info: { bg: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700", icon: Info, label: "info" },
};

function LiveBroadcastScreen({ beach, alerts, isLive, liveStartedAt, language, onBack }) {
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
          isLive ? (
            <div className="flex items-center gap-1.5 bg-red-600 rounded-full px-2.5 py-1 text-xs font-bold">
              <span className={`w-1.5 h-1.5 rounded-full bg-white ${pulse ? "opacity-100" : "opacity-30"}`} />
              LIVE
            </div>
          ) : null
        }
      />

      <div className="px-4 mt-4">
        <div className="bg-blue-900 text-white rounded-xl p-3.5 flex items-center gap-3">
          <Volume2 className="w-5 h-5 shrink-0" />
          <p className="text-sm leading-snug">
            {isLive
              ? <>The lifeguard tower is broadcasting live now, started {fmtTime(liveStartedAt)}. Alerts below are translated into <span className="font-semibold">{LANGUAGES.find((l) => l.code === language)?.label}</span>.</>
              : <>No live broadcast right now. Alerts published by lifeguards still appear below, translated into <span className="font-semibold">{LANGUAGES.find((l) => l.code === language)?.label}</span>.</>}
          </p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {alerts.length === 0 && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
            <MapPin className="w-4 h-4" /> No active alerts for this beach right now.
          </div>
        )}
        {alerts.map((a) => {
          const style = LEVEL_STYLES[a.severity] || LEVEL_STYLES.info;
          const Icon = style.icon;
          const { text, isFallback } = translateAlert(a, language);
          return (
            <div key={a.id} className={`rounded-xl p-3.5 ring-1 ${style.bg} ${style.ring}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase ${style.text}`}>
                  <Icon className="w-3.5 h-3.5" /> {style.label}
                </div>
                <span className="text-xs text-slate-400">{fmtTime(a.createdAt)}</span>
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

/* ---- Language ---- */

function LanguageScreen({ language, setLanguage }) {
  const samplePreset = PRESETS.find((p) => p.key === "shark");
  const sampleAlert = { presetKey: samplePreset.key, text: samplePreset.text };
  const preview = translateAlert(sampleAlert, language);

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

/* ---- Emergency ---- */

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

/* ---- Root ---- */

export default function TouristApp() {
  const { beaches, liveByBeach, activeAlertsForBeach } = useBeachData();
  const geo = useGeolocation();
  const [screen, setScreen] = useState("home");
  const [previousScreen, setPreviousScreen] = useState("home");
  const [selectedBeachId, setSelectedBeachId] = useState(null);
  const [language, setLanguage] = useState("en");

  const selectedBeach = beaches.find((b) => b.id === selectedBeachId) || null;

  function goTo(next, opts = {}) {
    setPreviousScreen(screen);
    setScreen(next);
    if (opts.beachId) setSelectedBeachId(opts.beachId);
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 font-sans relative">
      {screen === "home" && (
        <HomeScreen
          beaches={beaches}
          language={language}
          geo={geo}
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
          alerts={selectedBeach ? activeAlertsForBeach(selectedBeach.id) : []}
          isLive={!!(selectedBeach && liveByBeach[selectedBeach.id]?.isLive)}
          liveStartedAt={selectedBeach ? liveByBeach[selectedBeach.id]?.startedAt : null}
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
