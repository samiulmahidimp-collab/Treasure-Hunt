import React, { useState } from "react";
import { AlertOctagon, Unlock } from "lucide-react";

export default function SystemLocked({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === "ami_mahid") {
      onUnlock();
      setError("");
    } else {
      setError("INCORRECT DECRYPTION SECURITY KEY. ACCESS DENIED.");
      setPassword("");
    }
  };

  return (
    <div style={styles.container}>
      <div className="scanlines"></div>
      
      <div style={styles.alertBar}>
        <span>⚠️ SECURITY COMPROMISED - BRUTE FORCE DETECTED ⚠️</span>
      </div>

      <div className="heist-card red-glow-border" style={styles.card}>
        <div style={styles.iconContainer}>
          <AlertOctagon size={48} className="pulse-glow" style={styles.icon} />
        </div>
        
        <h1 style={styles.title}>SYSTEM LOCKED</h1>
        <p style={styles.subtitle}>
          MAXIMUM DECRYPTION ATTEMPTS EXCEEDED. THE BOT HAS INITIATED LOCKDOWN PROTOCOLS.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>ENTER ADMIN ACCESS CODE TO OVERRIDE</label>
            <input
              type="password"
              className="heist-input"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" className="heist-btn-solid" style={styles.unlockBtn}>
            <Unlock size={16} />
            <span>OVERRIDE LOCKDOWN</span>
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(8, 0, 0, 0.98)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  alertBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    background: "#e50914",
    color: "#fff",
    textAlign: "center",
    padding: "10px",
    fontWeight: "bold",
    letterSpacing: "2px",
    fontSize: "12px",
    fontFamily: "var(--font-display)",
    boxShadow: "0 0 20px rgba(229, 9, 20, 0.5)",
  },
  card: {
    maxWidth: "450px",
    width: "100%",
    padding: "40px 30px",
    background: "rgba(10, 0, 0, 0.95)",
    border: "2px solid #e50914",
    textAlign: "center",
  },
  iconContainer: {
    marginBottom: "20px",
  },
  icon: {
    color: "#e50914",
    filter: "drop-shadow(0 0 10px rgba(229, 9, 20, 0.8))",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "32px",
    color: "#e50914",
    letterSpacing: "2px",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "11px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    letterSpacing: "1px",
    marginBottom: "30px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    textAlign: "left",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "10px",
    color: "#e50914",
    letterSpacing: "1px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    textAlign: "center",
    letterSpacing: "4px",
    fontSize: "18px",
    borderColor: "#e50914",
  },
  error: {
    color: "#e50914",
    fontSize: "11px",
    border: "1px solid #e50914",
    background: "rgba(229, 9, 20, 0.1)",
    padding: "10px",
    textAlign: "center",
    letterSpacing: "1px",
  },
  unlockBtn: {
    width: "100%",
    background: "#e50914",
  }
};
