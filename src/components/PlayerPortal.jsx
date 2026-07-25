import React, { useState, useEffect } from "react";
import { dbService } from "../firebase";
import { Users, AlertTriangle, Play, Pause } from "lucide-react";
import ChatbotScreen from "./ChatbotScreen";

export default function PlayerPortal({ onBack }) {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [activeTeam, setActiveTeam] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [gameSettings, setGameSettings] = useState({ isStarted: false, isPaused: false });
  const [teamData, setTeamData] = useState(null);
  const [loginError, setLoginError] = useState("");

  const validTeams = ["mahid", "oyshee", "prizon"];

  // 1. Subscribe to Global Game Settings
  useEffect(() => {
    const unsubSettings = dbService.subscribeGameSettings((settings) => {
      setGameSettings(settings);
    });
    return () => unsubSettings();
  }, []);

  // 2. Check if already logged in from localStorage
  useEffect(() => {
    const storedTeam = localStorage.getItem("heist_team");
    const storedToken = localStorage.getItem("heist_session_token");
    if (storedTeam && storedToken && validTeams.includes(storedTeam)) {
      setActiveTeam(storedTeam);
      setSessionToken(storedToken);
    }
  }, []);

  // 3. Listen to Team Document in DB for Single-Device Check & Game Progress
  useEffect(() => {
    if (!activeTeam) return;

    const unsubTeam = dbService.subscribeTeam(activeTeam, (data) => {
      setTeamData(data);

      // Single device check: If DB session token doesn't match our local token, kick out
      if (data && data.sessionToken && data.sessionToken !== sessionToken) {
        alert("SECURITY BREACH: Your team logged in on another device! You have been disconnected.");
        handleLogout();
      }
    });

    return () => unsubTeam();
  }, [activeTeam, sessionToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const teamLower = selectedTeam.trim().toLowerCase();

    if (!validTeams.includes(teamLower)) {
      setLoginError("INVALID TEAM SIGNATURE. ACCESS REJECTED.");
      return;
    }

    setLoginError("");

    // Generate unique session token for this device
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Fetch existing team data (if any) to preserve score and history, but update session token
    dbService.subscribeTeam(teamLower, async (data) => {
      // Unsubscribe immediately so we don't trigger recursive calls here
    });

    // Write session token to DB to kick out other sessions
    await dbService.updateTeam(teamLower, { 
      sessionToken: token,
      // If team doesn't exist, initialize defaults
      score: teamData?.score || 0,
      solvedClues: teamData?.solvedClues || [],
      attempts: teamData?.attempts || 0,
      locked: teamData?.locked || false
    });

    // Write to Local Storage
    localStorage.setItem("heist_team", teamLower);
    localStorage.setItem("heist_session_token", token);

    setActiveTeam(teamLower);
    setSessionToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("heist_team");
    localStorage.removeItem("heist_session_token");
    setActiveTeam("");
    setSessionToken("");
    setTeamData(null);
  };

  // Render Portal Content
  if (!activeTeam) {
    return (
      <div style={styles.container}>
        <div className="scanlines"></div>
        <div className="heist-card" style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <Users size={32} color="#e50914" />
            <h2 className="glitch-text" style={styles.title}>OPERATIVE SIGN IN</h2>
            <p style={styles.sub}>SYNC SQUAD COORDINATES TO ENTER CHANNELS</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>SELECT OR TYPE TEAM SIGNATURE</label>
              <select
                className="heist-input"
                style={styles.select}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                required
              >
                <option value="" disabled>-- CHOOSE TEAM --</option>
                {validTeams.map((team) => (
                  <option key={team} value={team}>
                    {team.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {loginError && <div style={styles.error}>{loginError}</div>}

            <div style={styles.actions}>
              <button type="submit" className="heist-btn-solid" style={styles.submitBtn}>
                CONNECT CHANNEL
              </button>
              <button type="button" className="heist-btn" style={styles.backBtn} onClick={onBack}>
                BACK TO LOBBY
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 1. If Game is not started globally
  if (!gameSettings.isStarted) {
    return (
      <div style={styles.waitingContainer}>
        <div className="scanlines"></div>
        <div style={styles.waitingContent}>
          <AlertTriangle size={48} color="#e50914" className="pulse-glow" style={{ marginBottom: "15px" }} />
          <h2 style={styles.waitingTitle}>CHANNEL ENCRYPTED</h2>
          <p style={styles.waitingText}>
            THE PROFESSOR HAS NOT STARTED THE PROTOCOL YET. STAND BY FOR THE SIGNAL...
          </p>
          <button className="heist-btn" onClick={handleLogout} style={styles.disconnectBtn}>
            DISCONNECT CHANNEL
          </button>
        </div>
      </div>
    );
  }

  // 2. If Game is paused globally
  if (gameSettings.isPaused) {
    return (
      <div style={styles.waitingContainer}>
        <div className="scanlines"></div>
        <div style={styles.waitingContent}>
          <Pause size={48} color="#d97706" style={{ marginBottom: "15px", animation: "pulse 1.5s infinite alternate" }} />
          <h2 style={{ ...styles.waitingTitle, color: "#d97706" }}>MISSION HOLD</h2>
          <p style={styles.waitingText}>
            THE PROFESSOR HAS PAUSED GAME CHANNELS. MAINTAIN CURRENT POSITIONS AND STAND BY.
          </p>
          <button className="heist-btn" onClick={handleLogout} style={styles.disconnectBtn}>
            DISCONNECT CHANNEL
          </button>
        </div>
      </div>
    );
  }

  // 3. Otherwise, play game
  return (
    <ChatbotScreen 
      teamName={activeTeam} 
      teamData={teamData} 
      onLogout={handleLogout} 
    />
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    background: "#080808",
  },
  loginCard: {
    maxWidth: "400px",
    width: "100%",
    padding: "36px 24px",
    textAlign: "center",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontFamily: "var(--font-display)",
  },
  sub: {
    fontSize: "11px",
    color: "var(--text-muted)",
    letterSpacing: "1px",
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
    fontSize: "11px",
    color: "#e50914",
    letterSpacing: "1px",
    fontWeight: "bold",
  },
  select: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.8)",
    cursor: "pointer",
    fontSize: "13px",
  },
  error: {
    color: "#e50914",
    fontSize: "11px",
    border: "1px solid #e50914",
    background: "rgba(229,9,20,0.1)",
    padding: "10px",
    textAlign: "center",
    letterSpacing: "1px",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  submitBtn: {
    width: "100%",
  },
  backBtn: {
    width: "100%",
  },
  waitingContainer: {
    minHeight: "100vh",
    background: "#080808",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    textAlign: "center",
  },
  waitingContent: {
    maxWidth: "400px",
    background: "rgba(18, 18, 18, 0.95)",
    border: "1px solid var(--border-color)",
    padding: "36px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  waitingTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "22px",
    color: "#e50914",
    marginBottom: "10px",
    letterSpacing: "1px",
  },
  waitingText: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  disconnectBtn: {
    width: "100%",
    fontSize: "11px",
    padding: "8px 16px",
  }
};
