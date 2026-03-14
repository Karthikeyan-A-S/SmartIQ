import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Analytics({ activeDevice }) {
  const [results, setResults] = useState(60);
  // NEW: States for date filtering
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [chartData, setChartData] = useState(null);
  const [latestStats, setLatestStats] = useState({ temp: null, hum: null, soil: null, pump: null });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedChart, setZoomedChart] = useState(null);

  const fetchData = async (signal) => {
    if (!activeDevice?.thinkspeakChannel || !activeDevice?.thinkspeakReadKey) {
      setError("Active device is missing ThingSpeak credentials.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. Build the dynamic URL
      let url = `https://api.thingspeak.com/channels/${activeDevice.thinkspeakChannel}/feeds.json?api_key=${activeDevice.thinkspeakReadKey}`;

      if (startDate || endDate) {
        // If using dates, append them with exact times to cover the whole day
        if (startDate) url += `&start=${startDate}%2000:00:00`;
        if (endDate) url += `&end=${endDate}%2023:59:59`;
        // Force max results so the date range doesn't cap at the default 100
        url += `&results=8000`; 
      } else {
        // Fallback to the standard points dropdown
        url += `&results=${results}`;
      }

      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const feeds = json.feeds;

      // 2. Format labels dynamically based on whether dates are used
      const labels = feeds.map(f => {
        const d = new Date(f.created_at);
        const timeStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        
        if (startDate || endDate) {
          // Show MM/DD HH:MM for long ranges
          return `${d.getMonth() + 1}/${d.getDate()} ${timeStr}`;
        }
        return timeStr; // Just HH:MM for short ranges
      });

      const getField = (n) => feeds.map(e => e[`field${n}`] ? parseFloat(e[`field${n}`]) : null);

      setChartData({
        labels,
        temp: getField(1), hum: getField(2), soil: getField(3),
        sal: getField(4), pump: getField(5), vol: getField(6)
      });

      const latest = (arr) => [...arr].reverse().find(v => v !== null && !isNaN(v));

      setLatestStats({
        temp: latest(getField(1)),
        hum: latest(getField(2)),
        soil: latest(getField(3)),
        pump: latest(getField(5))
      });

    } catch (err) {
      if (err.name === "AbortError") return;
      setError("Failed to fetch from ThingSpeak. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  // Ensure the effect runs whenever the dates change
  }, [activeDevice, results, startDate, endDate]);

  return (
    <div className="container-wide">
      <div className="ts-page-hero">
        <h1>📊 Farm Analytics</h1>
        <p>Live sensor data from ThingSpeak — visualised in real time.</p>
      </div>

      <div className="ts-toolbar">
        {/* Left Side: Controls */}
        <div className="ts-toolbar-left">
          <span className="ts-channel-pill">📡 Channel #{activeDevice?.thinkspeakChannel || "Unknown"}</span>
          
          <div className="ts-toolbar-group">
            <label>Points:</label>
            <select 
              value={results} 
              onChange={(e) => setResults(Number(e.target.value))}
              disabled={startDate !== "" || endDate !== ""} 
            >
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>

          <div className="ts-toolbar-dates">
            <div className="date-field">
              <label>From:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="date-field">
              <label>To:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        
        {/* Right Side: Buttons */}
        <div className="ts-toolbar-right">
          {(startDate || endDate) && (
            <button className="btn-cancel ts-clear-btn" onClick={() => { setStartDate(""); setEndDate(""); }}>
              Clear Dates
            </button>
          )}
          <button className="btn-ts-refresh" onClick={() => fetchData(new AbortController().signal)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Refresh Data
          </button>
        </div>
      </div>
      {error && <div className="ts-error" style={{ display: "block" }}>{error}</div>}

      {isLoading && (
        <div className="ts-loading">
          <div><span className="ts-loading-dot"></span><span className="ts-loading-dot"></span><span className="ts-loading-dot"></span></div>
          <p style={{ marginTop: '14px', fontSize: '0.9rem' }}>Fetching data from ThingSpeak…</p>
        </div>
      )}

      {!isLoading && chartData && (
        <>
          <div className="ts-stats-row">
            <div className="ts-stat-box"><div className="ts-stat-label">🌡️ Temp</div><div className="ts-stat-val">{latestStats.temp !== undefined ? `${latestStats.temp}°C` : '—'}</div></div>
            <div className="ts-stat-box"><div className="ts-stat-label">💧 Humidity</div><div className="ts-stat-val">{latestStats.hum !== undefined ? `${latestStats.hum}%` : '—'}</div></div>
            <div className="ts-stat-box"><div className="ts-stat-label">🌱 Soil</div><div className={`ts-stat-val ${latestStats.soil === 1 ? 'dry' : 'wet'}`}>{latestStats.soil === 1 ? 'Dry' : (latestStats.soil === 0 ? 'Wet' : '—')}</div></div>
            <div className="ts-stat-box"><div className="ts-stat-label">⚙️ Pump</div><div className={`ts-stat-val ${latestStats.pump === 1 ? 'pump-on' : 'pump-off'}`}>{latestStats.pump === 1 ? 'ON' : (latestStats.pump === 0 ? 'OFF' : '—')}</div></div>
          </div>

          <div className="ts-charts-grid">
            <ChartCard title="Temperature" color="#ef4444" labels={chartData.labels} data={chartData.temp} fill onZoom={() => setZoomedChart({ title: "Temperature", color: "#ef4444", data: chartData.temp, labels: chartData.labels, fill: true })} />
            <ChartCard title="Humidity" color="#0ea5e9" labels={chartData.labels} data={chartData.hum} fill onZoom={() => setZoomedChart({ title: "Humidity", color: "#0ea5e9", data: chartData.hum, labels: chartData.labels, fill: true })} />
            <ChartCard title="Soil Moisture" color="#818cf8" labels={chartData.labels} data={chartData.soil} stepped onZoom={() => setZoomedChart({ title: "Soil Moisture", color: "#818cf8", data: chartData.soil, labels: chartData.labels, stepped: true })} />
            <ChartCard title="Salinity / EC" color="#f59e0b" labels={chartData.labels} data={chartData.sal} fill onZoom={() => setZoomedChart({ title: "Salinity / EC", color: "#f59e0b", data: chartData.sal, labels: chartData.labels, fill: true })} />
            <ChartCard title="Pump Status" color="#22c55e" labels={chartData.labels} data={chartData.pump} stepped onZoom={() => setZoomedChart({ title: "Pump Status", color: "#22c55e", data: chartData.pump, labels: chartData.labels, stepped: true })} />
            <ChartCard title="Volume Pumped" color="#0b6e8a" labels={chartData.labels} data={chartData.vol} fill onZoom={() => setZoomedChart({ title: "Volume Pumped", color: "#0b6e8a", data: chartData.vol, labels: chartData.labels, fill: true })} />
          </div>
        </>
      )}

      {zoomedChart && (
        <div className="chart-modal-overlay" onClick={() => setZoomedChart(null)}>
          <div className="chart-modal-content" onClick={e => e.stopPropagation()}>
            <div className="chart-modal-header">
              <h2>{zoomedChart.title} Analytics</h2>
              <button className="chart-modal-close" onClick={() => setZoomedChart(null)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="chart-modal-body">
              <ChartCard
                title=""
                color={zoomedChart.color}
                labels={zoomedChart.labels}
                data={zoomedChart.data}
                fill={zoomedChart.fill}
                stepped={zoomedChart.stepped}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function ChartCard({ title, color, labels, data, fill, stepped, onZoom, isModal }) {
  const lineData = {
    labels,
    datasets: [{
      label: title,
      data,
      borderColor: color,
      backgroundColor: fill ? `${color}33` : 'transparent',
      fill: fill,
      tension: 0.35,
      stepped: stepped,
      borderWidth: 2,
      pointRadius: isModal ? 3 : 2,
      pointHoverRadius: 6
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "rgba(100, 116, 139, 0.1)" } }
    }
  };

  return (
    <div className={isModal ? "" : "ts-chart-card"} style={isModal ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
      {!isModal && (
        <div className="ts-chart-header">
          <div className="ts-chart-title">{title}</div>
          <button className="chart-maximize-btn" onClick={onZoom} title="Expand Chart">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        </div>
      )}
      <div className="ts-chart-wrap" style={{ height: isModal ? '100%' : '190px' }}>
        <Line data={lineData} options={lineOptions} />
      </div>
    </div>
  );
}