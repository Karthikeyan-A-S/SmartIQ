import React, { useState, useEffect, useRef } from "react";
import AuthScreen from "./components/AuthScreen";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import AddDeviceModal from "./components/AddDeviceModal";
import SettingsModal from "./components/SettingsModal";
import "./style.css";

const RENDER_DOMAIN = "smartiq-backend.onrender.com";
const HTTP_URL = `https://${RENDER_DOMAIN}`;
const WS_URL = `ws://${RENDER_DOMAIN}`;

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("smartiq_jwt") || null,
  );
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sensorData, setSensorData] = useState({});
  const [isCloudOnline, setIsCloudOnline] = useState(false);

  // NEW: State for Custom Crops
  const [customCrops, setCustomCrops] = useState([]);

  const ws = useRef(null);

  const fetchDevices = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${HTTP_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return handleLogout();
      const data = await res.json();
      setDevices(data);
      if (data.length > 0 && !activeDevice) setActiveDevice(data[0]);
    } catch (err) {
      console.error("Failed to fetch devices", err);
    }
  };

  // NEW: Fetch crops function
  const fetchCrops = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${HTTP_URL}/api/crops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomCrops(data);
      }
    } catch (err) {
      console.error("Failed to fetch crops", err);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchCrops(); // Load crops on mount
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const connectWS = () => {
      ws.current = new WebSocket(`${WS_URL}?type=user&token=${token}`);
      ws.current.onopen = () => setIsCloudOnline(true);
      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (
          message.type === "sensor_update" &&
          activeDevice &&
          message.deviceId === activeDevice.id
        ) {
          setSensorData(message.data);
        }
      };
      ws.current.onclose = () => {
        setIsCloudOnline(false);
        setTimeout(connectWS, 4000);
      };
    };

    connectWS();
    return () => ws.current?.close();
  }, [token, activeDevice]);

  const handleLogin = (jwt) => {
    localStorage.setItem("smartiq_jwt", jwt);
    setToken(jwt);
  };

  const handleLogout = () => {
    localStorage.removeItem("smartiq_jwt");
    setToken(null);
    setDevices([]);
    setCustomCrops([]);
    setActiveDevice(null);
    ws.current?.close();
  };

  const sendCommand = (mode, payload = {}) => {
    if (!activeDevice) return alert("Select a device first.");
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: "send_command",
          targetDeviceId: activeDevice.id,
          payload: { mode, ...payload },
        }),
      );
    } else {
      alert("Cloud connection is offline.");
    }
  };

  if (!token) return <AuthScreen onLogin={handleLogin} httpUrl={HTTP_URL} />;

  return (
    <div id="appScreen">
      <Navbar
        devices={devices}
        activeDevice={activeDevice}
        setActiveDevice={setActiveDevice}
        setCurrentView={setCurrentView}
        currentView={currentView}
        onLogout={handleLogout}
        onAddDevice={() => setShowAddModal(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {currentView === "dashboard" ? (
        <Dashboard
          sensorData={sensorData}
          isCloudOnline={isCloudOnline}
          sendCommand={sendCommand}
          customCrops={customCrops} // Passed to Dashboard
          refreshCrops={fetchCrops} // Passed to Dashboard
          token={token} // Passed to Dashboard
          httpUrl={HTTP_URL} // Passed to Dashboard
        />
      ) : (
        <Analytics activeDevice={activeDevice} />
      )}

      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          token={token}
          httpUrl={HTTP_URL}
          refreshDevices={fetchDevices}
        />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          activeDevice={activeDevice}
          token={token}
          httpUrl={HTTP_URL}
          refreshDevices={fetchDevices}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
