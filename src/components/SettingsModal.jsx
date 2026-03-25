import React, { useState, useEffect } from "react";

// --- SPEED LEVEL CONSTANTS (No % visible) ---
const DRIP_SPEED_LEVELS = [
  { level: 1, label: "🐢 Gentle",   desc: "Low-water crops, cool climates" },
  { level: 2, label: "🌿 Moderate", desc: "General purpose – most crops" },
  { level: 3, label: "🔥 Vigorous", desc: "High-demand crops, hot climates" },
];

const SURFACE_SPEED_LEVELS = [
  { level: 1, label: "💧 Low",    desc: "Sandy soil, light flooding" },
  { level: 2, label: "🌊 Medium", desc: "Standard clay/loam fields" },
  { level: 3, label: "🚿 High",   desc: "Dense clay, deep furrows" },
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

export default function SettingsModal({
  onClose,
  activeDevice,
  token,
  httpUrl,
  refreshDevices,
  onLogout,
  customCrops = [],
  refreshCrops,
}) {
  const [activeTab, setActiveTab] = useState("hardware");

  // ==========================================
  // HARDWARE & DANGER STATE
  // ==========================================
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isEditingDevice, setIsEditingDevice] = useState(false);
  
  // Added token to state
  const [deviceForm, setDeviceForm] = useState({
    name: "",
    token: "",
    thinkspeakChannel: "",
    thinkspeakReadKey: "",
    thinkspeakWriteKey: "",
  });

  // Added token to pre-fill effect
  useEffect(() => {
    if (activeDevice) {
      setDeviceForm({
        name: activeDevice.name || "",
        token: activeDevice.token || "",
        thinkspeakChannel: activeDevice.thinkspeakChannel || "",
        thinkspeakReadKey: activeDevice.thinkspeakReadKey || "",
        thinkspeakWriteKey: activeDevice.thinkspeakWriteKey || "",
      });
    }
  }, [activeDevice]);

  // ==========================================
  // CROP MANAGEMENT STATE
  // ==========================================
  const [cropView, setCropView] = useState("list"); 
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  
  const defaultCropForm = {
    id: null,
    name: "",
    irrigationMode: "drip", 
    dripDuration: 30,
    dripSpeedLevel: 2,
    surfaceQuantity: 5.0,
    surfaceDuration: 30,
    surfaceSpeedLevel: 2,
  };
  const [cropForm, setCropForm] = useState(defaultCropForm);

  // --- DEVICE HANDLERS ---
  const handleUpdateDevice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${httpUrl}/api/devices/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId: activeDevice.id, ...deviceForm }),
      });
      if (res.ok) {
        alert("Device updated successfully.");
        refreshDevices();
        setIsEditingDevice(false);
      } else {
        alert("Update failed.");
      }
    } catch (err) {
      alert("Error updating device.");
    }
  };

  const handleDeleteDevice = async () => {
    if (!activeDevice) return;
    if (!window.confirm(`Unlink ${activeDevice.name} from your account?`)) return;
    setIsDeletingDevice(true);
    try {
      const res = await fetch(`${httpUrl}/api/devices/unlink`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId: activeDevice.id }),
      });
      if (res.ok) {
        alert("Device unlinked.");
        refreshDevices();
        onClose();
      }
    } catch (err) { alert("Error unlinking."); }
    finally { setIsDeletingDevice(false); }
  };

  const handlePermanentDeleteDevice = async () => {
    if (!activeDevice) return;
    if (!window.confirm(`PERMANENTLY delete ${activeDevice.name}? This destroys the device ID.`)) return;
    try {
      const res = await fetch(`${httpUrl}/api/devices/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId: activeDevice.id }),
      });
      if (res.ok) {
        alert("Device permanently deleted.");
        refreshDevices();
        onClose();
      }
    } catch (err) {}
  };

  const handleFinalDeleteAccount = async () => {
    if (!confirmPassword) return alert("Enter password.");
    setIsDeletingAccount(true);
    try {
      const res = await fetch(`${httpUrl}/api/auth/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: confirmPassword }),
      });
      if (res.ok) { alert("Account deleted."); onLogout(); }
    } catch (err) {}
    finally { setIsDeletingAccount(false); }
  };

  // --- CROP HANDLERS ---
  const handleOpenAddCrop = () => {
    setCropForm(defaultCropForm);
    setCropView("add");
  };

  const handleOpenEditCrop = (crop) => {
    setCropForm({
      id: crop._id,
      name: crop.name,
      irrigationMode: "drip",
      dripDuration: crop.dripDuration,
      dripSpeedLevel: crop.dripSpeedLevel,
      surfaceQuantity: crop.surfaceQuantity,
      surfaceDuration: crop.surfaceDuration,
      surfaceSpeedLevel: crop.surfaceSpeedLevel,
    });
    setCropView("edit");
  };

  const handleDeleteCrop = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the plant: ${name}?`)) return;
    try {
      const res = await fetch(`${httpUrl}/api/crops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        refreshCrops();
      } else {
        alert("Failed to delete plant.");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleSaveCrop = async (e) => {
    e.preventDefault();
    setIsSavingCrop(true);
    
    const url = cropView === "add" ? `${httpUrl}/api/crops` : `${httpUrl}/api/crops/${cropForm.id}`;
    const method = cropView === "add" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: cropForm.name,
          dripDuration: Number(cropForm.dripDuration),
          dripSpeedLevel: cropForm.dripSpeedLevel,
          surfaceQuantity: Number(cropForm.surfaceQuantity),
          surfaceDuration: Number(cropForm.surfaceDuration),
          surfaceSpeedLevel: cropForm.surfaceSpeedLevel,
        }),
      });

      if (res.ok) {
        refreshCrops();
        setCropView("list");
      } else {
        alert("Failed to save plant.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSavingCrop(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10010 }}>
      <div className="settings-card">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`modal-tab-btn ${activeTab === "hardware" ? "active" : ""}`} 
            onClick={() => { setActiveTab("hardware"); setIsEditingDevice(false); }}
          >
            Hardware
          </button>
          <button 
            className={`modal-tab-btn ${activeTab === "crops" ? "active" : ""}`} 
            onClick={() => { setActiveTab("crops"); setCropView("list"); }}
          >
            Plants
          </button>
          <button 
            className={`modal-tab-btn ${activeTab === "danger" ? "active" : ""}`} 
            onClick={() => setActiveTab("danger")}
          >
            Danger Zone
          </button>
        </div>

        {/* ==========================================
            HARDWARE TAB
            ========================================== */}
        {activeTab === "hardware" && (
          <section className="settings-section">
            <div className="settings-item">
              {!isEditingDevice ? (
                <>
                  <p>Active: <strong>{activeDevice?.name || "None"}</strong></p>
                  <p className="device-id-text">ID: {activeDevice?.id || "N/A"}</p>
                  {activeDevice && (
                    <div className="btn-group-row">
                      <button className="btn-device-edit" onClick={() => setIsEditingDevice(true)}>
                        Edit Parameters
                      </button>
                      <button className="btn-unlink" onClick={handleDeleteDevice} disabled={isDeletingDevice}>
                        {isDeletingDevice ? "Unlinking..." : "Unlink Device"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleUpdateDevice} className="edit-device-form">
                  <div className="form-group">
                    <label>Device Name:</label>
                    <input type="text" value={deviceForm.name} onChange={e => setDeviceForm({...deviceForm, name: e.target.value})} required />
                  </div>
                  {/* ADDED TOKEN INPUT HERE */}
                  <div className="form-group">
                    <label>Device Token:</label>
                    <input type="text" value={deviceForm.token} onChange={e => setDeviceForm({...deviceForm, token: e.target.value})} required placeholder="Update security token" />
                  </div>
                  <div className="form-group">
                    <label>ThingSpeak Channel ID:</label>
                    <input type="text" value={deviceForm.thinkspeakChannel} onChange={e => setDeviceForm({...deviceForm, thinkspeakChannel: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>ThingSpeak Read Key:</label>
                    <input type="text" value={deviceForm.thinkspeakReadKey} onChange={e => setDeviceForm({...deviceForm, thinkspeakReadKey: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>ThingSpeak Write Key:</label>
                    <input type="text" value={deviceForm.thinkspeakWriteKey} onChange={e => setDeviceForm({...deviceForm, thinkspeakWriteKey: e.target.value})} />
                  </div>
                  <div className="btn-group-row">
                    <button type="submit" className="btn-primary">Save Changes</button>
                    <button type="button" className="btn-cancel" onClick={() => setIsEditingDevice(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}

        {/* ==========================================
            CROPS TAB
            ========================================== */}
        {activeTab === "crops" && (
          <section className="settings-section">
            {cropView === "list" && (
              <>
                <button className="btn-primary" style={{ width: "100%", marginBottom: "16px" }} onClick={handleOpenAddCrop}>
                  + Add Custom Plant
                </button>
                {customCrops.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)" }}>No custom plants added yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {customCrops.map(crop => (
                      <div key={crop._id} className="settings-item" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "12px" }}>
                        <strong style={{ fontSize: "1.05rem" }}>{crop.name}</strong>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => handleOpenEditCrop(crop)}>
                            Edit
                          </button>
                          <button className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => handleDeleteCrop(crop._id, crop.name)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {(cropView === "add" || cropView === "edit") && (
              <form onSubmit={handleSaveCrop} className="edit-device-form">
                <div className="form-group">
                  <label>Plant / Crop Name:</label>
                  <input type="text" value={cropForm.name} onChange={e => setCropForm({...cropForm, name: e.target.value})} required placeholder="e.g. Strawberry" />
                </div>

                <div className="btn-group-row" style={{ marginBottom: "20px" }}>
                  <button type="button" className={cropForm.irrigationMode === "drip" ? "btn-primary" : "btn-secondary"} onClick={() => setCropForm({...cropForm, irrigationMode: "drip"})}>
                    💧 Drip Settings
                  </button>
                  <button type="button" className={cropForm.irrigationMode === "surface" ? "btn-primary" : "btn-secondary"} onClick={() => setCropForm({...cropForm, irrigationMode: "surface"})}>
                    🌊 Surface Settings
                  </button>
                </div>

                {cropForm.irrigationMode === "drip" && (
                  <div className="fade-in-section">
                    <div className="form-group">
                      <label>Duration (Minutes):</label>
                      <input type="number" min="1" value={cropForm.dripDuration} onChange={e => setCropForm({...cropForm, dripDuration: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Pump Intensity:</label>
                      <SpeedLevelPicker levels={DRIP_SPEED_LEVELS} value={cropForm.dripSpeedLevel} onChange={val => setCropForm({...cropForm, dripSpeedLevel: val})} />
                    </div>
                  </div>
                )}

                {cropForm.irrigationMode === "surface" && (
                  <div className="fade-in-section">
                    <div className="form-group">
                      <label>Volume (Liters):</label>
                      <input type="number" min="0.1" step="0.1" value={cropForm.surfaceQuantity} onChange={e => setCropForm({...cropForm, surfaceQuantity: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Time Fallback (Minutes):</label>
                      <input type="number" min="1" value={cropForm.surfaceDuration} onChange={e => setCropForm({...cropForm, surfaceDuration: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Pump Intensity:</label>
                      <SpeedLevelPicker levels={SURFACE_SPEED_LEVELS} value={cropForm.surfaceSpeedLevel} onChange={val => setCropForm({...cropForm, surfaceSpeedLevel: val})} />
                    </div>
                  </div>
                )}

                <div className="btn-group-row" style={{ marginTop: "24px" }}>
                  <button type="submit" className="btn-primary" disabled={isSavingCrop}>
                    {isSavingCrop ? "Saving..." : "Save Plant"}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setCropView("list")}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* ==========================================
            DANGER ZONE TAB
            ========================================== */}
        {activeTab === "danger" && (
          <section className="settings-section danger-zone" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
            {activeDevice && (
               <button className="btn-delete-account btn-permanent-delete" onClick={handlePermanentDeleteDevice}>
                 Permanently Destroy Active Device
               </button>
            )}

            {!showPasswordInput ? (
              <button className="btn-delete-account" onClick={() => setShowPasswordInput(true)}>
                Delete My Account
              </button>
            ) : (
              <div className="confirm-delete-box">
                <p>Enter password to confirm permanent deletion:</p>
                <input type="password" className="settings-input" placeholder="Your Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <div className="btn-group-row">
                  <button className="btn-final-delete" onClick={handleFinalDeleteAccount} disabled={isDeletingAccount}>
                    {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button className="btn-secondary" onClick={() => setShowPasswordInput(false)}>Cancel</button>
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}