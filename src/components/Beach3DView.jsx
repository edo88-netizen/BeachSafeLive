import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { HAZARD_TYPES } from "../store/beachData";

/* ============================================================================
   IMPORTANT HONESTY NOTE (also surfaced in the UI itself):
   This is a STYLIZED, SCHEMATIC 3D view — sand and water planes with the
   same hazard markers and zone outlines as the 2D map, converted into 3D
   space. It is NOT photographic Street View of the real beach. True
   photographic 3D exploration would require real 360°/drone imagery
   captured per beach, which is out of scope for this prototype. What's
   built here is honest and still useful: it mirrors the real safety data
   (swim zones, closed areas, hazard positions) in an immersive, explorable
   way, using the exact same mapFeatures the admin drew on the 2D map.
   ============================================================================ */

const METERS_PER_DEG_LAT = 111320;
const SCENE_SCALE = 1 / 6; // shrinks real-world meters down to a walkable-feeling scene

function toLocalXZ(lat, lng, centerLat, centerLng) {
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((centerLat * Math.PI) / 180);
  const x = (lng - centerLng) * metersPerDegLng * SCENE_SCALE;
  const z = (centerLat - lat) * METERS_PER_DEG_LAT * SCENE_SCALE; // north = -Z
  return [x, z];
}

function polygonShape(points, centerLat, centerLng) {
  const shape = new THREE.Shape();
  points.forEach(([lat, lng], i) => {
    const [x, z] = toLocalXZ(lat, lng, centerLat, centerLng);
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  return shape;
}

export default function Beach3DView({ beach, onBack }) {
  const containerRef = useRef(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer, camera, controls, animationId;
    const scene = new THREE.Scene();

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    scene.background = new THREE.Color("#bfe3f0"); // sky

    camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 16, 26);
    camera.lookAt(0, 0, 0);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.HemisphereLight("#ffffff", "#dfc38a", 0.9));
    const sun = new THREE.DirectionalLight("#fff6e0", 1.1);
    sun.position.set(20, 30, 10);
    scene.add(sun);

    // Ground (sand)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: "#dfae68", roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const mapFeatures = beach.mapFeatures || { swimZone: null, closedZones: [], hazardMarkers: [] };
    const centerLat = beach.lat;
    const centerLng = beach.lng;

    // Swim zone — teal translucent footprint, matches the 2D map's green outline
    if (mapFeatures.swimZone) {
      const shape = polygonShape(mapFeatures.swimZone.points, centerLat, centerLng);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshStandardMaterial({ color: "#0d9488", transparent: true, opacity: 0.55, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.05;
      scene.add(mesh);
    }

    // Closed zones — red translucent footprint
    (mapFeatures.closedZones || []).forEach((zone) => {
      const shape = polygonShape(zone.points, centerLat, centerLng);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshStandardMaterial({ color: "#dc2626", transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.06;
      scene.add(mesh);
    });

    // Hazard markers — a pole + colored sphere, matching the 2D map's pin colors
    (mapFeatures.hazardMarkers || []).forEach((h) => {
      const [x, z] = toLocalXZ(h.lat, h.lng, centerLat, centerLng);
      const color = HAZARD_TYPES[h.type]?.color || "#f59e0b";

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8),
        new THREE.MeshStandardMaterial({ color: "#44403c" })
      );
      pole.position.set(x, 1.1, z);
      scene.add(pole);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25 })
      );
      marker.position.set(x, 2.35, z);
      scene.add(marker);
    });

    // Controls — drag to look around, scroll to zoom, matching the request
    // for a "walk around and look" style exploration.
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't let the camera go below ground
    controls.minDistance = 6;
    controls.maxDistance = 60;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      if (container) container.innerHTML = "";
    };
  }, [beach]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-stone-900/90 text-white">
        <div>
          <p className="font-display font-bold text-sm">{beach.name} — 3D Beach View</p>
          <p className="text-xs text-stone-300">Drag to look around · scroll or pinch to zoom</p>
        </div>
        <button onClick={onBack} className="bg-white text-stone-800 rounded-full px-3 py-1.5 text-sm font-bold">
          Back to map
        </button>
      </div>

      <div ref={containerRef} className="flex-1" />

      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900 text-white p-6 text-center">
          <p className="text-sm">3D view isn't supported on this device or browser. Try the regular map instead.</p>
        </div>
      )}

      <div className="px-4 py-2.5 bg-stone-900/90 text-stone-300 text-xs text-center">
        Stylized 3D representation using the same hazard data as the map — not a real photo of this beach.
      </div>
    </div>
  );
}
