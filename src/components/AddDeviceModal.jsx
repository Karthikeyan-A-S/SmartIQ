import React, { useState } from 'react';

export default function AddDeviceModal({ onClose, token, httpUrl, refreshDevices }) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceToken, setDeviceToken] = useState(''); // Added state for the token

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${httpUrl}/api/devices/claim`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        // Send BOTH the ID and the Token to the backend
        body: JSON.stringify({ deviceId, deviceToken }) 
      });
      
      const data = await res.json();

      if (res.ok) {
        refreshDevices();
        onClose();
      } else {
        // Display the specific error message from the backend
        alert(`Failed: ${data.error || "Could not claim device."}`);
      }
    } catch (err) {
      alert("Network error. Is the cloud server awake?");
    }
  };

  return (
    <div className="auth-container" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card auth-card" style={{ margin: 'auto', position: 'relative' }}>
        <h2>🔗 Claim New Device</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Device ID (from Pi):</label>
            <input 
              type="text" 
              value={deviceId} 
              onChange={e => setDeviceId(e.target.value)} 
              required 
              placeholder="e.g. pi_001"
            />
          </div>
          
          {/* New Input Field for the Security Token */}
          <div className="form-group">
            <label>Hardware Security Token:</label>
            <input 
              type="password" 
              value={deviceToken} 
              onChange={e => setDeviceToken(e.target.value)} 
              required 
              placeholder="e.g. secret123"
            />
          </div>

          <div className="btn-group">
            <button type="submit" className="btn-primary">Link Device</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}