import React, { useState } from "react";
import {
  LogOut, Lock, ShieldCheck, Radio,
  Send, CheckCircle2, ChevronRight, ScrollText,
  Eye, Mic, MapPin, Languages, Delete, Megaphone, RotateCcw,
  Map, Trash2, Waves, Ban, Undo2, Flag, User,
} from "lucide-react";
import { useBeachData } from "../store/BeachDataContext";
import {
  PRESETS, SEVERITY, FLAG_STATUS, LANGUAGES, HAZARD_TYPES,
  translateAlert, fmtTime, fmtClock,
} from "../store/beachData";
import BeachMap from "../components/BeachMap";
import FlagIcon from "../components/FlagIcon";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { translateToAllLanguages } from "../i18n/liveTranslate";

/* ============================================================================
   AdminApp now reads/writes the SAME state as TouristApp via useBeachData().
   Publishing an alert here updates the shared alerts list and beach flag
   status immediately — the "Public View" tab and the actual tourist app
   both reflect it instantly, no refresh needed.
   ============================================================================ */

/* ---- Login ---- */

function LoginScreen({ users, onPicked, onSignUp }) {
  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 text-white mb-8">
        <ShieldCheck className="w-8 h-8" />
        <span className="font-display text-2xl font-extrabold tracking-tight">BeachSafe Admin</span>
      </div>
      <p className="text-blue-200 mb-6 text-sm">Tap your name to sign in</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => onPicked(u)}
            className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-blue-800 text-white flex items-center justify-center text-xl font-bold">
              {u.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <p className="font-bold text-stone-800 text-center leading-tight">{u.name}</p>
            <p className="text-xs text-stone-400">{u.role}</p>
            <p className="text-[11px] text-blue-700 font-semibold">{u.assignedBeachIds.length} beach{u.assignedBeachIds.length > 1 ? "es" : ""}</p>
          </button>
        ))}
      </div>
      <button onClick={onSignUp} className="mt-8 text-blue-200 text-sm font-semibold underline">
        New lifesaver? Create an account
      </button>
    </div>
  );
}

function SignUpScreen({ beaches, onSignUp, onCancel }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [role, setRole] = useState("Lifesaver");
  const [selectedBeaches, setSelectedBeaches] = useState([]);
  const [error, setError] = useState(null);

  function toggleBeach(id) {
    setSelectedBeaches((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function submit() {
    setError(null);
    if (pin !== confirmPin) {
      setError("PINs don't match.");
      return;
    }
    const result = onSignUp({ name, pin, role, assignedBeachIds: selectedBeaches });
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center p-6 overflow-y-auto">
      <div className="flex items-center gap-2 text-white mb-1 mt-6">
        <ShieldCheck className="w-7 h-7" />
        <span className="font-display text-xl font-extrabold tracking-tight">Create lifesaver account</span>
      </div>
      <p className="text-blue-200 text-sm mb-6 text-center max-w-sm">
        This is a demo account system — PINs are stored in this browser only, not securely hashed. Real deployment needs a proper backend.
      </p>

      <div className="w-full max-w-md space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl px-4 py-3 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4-digit PIN"
            inputMode="numeric"
            className="font-data w-1/2 rounded-xl px-4 py-3 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Confirm PIN"
            inputMode="numeric"
            className="font-data w-1/2 rounded-xl px-4 py-3 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-2">
          {["Lifesaver", "Patrol Supervisor"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${role === r ? "bg-white text-blue-900" : "bg-blue-900 text-blue-200"}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 max-h-64 overflow-y-auto">
          <p className="text-xs font-bold uppercase text-stone-400 mb-2">Which beaches will you manage?</p>
          <div className="space-y-1.5">
            {beaches.map((b) => (
              <button
                key={b.id}
                onClick={() => toggleBeach(b.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selectedBeaches.includes(b.id) ? "bg-blue-50 text-blue-800 font-bold" : "text-stone-600"}`}
              >
                <span>{b.name} <span className="text-xs text-stone-400 font-normal">({b.state})</span></span>
                {selectedBeaches.includes(b.id) && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-300 text-sm font-semibold text-center">{error}</p>}

        <button onClick={submit} className="w-full bg-white text-blue-900 rounded-xl py-3 font-bold">
          Create account & sign in
        </button>
        <button onClick={onCancel} className="w-full text-blue-200 text-sm font-semibold py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

function PinScreen({ user, onSuccess, onCancel }) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);

  function press(d) {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length === 4) {
      if (next === user.pin) {
        setTimeout(() => onSuccess(), 150);
      } else {
        setError(true);
        setTimeout(() => { setEntry(""); setError(false); }, 500);
      }
    }
  }

  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-full bg-blue-800 text-white flex items-center justify-center text-xl font-bold mb-3">
        {user.name.split(" ").map((n) => n[0]).join("")}
      </div>
      <p className="text-white font-bold text-lg mb-1">{user.name}</p>
      <p className="text-blue-200 text-sm mb-6 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Enter your 4-digit PIN</p>

      <div className={`flex gap-3 mb-6 ${error ? "animate-pulse" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`w-4 h-4 rounded-full ${entry.length > i ? (error ? "bg-red-500" : "bg-white") : "bg-blue-800"}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button key={d} onClick={() => press(d)} className="font-data bg-blue-900 text-white text-2xl font-bold rounded-xl py-4 active:bg-blue-800">{d}</button>
        ))}
        <button onClick={onCancel} className="text-blue-300 text-sm font-semibold">Cancel</button>
        <button onClick={() => press("0")} className="font-data bg-blue-900 text-white text-2xl font-bold rounded-xl py-4 active:bg-blue-800">0</button>
        <button onClick={() => setEntry(entry.slice(0, -1))} className="flex items-center justify-center text-blue-300 active:text-white">
          <Delete className="w-6 h-6" />
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-4 font-semibold">Incorrect PIN — try again</p>}
    </div>
  );
}

/* ---- Beach selector ---- */

function BeachSelectScreen({ user, beaches, onPick, onLogout }) {
  const assigned = beaches.filter((b) => user.assignedBeachIds.includes(b.id));
  return (
    <div className="min-h-screen bg-sand-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-stone-400">Signed in as</p>
          <p className="text-xl font-bold text-stone-800">{user.name}</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-stone-500 font-semibold text-sm bg-white rounded-full px-3 py-2 ring-1 ring-stone-200">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3">Your assigned beaches</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assigned.map((b) => {
          const cfg = FLAG_STATUS[b.flagStatus];
          return (
            <button key={b.id} onClick={() => onPick(b.id)} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-stone-100 flex items-center justify-between active:bg-stone-50 text-left">
              <div>
                <p className="text-lg font-bold text-stone-800">{b.name}</p>
                <p className="text-xs text-stone-400 mb-2">{b.state}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  <FlagIcon status={b.flagStatus} /> {cfg.label}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Control room ---- */

function ControlRoom({ user, beach, allBeaches, auditLog, live, activeAlerts, onPublish, onResolve, onToggleLive, onSetFlag, onUpdateMapFeatures, onSwitchBeach, onLogout, transcripts, onAddTranscript, onSetTranscriptTranslation }) {
  const [tab, setTab] = useState("composer");
  const canSwitch = user.assignedBeachIds.length > 1;

  const NAV = [
    { id: "composer", label: "Compose Alert", icon: Megaphone },
    { id: "map", label: "Beach Map", icon: Map },
    { id: "log", label: "Audit Log", icon: ScrollText },
    { id: "public", label: "Public View", icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-sand-50 flex">
      <div className="w-56 bg-blue-950 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-blue-900">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-extrabold">BeachSafe Admin</span>
          </div>
          <p className="text-xs text-blue-300">{user.name} · {user.role}</p>
        </div>

        <div className="p-4 border-b border-blue-900">
          <p className="text-xs text-blue-300 uppercase font-bold mb-1">Managing</p>
          <p className="font-bold">{beach.name}</p>
          {canSwitch && (
            <button onClick={onSwitchBeach} className="text-xs text-blue-300 underline mt-1">Switch beach</button>
          )}
        </div>

        <div className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold ${active ? "bg-white text-blue-900" : "text-blue-200 active:bg-blue-900"}`}>
                <Icon className="w-4.5 h-4.5" /> {n.label}
              </button>
            );
          })}
        </div>

        <button onClick={onLogout} className="m-3 flex items-center gap-2 justify-center text-blue-200 border border-blue-800 rounded-xl py-3 font-semibold text-sm active:bg-blue-900">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="flex-1 min-w-0">
        {tab === "composer" && (
          <ComposerPanel
            beach={beach} activeAlerts={activeAlerts} live={live} onPublish={onPublish} onResolve={onResolve}
            onToggleLive={onToggleLive} onSetFlag={onSetFlag} actor={user.name}
            transcripts={transcripts} onAddTranscript={onAddTranscript} onSetTranscriptTranslation={onSetTranscriptTranslation}
          />
        )}
        {tab === "map" && (
          <BeachMapEditor beach={beach} onSave={(features, summary) => onUpdateMapFeatures(beach.id, features, summary)} />
        )}
        {tab === "log" && <AuditLogPanel auditLog={auditLog} beaches={allBeaches} />}
        {tab === "public" && <PublicViewPanel beach={beach} activeAlerts={activeAlerts} live={live} />}
      </div>
    </div>
  );
}

/* ---- Composer ---- */

function ComposerPanel({ beach, activeAlerts, live, onPublish, onResolve, onToggleLive, onSetFlag, actor, transcripts, onAddTranscript, onSetTranscriptTranslation }) {
  const [presetKey, setPresetKey] = useState(null);
  const [text, setText] = useState("");
  const [severity, setSeverity] = useState("caution");
  const [expiryMin, setExpiryMin] = useState(60);
  const [confirmed, setConfirmed] = useState(false);

  const speech = useSpeechRecognition({
    onFinalResult: async (finalText) => {
      const transcriptId = onAddTranscript(beach.id, finalText, actor);
      const translations = await translateToAllLanguages(finalText);
      Object.entries(translations).forEach(([lang, translatedText]) => {
        onSetTranscriptTranslation(transcriptId, lang, translatedText);
      });
    },
  });

  function handleToggleVoiceBroadcast() {
    if (speech.isListening) {
      speech.stop();
    } else {
      if (!live?.isLive) onToggleLive(beach.id); // voice broadcast implies you're live
      speech.start();
    }
  }

  function pickPreset(p) {
    setPresetKey(p.key);
    setText(p.text);
    setSeverity(p.severity);
    setExpiryMin(p.expiryMin);
  }

  function publish() {
    if (!text.trim()) return;
    onPublish({ beachId: beach.id, presetKey, text: text.trim(), severity, expiryMin });
    setConfirmed(true);
    setText("");
    setPresetKey(null);
    setTimeout(() => setConfirmed(false), 2200);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-800">{beach.name}</h1>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${FLAG_STATUS[beach.flagStatus].bg} ${FLAG_STATUS[beach.flagStatus].text}`}>
            <FlagIcon status={beach.flagStatus} /> {FLAG_STATUS[beach.flagStatus].label}
          </span>
        </div>
        <button
          onClick={() => onToggleLive(beach.id)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${live?.isLive ? "bg-red-600 text-white" : "bg-white ring-1 ring-stone-200 text-stone-600"}`}
        >
          <Mic className="w-4 h-4" /> {live?.isLive ? "End live broadcast" : "Start live broadcast"}
        </button>
      </div>

      {live?.isLive && (
        <div className="bg-red-600 text-white rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-sm font-bold">
          <Radio className="w-4 h-4" /> ON AIR — broadcasting live since {fmtTime(live.startedAt)} · visible now in the tourist app
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 ring-1 ring-stone-200 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Voice broadcast</p>
          {speech.isListening && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> Listening
            </span>
          )}
        </div>

        {!speech.supported ? (
          <p className="text-sm text-stone-500">Voice broadcast isn't supported in this browser. Try Chrome or Safari on this device.</p>
        ) : (
          <>
            <button
              onClick={handleToggleVoiceBroadcast}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm mb-2 ${speech.isListening ? "bg-red-600 text-white" : "bg-blue-800 text-white"}`}
            >
              <Mic className="w-5 h-5" /> {speech.isListening ? "Stop voice broadcast" : "Start voice broadcast"}
            </button>
            <p className="text-xs text-stone-400 mb-2">
              Hold your phone near the speakerphone while you announce. Each sentence is transcribed and translated automatically for tourists in real time.
            </p>

            {speech.error && <p className="text-xs text-red-600 font-semibold mb-2">{speech.error}</p>}

            {speech.isListening && speech.interimText && (
              <p className="text-sm text-stone-500 italic mb-2">"{speech.interimText}"</p>
            )}

            {transcripts.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                {transcripts.slice(0, 6).map((tItem) => {
                  const translatedCount = Object.keys(tItem.translations).length;
                  return (
                    <div key={tItem.id} className="text-xs bg-stone-50 rounded-lg p-2">
                      <p className="font-semibold text-stone-700">{tItem.textEn}</p>
                      <p className="text-stone-400 mt-0.5">
                        {translatedCount === 6 ? "Translated into all languages" : `Translating... ${translatedCount}/6 languages done`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">Flag status — set manually</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {Object.entries(FLAG_STATUS).map(([key, cfg]) => {
          const active = beach.flagStatus === key;
          return (
            <button
              key={key}
              onClick={() => onSetFlag(key)}
              className={`flex items-center gap-2 rounded-xl py-3 px-3 ring-1 ${active ? `${cfg.bg} ${cfg.text} ring-transparent font-bold` : "bg-white ring-stone-200 text-stone-600"}`}
            >
              <FlagIcon status={key} size="sm" />
              <span className="text-sm text-left leading-tight">{cfg.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-stone-400 -mt-3 mb-5">Publishing a danger or closure alert below will also update this automatically — you can always override it here.</p>

      {confirmed && (
        <div className="bg-teal-50 text-teal-700 ring-1 ring-teal-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="w-4 h-4" /> Alert published instantly to the public beach page.
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">Presets — one tap to fill</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const active = presetKey === p.key;
          const sv = SEVERITY[p.severity];
          return (
            <button key={p.key} onClick={() => pickPreset(p)}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-4 px-2 ring-1 ${active ? `${sv.bg} text-white ring-transparent` : `bg-white ring-stone-200 text-stone-700`}`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs font-bold text-center leading-tight">{p.label}</span>
            </button>
          );
        })}
      </div>

      <label className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2 block">Message</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={220}
        rows={3}
        placeholder="Select a preset above or type a custom alert..."
        className="w-full rounded-xl ring-1 ring-stone-200 bg-white p-3.5 text-stone-800 text-base mb-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-stone-400 mb-5 text-right">{text.length}/220</p>

      <label className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2 block">Severity</label>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {Object.entries(SEVERITY).map(([key, cfg]) => (
          <button key={key} onClick={() => setSeverity(key)}
            className={`py-3 rounded-xl font-bold text-sm ${severity === key ? `${cfg.bg} text-white` : "bg-white ring-1 ring-stone-200 text-stone-600"}`}>
            {cfg.label}
          </button>
        ))}
      </div>

      <label className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2 block">Expires in</label>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[15, 30, 60, 120, 240].map((m) => (
          <button key={m} onClick={() => setExpiryMin(m)}
            className={`px-4 py-2.5 rounded-full font-semibold text-sm ${expiryMin === m ? "bg-blue-800 text-white" : "bg-white ring-1 ring-stone-200 text-stone-600"}`}>
            {m < 60 ? `${m} min` : `${m / 60} hr`}
          </button>
        ))}
      </div>

      <button
        onClick={publish}
        disabled={!text.trim()}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-extrabold text-lg text-white ${SEVERITY[severity].bg} disabled:opacity-40`}
      >
        <Send className="w-5 h-5" /> Publish alert to {beach.name}
      </button>

      {activeAlerts.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">Active alerts on this beach</p>
          <div className="space-y-2">
            {activeAlerts.map((a) => {
              const sv = SEVERITY[a.severity];
              return (
                <div key={a.id} className={`rounded-xl p-3.5 ring-1 ${sv.soft} ${sv.ring} flex items-start justify-between gap-3`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold uppercase ${sv.text}`}>{sv.label}</span>
                      <span className="text-xs text-stone-400">published {fmtTime(a.createdAt)} · expires {fmtTime(a.expiresAt)}</span>
                    </div>
                    <p className="text-sm text-stone-800">{a.text}</p>
                  </div>
                  <button onClick={() => onResolve(a.id)} className="shrink-0 flex items-center gap-1 text-xs font-bold text-stone-500 bg-white rounded-full px-3 py-1.5 ring-1 ring-stone-200">
                    <RotateCcw className="w-3.5 h-3.5" /> Resolve
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Audit log ---- */

/* ---- Beach map editor ---- */

function BeachMapEditor({ beach, onSave }) {
  const [mode, setMode] = useState(null); // null | "swimZone" | "closedZone" | "hazard"
  const [hazardType, setHazardType] = useState("rip");
  const [draftPoints, setDraftPoints] = useState([]);

  const mapFeatures = beach.mapFeatures || { swimZone: null, closedZones: [], hazardMarkers: [] };

  function handleMapClick(latlng) {
    if (mode === "hazard") {
      const marker = { id: `hm-${Date.now()}`, lat: latlng[0], lng: latlng[1], type: hazardType, label: `${HAZARD_TYPES[hazardType].label} reported here` };
      onSave({ ...mapFeatures, hazardMarkers: [...mapFeatures.hazardMarkers, marker] }, `added a ${HAZARD_TYPES[hazardType].label.toLowerCase()} marker`);
      return;
    }
    if (mode === "swimZone" || mode === "closedZone") {
      setDraftPoints((pts) => [...pts, latlng]);
    }
  }

  function finishShape() {
    if (draftPoints.length < 3) return;
    if (mode === "swimZone") {
      onSave({ ...mapFeatures, swimZone: { id: `sz-${Date.now()}`, points: draftPoints } }, "updated the swim zone");
    } else if (mode === "closedZone") {
      onSave({ ...mapFeatures, closedZones: [...mapFeatures.closedZones, { id: `cz-${Date.now()}`, points: draftPoints }] }, "added a closed zone");
    }
    setDraftPoints([]);
    setMode(null);
  }

  function cancelShape() {
    setDraftPoints([]);
    setMode(null);
  }

  function clearSwimZone() {
    onSave({ ...mapFeatures, swimZone: null }, "removed the swim zone");
  }

  function removeClosedZone(id) {
    onSave({ ...mapFeatures, closedZones: mapFeatures.closedZones.filter((z) => z.id !== id) }, "removed a closed zone");
  }

  function removeHazard(id) {
    onSave({ ...mapFeatures, hazardMarkers: mapFeatures.hazardMarkers.filter((h) => h.id !== id) }, "removed a hazard marker");
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-800 mb-1">Beach Map — {beach.name}</h1>
      <p className="text-sm text-stone-400 mb-4">Draw the safe swim zone, mark closed areas, and drop hazard pins directly on the satellite image. Changes appear on the tourist app instantly.</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => { setMode(mode === "swimZone" ? null : "swimZone"); setDraftPoints([]); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold ${mode === "swimZone" ? "bg-teal-600 text-white" : "bg-white ring-1 ring-stone-200 text-stone-700"}`}
        >
          <Waves className="w-4 h-4" /> {mode === "swimZone" ? "Click map to add points..." : "Draw swim zone"}
        </button>
        <button
          onClick={() => { setMode(mode === "closedZone" ? null : "closedZone"); setDraftPoints([]); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold ${mode === "closedZone" ? "bg-red-600 text-white" : "bg-white ring-1 ring-stone-200 text-stone-700"}`}
        >
          <Ban className="w-4 h-4" /> {mode === "closedZone" ? "Click map to add points..." : "Draw closed zone"}
        </button>

        <div className="flex items-center gap-1 bg-white rounded-lg ring-1 ring-stone-200 px-1 py-1">
          <select
            value={hazardType}
            onChange={(e) => setHazardType(e.target.value)}
            className="text-sm font-semibold text-stone-700 bg-transparent focus:outline-none px-1"
          >
            {Object.entries(HAZARD_TYPES).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <button
            onClick={() => { setMode(mode === "hazard" ? null : "hazard"); setDraftPoints([]); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-bold ${mode === "hazard" ? "bg-amber-500 text-white" : "text-stone-700"}`}
          >
            <MapPin className="w-4 h-4" /> {mode === "hazard" ? "Tap map to place" : "Add hazard"}
          </button>
        </div>

        {(mode === "swimZone" || mode === "closedZone") && (
          <>
            <button onClick={finishShape} disabled={draftPoints.length < 3} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-blue-800 text-white disabled:opacity-40">
              <CheckCircle2 className="w-4 h-4" /> Finish shape ({draftPoints.length} pts)
            </button>
            <button onClick={cancelShape} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-white ring-1 ring-stone-200 text-stone-600">
              <Undo2 className="w-4 h-4" /> Cancel
            </button>
          </>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden ring-1 ring-stone-200" style={{ height: 420 }}>
        <BeachMap
          beach={beach}
          editable={mode !== null}
          onMapClick={handleMapClick}
          draftPoints={draftPoints}
          draftKind={mode === "closedZone" ? "closedZone" : "swimZone"}
          onDeleteHazard={removeHazard}
          className="w-full h-full"
        />
      </div>
      {mode && (
        <p className="text-xs text-stone-400 mt-2">
          {mode === "hazard" ? "Tap anywhere on the map to drop a hazard pin. Keep tapping to add more." : "Tap at least 3 points to outline the area, then hit Finish shape."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="bg-white rounded-xl p-4 ring-1 ring-stone-100">
          <p className="text-xs font-bold uppercase text-stone-400 mb-2">Swim zone</p>
          {mapFeatures.swimZone ? (
            <button onClick={clearSwimZone} className="flex items-center gap-1.5 text-sm font-bold text-red-600">
              <Trash2 className="w-4 h-4" /> Remove swim zone
            </button>
          ) : (
            <p className="text-sm text-stone-400">No swim zone drawn yet.</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 ring-1 ring-stone-100">
          <p className="text-xs font-bold uppercase text-stone-400 mb-2">Closed zones ({mapFeatures.closedZones.length})</p>
          {mapFeatures.closedZones.length === 0 ? (
            <p className="text-sm text-stone-400">No closed zones marked.</p>
          ) : (
            <div className="space-y-1.5">
              {mapFeatures.closedZones.map((z, i) => (
                <div key={z.id} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">Closed area {i + 1}</span>
                  <button onClick={() => removeClosedZone(z.id)} className="text-red-600 font-bold flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 ring-1 ring-stone-100 mt-4">
        <p className="text-xs font-bold uppercase text-stone-400 mb-2">Hazard markers ({mapFeatures.hazardMarkers.length})</p>
        {mapFeatures.hazardMarkers.length === 0 ? (
          <p className="text-sm text-stone-400">No hazards marked yet. Choose a type above, tap "Add hazard," then tap the map.</p>
        ) : (
          <div className="space-y-1.5">
            {mapFeatures.hazardMarkers.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm gap-2">
                <span className="text-stone-700 min-w-0">
                  <span className="font-semibold" style={{ color: HAZARD_TYPES[h.type]?.color }}>{HAZARD_TYPES[h.type]?.label}</span> — {h.label}
                </span>
                <button onClick={() => removeHazard(h.id)} className="text-red-600 font-bold flex items-center gap-1 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLogPanel({ auditLog, beaches }) {
  const beachName = (id) => beaches.find((b) => b.id === id)?.name || id;
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-800 mb-1">Audit Log</h1>
      <p className="text-sm text-stone-400 mb-5">Every action is timestamped and permanently recorded.</p>
      <div className="bg-white rounded-xl ring-1 ring-stone-100 divide-y divide-stone-100">
        {auditLog.length === 0 && <p className="p-4 text-sm text-stone-400">No actions recorded yet.</p>}
        {auditLog.map((e) => (
          <div key={e.id} className="p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
              {e.type === "publish" && <Megaphone className="w-4 h-4 text-blue-700" />}
              {e.type === "resolve" && <RotateCcw className="w-4 h-4 text-stone-500" />}
              {e.type === "broadcast_start" && <Radio className="w-4 h-4 text-red-600" />}
              {e.type === "broadcast_end" && <Mic className="w-4 h-4 text-stone-400" />}
              {e.type === "map_update" && <Map className="w-4 h-4 text-teal-600" />}
              {e.type === "flag_change" && <Flag className="w-4 h-4 text-amber-600" />}
              {e.type === "account_created" && <User className="w-4 h-4 text-blue-700" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-stone-800">
                <span className="font-bold">{e.actor}</span> {e.summary} <span className="text-stone-400">— {beachName(e.beachId)}</span>
              </p>
              {e.detail && <p className="text-xs text-stone-500 mt-0.5">{e.detail}</p>}
            </div>
            <span className="text-xs text-stone-400 shrink-0">{fmtClock(e.at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Public view preview ---- */

function PublicViewPanel({ beach, activeAlerts, live }) {
  const [lang, setLang] = useState("en");
  const cfg = FLAG_STATUS[beach.flagStatus];

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-800">Public preview</h1>
          <p className="text-sm text-stone-400">Exactly what visitors see for {beach.name}, updated instantly.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full ring-1 ring-stone-200 px-2 py-1.5">
          <Languages className="w-4 h-4 text-stone-400" />
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-sm font-semibold text-stone-700 bg-transparent focus:outline-none">
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-stone-100 overflow-hidden">
        <div className={`p-5 ${cfg.bg} flex items-center gap-3`}>
          <FlagIcon status={beach.flagStatus} />
          <div>
            <p className={`font-extrabold text-lg ${cfg.text}`}>{cfg.label}</p>
            <p className="text-xs text-stone-500">{beach.name}, {beach.state}</p>
          </div>
        </div>

        {live?.isLive && (
          <div className="bg-red-600 text-white px-5 py-2.5 flex items-center gap-2 text-sm font-bold">
            <Radio className="w-4 h-4" /> Lifeguard is broadcasting live now
          </div>
        )}

        <div className="p-5 pb-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-stone-200" style={{ height: 220 }}>
            <BeachMap beach={beach} className="w-full h-full" zoom={17} />
          </div>
        </div>

        <div className="p-5 space-y-3">
          {activeAlerts.length === 0 && (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <MapPin className="w-4 h-4" /> No active alerts right now.
            </div>
          )}
          {activeAlerts.map((a) => {
            const sv = SEVERITY[a.severity];
            const { text, isFallback } = translateAlert(a, lang);
            return (
              <div key={a.id} className={`rounded-xl p-3.5 ring-1 ${sv.soft} ${sv.ring}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-bold uppercase ${sv.text}`}>{sv.label}</span>
                  <span className="text-xs text-stone-400">{fmtTime(a.createdAt)}</span>
                </div>
                <p className="text-sm text-stone-800">{text}</p>
                {isFallback && (
                  <p className="text-xs text-stone-400 mt-1.5 italic">Translation unavailable — showing original English text.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- Root ---- */

export default function AdminApp() {
  const { beaches, auditLog, liveByBeach, publishAlert, resolveAlert, toggleLive, setBeachFlag, updateMapFeatures, activeAlertsForBeach, users, signUpLifesaver, addLiveTranscript, setTranscriptTranslation, liveTranscriptsForBeach } = useBeachData();

  const [screen, setScreen] = useState("login"); // login | signup | pin | beachSelect | room
  const [pendingUser, setPendingUser] = useState(null);
  const [user, setUser] = useState(null);
  const [currentBeachId, setCurrentBeachId] = useState(null);

  function logout() {
    setUser(null); setPendingUser(null); setCurrentBeachId(null); setScreen("login");
  }

  const currentBeach = beaches.find((b) => b.id === currentBeachId);

  function handleSignUp(payload) {
    const result = signUpLifesaver(payload);
    if (result.ok) {
      // Skip the PIN re-entry step — they just chose it themselves.
      setUser(result.user);
      if (result.user.assignedBeachIds.length === 1) {
        setCurrentBeachId(result.user.assignedBeachIds[0]);
        setScreen("room");
      } else {
        setScreen("beachSelect");
      }
    }
    return result;
  }

  return (
    <div className="min-h-screen bg-sand-50 font-sans">
      {screen === "login" && (
        <LoginScreen
          users={users}
          onPicked={(u) => { setPendingUser(u); setScreen("pin"); }}
          onSignUp={() => setScreen("signup")}
        />
      )}

      {screen === "signup" && (
        <SignUpScreen beaches={beaches} onSignUp={handleSignUp} onCancel={() => setScreen("login")} />
      )}

      {screen === "pin" && pendingUser && (
        <PinScreen
          user={pendingUser}
          onCancel={() => { setPendingUser(null); setScreen("login"); }}
          onSuccess={() => {
            setUser(pendingUser);
            if (pendingUser.assignedBeachIds.length === 1) {
              setCurrentBeachId(pendingUser.assignedBeachIds[0]);
              setScreen("room");
            } else {
              setScreen("beachSelect");
            }
          }}
        />
      )}

      {screen === "beachSelect" && user && (
        <BeachSelectScreen
          user={user}
          beaches={beaches}
          onPick={(id) => { setCurrentBeachId(id); setScreen("room"); }}
          onLogout={logout}
        />
      )}

      {screen === "room" && user && currentBeach && (
        <ControlRoom
          user={user}
          beach={currentBeach}
          allBeaches={beaches}
          auditLog={auditLog}
          live={liveByBeach[currentBeach.id]}
          activeAlerts={activeAlertsForBeach(currentBeach.id)}
          onPublish={(payload) => publishAlert({ ...payload, actor: user.name })}
          onResolve={(alertId) => resolveAlert(alertId, user.name)}
          onToggleLive={(beachId) => toggleLive(beachId, user.name)}
          onUpdateMapFeatures={(beachId, features, summary) => updateMapFeatures(beachId, features, user.name, summary)}
          onSetFlag={(status) => setBeachFlag(currentBeach.id, status, user.name)}
          transcripts={liveTranscriptsForBeach(currentBeach.id)}
          onAddTranscript={addLiveTranscript}
          onSetTranscriptTranslation={setTranscriptTranslation}
          onSwitchBeach={() => setScreen("beachSelect")}
          onLogout={logout}
        />
      )}
    </div>
  );
}
