import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { INITIAL_BEACHES, USERS, SEVERITY_FLAG_EFFECT, SEVERITY, FLAG_STATUS } from "./beachData";

/* ============================================================================
   This is what makes the two apps "connected": AdminApp and TouristApp both
   call useBeachData() and read/write the exact same state tree. Publish an
   alert in the admin composer and it appears instantly in the tourist app's
   live broadcast screen.

   PERSISTENCE: state is now saved to localStorage, so beaches, alerts, and
   lifesaver accounts survive a page reload — not just cross-tab sync. This
   is what makes "creating an account" mean something (it's still there
   after you refresh).

   CROSS-TAB SYNC: a BroadcastChannel keeps every open tab/window of the SAME
   browser in sync in real time. A freshly opened tab asks "does anyone
   already have data?" instead of asserting its own defaults, so it doesn't
   wipe out an existing session.

   WHAT THIS DOESN'T DO: sync across different browsers, devices, or
   computers. Both localStorage and BroadcastChannel are same-browser-only
   by design. Real cross-device sync needs a backend (database + WebSocket
   or push) — this is a realistic stand-in for local development and demos.

   ACCOUNT SECURITY: lifesaver PINs are stored here in plain form, in the
   browser's own localStorage — fine for a prototype, NOT how real
   credentials should be handled. Production auth needs server-side password
   hashing, real sessions, and a real database, which is exactly the "real
   backend" noted elsewhere as future work.
   ============================================================================ */

const BeachDataContext = createContext(null);
const CHANNEL_NAME = "beachsafe-sync-v1";
const STORAGE_KEY = "beachsafe-state-v1";

const defaultState = {
  beaches: INITIAL_BEACHES,
  alerts: [],
  auditLog: [],
  liveByBeach: {},
  users: USERS,
  liveTranscripts: [],
};

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    // Merge with defaults so any new fields added later (e.g. a new beach)
    // still show up even for a browser that has old saved data.
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

export function BeachDataProvider({ children }) {
  const [state, setState] = useState(loadInitialState);
  const [now, setNow] = useState(Date.now());

  // Always-current reference to state, used inside the message handler
  // below so replies to other tabs never use a stale closure.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const channelRef = useRef(null);
  const suppressBroadcastRef = useRef(false);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return; // unsupported browser — falls back to single-tab only
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === "requestState") {
        // A newly opened tab is asking who already has data — reply with ours.
        channel.postMessage({ type: "state", payload: stateRef.current });
      } else if (msg.type === "state") {
        suppressBroadcastRef.current = true; // don't immediately echo back what we just received
        setState(msg.payload);
      }
    };

    // Ask other open tabs for their current state rather than asserting our
    // own fresh defaults — avoids a newly opened tab wiping out real data.
    channel.postMessage({ type: "requestState" });

    return () => channel.close();
  }, []);

  // Broadcast every LOCAL state change to other tabs, and persist it so it
  // survives a reload. Changes that arrived FROM another tab are flagged so
  // we don't immediately echo them back (avoiding an infinite ping-pong).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage can throw in rare cases (private browsing quota, etc.)
      // — non-fatal, the app just falls back to in-memory-only for this session.
    }
    if (suppressBroadcastRef.current) {
      suppressBroadcastRef.current = false;
      return;
    }
    channelRef.current?.postMessage({ type: "state", payload: state });
  }, [state]);

  // Ticks so both apps re-render together as alerts expire, without
  // either side needing to poll or refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const addAuditEntry = (log, entry) => [{ id: `e${Date.now()}${Math.random()}`, at: Date.now(), ...entry }, ...log];

  const publishAlert = useCallback(({ beachId, presetKey, text, severity, expiryMin, actor }) => {
    const at = Date.now();
    const alert = {
      id: `a${at}${Math.random()}`, beachId, presetKey, text, severity,
      createdAt: at, expiresAt: at + expiryMin * 60000, resolved: false, publishedBy: actor,
    };
    setState((prev) => {
      const effect = SEVERITY_FLAG_EFFECT[severity];
      const nextBeaches = effect
        ? prev.beaches.map((b) => (b.id === beachId ? { ...b, flagStatus: effect, lastUpdated: "Just now" } : b))
        : prev.beaches;
      const nextAuditLog = addAuditEntry(prev.auditLog, {
        type: "publish", actor, beachId,
        summary: `published a ${SEVERITY[severity].label.toLowerCase()} alert`, detail: text,
      });
      return { ...prev, beaches: nextBeaches, alerts: [alert, ...prev.alerts], auditLog: nextAuditLog };
    });
    return alert;
  }, []);

  const resolveAlert = useCallback((alertId, actor) => {
    setState((prev) => {
      const alert = prev.alerts.find((a) => a.id === alertId);
      const nextAuditLog = alert
        ? addAuditEntry(prev.auditLog, { type: "resolve", actor, beachId: alert.beachId, summary: "resolved an alert", detail: alert.text })
        : prev.auditLog;
      return {
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)),
        auditLog: nextAuditLog,
      };
    });
  }, []);

  const setBeachFlag = useCallback((beachId, flagStatus, actor) => {
    setState((prev) => {
      const nextBeaches = prev.beaches.map((b) => (b.id === beachId ? { ...b, flagStatus, lastUpdated: "Just now" } : b));
      const nextAuditLog = actor
        ? addAuditEntry(prev.auditLog, { type: "flag_change", actor, beachId, summary: `set the flag status to "${FLAG_STATUS[flagStatus]?.label || flagStatus}"` })
        : prev.auditLog;
      return { ...prev, beaches: nextBeaches, auditLog: nextAuditLog };
    });
  }, []);

  const toggleLive = useCallback((beachId, actor) => {
    setState((prev) => {
      const isLive = !prev.liveByBeach[beachId]?.isLive;
      const nextAuditLog = addAuditEntry(prev.auditLog, {
        type: isLive ? "broadcast_start" : "broadcast_end", actor, beachId,
        summary: isLive ? "started a live broadcast" : "ended the live broadcast",
      });
      return {
        ...prev,
        liveByBeach: { ...prev.liveByBeach, [beachId]: isLive ? { isLive: true, startedAt: Date.now() } : { isLive: false } },
        auditLog: nextAuditLog,
      };
    });
  }, []);

  // Admin map editor calls this whenever hazard markers, the swim zone, or
  // closed zones change for a beach. Synced instantly to the tourist app's
  // map via the same shared state (and across tabs via BroadcastChannel).
  const updateMapFeatures = useCallback((beachId, mapFeatures, actor, summary) => {
    setState((prev) => {
      const nextBeaches = prev.beaches.map((b) => (b.id === beachId ? { ...b, mapFeatures } : b));
      const nextAuditLog = addAuditEntry(prev.auditLog, {
        type: "map_update", actor, beachId, summary: summary || "updated the beach map",
      });
      return { ...prev, beaches: nextBeaches, auditLog: nextAuditLog };
    });
  }, []);

  // Lifesaver self-service sign-up. Validation happens against stateRef
  // (always current) BEFORE the state update, since setState updaters must
  // stay pure — we can't safely "return an error" from inside one.
  const signUpLifesaver = useCallback(({ name, pin, role, assignedBeachIds }) => {
    const users = stateRef.current.users;
    if (!name || !name.trim()) return { ok: false, error: "Please enter your name." };
    if (!/^\d{4}$/.test(pin)) return { ok: false, error: "PIN must be exactly 4 digits." };
    if (users.some((u) => u.pin === pin)) return { ok: false, error: "That PIN is already in use — please choose another." };
    if (!assignedBeachIds || assignedBeachIds.length === 0) return { ok: false, error: "Select at least one beach to manage." };

    const newUser = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      pin,
      role: role || "Lifesaver",
      assignedBeachIds,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      auditLog: addAuditEntry(prev.auditLog, {
        type: "account_created", actor: newUser.name, beachId: assignedBeachIds[0],
        summary: `created a lifesaver account assigned to ${assignedBeachIds.length} beach${assignedBeachIds.length > 1 ? "es" : ""}`,
      }),
    }));
    return { ok: true, user: newUser };
  }, []);

  // ---- Voice broadcast transcripts ----
  // A lifeguard speaks into their phone; speech-to-text runs client-side
  // (see useSpeechRecognition), and each finalized sentence is added here
  // immediately in English, then patched with each language's translation
  // as it comes back from the translation API (see liveTranslate.js) — the
  // tourist app sees the English line appear instantly and the translation
  // "fill in" moments later, which is an honest reflection of real network
  // latency rather than a fake instant translation.
  const MAX_TRANSCRIPTS_PER_BEACH = 40;

  const addLiveTranscript = useCallback((beachId, textEn, actor) => {
    const entry = { id: `tr-${Date.now()}-${Math.random()}`, beachId, at: Date.now(), textEn, translations: {}, actor };
    setState((prev) => {
      const forThisBeach = [entry, ...prev.liveTranscripts.filter((tItem) => tItem.beachId === beachId)].slice(0, MAX_TRANSCRIPTS_PER_BEACH);
      const otherBeaches = prev.liveTranscripts.filter((tItem) => tItem.beachId !== beachId);
      return { ...prev, liveTranscripts: [...forThisBeach, ...otherBeaches] };
    });
    return entry.id;
  }, []);

  const setTranscriptTranslation = useCallback((transcriptId, lang, text) => {
    setState((prev) => ({
      ...prev,
      liveTranscripts: prev.liveTranscripts.map((tItem) =>
        tItem.id === transcriptId ? { ...tItem, translations: { ...tItem.translations, [lang]: text } } : tItem
      ),
    }));
  }, []);

  const liveTranscriptsForBeach = useCallback((beachId) => {
    return state.liveTranscripts.filter((tItem) => tItem.beachId === beachId).sort((a, b) => b.at - a.at);
  }, [state.liveTranscripts]);

  const activeAlertsForBeach = useCallback((beachId) => {
    return state.alerts
      .filter((a) => a.beachId === beachId && !a.resolved && a.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [state.alerts, now]);

  const value = {
    beaches: state.beaches, alerts: state.alerts, auditLog: state.auditLog, liveByBeach: state.liveByBeach, users: state.users, now,
    publishAlert, resolveAlert, toggleLive, setBeachFlag, activeAlertsForBeach, updateMapFeatures, signUpLifesaver,
    addLiveTranscript, setTranscriptTranslation, liveTranscriptsForBeach,
  };

  return <BeachDataContext.Provider value={value}>{children}</BeachDataContext.Provider>;
}

export function useBeachData() {
  const ctx = useContext(BeachDataContext);
  if (!ctx) throw new Error("useBeachData must be used inside a BeachDataProvider");
  return ctx;
}
