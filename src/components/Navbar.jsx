import React, { useEffect } from "react";

export default function Navbar({ devices, activeDevice, setActiveDevice, setCurrentView, currentView, onLogout, onAddDevice }) {
  const handleDeviceChange = (e) => {
    const selected = devices.find((d) => d.id === e.target.value);
    setActiveDevice(selected);
  };

  const toggleTheme = (e) => {
    const isDark = e.target.checked;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      const checkbox = document.getElementById("checkbox");
      if (checkbox) checkbox.checked = true;
    }
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => setCurrentView("dashboard")}>
        <span className="nav-brand-icon">🌱</span>
        <span className="nav-brand-text">SmartIQ</span>
      </div>

      <div className="device-selector">
        <select value={activeDevice?.id || "none"} onChange={handleDeviceChange}>
          <option value="none" disabled>-- Select a Farm --</option>
          {devices.map((dev) => (
            <option key={dev.id} value={dev.id}>{dev.name} ({dev.id})</option>
          ))}
        </select>
        <button className="btn-icon" onClick={onAddDevice}>➕</button>
      </div>

      <div className="nav-menu open">
        <ul className="nav-links">
          <li>
            <a href="#" className={currentView === "dashboard" ? "active" : ""} onClick={() => setCurrentView("dashboard")}>
              <span className="nav-icon">🏠</span> Dashboard
            </a>
          </li>
          <li>
            <a href="#" className={currentView === "analytics" ? "active" : ""} onClick={() => setCurrentView("analytics")}>
              <span className="nav-icon">📊</span> Analytics
            </a>
          </li>
        </ul>

        <div className="nav-right">
          <button onClick={onLogout} className="btn-cancel" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "6px" }}>Logout</button>
          <div className="theme-switch-wrapper">
            <label className="theme-switch" htmlFor="checkbox">
              <input type="checkbox" id="checkbox" onChange={toggleTheme} />
              <div className="slider round">
                <span className="icon sun">☀️</span>
                <span className="icon moon">🌙</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </nav>
  );
}