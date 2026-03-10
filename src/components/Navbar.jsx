import React, { useEffect, useRef } from "react";
import { IoLogOutOutline } from "react-icons/io5";

export default function Navbar({
  devices,
  activeDevice,
  setActiveDevice,
  setCurrentView,
  currentView,
  onLogout,
  onAddDevice,
  onOpenSettings,
}) {
  const navRef = useRef(null);

  const handleDeviceChange = (e) => {
    const selected = devices.find((d) => d.id === e.target.value);
    setActiveDevice(selected);
  };

  const toggleTheme = (e) => {
    const isDark = e.target.checked;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  // Restore saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      const checkbox = document.getElementById("checkbox");
      if (checkbox) checkbox.checked = true;
    }
  }, []);

  // Scroll-hide functionality
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const nav = navRef.current;
          if (!nav) { ticking = false; return; }

          if (currentScrollY > lastScrollY && currentScrollY > 80) {
            nav.classList.add("navbar--hidden");
          } else {
            nav.classList.remove("navbar--hidden");
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="navbar" ref={navRef}>
      {/* 1. Logo */}
      <div className="nav-brand" onClick={() => setCurrentView("dashboard")}>
        <span className="nav-brand-icon">🌱</span>
        <span className="nav-brand-text">SmartIQ</span>
      </div>

      {/* 2. Device Selector */}
      <div className="device-selector">
        <select value={activeDevice?.id || "none"} onChange={handleDeviceChange}>
          <option value="none" disabled>-- Select a Farm --</option>
          {devices.map((dev) => (
            <option key={dev.id} value={dev.id}>
              {dev.name} ({dev.id})
            </option>
          ))}
        </select>
        <button className="btn-icon" onClick={onAddDevice} title="Add Device">
          ➕
        </button>
      </div>

      {/* Mobile Breakpoint Divider (Invisible on Desktop) */}
      <div className="nav-break"></div>

      {/* 3. Navigation Links */}
      <ul className="nav-links">
        <li>
          <a
            href="#"
            className={currentView === "dashboard" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); setCurrentView("dashboard"); }}
            title="Dashboard"
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            className={currentView === "analytics" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); setCurrentView("analytics"); }}
            title="Analytics"
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </a>
        </li>
      </ul>

      {/* 4. Action Buttons */}
      <div className="nav-right">
        <button onClick={onOpenSettings} className="nav-action-btn" title="Settings">
          <span className="nav-action-icon">⚙️</span>
          <span className="nav-action-label">Settings</span>
        </button>

        <button onClick={onLogout} className="nav-action-btn nav-action-btn--logout" title="Logout">
          <span className="nav-action-icon logout-react-icon">
            <IoLogOutOutline size={22} />
          </span>
          <span className="nav-action-label">Logout</span>
        </button>
      </div>

      {/* 5. Theme Switch */}
      <div className="theme-switch-wrapper">
        <label className="theme-switch" htmlFor="checkbox">
          <input type="checkbox" id="checkbox" onChange={toggleTheme} />
          <div className="slider round">
            <span className="icon sun">☀️</span>
            <span className="icon moon">🌙</span>
          </div>
        </label>
      </div>
    </nav>
  );
}