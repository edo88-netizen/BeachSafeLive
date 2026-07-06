import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin, Waves, Radio, Languages, AlertTriangle, Phone, ChevronLeft,
  Wind, Thermometer, Sun, Clock, Megaphone, ShieldAlert, CheckCircle2,
  Circle, ChevronRight, Volume2, Navigation, Users, Info, Bell, BellRing, BellOff, X,
  Maximize2, User,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { useBeachData } from "../store/BeachDataContext";
import { FLAG_STATUS, PRESETS, SEVERITY, translateAlert, fmtTime, calculateDistanceKm } from "../store/beachData";
import { useGeolocation } from "../hooks/useGeolocation";
import BeachMap from "../components/BeachMap"; // also loads leaflet's CSS as a side effect
import FlagIcon from "../components/FlagIcon";
import { t, LANGUAGE_NAMES } from "../i18n/i18n";

/* ============================================================================
   This app now reads live data from BeachDataContext (shared with AdminApp)
   instead of its own local mock copy. Anything a lifesaver publishes in the
   admin composer appears here automatically — same state tree, no refresh.

   TRANSLATION: every user-facing string in this file goes through t(language,
   key). Beach names are intentionally never translated (they're proper
   nouns, same as "Paris" stays "Paris" in every language). The 3D beach view
   that used to live here has been removed per feedback that it felt basic
   and confusing — worth revisiting later with a clearer interaction model.
   ============================================================================ */

function withLiveDistance(beaches, geo) {
  return beaches.map((b) => {
    if (geo.status === "granted" && geo.coords) {
      return { ...b, liveDistanceKm: calculateDistanceKm(geo.coords.lat, geo.coords.lng, b.lat, b.lng), isLive: true };
    }
    return { ...b, liveDistanceKm: b.distanceKm, isLive: false };
  });
}

const FLAG_HEX = { patrolled: "#0d9488", caution: "#f59e0b", closed: "#dc2626", unpatrolled: "#a8a29e" };

function overviewDivIcon(status) {
  const color = FLAG_HEX[status] || FLAG_HEX.unpatrolled;
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function OverviewMap({ beaches, onSelectBeach }) {
  const positions = beaches.map((b) => [b.lat, b.lng]);
  return (
    <MapContainer bounds={positions} boundsOptions={{ padding: [30, 30] }} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />
      {beaches.map((b) => (
        <Marker key={b.id} position={[b.lat, b.lng]} icon={overviewDivIcon(b.flagStatus)} eventHandlers={{ click: () => onSelectBeach(b.id) }} />
      ))}
    </MapContainer>
  );
}

function StatusPill({ status, language }) {
  const cfg = FLAG_STATUS[status];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bg}`}>
      <FlagIcon status={status} />
      <span className={`text-sm font-semibold ${cfg.text}`}>{t(language, `flag_${status}_short`)}</span>
    </div>
  );
}

function TopBar({ title, onBack, right, language, onOpenLanguage, hideLanguageChip = false }) {
  return (
    <div className="sticky top-0 z-20 bg-blue-950 text-white px-4 py-4 flex items-center justify-between shadow-lg shadow-blue-950/20">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 rounded-full active:bg-blue-900" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <span className="font-display text-lg font-bold tracking-tight truncate">{title}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {right}
        {!hideLanguageChip && onOpenLanguage && (
          <button
            onClick={onOpenLanguage}
            className="flex items-center gap-1 bg-blue-800 rounded-full px-2.5 py-1 text-xs font-medium active:bg-blue-700"
            aria-label="Change language"
          >
            <Languages className="w-3.5 h-3.5" />
            {LANGUAGE_NAMES[language]?.native}
          </button>
        )}
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen, language }) {
  const items = [
    { id: "home", label: t(language, "nav_beaches"), icon: MapPin },
    { id: "live", label: t(language, "nav_live"), icon: Radio },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-20 max-w-md mx-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${active ? "text-blue-800" : "text-stone-400"}`}
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

function LocationBanner({ geo, language }) {
  if (geo.status === "granted") {
    return (
      <div className="mx-4 mt-4 flex items-center gap-2 bg-teal-50 text-teal-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
        <Navigation className="w-4 h-4 shrink-0" />
        {t(language, "loc_granted")}
      </div>
    );
  }
  if (geo.status === "loading" || geo.status === "idle") {
    return (
      <div className="mx-4 mt-4 flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
        <Navigation className="w-4 h-4 shrink-0 animate-pulse" />
        {t(language, "loc_loading")}
      </div>
    );
  }
  const message = geo.status === "unavailable" ? t(language, "loc_unavailable") : t(language, "loc_denied");
  return (
    <div className="mx-4 mt-4 flex items-center justify-between gap-2 bg-amber-50 text-amber-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
      <div className="flex items-center gap-2 min-w-0">
        <Navigation className="w-4 h-4 shrink-0" />
        <span>{message} {t(language, "loc_estimatedSuffix")}</span>
      </div>
      {geo.status !== "unavailable" && (
        <button onClick={geo.retry} className="shrink-0 underline font-bold">{t(language, "loc_retry")}</button>
      )}
    </div>
  );
}

const NEARBY_RADIUS_KM = 10;

function HomeScreen({ beaches, onSelectBeach, language, geo, onOpenNotifications, onOpenLanguage, notifyEnabled }) {
  const [showAllNationwide, setShowAllNationwide] = useState(false);
  const beachesWithDistance = withLiveDistance(beaches, geo);
  const sorted = [...beachesWithDistance].sort((a, b) => a.liveDistanceKm - b.liveDistanceKm);
  const nearest = sorted[0];

  const hasRealLocation = geo.status === "granted";
  const nearby = hasRealLocation ? sorted.filter((b) => b.liveDistanceKm <= NEARBY_RADIUS_KM) : [];
  const fallbackNearby = sorted.slice(0, 5);

  return (
    <div className="pb-24">
      <TopBar
        title="BeachSafe Live"
        language={language}
        onOpenLanguage={onOpenLanguage}
        right={
          <button
            onClick={onOpenNotifications}
            className="relative flex items-center justify-center bg-blue-800 rounded-full w-8 h-8 active:bg-blue-700"
            aria-label="Notification settings"
          >
            {notifyEnabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {notifyEnabled && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-blue-900" />}
          </button>
        }
      />

      <LocationBanner geo={geo} language={language} />

      <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden h-44 ring-1 ring-stone-200">
        <OverviewMap beaches={sorted} onSelectBeach={onSelectBeach} />
        <div className="absolute top-3 left-3 bg-white/90 rounded-full px-3 py-1 flex items-center gap-1 text-xs font-semibold text-blue-900 pointer-events-none z-[1000]">
          <Navigation className="w-3.5 h-3.5" /> {t(language, "home_liveMap")}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">{t(language, "home_nearestToYou")}</p>
        <button
          onClick={() => onSelectBeach(nearest.id)}
          className="w-full text-left bg-white rounded-2xl p-4 shadow-sm ring-1 ring-stone-100 flex items-center justify-between active:bg-stone-50"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold tracking-tight text-stone-800 truncate">{nearest.name}</h2>
              <span className="font-data text-xs text-stone-400 font-medium">
                {nearest.isLive ? "" : "~"}{nearest.liveDistanceKm.toFixed(1)} km
              </span>
            </div>
            <div className="mt-2"><StatusPill status={nearest.flagStatus} language={language} /></div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-300 shrink-0" />
        </button>
      </div>

      <div className="px-4 mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">
          {hasRealLocation ? t(language, "home_beachesWithinRadius", { n: NEARBY_RADIUS_KM }) : t(language, "home_closestEstimated")}
        </p>

        {hasRealLocation && nearby.length === 0 && (
          <div className="bg-white rounded-xl p-4 ring-1 ring-stone-100 text-sm text-stone-500 flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" /> {t(language, "home_noNearbyBeaches", { n: NEARBY_RADIUS_KM })}
          </div>
        )}

        <div className="space-y-2">
          {(hasRealLocation ? nearby : fallbackNearby).map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBeach(b.id)}
              className="w-full text-left bg-white rounded-xl p-3.5 shadow-sm ring-1 ring-stone-100 flex items-center justify-between active:bg-stone-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FlagIcon status={b.flagStatus} />
                <div className="min-w-0">
                  <p className="font-semibold text-stone-800 truncate">{b.name}</p>
                  <p className="font-data text-xs text-stone-400">{b.state} · {b.isLive ? "" : "~"}{b.liveDistanceKm.toFixed(1)} km {t(language, "home_away")}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <button
          onClick={() => setShowAllNationwide((v) => !v)}
          className="w-full flex items-center justify-between bg-white rounded-xl p-3.5 ring-1 ring-stone-100 text-sm font-bold text-blue-800"
        >
          <span>{showAllNationwide ? t(language, "home_hide") : t(language, "home_showAllNationwide", { n: sorted.length })}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showAllNationwide ? "rotate-90" : ""}`} />
        </button>

        {showAllNationwide && (
          <div className="space-y-2 mt-2">
            {sorted.map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectBeach(b.id)}
                className="w-full text-left bg-white rounded-xl p-3.5 shadow-sm ring-1 ring-stone-100 flex items-center justify-between active:bg-stone-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FlagIcon status={b.flagStatus} />
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 truncate">{b.name}</p>
                    <p className="font-data text-xs text-stone-400">{b.state} · {b.isLive ? "" : "~"}{b.liveDistanceKm.toFixed(1)} km {t(language, "home_away")}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Beach detail ---- */

function BeachDetailScreen({ beach, onBack, onGoLive, userLocation, language, onOpenLanguage }) {
  const cfg = FLAG_STATUS[beach.flagStatus];
  const mapFeatures = beach.mapFeatures || { swimZone: null, closedZones: [], hazardMarkers: [] };
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="pb-24">
      <TopBar title={beach.name} onBack={onBack} language={language} onOpenLanguage={onOpenLanguage} />

      <div className={`mx-4 mt-4 rounded-2xl p-5 ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <FlagIcon status={beach.flagStatus} size="lg" />
          <div>
            <p className={`font-bold text-lg ${cfg.text}`}>{t(language, `flag_${beach.flagStatus}_label`)} {beach.adminManaged ? "" : t(language, "detail_unpatrolledSuffix")}</p>
            <p className="text-xs text-stone-500 mt-0.5">{t(language, "detail_updated", { time: beach.lastUpdated })}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">{t(language, "detail_beachMap")}</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-stone-200" style={{ height: 380 }}>
          <BeachMap beach={beach} userLocation={userLocation} className="w-full h-full" zoom={17} language={language} />
          <button
            onClick={() => setFullscreen(true)}
            className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/95 text-stone-700 rounded-full px-3 py-1.5 text-xs font-bold shadow"
          >
            <Maximize2 className="w-3.5 h-3.5" /> {t(language, "detail_expand")}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 px-1">
          {mapFeatures.swimZone && (
            <span className="flex items-center gap-1.5 text-xs text-stone-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" /> {t(language, "detail_safeSwimZone")}</span>
          )}
          {mapFeatures.closedZones.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-stone-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" /> {t(language, "detail_closedArea")}</span>
          )}
          {mapFeatures.hazardMarkers.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-stone-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> {t(language, "detail_tapPinHazard")}</span>
          )}
          {userLocation && (
            <span className="flex items-center gap-1.5 text-xs text-stone-500"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> {t(language, "detail_you")}</span>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 ring-1 ring-stone-100">
          <Clock className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-stone-400">{t(language, "detail_patrolHours")}</p>
          <p className="font-semibold text-stone-800 text-sm">{beach.patrolHours}</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-stone-100">
          <Users className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-stone-400">{t(language, "detail_lifeguardsOnDuty")}</p>
          <p className="font-data font-semibold text-stone-800 text-sm">{beach.lifeguardsOnDuty}</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-stone-100">
          <Waves className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-stone-400">{t(language, "detail_waveHeight")}</p>
          <p className="font-data font-semibold text-stone-800 text-sm">{beach.conditions.waveHeightM} m</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-stone-100">
          <Thermometer className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-stone-400">{t(language, "detail_waterTemp")}</p>
          <p className="font-data font-semibold text-stone-800 text-sm">{beach.conditions.waterTempC}°C</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-stone-100">
          <Sun className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-stone-400">{t(language, "detail_uvIndex")}</p>
          <p className="font-data font-semibold text-stone-800 text-sm">{beach.conditions.uvIndex} {t(language, "detail_uvExtreme")}</p>
        </div>
        <div className="bg-white rounded-xl p-3 ring-1 ring-stone-100">
          <Wind className="w-4 h-4 text-blue-800 mb-1" />
          <p className="text-xs text-stone-400">{t(language, "detail_wind")}</p>
          <p className="font-data font-semibold text-stone-800 text-sm">{beach.conditions.windKmh} km/h {beach.conditions.windDir}</p>
        </div>
      </div>

      {beach.hazards.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">{t(language, "detail_knownHazards")}</p>
          <div className="bg-white rounded-xl ring-1 ring-stone-100 divide-y divide-stone-100">
            {beach.hazards.map((h, i) => (
              <div key={i} className="flex items-start gap-2 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-700">{h}</p>
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
          <Megaphone className="w-5 h-5" /> {t(language, "detail_liveLifeguardAlerts")}
        </button>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[2000] bg-black">
          <BeachMap beach={beach} userLocation={userLocation} className="w-full h-full" zoom={17} language={language} />
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-[2001] flex items-center gap-1.5 bg-white text-stone-800 rounded-full px-3 py-2 text-sm font-bold shadow-lg"
          >
            <X className="w-4 h-4" /> {t(language, "detail_close")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- Live broadcast — now driven by real published alerts ---- */

const LEVEL_STYLES = {
  danger: { bg: "bg-red-50", ring: "ring-red-200", text: "text-red-700", icon: AlertTriangle },
  closure: { bg: "bg-stone-100", ring: "ring-stone-300", text: "text-stone-800", icon: AlertTriangle },
  caution: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700", icon: AlertTriangle },
  info: { bg: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700", icon: Info },
};

function LiveBroadcastScreen({ beach, alerts, transcripts, isLive, liveStartedAt, language, onBack, onOpenLanguage }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setPulse((p) => !p), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveLabel = t(language, "nav_live");
  const title = beach ? `${beach.name} · ${liveLabel}` : liveLabel;

  return (
    <div className="pb-24">
      <TopBar
        title={title}
        onBack={onBack}
        language={language}
        onOpenLanguage={onOpenLanguage}
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
              ? t(language, "live_broadcastingSince", { time: fmtTime(liveStartedAt), lang: LANGUAGE_NAMES[language]?.label })
              : t(language, "live_noLiveNote", { lang: LANGUAGE_NAMES[language]?.label })}
          </p>
        </div>
      </div>

      {isLive && transcripts.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-600" /> {t(language, "live_voiceAnnouncement")}
          </p>
          <div className="space-y-2.5">
            {transcripts.map((tItem) => {
              const translated = language === "en" ? tItem.textEn : tItem.translations[language];
              return (
                <div key={tItem.id} className="rounded-xl p-3.5 bg-red-50 ring-1 ring-red-200">
                  <p className="text-stone-800 text-base leading-relaxed font-semibold">
                    {translated || <span className="italic text-stone-400 font-normal">{t(language, "live_translating")}</span>}
                  </p>
                  {language !== "en" && (
                    <div className="mt-2 pt-2 border-t border-red-200/70">
                      <p className="text-xs font-bold uppercase text-stone-400 mb-0.5">{t(language, "live_english")}</p>
                      <p className="text-sm text-stone-600">{tItem.textEn}</p>
                    </div>
                  )}
                  <p className="font-data text-xs text-stone-400 mt-1.5">{fmtTime(tItem.at)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 mt-4 space-y-3">
        {alerts.length === 0 && (
          <div className="flex items-center gap-2 text-stone-400 text-sm py-6 justify-center">
            <MapPin className="w-4 h-4" /> {t(language, "live_noActiveAlerts")}
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
                  <Icon className="w-3.5 h-3.5" /> {t(language, `severity_${a.severity}`)}
                </div>
                <span className="font-data text-xs text-stone-400">{fmtTime(a.createdAt)}</span>
              </div>
              <p className="text-stone-800 text-sm leading-relaxed">{text}</p>
              {isFallback && (
                <p className="text-xs text-stone-400 mt-1.5 italic">
                  {t(language, "live_translationUnavailable")}
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
      <TopBar title={t(language, "nav_language")} />
      <div className="px-4 mt-4">
        <p className="text-sm text-stone-500 mb-3">
          {t(language, "lang_chooseLanguage")}
        </p>

        <div className="bg-white rounded-xl ring-1 ring-stone-100 p-3.5 mb-4">
          <p className="text-xs font-bold uppercase text-stone-400 mb-1.5">{t(language, "lang_preview")}</p>
          <p className="text-sm text-stone-800">{preview.text}</p>
          {preview.isFallback && (
            <p className="text-xs text-stone-400 mt-1.5 italic">{t(language, "lang_showingOriginalNote")}</p>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(LANGUAGE_NAMES).map(([code, names]) => {
            const active = language === code;
            return (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`w-full flex items-center justify-between rounded-xl p-3.5 ring-1 ${
                  active ? "bg-blue-50 ring-blue-300" : "bg-white ring-stone-100"
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold text-stone-800">{names.native}</p>
                  <p className="text-xs text-stone-400">{names.label}</p>
                </div>
                {active ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-200" />
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

function EmergencyScreen({ beach, onBack, language }) {
  const [alerted, setAlerted] = useState(false);
  return (
    <div className="pb-10 bg-red-600 min-h-screen text-white">
      <TopBar title={t(language, "emergency_title")} onBack={onBack} right={null} hideLanguageChip />
      <div className="px-4 mt-4">
        <div className="bg-white/10 rounded-2xl p-4 mb-5">
          <p className="text-sm text-red-50">
            {t(language, "emergency_ifDanger")}
          </p>
        </div>

        <a
          href="tel:000"
          className="w-full flex items-center justify-center gap-3 bg-white text-red-700 rounded-2xl py-5 font-extrabold text-2xl shadow-lg mb-3"
        >
          <Phone className="w-7 h-7" /> {t(language, "emergency_call000")}
        </a>

        <button
          onClick={() => setAlerted(true)}
          disabled={alerted}
          className="w-full flex items-center justify-center gap-2 bg-red-800 rounded-2xl py-4 font-bold text-lg disabled:opacity-70"
        >
          <Megaphone className="w-5 h-5" />
          {alerted ? t(language, "emergency_towerAlerted") : t(language, "emergency_alertTower")}
        </button>
        {alerted && (
          <p className="text-center text-sm text-red-50 mt-2">
            {t(language, "emergency_notified", { beach: beach ? beach.name : t(language, "emergency_yourBeachFallback") })}
          </p>
        )}

        <div className="bg-white/10 rounded-2xl p-4 mt-6">
          <p className="text-xs uppercase font-bold text-red-100 mb-1">{t(language, "emergency_yourLocation")}</p>
          <p className="font-semibold">{beach ? beach.name : t(language, "emergency_locationUnavailable")}</p>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase font-bold text-red-100 mb-2">{t(language, "emergency_whileYouWait")}</p>
          <ul className="space-y-2 text-sm text-red-50">
            <li>• {t(language, "emergency_bullet1")}</li>
            <li>• {t(language, "emergency_bullet2")}</li>
            <li>• {t(language, "emergency_bullet3")}</li>
            <li>• {t(language, "emergency_bullet4")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---- Tourist profile — deliberately lightweight: name only, no password.
   Tourists have nothing sensitive to protect, so this is personalization,
   not security. Stored in localStorage only (this device, this browser).
   Shown before any language selection happens, so it stays in English by
   design — same default-English-until-you-pick pattern used elsewhere. ---- */

const PROFILE_KEY = "beachsafe-tourist-profile";

function loadTouristProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function WelcomeScreen({ existing, onSubmit }) {
  const [name, setName] = useState(existing?.name || "");
  const [country, setCountry] = useState(existing?.country || "");

  function submit(profile) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* non-fatal */ }
    onSubmit(profile);
  }

  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 text-white mb-2">
        <User className="w-7 h-7" />
        <span className="font-display text-2xl font-extrabold tracking-tight">Welcome to BeachSafe</span>
      </div>
      <p className="text-blue-200 text-sm mb-8 text-center max-w-xs">
        Tell us your name so we can personalize your alerts — no password needed, this stays on your device.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl px-4 py-3 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Home country (optional)"
          className="w-full rounded-xl px-4 py-3 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => submit({ name: name.trim() || "Guest", country: country.trim(), isGuest: false })}
          disabled={!name.trim()}
          className="w-full bg-white text-blue-900 rounded-xl py-3 font-bold disabled:opacity-40"
        >
          Continue
        </button>
        <button
          onClick={() => submit({ name: "Guest", country: "", isGuest: true })}
          className="w-full text-blue-200 text-sm font-semibold py-2"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

function NotificationsScreen({ beaches, notifyEnabled, onToggle, notifyTarget, setNotifyTarget, permission, onTest, onBack, profile, onEditProfile, language, onOpenLanguage }) {
  const supported = permission !== "unsupported";
  return (
    <div className="pb-24">
      <TopBar title={t(language, "settings_title")} onBack={onBack} language={language} onOpenLanguage={onOpenLanguage} />
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 ring-1 ring-stone-100 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-stone-800">{profile?.isGuest ? t(language, "settings_guest") : profile?.name || t(language, "settings_guest")}</p>
              <p className="text-xs text-stone-400">{profile?.country ? t(language, "settings_fromCountry", { country: profile.country }) : t(language, "settings_noProfile")}</p>
            </div>
          </div>
          <button onClick={onEditProfile} className="text-xs font-bold text-blue-700 bg-blue-50 rounded-full px-3 py-1.5">
            {t(language, "settings_edit")}
          </button>
        </div>

        {!supported && (
          <div className="bg-stone-100 text-stone-500 rounded-xl p-3.5 text-sm mb-4">
            {t(language, "settings_pushNotSupported")}
          </div>
        )}
        {supported && permission === "denied" && (
          <div className="bg-amber-50 text-amber-800 rounded-xl p-3.5 text-sm mb-4">
            {t(language, "settings_blocked")}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 ring-1 ring-stone-100 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notifyEnabled ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-400"}`}>
              {notifyEnabled ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-stone-800">{t(language, "settings_pushAlerts")}</p>
              <p className="text-xs text-stone-400">{t(language, "settings_pushAlertsDesc")}</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${notifyEnabled ? "bg-blue-700 justify-end" : "bg-stone-200 justify-start"}`}
            aria-label="Toggle push alerts"
          >
            <span className="w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </div>

        {notifyEnabled && (
          <div className="bg-white rounded-2xl p-4 ring-1 ring-stone-100 mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">{t(language, "settings_notifyAbout")}</p>
            <div className="space-y-2">
              <button
                onClick={() => setNotifyTarget("nearest")}
                className={`w-full flex items-center justify-between rounded-xl p-3 text-left ${notifyTarget === "nearest" ? "bg-blue-50 ring-1 ring-blue-300" : "bg-stone-50"}`}
              >
                <span className="text-sm font-semibold text-stone-800">{t(language, "settings_nearestOnly")}</span>
                {notifyTarget === "nearest" && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
              </button>
              <button
                onClick={() => setNotifyTarget("all")}
                className={`w-full flex items-center justify-between rounded-xl p-3 text-left ${notifyTarget === "all" ? "bg-blue-50 ring-1 ring-blue-300" : "bg-stone-50"}`}
              >
                <span className="text-sm font-semibold text-stone-800">{t(language, "settings_allBeaches")}</span>
                {notifyTarget === "all" && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
              </button>
              {beaches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setNotifyTarget(b.id)}
                  className={`w-full flex items-center justify-between rounded-xl p-3 text-left ${notifyTarget === b.id ? "bg-blue-50 ring-1 ring-blue-300" : "bg-stone-50"}`}
                >
                  <span className="text-sm font-semibold text-stone-800">{t(language, "settings_beachOnly", { beach: b.name })}</span>
                  {notifyTarget === b.id && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {notifyEnabled && (
          <button
            onClick={onTest}
            className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-700 rounded-xl py-3 font-bold text-sm"
          >
            <Bell className="w-4 h-4" /> {t(language, "settings_sendTest")}
          </button>
        )}
      </div>
    </div>
  );
}

function AlertToast({ toast, onDismiss }) {
  if (!toast) return null;
  const sv = SEVERITY[toast.severity] || SEVERITY.info;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className={`rounded-2xl shadow-lg p-3.5 flex items-start gap-3 text-white ${sv.bg}`}>
        <BellRing className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase opacity-90">{toast.title}</p>
          <p className="text-sm leading-snug mt-0.5">{toast.body}</p>
        </div>
        <button onClick={onDismiss} className="shrink-0 opacity-80 active:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ---- Root ---- */

export default function TouristApp() {
  const { beaches, alerts, liveByBeach, activeAlertsForBeach, liveTranscriptsForBeach } = useBeachData();
  const geo = useGeolocation();
  const [profile, setProfile] = useState(loadTouristProfile);
  const [screen, setScreen] = useState(() => (loadTouristProfile() ? "home" : "welcome"));
  const [previousScreen, setPreviousScreen] = useState("home");
  const [selectedBeachId, setSelectedBeachId] = useState(null);
  const [language, setLanguage] = useState("en");

  // ---- Push notifications ----
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState("nearest"); // "nearest" | "all" | beachId
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [toast, setToast] = useState(null);
  const seenAlertIds = useRef(null); // null until seeded, so we never notify for pre-existing alerts

  const sortedByDistance = useMemo(
    () => [...withLiveDistance(beaches, geo)].sort((a, b) => a.liveDistanceKm - b.liveDistanceKm),
    [beaches, geo.status, geo.coords]
  );
  const nearestBeachId = sortedByDistance[0]?.id;

  // Fires both the OS notification and the guaranteed-visible in-app toast,
  // translated into the tourist's selected language — this is the fix for
  // "I can't see the translation" on live/push alerts.
  function fireAlert(beach, alert) {
    const { text: translatedText } = translateAlert(alert, language);
    const severityLabel = t(language, `severity_${alert.severity}`);
    const beachName = beach ? beach.name : t(language, "toast_beachFallback");
    const title = t(language, "toast_alertTitle", { severity: severityLabel, beach: beachName });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body: translatedText }); } catch { /* some browsers restrict this outside a service worker */ }
    }
    setToast({ id: alert.id, title, body: translatedText, severity: alert.severity });
    setTimeout(() => setToast((cur) => (cur && cur.id === alert.id ? null : cur)), 6000);
  }

  function handleToggleNotify() {
    if (!notifyEnabled) {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((p) => setPermission(p));
      }
      setNotifyEnabled(true);
    } else {
      setNotifyEnabled(false);
    }
  }

  function handleTestAlert() {
    const targetId = notifyTarget === "nearest" ? nearestBeachId : notifyTarget === "all" ? nearestBeachId : notifyTarget;
    const beach = beaches.find((b) => b.id === targetId);
    fireAlert(beach, { id: `test-${Date.now()}`, severity: "caution", text: t(language, "settings_testAlertBody") });
  }

  useEffect(() => {
    if (seenAlertIds.current === null) {
      seenAlertIds.current = new Set(alerts.map((a) => a.id));
    }
  }, [alerts]);

  useEffect(() => {
    if (!notifyEnabled || seenAlertIds.current === null) return;
    const targetId = notifyTarget === "nearest" ? nearestBeachId : notifyTarget === "all" ? null : notifyTarget;
    alerts.forEach((a) => {
      if (seenAlertIds.current.has(a.id) || a.resolved) return;
      seenAlertIds.current.add(a.id);
      if (targetId !== null && a.beachId !== targetId) return;
      fireAlert(beaches.find((b) => b.id === a.beachId), a);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, notifyEnabled, notifyTarget, nearestBeachId, beaches, language]);

  const selectedBeach = beaches.find((b) => b.id === selectedBeachId) || null;

  function goTo(next, opts = {}) {
    setPreviousScreen(screen);
    setScreen(next);
    if (opts.beachId) setSelectedBeachId(opts.beachId);
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-sand-50 font-sans relative">
      {screen === "welcome" && (
        <WelcomeScreen existing={profile} onSubmit={(p) => { setProfile(p); goTo("home"); }} />
      )}

      {screen !== "welcome" && <AlertToast toast={toast} onDismiss={() => setToast(null)} />}

      {screen === "home" && (
        <HomeScreen
          beaches={beaches}
          language={language}
          geo={geo}
          notifyEnabled={notifyEnabled}
          onOpenNotifications={() => goTo("notifications")}
          onOpenLanguage={() => goTo("language")}
          onSelectBeach={(id) => goTo("detail", { beachId: id })}
        />
      )}

      {screen === "notifications" && (
        <NotificationsScreen
          beaches={beaches}
          notifyEnabled={notifyEnabled}
          onToggle={handleToggleNotify}
          notifyTarget={notifyTarget}
          setNotifyTarget={setNotifyTarget}
          permission={permission}
          onTest={handleTestAlert}
          profile={profile}
          onEditProfile={() => goTo("welcome")}
          language={language}
          onOpenLanguage={() => goTo("language")}
          onBack={() => goTo(previousScreen === "notifications" ? "home" : previousScreen)}
        />
      )}

      {screen === "detail" && selectedBeach && (
        <BeachDetailScreen
          beach={selectedBeach}
          onBack={() => goTo("home")}
          onGoLive={() => goTo("live")}
          userLocation={geo.status === "granted" && geo.coords ? geo.coords : null}
          language={language}
          onOpenLanguage={() => goTo("language")}
        />
      )}

      {screen === "live" && (
        <LiveBroadcastScreen
          beach={selectedBeach}
          alerts={selectedBeach ? activeAlertsForBeach(selectedBeach.id) : []}
          transcripts={selectedBeach ? liveTranscriptsForBeach(selectedBeach.id) : []}
          isLive={!!(selectedBeach && liveByBeach[selectedBeach.id]?.isLive)}
          liveStartedAt={selectedBeach ? liveByBeach[selectedBeach.id]?.startedAt : null}
          language={language}
          onOpenLanguage={() => goTo("language")}
          onBack={() => goTo(previousScreen === "live" ? "home" : previousScreen)}
        />
      )}

      {screen === "language" && (
        <LanguageScreen language={language} setLanguage={setLanguage} />
      )}

      {screen === "emergency" && (
        <EmergencyScreen beach={selectedBeach} language={language} onBack={() => goTo(previousScreen === "emergency" ? "home" : previousScreen)} />
      )}

      {screen !== "emergency" && screen !== "welcome" && (
        <>
          <SOSButton onClick={() => goTo("emergency")} />
          <BottomNav screen={["detail", "notifications"].includes(screen) ? "home" : screen} setScreen={goTo} language={language} />
        </>
      )}
    </div>
  );
}
