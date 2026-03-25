import React, { useState, useEffect } from "react";
import AddCropModal from "./AddCropModal";
 
// FIX: Added the exact speed percentages (15/25/35 for Drip, 70/85/100 for Surface) 
// to the default plants so they don't break the system!
const cropData = {
  tomato:  { name: "Tomato", dripDuration: 45, surfaceQuantity: 4.0, surfaceDuration: 20, dripSpeed: 25, surfaceSpeed: 85 },
  banana:  { name: "Banana", dripDuration: 90, surfaceQuantity: 12.0, surfaceDuration: 40, dripSpeed: 35, surfaceSpeed: 100 },
  mango:   { name: "Mango", dripDuration: 120, surfaceQuantity: 25.0, surfaceDuration: 60, dripSpeed: 25, surfaceSpeed: 85 },
  coconut: { name: "Coconut", dripDuration: 150, surfaceQuantity: 40.0, surfaceDuration: 90, dripSpeed: 35, surfaceSpeed: 100 },
};
 
function CropDropdownOptions({ customCrops }) {
  return (
    <>
      <option value="none">— Select a Plant / Tree —</option>
      <optgroup label="Default Plants">
        <option value="tomato">Tomato</option>
        <option value="banana">Banana</option>
        <option value="mango">Mango</option>
        <option value="coconut">Coconut</option>
      </optgroup>
      {customCrops.length > 0 && (
        <optgroup label="My Custom Plants">
          {customCrops.map((c) => (
            <option key={c._id} value={`custom_${c._id}`}>{c.name}</option>
          ))}
        </optgroup>
      )}
    </>
  );
}
 
export default function Dashboard({ sensorData, isCloudOnline, sendCommand, customCrops, refreshCrops, token, httpUrl }) {
  const [salinityInput, setSalinityInput] = useState("");
  const [currentSalinity, setCurrentSalinity] = useState(null);
  const [masterMode, setMasterMode] = useState("manual");
 
  const [autoPlantType, setAutoPlantType] = useState("none");
  const [autoMethod, setAutoMethod] = useState("drip");
 
  const [manualMode, setManualMode] = useState("none");
  const [plantDataset, setPlantDataset] = useState("none");
 
  const [dripStartNow, setDripStartNow] = useState(true);
  const [dripStartTime, setDripStartTime] = useState("");
  const [dripDuration, setDripDuration] = useState(30);
 
  const [surfaceControl, setSurfaceControl] = useState("volume");
  const [surfaceQuantity, setSurfaceQuantity] = useState(5.0);
  const [surfaceStartNow, setSurfaceStartNow] = useState(true);
  const [surfaceStartTime, setSurfaceStartTime] = useState("");
  const [surfaceDuration, setSurfaceDuration] = useState(30);
 
  const [overrideSpeed, setOverrideSpeed] = useState(100);
 
  const [showCropModal, setShowCropModal] = useState(false);
 
  // --- HELPER FUNCTION: Safely get crop data whether it's custom or default ---
  const getSelectedCropData = (cropId) => {
    if (cropId === "none") return null;
    if (cropId.startsWith("custom_")) {
      const id = cropId.replace("custom_", "");
      return customCrops.find((c) => c._id === id);
    }
    return cropData[cropId];
  };

  const getSalinityInfo = (ec) => {
    if (ec === null) return null;
    if (ec < 1.5) return { level: "normal", label: "✅ Normal", cls: "sal-normal", factor: 1.0, dripAdj: 0 };
    if (ec < 3.0) return { level: "moderate", label: "⚠️ Moderate", cls: "sal-moderate", factor: 0.85, dripAdj: -8 };
    return { level: "high", label: "🔴 High", cls: "sal-high", factor: 0.65, dripAdj: -15 };
  };
  const salInfo = getSalinityInfo(currentSalinity);
 
  const handleSetSalinity = () => {
    const val = parseFloat(salinityInput);
    if (!isNaN(val) && val >= 0 && val <= 20) setCurrentSalinity(val);
    else alert("Enter a valid EC value (0–20 mS/cm)");
  };
 
  useEffect(() => {
    if (plantDataset === "none") return;
    const data = getSelectedCropData(plantDataset);
 
    if (data) {
      if (manualMode === "drip") {
        setDripDuration(data.dripDuration);
      } else if (manualMode === "surface") {
        if (surfaceControl === "volume") setSurfaceQuantity(data.surfaceQuantity);
        else setSurfaceDuration(data.surfaceDuration);
      }
    }
  }, [plantDataset, manualMode, surfaceControl, customCrops]);
 
  // // FIX: Added treeSpeed injection to AUTO command
  // const handleAutoSubmit = (e) => {
  //   e.preventDefault();
  //   if (autoPlantType === "none") return alert("Please select a plant type.");
    
  //   const cropDataObj = getSelectedCropData(autoPlantType);
  //   const targetSpeed = autoMethod === "drip" ? cropDataObj?.dripSpeed : cropDataObj?.surfaceSpeed;
  //   const fallbackSpeed = autoMethod === "drip" ? 25 : 85;

  //   sendCommand("AUTO", { 
  //     treeType: cropDataObj ? cropDataObj.name : autoPlantType, 
  //     irrigationMethod: autoMethod, 
  //     salinity: currentSalinity,
  //     treeSpeed: targetSpeed || fallbackSpeed
  //   });
  // };
 const handleAutoSubmit = (e) => {
    e.preventDefault();
    
    // 1. Check if a specific plant is selected
    const cropDataObj = getSelectedCropData(autoPlantType);
    
    // 2. If selected, use its exact speed. If "none", send 0 to trigger Smart Weather Mode
    let targetSpeed = 0; 
    let displayName = "🧠 Smart Weather AI";

    if (cropDataObj) {
      targetSpeed = autoMethod === "drip" ? cropDataObj.dripSpeed : cropDataObj.surfaceSpeed;
      displayName = cropDataObj.name;
    }

    // 3. Send the payload
    sendCommand("AUTO", { 
      treeType: displayName, 
      irrigationMethod: autoMethod, 
      salinity: currentSalinity,
      treeSpeed: targetSpeed 
    });
  };
  // FIX: Added speed injection to MANUAL DRIP command
  const handleDripSubmit = (e) => {
    e.preventDefault();
    const cropDataObj = getSelectedCropData(plantDataset);
    const targetSpeed = cropDataObj?.dripSpeed || 25; // Default 25 if no plant selected

    sendCommand("DRIP", {
      startTime: dripStartNow ? "NOW" : dripStartTime,
      duration: Number(dripDuration),
      salinity: currentSalinity,
      speed: targetSpeed
    });
  };
 
  // FIX: Added speed injection to MANUAL SURFACE command
  const handleSurfaceSubmit = (e) => {
    e.preventDefault();
    const cropDataObj = getSelectedCropData(plantDataset);
    const targetSpeed = cropDataObj?.surfaceSpeed || 85; // Default 85 if no plant selected

    let payload = { 
      controlType: surfaceControl, 
      salinity: currentSalinity,
      speed: targetSpeed 
    };
    
    if (surfaceControl === "volume") {
      payload.quantity = Number(surfaceQuantity);
    } else {
      payload.startTime = surfaceStartNow ? "NOW" : surfaceStartTime;
      payload.duration = Number(surfaceDuration);
    }
    sendCommand("SURFACE", payload);
  };
 
  const isDry = sensorData.soilMoisture?.toLowerCase() === "dry";
 
  return (
    <div className="container">
      {/* --- ACTIVE ACTION BANNER --- */}
      {sensorData?.pumpStatus === "ON" && (
        <div className="active-action-banner">
          <div className="banner-info">
            <span className="banner-icon">💦</span>
            <div>
              <strong>
                {sensorData?.systemMode === "AUTO" 
                  ? "🤖 Auto-Pilot Irrigation Running" 
                  : "🌊 Manual Irrigation Active"}
              </strong>
              <p>The water pump is currently dispensing at {sensorData?.pumpSpeed || 100}% speed.</p>
            </div>
          </div>
          <button 
            className="btn-danger banner-cancel-btn" 
            onClick={() => sendCommand("CANCEL")}
          >
            ⏹ Cancel Action
          </button>
        </div>
      )}
      
      {/* 1. Live Conditions */}
      <div className="card">
        <div className="card-header">
          <h2>Live Farm Conditions</h2>
          <span className={`badge ${isCloudOnline ? "online" : "offline"}`}>
            {isCloudOnline ? "🟢 Cloud Connected" : "🔴 Cloud Offline"}
          </span>
        </div>
        <div className="sensor-container">
          <SensorBox label="Temperature" value={sensorData.temperature ? `${sensorData.temperature}°C` : "--°C"} />
          <SensorBox label="Humidity" value={sensorData.humidity ? `${sensorData.humidity}%` : "--%"} />
          <SensorBox label="Soil Moisture" value={sensorData.soilMoisture || "--"} />
          <SensorBox label="Rain Status" value={sensorData.rainStatus || "--"} />
          <SensorBox label="Pump Status" value={sensorData.pumpStatus || "OFF"} />
          <div className="sensor-box salinity-live-box">
            <div className="sensor-label">Soil Salinity</div>
            <div className="sensor-val">{currentSalinity !== null ? `${currentSalinity.toFixed(1)} mS` : "— mS"}</div>
            <div className={`sensor-sublabel ${salInfo?.cls}-text`}>{salInfo?.label || "Not Read"}</div>
          </div>
        </div>
        {isDry && masterMode === "manual" && <p className="live-warning">⚠️ Alert: Soil moisture is critically low! Manual irrigation required.</p>}
      </div>
 
      {/* 2. Salinity Config */}
      <div className="card salinity-card">
        <div className="card-header">
          <h2>🧪 Salinity / EC Reading</h2>
          <span className={`badge ${salInfo?.cls || "sal-unread"}`}>{salInfo?.label || "— Not Read"}</span>
        </div>
        <div className="form-group">
          <label>EC Value (mS/cm):</label>
          <input type="number" step="0.1" min="0" max="20" value={salinityInput} onChange={(e) => setSalinityInput(e.target.value)} placeholder="e.g. 1.2" />
        </div>
        <button className="btn-salinity" onClick={handleSetSalinity}>Set Salinity Value</button>
 
        {salInfo && (
          <div className="salinity-info-panel">
            <div className="sal-ec-display"><span className="sal-ec-label">EC Reading</span><span className="sal-ec-value">{currentSalinity.toFixed(2)} mS/cm</span></div>
            <div className="sal-impact-grid">
              <div className="sal-impact-box"><div className="sal-impact-label">💧 Surface Irrigation</div><div className="sal-impact-val">{salInfo.factor === 1 ? "No change" : `−${Math.round((1 - salInfo.factor) * 100)}% volume`}</div></div>
              <div className="sal-impact-box"><div className="sal-impact-label">🌡️ Drip Speed</div><div className="sal-impact-val">{salInfo.dripAdj === 0 ? "No change" : `${salInfo.dripAdj}% PWM`}</div></div>
            </div>
          </div>
        )}
      </div>
 
      {/* 3. Master Mode Toggle */}
      <div className="card">
        <h2>🎛️ Operation Mode</h2>
        <div className="master-toggle">
          <input type="radio" id="modeManual" name="masterMode" checked={masterMode === "manual"} onChange={() => setMasterMode("manual")} />
          <label htmlFor="modeManual">🖐️ Manual</label>
          <input type="radio" id="modeAuto" name="masterMode" checked={masterMode === "auto"} onChange={() => setMasterMode("auto")} />
          <label htmlFor="modeAuto">🤖 Auto-Pilot</label>
        </div>
      </div>
 
      {/* 4. Auto Mode View */}
      {masterMode === "auto" && (
        <div className="card auto-card">
          <h2>🤖 Auto-Pilot Config</h2>
          <form onSubmit={handleAutoSubmit}>
            <div className="form-group">
              <label>Select Tree / Plant Type:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={autoPlantType} onChange={(e) => setAutoPlantType(e.target.value)} style={{ flex: 1 }}>
                  <CropDropdownOptions customCrops={customCrops} />
                </select>
                <button type="button" className="btn-secondary" style={{ flex: '0 0 auto', padding: '10px 14px' }} onClick={() => setShowCropModal(true)}>+ Add</button>
              </div>
            </div>
            <div className="form-group">
              <label>Hardware Irrigation Method:</label>
              <div className="radio-group-box">
                <label className="radio-group"><input type="radio" name="autoMethod" checked={autoMethod === "drip"} onChange={() => setAutoMethod("drip")} /><span className="pill-label">Drip Network</span></label>
                <label className="radio-group"><input type="radio" name="autoMethod" checked={autoMethod === "surface"} onChange={() => setAutoMethod("surface")} /><span className="pill-label">Surface Flow</span></label>
              </div>
            </div>
            <div className="btn-group">
              <button type="submit" className="btn-auto">Enable Auto-Pilot 🚀</button>
              <button type="button" className="btn-cancel" onClick={() => sendCommand("CANCEL")}>Cancel</button>
            </div>
          </form>
        </div>
      )}
 
      {/* 5. Manual Mode View */}
      {masterMode === "manual" && (
        <>
          <div className="card">
            <h2>⚙️ Step 1: Irrigation Mode</h2>
            <select value={manualMode} onChange={(e) => setManualMode(e.target.value)}>
              <option value="none">— Select a Mode —</option>
              <option value="drip">💧 Drip Irrigation</option>
              <option value="surface">🌊 Surface Irrigation</option>
            </select>
          </div>
 
          {manualMode !== "none" && (
            <div className="card smart-guide">
              <h3>💡 Smart Assistant</h3>
              <p className="subtitle">Select a plant type and we'll auto-fill the optimal settings for you.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={plantDataset} onChange={(e) => setPlantDataset(e.target.value)} style={{ flex: 1 }}>
                  <CropDropdownOptions customCrops={customCrops} />
                </select>
                <button type="button" className="btn-secondary" style={{ flex: '0 0 auto', padding: '10px 14px' }} onClick={() => setShowCropModal(true)}>+ Add</button>
              </div>
            </div>
          )}
 
          {manualMode === "drip" && (
            <div className="card">
              <h2>💧 Step 2: Drip Mode</h2>
              <form onSubmit={handleDripSubmit}>
                <div className="input-section">
                  <label className="checkbox-label"><input type="checkbox" checked={dripStartNow} onChange={(e) => setDripStartNow(e.target.checked)} /> Start Immediately (Now)</label>
                  {!dripStartNow && (<div className="form-group" style={{ marginTop: "14px" }}><label>Start Time:</label><input type="time" value={dripStartTime} onChange={(e) => setDripStartTime(e.target.value)} required /></div>)}
                </div>
                <div className="form-group"><label>Duration (Minutes):</label><input type="number" min="1" value={dripDuration} onChange={(e) => setDripDuration(e.target.value)} required /></div>
                <div className="btn-group"><button type="submit" className="btn-primary">Deploy Schedule</button><button type="button" className="btn-cancel" onClick={() => sendCommand("CANCEL")}>Cancel</button></div>
              </form>
            </div>
          )}
 
          {manualMode === "surface" && (
            <div className="card">
              <h2>🌊 Step 2: Surface Mode</h2>
              <form onSubmit={handleSurfaceSubmit}>
                <div className="input-section">
                  <label className="radio-group"><input type="radio" checked={surfaceControl === "volume"} onChange={() => setSurfaceControl("volume")} /> Control by Water Quantity</label>
                  {surfaceControl === "volume" && (<div className="form-group" style={{ marginTop: "14px" }}><label>Target Quantity (Litres):</label><input type="number" step="0.1" value={surfaceQuantity} onChange={(e) => setSurfaceQuantity(e.target.value)} required /></div>)}
                </div>
                <div className="input-section">
                  <label className="radio-group"><input type="radio" checked={surfaceControl === "time"} onChange={() => setSurfaceControl("time")} /> Control by Time &amp; Duration</label>
                  {surfaceControl === "time" && (
                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <label className="checkbox-label"><input type="checkbox" checked={surfaceStartNow} onChange={(e) => setSurfaceStartNow(e.target.checked)} /> Start Immediately (Now)</label>
                      {!surfaceStartNow && (<div className="form-group"><label>Start Time:</label><input type="time" value={surfaceStartTime} onChange={(e) => setSurfaceStartTime(e.target.value)} required /></div>)}
                      <div className="form-group"><label>Duration (Minutes):</label><input type="number" min="1" value={surfaceDuration} onChange={(e) => setSurfaceDuration(e.target.value)} required /></div>
                    </div>
                  )}
                </div>
                <div className="btn-group"><button type="submit" className="btn-primary">Deploy Schedule</button><button type="button" className="btn-cancel" onClick={() => sendCommand("CANCEL")}>Cancel</button></div>
              </form>
            </div>
          )}
        </>
      )}
 
      {/* 6. Emergency Override */}
      <div className="card override-card">
        <h2>🚨 Emergency Override</h2>
        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", justifyContent: "space-between" }}><span>Pump Speed / Power:</span><span style={{ fontWeight: "bold", color: "var(--danger)" }}>{overrideSpeed}%</span></label>
          <input type="range" min="10" max="100" step="5" value={overrideSpeed} onChange={(e) => setOverrideSpeed(e.target.value)} style={{ width: "100%", accentColor: "var(--danger)", cursor: "pointer", marginTop: "8px" }} />
        </div>
        <div className="btn-group">
          <button className="btn-primary" onClick={() => sendCommand("OVERRIDE", { state: "ON", speed: parseInt(overrideSpeed) })}>⚡ FORCE PUMP ON</button>
          <button className="btn-danger" onClick={() => sendCommand("OVERRIDE", { state: "OFF" })}>⛔ FORCE PUMP OFF</button>
        </div>
      </div>
 
      {showCropModal && (
        <AddCropModal
          onClose={() => setShowCropModal(false)}
          token={token}
          httpUrl={httpUrl}
          refreshCrops={refreshCrops}
        />
      )}
    </div>
  );
}
 
function SensorBox({ label, value }) {
  return (
    <div className="sensor-box">
      <div className="sensor-label">{label}</div>
      <div className="sensor-val">{value}</div>
    </div>
  );
}