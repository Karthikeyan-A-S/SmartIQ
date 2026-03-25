import React, { useState } from "react";

// Speed level definitions shared between drip and surface selectors.
// These map to actual pump % values sent to the ESP32 via treeSpeed.
const DRIP_SPEED_LEVELS = [
  { level: 1, label: "🐢 Gentle",   speed: 40, desc: "Low-water crops, cool climates" },
  { level: 2, label: "🌿 Moderate", speed: 60, desc: "General purpose – most crops" },
  { level: 3, label: "🔥 Vigorous", speed: 80, desc: "High-demand crops, hot climates" },
];

const SURFACE_SPEED_LEVELS = [
  { level: 1, label: "💧 Low",    speed: 40,  desc: "Sandy soil, light flooding" },
  { level: 2, label: "🌊 Medium", speed: 70,  desc: "Standard clay/loam fields" },
  { level: 3, label: "🚿 High",   speed: 100, desc: "Dense clay, deep furrows" },
];

function SpeedLevelPicker({ levels, value, onChange }) {
  return (
    <div className="speed-level-picker">
      {levels.map(({ level, label, speed, desc }) => (
        <button
          key={level}
          type="button"
          className={`speed-level-btn${value === level ? " active" : ""}`}
          onClick={() => onChange(level)}
          title={desc}
        >
          <span className="slb-label">{label}</span>
          <span className="slb-speed">{speed}%</span>
          <span className="slb-desc">{desc}</span>
        </button>
      ))}
    </div>
  );
}

export default function AddCropModal({ onClose, token, httpUrl, refreshCrops }) {
  const [name, setName] = useState("");
  const [dripDuration, setDripDuration] = useState(30);
  const [surfaceQuantity, setSurfaceQuantity] = useState(5.0);
  const [surfaceDuration, setSurfaceDuration] = useState(30);
  const [dripSpeedLevel, setDripSpeedLevel] = useState(2);     // default: Moderate
  const [surfaceSpeedLevel, setSurfaceSpeedLevel] = useState(2); // default: Medium
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${httpUrl}/api/crops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          dripDuration: Number(dripDuration),
          surfaceQuantity: Number(surfaceQuantity),
          surfaceDuration: Number(surfaceDuration),
          dripSpeedLevel,
          surfaceSpeedLevel,
        }),
      });

      if (res.ok) {
        refreshCrops();
        onClose();
      } else {
        alert("Failed to save custom plant.");
      }
    } catch (err) {
      alert("Network error. Is the server running?");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10010 }}>
      <div className="settings-card" style={{ maxWidth: "460px" }}>
        <div className="settings-header">
          <h2>🌱 Create Custom Plant</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Basic Info ─────────────────────────────────── */}
          <div className="form-group">
            <label>Plant / Crop Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Strawberry"
            />
          </div>

          {/* ── Drip Section ───────────────────────────────── */}
          <div className="crop-section-divider">
            <span>💧 Drip Irrigation</span>
          </div>

          <div className="form-group">
            <label>Duration (Minutes):</label>
            <input
              type="number"
              min="1"
              value={dripDuration}
              onChange={(e) => setDripDuration(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Pump Speed Level:
              <span className="form-hint">
                Sets the warm-up base speed in AUTO drip mode.
                After 3 s the ESP32 auto-adjusts using live temp & humidity.
              </span>
            </label>
            <SpeedLevelPicker
              levels={DRIP_SPEED_LEVELS}
              value={dripSpeedLevel}
              onChange={setDripSpeedLevel}
            />
          </div>

          {/* ── Surface Section ────────────────────────────── */}
          <div className="crop-section-divider">
            <span>🌊 Surface Irrigation</span>
          </div>

          <div className="form-group">
            <label>Volume (Liters):</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={surfaceQuantity}
              onChange={(e) => setSurfaceQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Time (Minutes):</label>
            <input
              type="number"
              min="1"
              value={surfaceDuration}
              onChange={(e) => setSurfaceDuration(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Pump Speed Level:
              <span className="form-hint">
                Used in manual surface mode. AUTO surface always runs at 100%.
              </span>
            </label>
            <SpeedLevelPicker
              levels={SURFACE_SPEED_LEVELS}
              value={surfaceSpeedLevel}
              onChange={setSurfaceSpeedLevel}
            />
          </div>

          <div className="btn-group-row" style={{ marginTop: "24px" }}>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Custom Plant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}