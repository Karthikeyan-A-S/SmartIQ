import React, { useState } from "react";

export default function AuthScreen({ onLogin, httpUrl }) {
  const [mode, setMode] = useState("login"); // 'login', 'register', 'verify', 'forgot', 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    try {
      let endpoint, payload;

      // Route the request based on the current modal state
      if (mode === "login") {
        endpoint = "/api/auth/login";
        payload = { email, password };
      } else if (mode === "register") {
        endpoint = "/api/auth/register";
        payload = { email, password };
      } else if (mode === "verify") {
        endpoint = "/api/auth/verify-otp";
        payload = { email, otp };
      } else if (mode === "forgot") {
        endpoint = "/api/auth/forgot-password";
        payload = { email };
      } else if (mode === "reset") {
        endpoint = "/api/auth/reset-password";
        payload = { email, otp, newPassword: password };
      }

      // Send the request to your backend
      const res = await fetch(`${httpUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Operation failed");

      // Handle the successful response dynamically
      if (mode === "register") {
        setMsg("OTP sent to your email!");
        setMode("verify");
      } else if (mode === "verify" || mode === "login") {
        onLogin(data.token); // Successfully authenticated, pass token to App.jsx
      } else if (mode === "forgot") {
        setMsg("Reset OTP sent to your email!");
        setMode("reset");
      } else if (mode === "reset") {
        setMsg("Password reset! Please log in.");
        setMode("login");
        setPassword(""); // Clear the password field for safety
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2>🌱 SmartIQ Cloud</h2>
        <p className="subtitle">
          {mode === "login" && "Sign in to your dashboard"}
          {mode === "register" && "Create a new farmer account"}
          {mode === "verify" && `Enter the OTP sent to ${email}`}
          {mode === "forgot" && "Recover your account"}
          {mode === "reset" && "Set your new password"}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email is required in every single mode */}
          <div className="form-group">
            <label>Email Address:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="farmer@smartiq.com"
              disabled={mode === "verify" || mode === "reset"} // Lock email during OTP steps
            />
          </div>

          {/* Password is required for Login, Register, and Resetting */}
          {(mode === "login" || mode === "register" || mode === "reset") && (
            <div className="form-group">
              <label>{mode === "reset" ? "New Password:" : "Password:"}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>
          )}

          {/* OTP is required for Verifying Registration and Resetting Passwords */}
          {(mode === "verify" || mode === "reset") && (
            <div className="form-group">
              <label>6-Digit Security OTP:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                placeholder="123456"
                style={{
                  letterSpacing: "2px",
                  fontFamily: "monospace",
                  textAlign: "center",
                  fontSize: "1.1rem",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginBottom: "16px" }}
          >
            {mode === "login" && "Login to Dashboard"}
            {mode === "register" && "Register & Get OTP"}
            {mode === "verify" && "Verify Email & Login"}
            {mode === "forgot" && "Send Reset OTP"}
            {mode === "reset" && "Save New Password"}
          </button>
        </form>

        {/* Navigation Links to switch between modes */}
        <div style={{ textAlign: "center", fontSize: "0.9rem" }}>
          {mode === "login" && (
            <>
              <span
                style={{
                  color: "var(--primary)",
                  cursor: "pointer",
                  display: "block",
                  marginBottom: "8px",
                }}
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setMsg("");
                }}
              >
                Forgot Password?
              </span>
              Don't have an account?{" "}
              <span
                style={{
                  color: "var(--primary)",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setMode("register");
                  setError("");
                  setMsg("");
                }}
              >
                Register here
              </span>
            </>
          )}
          {(mode === "register" || mode === "forgot") && (
            <span
              style={{
                color: "var(--primary)",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => {
                setMode("login");
                setError("");
                setMsg("");
              }}
            >
              Back to Login
            </span>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div
            className="status error"
            style={{ display: "block", marginTop: "16px" }}
          >
            {error}
          </div>
        )}
        {msg && (
          <div
            className="status success"
            style={{ display: "block", marginTop: "16px" }}
          >
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
