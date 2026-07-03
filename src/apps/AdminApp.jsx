import React, { useState } from "react";
import {
  LogOut, Lock, ShieldCheck, Radio,
  Send, CheckCircle2, ChevronRight, ScrollText,
  Eye, Mic, MapPin, Languages, Delete, Megaphone, RotateCcw,
} from "lucide-react";
import { useBeachData } from "../store/BeachDataContext";
import {
  USERS, PRESETS, SEVERITY, FLAG_STATUS, LANGUAGES,
  translateAlert, fmtTime, fmtClock,
} from "../store/beachData";

/* ============================================================================
   AdminApp now reads/writes the SAME state as TouristApp via useBeachData().
   Publishing an alert here updates the shared alerts list and beach flag
   status immediately — the "Public View" tab and the actual tourist app
   both reflect it instantly, no refresh needed.
   ============================================================================ */

function FlagIcon({ status }) {
  const cfg = FLAG_STATUS[status];
  return (
    <div className="flex w-7 h-5 rounded-sm overflow-hidden ring-1 ring-black/10">
      <div className={`w-1/2 h-full ${cfg.flagColors[0]}`} />
      <div className={`w-1/2 h-full ${cfg.flagColors[1]}`} />
    </div>
  );
}

/* ---- Login ---- */

function LoginScreen({ onPicked }) {
  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 text-white mb-8">
        <ShieldCheck className="w-8 h-8" />
        <span className="text-2xl font-extrabold">BeachSafe Admin</span>
      </div>
      <p className="text-blue-200 mb-6 text-sm">Tap your name to sign in</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {USERS.map((u) => (
          <button
            key={u.id}
            onClick={() => onPicked(u)}
            className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-blue-800 text-white flex items-center justify-center text-xl font-bold">
              {u.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <p className="font-bold text-slate-800 text-center leading-tight">{u.name}</p>
            <p className="text-xs text-slate-400">{u.role}</p>
            <p className="text-[11px] text-blue-700 font-semibold">{u.assignedBeachIds.length} beach{u.assignedBeachIds.length > 1 ? "es" : ""}</p>
          </button>
        ))}
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
          <button key={d} onClick={() => press(d)} className="bg-blue-900 text-white text-2xl font-bold rounded-xl py-4 active:bg-blue-800">{d}</button>
        ))}
        <button onClick={onCancel} className="text-blue-300 text-sm font-semibold">Cancel</button>
        <button onClick={() => press("0")} className="bg-blue-900 text-white text-2xl font-bold rounded-xl py-4 active:bg-blue-800">0</button>
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-400">Signed in as</p>
          <p className="text-xl font-bold text-slate-800">{user.name}</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-500 font-semibold text-sm bg-white rounded-full px-3 py-2 ring-1 ring-slate-200">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Your assigned beaches</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assigned.map((b) => {
          const cfg = FLAG_STATUS[b.flagStatus];
          return (
            <button key={b.id} onClick={() => onPick(b.id)} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-100 flex items-center justify-between active:bg-slate-50 text-left">
              <div>
                <p className="text-lg font-bold text-slate-800">{b.name}</p>
                <p className="text-xs text-slate-400 mb-2">{b.state}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  <FlagIcon status={b.flagStatus} /> {cfg.label}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Control room ---- */

function ControlRoom({ user, beach, allBeaches, auditLog, live, activeAlerts, onPublish, onResolve, onToggleLive, onSwitchBeach, onLogout }) {
  const [tab, setTab] = useState("composer");
  const canSwitch = user.assignedBeachIds.length > 1;

  const NAV = [
    { id: "composer", label: "Compose Alert", icon: Megaphone },
    { id: "log", label: "Audit Log", icon: ScrollText },
    { id: "public", label: "Public View", icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
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
          <ComposerPanel beach={beach} activeAlerts={activeAlerts} live={live} onPublish={onPublish} onResolve={onResolve} onToggleLive={onToggleLive} />
        )}
        {tab === "log" && <AuditLogPanel auditLog={auditLog} beaches={allBeaches} />}
        {tab === "public" && <PublicViewPanel beach={beach} activeAlerts={activeAlerts} live={live} />}
      </div>
    </div>
  );
}

/* ---- Composer ---- */

function ComposerPanel({ beach, activeAlerts, live, onPublish, onResolve, onToggleLive }) {
  const [presetKey, setPresetKey] = useState(null);
  const [text, setText] = useState("");
  const [severity, setSeverity] = useState("caution");
  const [expiryMin, setExpiryMin] = useState(60);
  const [confirmed, setConfirmed] = useState(false);

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
          <h1 className="text-2xl font-extrabold text-slate-800">{beach.name}</h1>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${FLAG_STATUS[beach.flagStatus].bg} ${FLAG_STATUS[beach.flagStatus].text}`}>
            <FlagIcon status={beach.flagStatus} /> {FLAG_STATUS[beach.flagStatus].label}
          </span>
        </div>
        <button
          onClick={() => onToggleLive(beach.id)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${live?.isLive ? "bg-red-600 text-white" : "bg-white ring-1 ring-slate-200 text-slate-600"}`}
        >
          <Mic className="w-4 h-4" /> {live?.isLive ? "End live broadcast" : "Start live broadcast"}
        </button>
      </div>

      {live?.isLive && (
        <div className="bg-red-600 text-white rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-sm font-bold">
          <Radio className="w-4 h-4" /> ON AIR — broadcasting live since {fmtTime(live.startedAt)} · visible now in the tourist app
        </div>
      )}

      {confirmed && (
        <div className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="w-4 h-4" /> Alert published instantly to the public beach page.
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Presets — one tap to fill</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const active = presetKey === p.key;
          const sv = SEVERITY[p.severity];
          return (
            <button key={p.key} onClick={() => pickPreset(p)}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-4 px-2 ring-1 ${active ? `${sv.bg} text-white ring-transparent` : `bg-white ring-slate-200 text-slate-700`}`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs font-bold text-center leading-tight">{p.label}</span>
            </button>
          );
        })}
      </div>

      <label className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 block">Message</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={220}
        rows={3}
        placeholder="Select a preset above or type a custom alert..."
        className="w-full rounded-xl ring-1 ring-slate-200 bg-white p-3.5 text-slate-800 text-base mb-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-slate-400 mb-5 text-right">{text.length}/220</p>

      <label className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 block">Severity</label>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {Object.entries(SEVERITY).map(([key, cfg]) => (
          <button key={key} onClick={() => setSeverity(key)}
            className={`py-3 rounded-xl font-bold text-sm ${severity === key ? `${cfg.bg} text-white` : "bg-white ring-1 ring-slate-200 text-slate-600"}`}>
            {cfg.label}
          </button>
        ))}
      </div>

      <label className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 block">Expires in</label>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[15, 30, 60, 120, 240].map((m) => (
          <button key={m} onClick={() => setExpiryMin(m)}
            className={`px-4 py-2.5 rounded-full font-semibold text-sm ${expiryMin === m ? "bg-blue-800 text-white" : "bg-white ring-1 ring-slate-200 text-slate-600"}`}>
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
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Active alerts on this beach</p>
          <div className="space-y-2">
            {activeAlerts.map((a) => {
              const sv = SEVERITY[a.severity];
              return (
                <div key={a.id} className={`rounded-xl p-3.5 ring-1 ${sv.soft} ${sv.ring} flex items-start justify-between gap-3`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold uppercase ${sv.text}`}>{sv.label}</span>
                      <span className="text-xs text-slate-400">published {fmtTime(a.createdAt)} · expires {fmtTime(a.expiresAt)}</span>
                    </div>
                    <p className="text-sm text-slate-800">{a.text}</p>
                  </div>
                  <button onClick={() => onResolve(a.id)} className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-500 bg-white rounded-full px-3 py-1.5 ring-1 ring-slate-200">
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

function AuditLogPanel({ auditLog, beaches }) {
  const beachName = (id) => beaches.find((b) => b.id === id)?.name || id;
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Audit Log</h1>
      <p className="text-sm text-slate-400 mb-5">Every action is timestamped and permanently recorded.</p>
      <div className="bg-white rounded-xl ring-1 ring-slate-100 divide-y divide-slate-100">
        {auditLog.length === 0 && <p className="p-4 text-sm text-slate-400">No actions recorded yet.</p>}
        {auditLog.map((e) => (
          <div key={e.id} className="p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              {e.type === "publish" && <Megaphone className="w-4 h-4 text-blue-700" />}
              {e.type === "resolve" && <RotateCcw className="w-4 h-4 text-slate-500" />}
              {e.type === "broadcast_start" && <Radio className="w-4 h-4 text-red-600" />}
              {e.type === "broadcast_end" && <Mic className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-800">
                <span className="font-bold">{e.actor}</span> {e.summary} <span className="text-slate-400">— {beachName(e.beachId)}</span>
              </p>
              {e.detail && <p className="text-xs text-slate-500 mt-0.5">{e.detail}</p>}
            </div>
            <span className="text-xs text-slate-400 shrink-0">{fmtClock(e.at)}</span>
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
          <h1 className="text-2xl font-extrabold text-slate-800">Public preview</h1>
          <p className="text-sm text-slate-400">Exactly what visitors see for {beach.name}, updated instantly.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full ring-1 ring-slate-200 px-2 py-1.5">
          <Languages className="w-4 h-4 text-slate-400" />
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-sm font-semibold text-slate-700 bg-transparent focus:outline-none">
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-slate-100 overflow-hidden">
        <div className={`p-5 ${cfg.bg} flex items-center gap-3`}>
          <FlagIcon status={beach.flagStatus} />
          <div>
            <p className={`font-extrabold text-lg ${cfg.text}`}>{cfg.label}</p>
            <p className="text-xs text-slate-500">{beach.name}, {beach.state}</p>
          </div>
        </div>

        {live?.isLive && (
          <div className="bg-red-600 text-white px-5 py-2.5 flex items-center gap-2 text-sm font-bold">
            <Radio className="w-4 h-4" /> Lifeguard is broadcasting live now
          </div>
        )}

        <div className="p-5 space-y-3">
          {activeAlerts.length === 0 && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
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
                  <span className="text-xs text-slate-400">{fmtTime(a.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-800">{text}</p>
                {isFallback && (
                  <p className="text-xs text-slate-400 mt-1.5 italic">Translation unavailable — showing original English text.</p>
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
  const { beaches, auditLog, liveByBeach, publishAlert, resolveAlert, toggleLive, activeAlertsForBeach } = useBeachData();

  const [screen, setScreen] = useState("login"); // login | pin | beachSelect | room
  const [pendingUser, setPendingUser] = useState(null);
  const [user, setUser] = useState(null);
  const [currentBeachId, setCurrentBeachId] = useState(null);

  function logout() {
    setUser(null); setPendingUser(null); setCurrentBeachId(null); setScreen("login");
  }

  const currentBeach = beaches.find((b) => b.id === currentBeachId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {screen === "login" && (
        <LoginScreen onPicked={(u) => { setPendingUser(u); setScreen("pin"); }} />
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
          onSwitchBeach={() => setScreen("beachSelect")}
          onLogout={logout}
        />
      )}
    </div>
  );
}
