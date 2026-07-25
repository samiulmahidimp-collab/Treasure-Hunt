import React from "react";
import { Shield, Users } from "lucide-react";

export default function LandingPage({ onSelectRole }) {
  return (
    <div className="landing-container" style={styles.container}>
      <div style={styles.overlay}></div>
      <div className="scanlines"></div>
      
      <div className="heist-card" style={styles.card}>
        <div style={styles.stamp}>SECURE COMMS</div>
        
        <header style={styles.header}>
          <h1 className="glitch-text" style={styles.title}>
            LA CASA DEL TESORO
          </h1>
          <p style={styles.subtitle}>
            SYSTEM LOCKDOWN ACTIVE. SELECT COMMS ROLE TO INITIALIZE DECRYPTION.
          </p>
        </header>

        {/* High-Tech Vault Lock Vector */}
        <div style={styles.vaultContainer}>
          <svg viewBox="0 0 100 100" style={styles.vaultSvg}>
            {/* Outer alignment ring */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(229, 9, 20, 0.15)" strokeWidth="1.5" strokeDasharray="6 3" />
            
            {/* Outer rotating notch ring */}
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(229, 9, 20, 0.4)" strokeWidth="3" strokeDasharray="4 8" className="spin-animation" />
            
            {/* Inner reverse rotating notch ring */}
            <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" strokeDasharray="12 6" className="spin-reverse-animation" />
            
            {/* Inner Lock Core */}
            <circle cx="50" cy="50" r="20" fill="rgba(10, 10, 15, 0.95)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
            
            {/* Padlock Icon */}
            <path 
              d="M 44,52 L 56,52 L 56,62 L 44,62 Z M 46,52 L 46,47 C 46,43 54,43 54,47 L 54,52" 
              fill="none" 
              stroke="#fff" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Keyhole */}
            <circle cx="50" cy="56" r="1.2" fill="var(--red-primary)" />
            <path d="M 50,57.2 L 50,59.5" stroke="var(--red-primary)" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            className="heist-btn-solid" 
            style={styles.button}
            onClick={() => onSelectRole("player")}
          >
            <Users size={18} />
            <span>OPERATIVE (PLAYER)</span>
          </button>
          
          <button 
            className="heist-btn" 
            style={styles.button}
            onClick={() => onSelectRole("admin")}
          >
            <Shield size={18} />
            <span>THE PROFESSOR (ADMIN)</span>
          </button>
        </div>

        <footer style={styles.footer}>
          <span>MISSION PROTOCOL ENCRYPTED CHANNELS v1.1.0</span>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    padding: "24px",
    background: "#08080c",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle, rgba(20,2,5,0.6) 0%, rgba(10,10,15,1) 90%)",
    zIndex: 1,
  },
  card: {
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
    zIndex: 2,
    position: "relative",
    padding: "48px 36px",
  },
  header: {
    marginBottom: "24px",
  },
  stamp: {
    position: "absolute",
    top: "24px",
    right: "24px",
    border: "1px solid rgba(229, 9, 20, 0.4)",
    borderRadius: "4px",
    color: "var(--red-primary)",
    padding: "4px 8px",
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    transform: "rotate(5deg)",
    letterSpacing: "1px",
    fontWeight: "bold",
    background: "rgba(229, 9, 20, 0.05)",
  },
  title: {
    fontSize: "32px",
    marginBottom: "12px",
    color: "#ffffff",
    fontFamily: "var(--font-display)",
    letterSpacing: "1.5px",
    fontWeight: "800",
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: "12px",
    letterSpacing: "0.5px",
    lineHeight: "1.6",
    fontWeight: "400",
  },
  vaultContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "32px 0",
    filter: "drop-shadow(0 0 15px rgba(229, 9, 20, 0.15))",
  },
  vaultSvg: {
    width: "120px",
    height: "120px",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "16px",
  },
  button: {
    width: "100%",
    padding: "14px 20px",
    fontSize: "13px",
  },
  footer: {
    marginTop: "36px",
    color: "var(--text-muted)",
    fontSize: "9px",
    letterSpacing: "0.5px",
    fontFamily: "var(--font-mono)",
  }
};
