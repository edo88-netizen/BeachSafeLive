import React, { useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HAZARD_TYPES } from "../store/beachData";

/* ============================================================================
   Real satellite imagery via Esri World Imagery — free, no API key required,
   suitable for prototypes and moderate production traffic. FUTURE: for high-
   traffic production use, switch to a licensed tile provider (Mapbox,
   Google Maps Platform, or Esri's paid tier) per their terms of service.

   All markers use custom emoji-based divIcons rather than Leaflet's default
   marker icon — this sidesteps the well-known "broken default icon" bug
   that happens when bundlers (Vite/webpack) process Leaflet, and emoji read
   clearly across languages, which fits the app's multilingual goal.

   This component is intentionally "dumb": it renders whatever data it's
   given and forwards clicks. All the *editing* logic (what a click means —
   placing a hazard, adding a swim-zone corner, etc.) lives in the admin
   screen that uses this component in editable mode.
   ============================================================================ */

const HAZARD_EMOJI = { rip: "🌊", rocks: "⛰️", marine: "🐟", submerged: "⚠️", other: "⚠️" };

function hazardDivIcon(type) {
  const cfg = HAZARD_TYPES[type] || HAZARD_TYPES.other;
  return L.divIcon({
    className: "",
    html: `<div style="background:${cfg.color};width:30px;height:30px;border-radius:9999px;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;font-size:15px;">${HAZARD_EMOJI[type] || "⚠️"}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

const userLocationIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:9999px;box-shadow:0 0 0 6px rgba(37,99,235,0.28);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickForwarder({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function BeachMap({
  beach,
  userLocation,
  editable = false,
  onMapClick,
  draftPoints,
  draftKind, // "swimZone" | "closedZone" | null — styles the in-progress polygon
  onDeleteHazard,
  className = "",
  zoom = 17,
}) {
  const mapFeatures = beach.mapFeatures || { swimZone: null, closedZones: [], hazardMarkers: [] };

  const draftStyle = useMemo(() => {
    if (draftKind === "closedZone") return { color: "#dc2626", weight: 2, dashArray: "6 6", fillColor: "#dc2626", fillOpacity: 0.15 };
    return { color: "#2563eb", weight: 2, dashArray: "6 6", fillColor: "#2563eb", fillOpacity: 0.1 };
  }, [draftKind]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <MapContainer
        center={[beach.lat, beach.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
          maxZoom={19}
        />

        {editable && <ClickForwarder onMapClick={onMapClick} />}

        {mapFeatures.swimZone && (
          <Polygon
            positions={mapFeatures.swimZone.points}
            pathOptions={{ color: "#10b981", weight: 2, fillColor: "#10b981", fillOpacity: 0.22 }}
          />
        )}

        {(mapFeatures.closedZones || []).map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.points}
            pathOptions={{ color: "#dc2626", weight: 2, dashArray: "8 6", fillColor: "#dc2626", fillOpacity: 0.25 }}
          />
        ))}

        {draftPoints && draftPoints.length > 0 && (
          <Polygon positions={draftPoints} pathOptions={draftStyle} />
        )}

        {(mapFeatures.hazardMarkers || []).map((h) => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={hazardDivIcon(h.type)}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: HAZARD_TYPES[h.type]?.color || "#111" }}>
                  {HAZARD_TYPES[h.type]?.label || "Hazard"}
                </p>
                <p style={{ fontSize: 13, marginTop: 4 }}>{h.label}</p>
                {editable && onDeleteHazard && (
                  <button
                    onClick={() => onDeleteHazard(h.id)}
                    style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Remove marker
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
        )}
      </MapContainer>
    </div>
  );
}
