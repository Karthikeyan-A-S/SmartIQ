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
  const [customCrops, setCustomCrops] = useState([]);
 
  const ws = useRef(null);
 
  // FIX: Use a ref to track activeDevice inside the WS onmessage closure.
  // Without this, onmessage captures a stale value of activeDevice from when
  // the effect first ran, so switching devices never updated the sensor feed.
  const activeDeviceRef = useRef(activeDevice);
  useEffect(() => {
    activeDeviceRef.current = activeDevice;
  }, [activeDevice]);
 
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
    fetchCrops();
  }, [token]);
 
  useEffect(() => {
    if (!token) return;
    const connectWS = () => {
      ws.current = new WebSocket(`${WS_URL}?type=user&token=${token}`);
      ws.current.onopen = () => setIsCloudOnline(true);
      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // FIX: Read activeDevice from the ref so we always have the latest
        // value, even after the user has switched devices.
        if (
          message.type === "sensor_update" &&
          activeDeviceRef.current &&
          message.deviceId === activeDeviceRef.current.id
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
    // FIX: Removed activeDevice from the dependency array. Previously, every
    // device switch caused the WebSocket to disconnect and reconnect
    // unnecessarily. The ref above handles reading the latest device instead.
  }, [token]);
 
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
          customCrops={customCrops}
          refreshCrops={fetchCrops}
          token={token}
          httpUrl={HTTP_URL}
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