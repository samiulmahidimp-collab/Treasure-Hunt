import React, { useState, useRef } from "react";
import { AlertOctagon, Unlock } from "lucide-react";

export default function SystemLocked({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

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

  const handleInputFocus = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 250);
  };

  return (
    <div style={styles.container}>
      <div className="scanlines"></div>
      
      <div style={styles.alertBar}>
        <span>⚠️ SECURITY COMPROMISED - BRUTE FORCE DETECTED ⚠️</span>
      </div>

      <div className="heist-card red-glow-border" style={styles.card}>
        <div style={styles.iconContainer}>
          <AlertOctagon size={44} className="pulse-glow" style={styles.icon} />
        </div>
        
        <h1 style={styles.title}>SYSTEM LOCKED</h1>
        <p style={styles.subtitle}>
          MAXIMUM DECRYPTION ATTEMPTS EXCEEDED. THE BOT HAS INITIATED LOCKDOWN PROTOCOLS.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>ENTER ADMIN ACCESS CODE TO OVERRIDE</label>
            <input
              ref={inputRef}
              type="password"
              className="heist-input"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handleInputFocus}
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
    inset: 0,
    width: "100vw",
    height: "100dvh",
    background: "rgba(8, 0, 0, 0.98)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: "50px 16px 20px",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },
  alertBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    background: "#e50914",
    color: "#fff",
    textAlign: "center",
    padding: "8px",
    fontWeight: "bold",
    letterSpacing: "2px",
    fontSize: "11px",
    fontFamily: "var(--font-display)",
    boxShadow: "0 0 20px rgba(229, 9, 20, 0.5)",
    zIndex: 10000,
  },
  card: {
    maxWidth: "420px",
    width: "100%",
    padding: "28px 22px",
    background: "rgba(10, 0, 0, 0.95)",
    border: "2px solid #e50914",
    textAlign: "center",
    marginTop: "20px",
    marginBottom: "40px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.9)"
  },
  iconContainer: {
    marginBottom: "12px",
  },
  icon: {
    color: "#e50914",
    filter: "drop-shadow(0 0 10px rgba(229, 9, 20, 0.8))",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "26px",
    color: "#e50914",
    letterSpacing: "2px",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "10px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    letterSpacing: "1px",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    textAlign: "left",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
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
    fontSize: "16px", /* 16px prevents mobile auto-zoom */
    borderColor: "#e50914",
    padding: "10px",
  },
  error: {
    color: "#e50914",
    fontSize: "11px",
    border: "1px solid #e50914",
    background: "rgba(229, 9, 20, 0.1)",
    padding: "8px",
    textAlign: "center",
    letterSpacing: "1px",
  },
  unlockBtn: {
    width: "100%",
    background: "#e50914",
    padding: "12px",
  }
};
