import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { INITIAL_BEACHES, SEVERITY_FLAG_EFFECT, SEVERITY } from "./beachData";

/* ============================================================================
   This is what makes the two apps "connected": AdminApp and TouristApp both
   call useBeachData() and read/write the exact same state tree. Publish an
   alert in the admin composer and it appears instantly in the tourist app's
   live broadcast screen, because they're the same React state — no refresh,
   no polling needed while both run in one browser tab.

   FUTURE: this provider is the seam where a real backend plugs in. Replace
   the useState calls with data fetched from an API, and replace each action
   function's local state update with a POST/PATCH request (optimistic UI
   update + WebSocket/poll to sync across *different* browsers/devices,
   since right now this only syncs within one browser tab).
   ============================================================================ */

const BeachDataContext = createContext(null);

export function BeachDataProvider({ children }) {
  const [beaches, setBeaches] = useState(INITIAL_BEACHES);
  const [alerts, setAlerts] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [liveByBeach, setLiveByBeach] = useState({});
  const [now, setNow] = useState(Date.now());

  // Ticks so both apps re-render together as alerts expire, without
  // either side needing to poll or refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const logEvent = useCallback((entry) => {
    setAuditLog((log) => [{ id: `e${Date.now()}${Math.random()}`, at: Date.now(), ...entry }, ...log]);
  }, []);

  const publishAlert = useCallback(({ beachId, presetKey, text, severity, expiryMin, actor }) => {
    const at = Date.now();
    const alert = {
      id: `a${at}${Math.random()}`, beachId, presetKey, text, severity,
      createdAt: at, expiresAt: at + expiryMin * 60000, resolved: false, publishedBy: actor,
    };
    setAlerts((a) => [alert, ...a]);
    const effect = SEVERITY_FLAG_EFFECT[severity];
    if (effect) {
      setBeaches((bs) => bs.map((b) => (b.id === beachId ? { ...b, flagStatus: effect, lastUpdated: "Just now" } : b)));
    }
    logEvent({ type: "publish", actor, beachId, summary: `published a ${SEVERITY[severity].label.toLowerCase()} alert`, detail: text });
    return alert;
  }, [logEvent]);

  const resolveAlert = useCallback((alertId, actor) => {
    setAlerts((list) => {
      const alert = list.find((a) => a.id === alertId);
      if (alert) logEvent({ type: "resolve", actor, beachId: alert.beachId, summary: "resolved an alert", detail: alert.text });
      return list.map((a) => (a.id === alertId ? { ...a, resolved: true } : a));
    });
  }, [logEvent]);

  const setBeachFlag = useCallback((beachId, flagStatus, actor) => {
    setBeaches((bs) => bs.map((b) => (b.id === beachId ? { ...b, flagStatus, lastUpdated: "Just now" } : b)));
    if (actor) logEvent({ type: "flag_change", actor, beachId, summary: `set the flag status to "${flagStatus}"` });
  }, [logEvent]);

  const toggleLive = useCallback((beachId, actor) => {
    setLiveByBeach((m) => {
      const isLive = !m[beachId]?.isLive;
      logEvent({ type: isLive ? "broadcast_start" : "broadcast_end", actor, beachId, summary: isLive ? "started a live broadcast" : "ended the live broadcast" });
      return { ...m, [beachId]: isLive ? { isLive: true, startedAt: Date.now() } : { isLive: false } };
    });
  }, [logEvent]);

  const activeAlertsForBeach = useCallback((beachId) => {
    return alerts
      .filter((a) => a.beachId === beachId && !a.resolved && a.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [alerts, now]);

  const value = {
    beaches, alerts, auditLog, liveByBeach, now,
    publishAlert, resolveAlert, toggleLive, setBeachFlag, activeAlertsForBeach,
  };

  return <BeachDataContext.Provider value={value}>{children}</BeachDataContext.Provider>;
}

export function useBeachData() {
  const ctx = useContext(BeachDataContext);
  if (!ctx) throw new Error("useBeachData must be used inside a BeachDataProvider");
  return ctx;
}
