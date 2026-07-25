import React, { useState, useEffect } from "react";
import { dbService } from "../firebase";
import { Lock, Play, Pause, RefreshCw, LogOut, Trophy } from "lucide-react";
import Leaderboard from "./Leaderboard";
import HeistLayout from "./HeistLayout";
import { DeTag, HeistTitle } from "./HeistUI";

export default function AdminPortal({ onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [gameSettings, setGameSettings] = useState({ isStarted: false, isPaused: false });
  const [teams, setTeams] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubSettings = dbService.subscribeGameSettings((s) => setGameSettings(s));
    const unsubTeams    = dbService.subscribeTeams((t) => setTeams(t));
    return () => { unsubSettings(); unsubTeams(); };
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

  const handleStartGame  = async () => { await dbService.updateGameSettings({ isStarted: true, isPaused: false }); };
  const handlePauseGame  = async () => { await dbService.updateGameSettings({ isPaused: true }); };
  const handleResumeGame = async () => { await dbService.updateGameSettings({ isPaused: false }); };
  const handleResetGame  = async () => {
    if (window.confirm("RESET ALL MISSION DATA? THIS ACTION CANNOT BE UNDONE.")) {
      await dbService.resetGame();
    }
  };

  // ── Admin login form ─────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <HeistLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "24px" }}>
          <div className="heist-card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <Lock size={34} color="#C8102E" />
              <h2 className="heist-section-title">PROFESSOR ACCESS</h2>
              <p className="heist-subtitle" style={{ marginTop: 4 }}>
                ENTER COORDINATES TO COMMAND THE MISSION
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div className="login-field">
                <label className="heist-label" htmlFor="admin-username">OPERATIVE ID</label>
                <input
                  id="admin-username"
                  type="text"
                  className="heist-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ENTER YOUR ID..."
                  autoComplete="username"
                  required
                />
              </div>

              <div className="login-field">
                <label className="heist-label" htmlFor="admin-password">ACCESS KEY</label>
                <input
                  id="admin-password"
                  type="password"
                  className="heist-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && <div className="heist-error">{error}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                <button type="submit" className="heist-btn-solid" style={{ width: "100%" }}>
                  DECRYPT &amp; ENTER
                </button>
                <button type="button" className="heist-btn" style={{ width: "100%" }} onClick={onBack}>
                  BACK TO LOBBY
                </button>
              </div>
            </form>
          </div>
        </div>
      </HeistLayout>
    );
  }

  // ── Admin dashboard ──────────────────────────────────────
  return (
    <HeistLayout>
      <header className="heist-header">
        <div>
          <div className="heist-header-logo">
            THE PROFESSOR&apos;S COMMAND ROOM
          </div>
          <p className="heist-subtitle" style={{ marginTop: 3, fontSize: 9, letterSpacing: "2px" }}>
            MISSION: LA CAZA <DeTag style={{ fontSize: 9, letterSpacing: 1, padding: "0 4px" }} /> TESORO
          </p>
        </div>
        <div className="heist-header-actions">
          <button
            className="heist-btn"
            style={{ padding: "8px 16px", fontSize: 13 }}
            onClick={() => setIsAuthenticated(false)}
          >
            <LogOut size={14} /> DISCONNECT
          </button>
        </div>
      </header>

      <div className="admin-grid">
        {/* Controls card */}
        <section className="heist-card" style={{ display: "flex", flexDirection: "column", gap: 20, alignSelf: "start" }}>
          <h2 className="heist-section-title">SYSTEM COMMANDS</h2>

          <div className="admin-status-row">
            <span className="heist-label">GAME STATUS</span>
            {gameSettings.isStarted ? (
              gameSettings.isPaused
                ? <span className="status-pill status-paused">⏸ PAUSED</span>
                : <span className="status-pill status-running">● LIVE &amp; ACTIVE</span>
            ) : (
              <span className="status-pill status-stopped">READY TO DEPLOY</span>
            )}
          </div>

          <div className="control-btn-row">
            {!gameSettings.isStarted ? (
              <button className="heist-btn-solid" style={{ width: "100%" }} onClick={handleStartGame}>
                <Play size={18} /> START MISSION
              </button>
            ) : (
              <>
                {gameSettings.isPaused ? (
                  <button className="heist-btn-solid" style={{ width: "100%" }} onClick={handleResumeGame}>
                    <Play size={18} /> RESUME MISSION
                  </button>
                ) : (
                  <button
                    className="heist-btn-solid"
                    style={{ width: "100%", background: "#d97706", borderColor: "#d97706" }}
                    onClick={handlePauseGame}
                  >
                    <Pause size={18} /> PAUSE MISSION
                  </button>
                )}
              </>
            )}

            <button
              className="heist-btn"
              style={{ width: "100%", borderColor: "rgba(200,16,46,0.4)" }}
              onClick={handleResetGame}
            >
              <RefreshCw size={18} color="#C8102E" />
              <span style={{ color: "#C8102E" }}>RESET MISSION DATA</span>
            </button>
          </div>
        </section>

        {/* Leaderboard card */}
        <section className="heist-card" style={{ minHeight: 360 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Trophy size={22} color="#C8102E" />
            <h2 className="heist-section-title">REAL-TIME TEAM TRACKER</h2>
          </div>
          <Leaderboard teams={teams} />
        </section>
      </div>
    </HeistLayout>
  );
}
