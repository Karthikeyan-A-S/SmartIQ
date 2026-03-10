import React, { useState } from "react";

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

  const handleDeleteDevice = async () => {
    if (!activeDevice) return alert("No active device to delete.");
    if (!window.confirm(`Delete ${activeDevice.name}?`)) return;

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

  return (
    <div className="modal-overlay">
      <div className="settings-card">
        <div className="settings-header">
          <h2>⚙️ Setting</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <section className="settings-section">
          <label className="section-label">Hardware Management</label>
          <div className="settings-item">
            <p>
              Active: <strong>{activeDevice?.name || "None"}</strong>
            </p>
            <button
              className="btn-unlink"
              onClick={handleDeleteDevice}
              disabled={isDeletingDevice}
            >
              {isDeletingDevice ? "Unlinking..." : "Unlink Device"}
            </button>
          </div>
        </section>

        <section className="settings-section danger-zone">
          <label className="section-label">Danger Zone</label>
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
