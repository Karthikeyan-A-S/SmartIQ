import React, { useState } from 'react';

export default function AddDeviceModal({ onClose, token, httpUrl, refreshDevices }) {
  const [tab, setTab] = useState('new'); // 'new' or 'existing'
  const [generatedId, setGeneratedId] = useState(null);

  // State for Claiming Existing Device
  const [existId, setExistId] = useState('');
  const [existToken, setExistToken] = useState('');

  // State for Creating New Device
  const [newName, setNewName] = useState('');
  const [newToken, setNewToken] = useState('');
  const [tsChannel, setTsChannel] = useState('');
  const [tsRead, setTsRead] = useState('');
  const [tsWrite, setTsWrite] = useState('');

  const handleClaim = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${httpUrl}/api/devices/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId: existId, deviceToken: existToken }) 
      });
      const data = await res.json();
      if (res.ok) {
        refreshDevices();
        onClose();
      } else {
        alert(`Failed: ${data.error || "Could not claim device."}`);
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${httpUrl}/api/devices/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          name: newName, 
          token: newToken, 
          thinkspeakChannel: tsChannel, 
          thinkspeakReadKey: tsRead,
          thinkspeakWriteKey: tsWrite
        }) 
      });
      const data = await res.json();
      if (res.ok) {
        refreshDevices();
        setGeneratedId(data.device.id); 
      } else {
        alert(`Failed: ${data.error || "Could not create device."}`);
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  // --- UI: SUCCESS SCREEN AFTER CREATION ---
  if (generatedId) {
    return (
      <div className="modal-overlay">
        <div className="card auth-card text-center">
          <h2>✅ Device Created!</h2>
          <p className="subtitle">Your hardware is now registered. Enter this ID into your Raspberry Pi code:</p>
          <div className="success-id-box">
            <h1 className="success-id-text">{generatedId}</h1>
          </div>
          <button className="btn-primary btn-block" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  // --- UI: MAIN TABS ---
  return (
    <div className="modal-overlay">
      <div className="card auth-card">
        
        {/* Tab Selection */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab-btn ${tab === 'new' ? 'active' : ''}`}
            onClick={() => setTab('new')}
          >
            Create New Device
          </button>
          <button 
            className={`modal-tab-btn ${tab === 'existing' ? 'active' : ''}`}
            onClick={() => setTab('existing')}
          >
            Link Existing
          </button>
        </div>

        {/* CREATE NEW TAB */}
        {tab === 'new' && (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Device Name:</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Farm Node 1" />
            </div>
            <div className="form-group">
              <label>Create a Security Token:</label>
              <input type="password" value={newToken} onChange={e => setNewToken(e.target.value)} required placeholder="Create a password for this Pi" />
            </div>
            <div className="form-group">
              <label>ThingSpeak Channel ID (Optional):</label>
              <input type="text" value={tsChannel} onChange={e => setTsChannel(e.target.value)} />
            </div>
            <div className="form-group">
              <label>ThingSpeak Read Key (Optional):</label>
              <input type="text" value={tsRead} onChange={e => setTsRead(e.target.value)} />
            </div>
            <div className="form-group">
              <label>ThingSpeak Write Key (Optional):</label>
              <input type="text" value={tsWrite} onChange={e => setTsWrite(e.target.value)} />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn-primary">Generate</button>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}

        {/* CLAIM EXISTING TAB */}
        {tab === 'existing' && (
          <form onSubmit={handleClaim}>
            <div className="form-group">
              <label>Device ID (from Pi):</label>
              <input type="text" value={existId} onChange={e => setExistId(e.target.value)} required placeholder="e.g. PI_A1B2C3D4" />
            </div>
            <div className="form-group">
              <label>Hardware Security Token:</label>
              <input type="password" value={existToken} onChange={e => setExistToken(e.target.value)} required placeholder="e.g. secret123" />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn-primary">Link Device</button>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}