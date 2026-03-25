import React, { useState } from "react";

// Speed level definitions using the strict 15/25/35 and 70/85/100 percentages
const DRIP_SPEED_LEVELS = [
  { level: 1, label: "🐢 Gentle",   speed: 15, desc: "Low-water crops, cool climates" },
  { level: 2, label: "🌿 Moderate", speed: 25, desc: "General purpose – most crops" },
  { level: 3, label: "🔥 Vigorous", speed: 35, desc: "High-demand crops, hot climates" },
];

const SURFACE_SPEED_LEVELS = [
  { level: 1, label: "💧 Low",    speed: 70,  desc: "Sandy soil, light flooding" },
  { level: 2, label: "🌊 Medium", speed: 85,  desc: "Standard clay/loam fields" },
  { level: 3, label: "🚿 High",   speed: 100, desc: "Dense clay, deep furrows" },
];

function SpeedLevelPicker({ levels, value, onChange }) {
  return (
    <div className="speed-level-picker">
      {levels.map(({ level, label, desc }) => (
        <button
          key={level}
          type="button"
          className={`speed-level-btn${value === level ? " active" : ""}`}
          onClick={() => onChange(level)}
          title={desc}
        >
          <span className="slb-label">{label}</span>
          <span className="slb-desc">{desc}</span>
        </button>
      ))}
    </div>
  );
}

export default function AddCropModal({ onClose, token, httpUrl, refreshCrops }) {
  const [activeTab, setActiveTab] = useState("drip"); // "drip" or "surface"
  const [name, setName] = useState("");
  
  // Drip State
  const [dripDuration, setDripDuration] = useState(30);
  const [dripSpeedLevel, setDripSpeedLevel] = useState(2);     
  
  // Surface State
  const [surfaceQuantity, setSurfaceQuantity] = useState(5.0);
  const [surfaceDuration, setSurfaceDuration] = useState(30);
  const [surfaceSpeedLevel, setSurfaceSpeedLevel] = useState(2); 
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Even if one tab is hidden, all of these state variables are saved!
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
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Global Name Input ── */}
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

          {/* ── Tab Selectors (Styled like Dashboard Buttons) ── */}
          <div className="btn-group-row" style={{ marginBottom: "20px" }}>
            <button 
              type="button" 
              className={activeTab === "drip" ? "btn-primary" : "btn-secondary"} 
              onClick={() => setActiveTab("drip")}
            >
              💧 Drip Settings
            </button>
            <button 
              type="button" 
              className={activeTab === "surface" ? "btn-primary" : "btn-secondary"} 
              onClick={() => setActiveTab("surface")}
            >
              🌊 Surface Settings
            </button>
          </div>

          {/* ── Drip Section Conditional Rendering ── */}
          {activeTab === "drip" && (
            <div className="fade-in-section">
              <div className="form-group">
                <label>Duration (Minutes):</label>
                <input type="number" min="1" value={dripDuration} onChange={(e) => setDripDuration(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Pump Intensity:</label>
                <SpeedLevelPicker levels={DRIP_SPEED_LEVELS} value={dripSpeedLevel} onChange={setDripSpeedLevel} />
              </div>
            </div>
          )}

          {/* ── Surface Section Conditional Rendering ── */}
          {activeTab === "surface" && (
            <div className="fade-in-section">
              <div className="form-group">
                <label>Volume (Liters):</label>
                <input type="number" min="0.1" step="0.1" value={surfaceQuantity} onChange={(e) => setSurfaceQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Time Fallback (Minutes):</label>
                <input type="number" min="1" value={surfaceDuration} onChange={(e) => setSurfaceDuration(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Pump Intensity:</label>
                <SpeedLevelPicker levels={SURFACE_SPEED_LEVELS} value={surfaceSpeedLevel} onChange={setSurfaceSpeedLevel} />
              </div>
            </div>
          )}

          {/* ── Submit Button ── */}
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