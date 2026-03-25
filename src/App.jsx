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
const WS_URL = `wss://${RENDER_DOMAIN}`;

export default function App() {
  // 1. JWT now securely uses sessionStorage (wipes when tab closes)
  const [token, setToken] = useState(
    sessionStorage.getItem("smartiq_jwt") || null,
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
 
  const activeDeviceRef = useRef(activeDevice);
  useEffect(() => {
    activeDeviceRef.current = activeDevice;
    
    // 2. Remember the selected device in localStorage so it survives refreshes
    if (activeDevice) {
      localStorage.setItem("smartiq_last_device", activeDevice.id);
    }
  }, [activeDevice]);
 
  // 3. 30-Minute Inactivity Auto-Logout Logic
  useEffect(() => {
    if (!token) return;

    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      // 30 minutes = 30 * 60 * 1000 = 1,800,000 milliseconds
      timeout = setTimeout(() => {
        alert("Session expired due to 30 minutes of inactivity. Please log in again.");
        handleLogout();
      }, 1800000);
    };

    // Listeners for any sign of life from the user
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start the timer immediately
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [token]);

  const fetchDevices = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${HTTP_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return handleLogout();
      const data = await res.json();
      setDevices(data);
      
      if (data.length > 0) {
        // 4. On refresh, look for the previously saved device
        const savedDeviceId = localStorage.getItem("smartiq_last_device");
        const previousDevice = data.find(d => d.id === savedDeviceId);
        
        if (previousDevice) {
          setActiveDevice(previousDevice);
        } else if (!activeDevice) {
          setActiveDevice(data[0]);
        }
      }
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
  }, [token]);
 
  const handleLogin = (jwt) => {
    sessionStorage.setItem("smartiq_jwt", jwt);
    setToken(jwt);
  };
 
  const handleLogout = () => {
    sessionStorage.removeItem("smartiq_jwt");
    localStorage.removeItem("smartiq_last_device"); // Clear device memory on logout
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
          customCrops={customCrops}
          refreshCrops={fetchCrops}
        />
      )}
    </div>
  );
}