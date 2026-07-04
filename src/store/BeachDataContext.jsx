import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { INITIAL_BEACHES, SEVERITY_FLAG_EFFECT, SEVERITY, FLAG_STATUS } from "./beachData";

/* ============================================================================
   This is what makes the two apps "connected": AdminApp and TouristApp both
   call useBeachData() and read/write the exact same state tree. Publish an
   alert in the admin composer and it appears instantly in the tourist app's
   live broadcast screen.

   CROSS-TAB SYNC: a BroadcastChannel keeps every open tab/window of the SAME
   browser in sync (e.g. Admin in one tab, Tourist in another) — this is what
   makes local testing across two tabs actually work. A freshly opened tab
   asks "does anyone already have data?" instead of asserting its own
   defaults, so it doesn't wipe out an existing session.

   WHAT THIS DOESN'T DO: sync across different browsers, devices, or
   computers. BroadcastChannel is same-browser-only by design. Real
   cross-device sync needs a backend (database + WebSocket or push), which
   is the actual production architecture — this is a realistic stand-in for
   local development and demos.
   ============================================================================ */

const BeachDataContext = createContext(null);
const CHANNEL_NAME = "beachsafe-sync-v1";

const initialState = {
  beaches: INITIAL_BEACHES,
  alerts: [],
  auditLog: [],
  liveByBeach: {},
};

export function BeachDataProvider({ children }) {
  const [state, setState] = useState(initialState);
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

  // Broadcast every LOCAL state change to other tabs. Changes that arrived
  // FROM another tab are flagged so we don't immediately echo them back
  // (which would otherwise cause an infinite ping-pong between tabs).
  useEffect(() => {
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

  const activeAlertsForBeach = useCallback((beachId) => {
    return state.alerts
      .filter((a) => a.beachId === beachId && !a.resolved && a.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [state.alerts, now]);

  const value = {
    beaches: state.beaches, alerts: state.alerts, auditLog: state.auditLog, liveByBeach: state.liveByBeach, now,
    publishAlert, resolveAlert, toggleLive, setBeachFlag, activeAlertsForBeach, updateMapFeatures,
  };

  return <BeachDataContext.Provider value={value}>{children}</BeachDataContext.Provider>;
}

export function useBeachData() {
  const ctx = useContext(BeachDataContext);
  if (!ctx) throw new Error("useBeachData must be used inside a BeachDataProvider");
  return ctx;
}
