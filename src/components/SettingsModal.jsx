import React, { useState, useEffect } from "react";

export default function SettingsModal({
  onClose,
  activeDevice,
  token,
  httpUrl,
  refreshDevices,
  onLogout,
}) {
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // New States for Editing Device
  const [isEditingDevice, setIsEditingDevice] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    thinkspeakChannel: "",
    thinkspeakReadKey: "",
    thinkspeakWriteKey: ""
  });

  // Pre-fill the form whenever the active device changes
  useEffect(() => {
    if (activeDevice) {
      setEditForm({
        name: activeDevice.name || "",
        thinkspeakChannel: activeDevice.thinkspeakChannel || "",
        thinkspeakReadKey: activeDevice.thinkspeakReadKey || "",
        thinkspeakWriteKey: activeDevice.thinkspeakWriteKey || ""
      });
    }
  }, [activeDevice]);

  // --- HANDLERS ---
  const handleUpdateDevice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${httpUrl}/api/devices/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: activeDevice.id, ...editForm }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Device updated successfully.");
        refreshDevices();
        setIsEditingDevice(false);
      } else {
        alert(data.error || "Update failed.");
      }
    } catch (err) {
      alert("Error updating device.");
    }
  };

  const handleDeleteDevice = async () => {
    if (!activeDevice) return alert("No active device to delete.");
    if (!window.confirm(`Unlink ${activeDevice.name} from your account?`)) return;

    setIsDeletingDevice(true);
    try {
      const res = await fetch(`${httpUrl}/api/devices/unlink`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: activeDevice.id }),
      });
      if (res.ok) {
        alert("Device unlinked.");
        refreshDevices();
        onClose();
      }
    } catch (err) {
      alert("Error unlinking device.");
    } finally {
      setIsDeletingDevice(false);
    }
  };

  const handlePermanentDeleteDevice = async () => {
    if (!activeDevice) return;
    if (!window.confirm(`PERMANENTLY delete ${activeDevice.name} from the database? This cannot be undone and will destroy the device ID.`)) return;

    try {
      const res = await fetch(`${httpUrl}/api/devices/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: activeDevice.id }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Device permanently deleted.");
        refreshDevices();
        onClose();
      } else {
        alert(data.error || "Deletion failed.");
      }
    } catch (err) {
      alert("Error deleting device.");
    }
  };

  const handleFinalDeleteAccount = async () => {
    if (!confirmPassword)
      return alert("Please enter your password to confirm.");

    setIsDeletingAccount(true);
    try {
      const res = await fetch(`${httpUrl}/api/auth/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Account deleted.");
        onLogout();
      } else {
        alert(data.error || "Deletion failed.");
      }
    } catch (err) {
      alert("Error deleting account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // --- UI ---
  return (
    <div className="modal-overlay">
      <div className="settings-card">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* DEVICE MANAGEMENT SECTION */}
        <section className="settings-section">
          <label className="section-label">Hardware Management</label>
          <div className="settings-item">
            
            {/* If Not Editing: Show standard Unlink/Edit buttons */}
            {!isEditingDevice ? (
              <>
                <p>Active: <strong>{activeDevice?.name || "None"}</strong></p>
                <p className="device-id-text">ID: {activeDevice?.id || "N/A"}</p>
                
                {activeDevice && (
                  <div className="btn-group-row">
                    <button className="btn-device-edit" onClick={() => setIsEditingDevice(true)}>
                      Edit Parameters
                    </button>
                    <button
                      className="btn-unlink"
                      onClick={handleDeleteDevice}
                      disabled={isDeletingDevice}
                    >
                      {isDeletingDevice ? "Unlinking..." : "Unlink Device"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* If Editing: Show the form */
              <form onSubmit={handleUpdateDevice} className="edit-device-form">
                <div className="form-group">
                  <label>Device Name:</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>ThingSpeak Channel ID:</label>
                  <input 
                    type="text" 
                    value={editForm.thinkspeakChannel} 
                    onChange={e => setEditForm({...editForm, thinkspeakChannel: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>ThingSpeak Read Key:</label>
                  <input 
                    type="text" 
                    value={editForm.thinkspeakReadKey} 
                    onChange={e => setEditForm({...editForm, thinkspeakReadKey: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>ThingSpeak Write Key:</label>
                  <input 
                    type="text" 
                    value={editForm.thinkspeakWriteKey} 
                    onChange={e => setEditForm({...editForm, thinkspeakWriteKey: e.target.value})} 
                  />
                </div>
                <div className="btn-group-row">
                  <button type="submit" className="btn-primary">Save Changes</button>
                  <button type="button" className="btn-cancel" onClick={() => setIsEditingDevice(false)}>Cancel</button>
                </div>
              </form>
            )}

          </div>
        </section>

        {/* DANGER ZONE SECTION */}
        <section className="settings-section danger-zone">
          <label className="section-label">Danger Zone</label>
          
          {/* Permanent Device Deletion */}
          {activeDevice && (
             <button
               className="btn-delete-account btn-permanent-delete"
               onClick={handlePermanentDeleteDevice}
             >
               Permanently Destroy Active Device
             </button>
          )}

          {/* Account Deletion */}
          {!showPasswordInput ? (
            <button
              className="btn-delete-account"
              onClick={() => setShowPasswordInput(true)}
            >
              Delete My Account
            </button>
          ) : (
            <div className="confirm-delete-box">
              <p>Enter password to confirm permanent deletion:</p>
              <input
                type="password"
                className="settings-input"
                placeholder="Your Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="btn-group-row">
                <button
                  className="btn-final-delete"
                  onClick={handleFinalDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowPasswordInput(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}