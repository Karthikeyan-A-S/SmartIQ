import React, { useState } from "react";

export default function AddCropModal({ onClose, token, httpUrl, refreshCrops }) {
  const [name, setName] = useState("");
  const [dripDuration, setDripDuration] = useState(30);
  const [surfaceQuantity, setSurfaceQuantity] = useState(5.0);
  const [surfaceDuration, setSurfaceDuration] = useState(30);
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
      <div className="settings-card" style={{ maxWidth: '400px' }}>
        <div className="settings-header">
          <h2>🌱 Create Custom Plant</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plant / Crop Name:</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Strawberry" />
          </div>
          <div className="form-group">
            <label>Drip Irrigation (Minutes):</label>
            <input type="number" min="1" value={dripDuration} onChange={e => setDripDuration(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Surface Volume (Liters):</label>
            <input type="number" min="0.1" step="0.1" value={surfaceQuantity} onChange={e => setSurfaceQuantity(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Surface Time (Minutes):</label>
            <input type="number" min="1" value={surfaceDuration} onChange={e => setSurfaceDuration(e.target.value)} required />
          </div>

          <div className="btn-group-row" style={{ marginTop: '24px' }}>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Custom Plant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}