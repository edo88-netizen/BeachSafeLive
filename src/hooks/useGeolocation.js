import { useState, useCallback, useEffect } from "react";

/* ============================================================================
   Wraps the browser's Geolocation API. Handles every real-world state a
   tourist might hit: no support, permission denied, timeout, or success.
   FUTURE: on native mobile (via a wrapper like Capacitor/React Native) this
   hook's shape stays the same — only the underlying API call changes.
   ============================================================================ */

// status: "idle" | "loading" | "granted" | "denied" | "unavailable" | "error"
export function useGeolocation() {
  const [status, setStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus("granted");
      },
      (err) => {
        // err.code: 1 = permission denied, 2 = position unavailable, 3 = timeout
        setErrorMessage(err.message);
        setStatus(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Ask automatically on first mount — the person can retry manually if it
  // fails, via the `retry` function returned below.
  useEffect(() => {
    request();
  }, [request]);

  return { status, coords, errorMessage, retry: request };
}
