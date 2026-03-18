import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// FIX: Removed duplicate style.css import — it is already imported inside App.jsx
 
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);