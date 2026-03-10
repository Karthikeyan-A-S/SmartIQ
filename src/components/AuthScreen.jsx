import React, { useState } from "react";

export default function AuthScreen({ onLogin, httpUrl }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(`${httpUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        onLogin(data.token); 
      } else {
        throw new Error(data.error || `${isLoginMode ? "Login" : "Registration"} failed. Please try again.`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(""); 
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2>🌱 SmartIQ Cloud</h2>
        <p className="subtitle">{isLoginMode ? "Secure JWT Login" : "Register a New Account"}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="farmer@smartiq.com" />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", marginBottom: "16px" }}>
            {isLoginMode ? "Login to Dashboard" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "var(--primary)", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }} onClick={toggleMode}>
            {isLoginMode ? "Register here" : "Login here"}
          </span>
        </div>

        {error && <div className="status error" style={{ display: "block", marginTop: "16px" }}>{error}</div>}
      </div>
    </div>
  );
}