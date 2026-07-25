import React, { useState, useEffect } from "react";
import { dbService } from "../firebase";
import { Lock, Play, Pause, RefreshCw, LogOut, Trophy } from "lucide-react";
import Leaderboard from "./Leaderboard";

export default function AdminPortal({ onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [gameSettings, setGameSettings] = useState({ isStarted: false, isPaused: false });
  const [teams, setTeams] = useState({});

  // Fetch settings & teams when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubSettings = dbService.subscribeGameSettings((settings) => {
      setGameSettings(settings);
    });

    const unsubTeams = dbService.subscribeTeams((teamsData) => {
      setTeams(teamsData);
    });

    return () => {
      unsubSettings();
      unsubTeams();
    };
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "jonogoner_raja_mahid_bro" && password === "ami_mahid") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("INVALID DECRYPTION KEYS. ACCESS DENIED.");
    }
  };

  const handleStartGame = async () => {
    await dbService.updateGameSettings({ isStarted: true, isPaused: false });
  };

  const handlePauseGame = async () => {
    await dbService.updateGameSettings({ isPaused: true });
  };

  const handleResumeGame = async () => {
    await dbService.updateGameSettings({ isPaused: false });
  };

  const handleResetGame = async () => {
    if (window.confirm("ARE YOU SURE YOU WANT TO RESET ALL MISSION DATA? THIS ACTION CANNOT BE UNDONE.")) {
      await dbService.resetGame();
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div className="scanlines"></div>
        <div className="heist-card" style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <Lock size={32} color="#e50914" />
            <h2 className="glitch-text" style={styles.title}>PROFESSOR ACCESS</h2>
            <p style={styles.sub}>ENTER COORDINATES TO COMMAND MISSION</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>OPERATIVE ID</label>
              <input
                type="text"
                className="heist-input"
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jonogoner_raja_mahid_bro"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>ACCESS KEY</label>
              <input
                type="password"
                className="heist-input"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.actions}>
              <button type="submit" className="heist-btn-solid" style={styles.submitBtn}>
                DECRYPT & ENTER
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

  return (
    <div style={styles.dashboardContainer}>
      <div className="scanlines"></div>
      
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 className="glitch-text" style={styles.dashTitle}>THE PROFESSOR'S COMMAND ROOM</h1>
          <p style={styles.dashSub}>MISSION: LA CASA DEL TESORO</p>
        </div>
        <div style={styles.headerRight}>
          <button className="heist-btn" onClick={() => setIsAuthenticated(false)} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>DISCONNECT</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* Controls Card */}
        <section className="heist-card" style={styles.controlsCard}>
          <h2 style={styles.sectionTitle}>SYSTEM COMMANDS</h2>
          
          <div style={styles.statusDisplay}>
            <div style={styles.statusLabel}>GAME STATUS:</div>
            {gameSettings.isStarted ? (
              gameSettings.isPaused ? (
                <span style={styles.statusPaused}>PAUSED</span>
              ) : (
                <span style={styles.statusRunning}>LIVE & ACTIVE</span>
              )
            ) : (
              <span style={styles.statusStopped}>READY TO DEPLOY</span>
            )}
          </div>

          <div style={styles.controlButtons}>
            {!gameSettings.isStarted ? (
              <button className="heist-btn-solid" style={styles.controlBtn} onClick={handleStartGame}>
                <Play size={20} />
                <span>START SYSTEM LOCK</span>
              </button>
            ) : (
              <>
                {gameSettings.isPaused ? (
                  <button className="heist-btn-solid" style={styles.controlBtn} onClick={handleResumeGame}>
                    <Play size={20} />
                    <span>RESUME SYSTEM LOCK</span>
                  </button>
                ) : (
                  <button className="heist-btn-solid" style={{ ...styles.controlBtn, backgroundColor: "#d97706", borderColor: "#d97706" }} onClick={handlePauseGame}>
                    <Pause size={20} />
                    <span>PAUSE SYSTEM LOCK</span>
                  </button>
                )}
              </>
            )}

            <button className="heist-btn" style={styles.resetBtn} onClick={handleResetGame}>
              <RefreshCw size={20} color="#e50914" />
              <span style={{ color: "#e50914" }}>RESET MISSION DATA</span>
            </button>
          </div>
        </section>

        {/* Leaderboard Card */}
        <section className="heist-card" style={styles.leaderboardCard}>
          <div style={styles.sectionHeader}>
            <Trophy size={24} color="#e50914" />
            <h2 style={styles.sectionTitle}>REAL-TIME TEAM TRACKER</h2>
          </div>
          <Leaderboard teams={teams} />
        </section>
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
    gap: "16px",
    textAlign: "left",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "11px",
    color: "#e50914",
    letterSpacing: "1px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
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
    marginTop: "10px",
  },
  submitBtn: {
    width: "100%",
  },
  backBtn: {
    width: "100%",
  },
  dashboardContainer: {
    minHeight: "100vh",
    background: "#080808",
    padding: "40px 24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "16px",
  },
  dashTitle: {
    fontSize: "28px",
    color: "#fff",
  },
  dashSub: {
    color: "#e50914",
    fontSize: "12px",
    letterSpacing: "2px",
    fontFamily: "var(--font-mono)",
  },
  headerRight: {
    display: "flex",
    gap: "12px",
  },
  logoutBtn: {
    padding: "8px 16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  controlsCard: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    alignSelf: "start",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "20px",
    letterSpacing: "1px",
    color: "#fff",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  statusDisplay: {
    background: "#151515",
    border: "1px solid var(--border-color)",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  statusStopped: {
    color: "var(--text-muted)",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  statusRunning: {
    color: "#22c55e",
    fontWeight: "bold",
    letterSpacing: "1px",
    textShadow: "0 0 10px rgba(34, 197, 94, 0.4)",
  },
  statusPaused: {
    color: "#e50914",
    fontWeight: "bold",
    letterSpacing: "1px",
    textShadow: "0 0 10px rgba(229, 9, 20, 0.4)",
  },
  controlButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  controlBtn: {
    width: "100%",
  },
  resetBtn: {
    width: "100%",
    borderColor: "rgba(229, 9, 20, 0.4)",
  },
  leaderboardCard: {
    minHeight: "350px",
  }
};
