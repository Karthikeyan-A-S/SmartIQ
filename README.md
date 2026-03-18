# 🌱 SmartIQ – Cloud-Connected IoT Smart Irrigation Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-karthikeyan--a--s.github.io%2FSmartIQ%2F-success?style=for-the-badge)](https://karthikeyan-a-s.github.io/SmartIQ/)

**SmartIQ** is a full-stack IoT agricultural platform designed to automate and remotely monitor farm irrigation. By combining an ESP32 microcontroller with a secure Node.js backend and a responsive React dashboard, SmartIQ allows farmers to optimize water usage based on real-time soil moisture, local salinity levels, and live weather forecasts.

---

## 🚀 Live Access

You can access the live, fully functional web application here:  
🔗 **[https://karthikeyan-a-s.github.io/SmartIQ/](https://karthikeyan-a-s.github.io/SmartIQ/)**

*(Note: To experience the live hardware telemetry, you must create an account, generate a secure Device ID/Token on the dashboard, and pair it with a physical ESP32 running the companion firmware).*

---

## ✨ About the Project & Key Features

* **Real-Time Telemetry & Control:** Bi-directional communication using Secure WebSockets (`wss://`) for zero-latency water pump control and live sensor monitoring.
* **Intelligent Auto-Pilot:** Automates irrigation based on live soil moisture sensors, physical rain sensors, and OpenWeatherMap cloud forecasts to intelligently prevent overwatering.
* **Dynamic Salinity Adjustment:** Automatically adjusts pump speeds (PWM) for Drip Irrigation modes based on the water's Electrical Conductivity (EC)/Salinity levels.
* **Secure Hardware Provisioning:** Dynamic device claiming using unique generated IDs and Tokens. No hardcoded ThingSpeak API keys in the hardware—the ESP32 securely fetches its credentials from the MongoDB cloud on boot.
* **Advanced Analytics Dashboard:** Live, interactive charts using Chart.js and the ThingSpeak API. Includes custom date-range filtering, zooming, and real-time statistical analysis (Max, Min, Average).

---

## ⚙️ System Architecture

1.  **Registration:** A user creates a "Farm Node" on the React Dashboard, generating a secure `DEVICE_ID` and `TOKEN`.
2.  **Authentication:** The ESP32 connects to Wi-Fi and sends an HTTP POST request to the Node.js backend using its ID and Token. If valid, the backend securely serves the user's ThingSpeak Write Key.
3.  **Connection:** The ESP32 establishes a Secure WebSocket connection to the server.
4.  **Operation:** The ESP32 continually reads physical GPIO sensors and OpenWeatherMap data. It logs historical data to ThingSpeak every 15 seconds and streams live UI updates to the React frontend via the WebSocket tunnel.
5.  **Control:** Users can trigger Manual Override, Drip, or Surface irrigation modes directly from the web UI, which are executed instantly by the ESP32.

---

## 🛠️ Technology Stack

**Frontend (Web Dashboard)**
* React.js
* Chart.js / react-chartjs-2
* CSS3 (Custom Responsive Grid/Flexbox UI)

**Backend (API & WebSockets)**
* Node.js & Express.js
* MongoDB (Mongoose)
* JSON Web Tokens (JWT) & bcrypt for Authentication
* `ws` (WebSocket Server)

**Hardware (Edge Node)**
* ESP32 Microcontroller (C++ / Arduino IDE)
* Sensors: Soil Moisture, RainDrop Module
* Actuators: L298N Motor Driver, 12V DC Water Pump

**Cloud & External APIs**
* **ThingSpeak:** High-resolution IoT data logging and historical retrieval.
* **OpenWeatherMap:** Live meteorological data for localized rain predictions.

---

## 📜 License
This project was developed for educational and portfolio purposes.