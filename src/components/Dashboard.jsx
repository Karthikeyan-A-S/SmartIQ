import React, { useState, useEffect } from "react";

// Crop Dataset from your vanilla JS
const cropData = {
  tomato: { dripDuration: 45, surfaceQuantity: 4.0, surfaceDuration: 20 },
  banana: { dripDuration: 90, surfaceQuantity: 12.0, surfaceDuration: 40 },
  mango: { dripDuration: 120, surfaceQuantity: 25.0, surfaceDuration: 60 },
  coconut: { dripDuration: 150, surfaceQuantity: 40.0, surfaceDuration: 90 },
};

export default function Dashboard({ sensorData, isCloudOnline, sendCommand }) {
  // Salinity State
  const [salinityInput, setSalinityInput] = useState("");
  const [currentSalinity, setCurrentSalinity] = useState(null);

  // Mode State
  const [masterMode, setMasterMode] = useState("manual"); // 'manual' | 'auto'
  
  // Auto Mode State
  const [autoPlantType, setAutoPlantType] = useState("default");
  const [autoMethod, setAutoMethod] = useState("drip");
  
  // Manual Mode State
  const [manualMode, setManualMode] = useState("none"); // 'drip' | 'surface' | 'none'
  const [plantDataset, setPlantDataset] = useState("none");
  
  // Drip State
  const [dripStartNow, setDripStartNow] = useState(true);
  const [dripStartTime, setDripStartTime] = useState("");
  const [dripDuration, setDripDuration] = useState(30);

  // Surface State
  const [surfaceControl, setSurfaceControl] = useState("volume"); // 'volume' | 'time'
  const [surfaceQuantity, setSurfaceQuantity] = useState(5.0);
  const [surfaceStartNow, setSurfaceStartNow] = useState(true);
  const [surfaceStartTime, setSurfaceStartTime] = useState("");
  const [surfaceDuration, setSurfaceDuration] = useState(30);

  // --- Salinity Logic ---
  const getSalinityInfo = (ec) => {
    if (ec === null) return null;
    if (ec < 1.5) return { level: "normal", label: "✅ Normal", cls: "sal-normal", factor: 1.0, dripAdj: 0 };
    if (ec < 3.0) return { level: "moderate", label: "⚠️ Moderate", cls: "sal-moderate", factor: 0.85, dripAdj: -8 };
    return { level: "high", label: "🔴 High", cls: "sal-high", factor: 0.65, dripAdj: -15 };
  };
  const salInfo = getSalinityInfo(currentSalinity);

  const handleSetSalinity = () => {
    const val = parseFloat(salinityInput);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      setCurrentSalinity(val);
    } else {
      alert("Enter a valid EC value (0–20 mS/cm)");
    }
  };

  // --- Smart Guide Logic ---
  useEffect(() => {
    if (plantDataset === "none") return;
    const data = cropData[plantDataset];
    if (manualMode === "drip") {
      setDripDuration(data.dripDuration);
    } else if (manualMode === "surface") {
      if (surfaceControl === "volume") setSurfaceQuantity(data.surfaceQuantity);
      else setSurfaceDuration(data.surfaceDuration);
    }
  }, [plantDataset, manualMode, surfaceControl]);

  // --- Submit Handlers ---
  const handleAutoSubmit = (e) => {
    e.preventDefault();
    sendCommand("AUTO", { treeType: autoPlantType, irrigationMethod: autoMethod, salinity: currentSalinity });
  };

  const handleDripSubmit = (e) => {
    e.preventDefault();
    sendCommand("DRIP", {
      startTime: dripStartNow ? "NOW" : dripStartTime,
      duration: dripDuration,
      salinity: currentSalinity
    });
  };

  const handleSurfaceSubmit = (e) => {
    e.preventDefault();
    let payload = { controlType: surfaceControl, salinity: currentSalinity };
    if (surfaceControl === "volume") {
      payload.quantity = surfaceQuantity;
    } else {
      payload.startTime = surfaceStartNow ? "NOW" : surfaceStartTime;
      payload.duration = surfaceDuration;
    }
    sendCommand("SURFACE", payload);
  };

  const isDry = sensorData.soilMoisture?.toLowerCase() === "dry";

  return (
    <div className="container">
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
        {isDry && masterMode === "manual" && (
          <p className="live-warning">⚠️ Alert: Soil moisture is critically low! Manual irrigation required.</p>
        )}
        {salInfo?.level === "high" && (
          <p className="live-warning sal-warning">🧪 Alert: High soil salinity! Irrigation quantities are being auto-reduced.</p>
        )}
      </div>

      {/* 2. Salinity Config */}
      <div className="card salinity-card">
        <div className="card-header">
          <h2>🧪 Salinity / EC Reading</h2>
          <span className={`badge ${salInfo?.cls || 'sal-unread'}`}>{salInfo?.label || "— Not Read"}</span>
        </div>
        <p className="subtitle">One-time soil electrical conductivity (EC) reading. Affects water quantity and drip speed.</p>
        <div className="form-group">
          <label>EC Value (mS/cm):</label>
          <input type="number" step="0.1" min="0" max="20" value={salinityInput} onChange={(e) => setSalinityInput(e.target.value)} placeholder="e.g. 1.2" />
        </div>
        <button className="btn-salinity" onClick={handleSetSalinity}>Set Salinity Value</button>

        {salInfo && (
          <div className="salinity-info-panel">
            <div className="sal-ec-display">
              <span className="sal-ec-label">EC Reading</span>
              <span className="sal-ec-value">{currentSalinity.toFixed(2)} mS/cm</span>
            </div>
            <div className="sal-impact-grid">
              <div className="sal-impact-box">
                <div className="sal-impact-label">💧 Surface Irrigation</div>
                <div className="sal-impact-val">{salInfo.factor === 1 ? "No change" : `−${Math.round((1 - salInfo.factor) * 100)}% volume`}</div>
              </div>
              <div className="sal-impact-box">
                <div className="sal-impact-label">🌡️ Drip Speed</div>
                <div className="sal-impact-val">{salInfo.dripAdj === 0 ? "No change" : `${salInfo.dripAdj}% PWM`}</div>
              </div>
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
          <p className="subtitle">System monitors soil, temperature, humidity, and salinity to calculate precise water needs.</p>
          <form onSubmit={handleAutoSubmit}>
            <div className="form-group">
              <label>Select Tree / Plant Type:</label>
              <select value={autoPlantType} onChange={(e) => setAutoPlantType(e.target.value)}>
                <option value="default">Default / Generic Crop</option>
                <option value="tomato">Tomato</option>
                <option value="banana">Banana</option>
                <option value="mango">Mango</option>
                <option value="coconut">Coconut</option>
              </select>
            </div>
            <div className="form-group">
              <label>Hardware Irrigation Method:</label>
              <div className="radio-group-box">
                <label className="radio-group">
                  <input type="radio" name="autoMethod" checked={autoMethod === "drip"} onChange={() => setAutoMethod("drip")} />
                  <span className="pill-label">Drip Network</span>
                </label>
                <label className="radio-group">
                  <input type="radio" name="autoMethod" checked={autoMethod === "surface"} onChange={() => setAutoMethod("surface")} />
                  <span className="pill-label">Surface Flow</span>
                </label>
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
              <select value={plantDataset} onChange={(e) => setPlantDataset(e.target.value)}>
                <option value="none">— Select a Plant / Tree —</option>
                <option value="tomato">Tomato Plant</option>
                <option value="banana">Banana Tree</option>
                <option value="mango">Mango Tree</option>
                <option value="coconut">Coconut Tree</option>
              </select>
            </div>
          )}

          {manualMode === "drip" && (
            <div className="card">
              <h2>💧 Step 2: Drip Mode</h2>
              <form onSubmit={handleDripSubmit}>
                <div className="input-section">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={dripStartNow} onChange={(e) => setDripStartNow(e.target.checked)} /> 
                    &nbsp;Start Immediately (Now)
                  </label>
                  {!dripStartNow && (
                    <div className="form-group" style={{ marginTop: '14px' }}>
                      <label>Start Time:</label>
                      <input type="time" value={dripStartTime} onChange={(e) => setDripStartTime(e.target.value)} required />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Duration (Minutes):</label>
                  <input type="number" min="1" value={dripDuration} onChange={(e) => setDripDuration(e.target.value)} required />
                </div>
                <div className="btn-group">
                  <button type="submit" className="btn-primary">Deploy Schedule</button>
                  <button type="button" className="btn-cancel" onClick={() => sendCommand("CANCEL")}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {manualMode === "surface" && (
            <div className="card">
              <h2>🌊 Step 2: Surface Mode</h2>
              <form onSubmit={handleSurfaceSubmit}>
                <div className="input-section">
                  <label className="radio-group">
                    <input type="radio" checked={surfaceControl === "volume"} onChange={() => setSurfaceControl("volume")} />
                    &nbsp;Control by Water Quantity
                  </label>
                  {surfaceControl === "volume" && (
                    <div className="form-group" style={{ marginTop: '14px' }}>
                      <label>Target Quantity (Litres):</label>
                      <input type="number" step="0.1" value={surfaceQuantity} onChange={(e) => setSurfaceQuantity(e.target.value)} required />
                    </div>
                  )}
                </div>
                <div className="input-section">
                  <label className="radio-group">
                    <input type="radio" checked={surfaceControl === "time"} onChange={() => setSurfaceControl("time")} />
                    &nbsp;Control by Time &amp; Duration
                  </label>
                  {surfaceControl === "time" && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={surfaceStartNow} onChange={(e) => setSurfaceStartNow(e.target.checked)} />
                        &nbsp;Start Immediately (Now)
                      </label>
                      {!surfaceStartNow && (
                        <div className="form-group">
                          <label>Start Time:</label>
                          <input type="time" value={surfaceStartTime} onChange={(e) => setSurfaceStartTime(e.target.value)} required />
                        </div>
                      )}
                      <div className="form-group">
                        <label>Duration (Minutes):</label>
                        <input type="number" min="1" value={surfaceDuration} onChange={(e) => setSurfaceDuration(e.target.value)} required />
                      </div>
                    </div>
                  )}
                </div>
                <div className="btn-group">
                  <button type="submit" className="btn-primary">Deploy Schedule</button>
                  <button type="button" className="btn-cancel" onClick={() => sendCommand("CANCEL")}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* 6. Emergency Override */}
      <div className="card override-card">
        <h2>🚨 Emergency Override</h2>
        <div className="btn-group">
          <button className="btn-primary" onClick={() => sendCommand("OVERRIDE", { state: "ON" })}>⚡ FORCE PUMP ON</button>
          <button className="btn-danger" onClick={() => sendCommand("OVERRIDE", { state: "OFF" })}>⛔ FORCE PUMP OFF</button>
        </div>
      </div>
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