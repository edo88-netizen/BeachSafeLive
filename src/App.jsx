import React, { useState } from "react";
import TouristApp from "./apps/TouristApp";
import AdminApp from "./apps/AdminApp";

// NOTE: In production these two experiences are almost certainly two
// separate deployments (e.g. app.beachsafe.gov.au for tourists and
// admin.beachsafe.gov.au for lifesavers) sharing one backend/API.
// They're combined behind this switcher here purely so both can be
// demoed and developed from a single repo. Swap this file for a router
// (or split into two Vite entry points) when splitting the deployments.

export default function App() {
  const [mode, setMode] = useState("tourist"); // tourist | admin

  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center gap-1 bg-slate-900 p-1.5">
        <button
          onClick={() => setMode("tourist")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full ${
            mode === "tourist" ? "bg-white text-slate-900" : "text-slate-400"
          }`}
        >
          Tourist App
        </button>
        <button
          onClick={() => setMode("admin")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full ${
            mode === "admin" ? "bg-white text-slate-900" : "text-slate-400"
          }`}
        >
          Lifesaver Admin
        </button>
      </div>
      <div className="pt-10">
        {mode === "tourist" ? <TouristApp /> : <AdminApp />}
      </div>
    </div>
  );
}
