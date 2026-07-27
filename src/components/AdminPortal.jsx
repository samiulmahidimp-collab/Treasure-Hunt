import React, { useState, useEffect } from "react";
import { dbService } from "../firebase";
import { Lock, Play, Pause, RefreshCw, LogOut, Trophy, Layers, Edit, Check, X } from "lucide-react";
import Leaderboard from "./Leaderboard";
import HeistLayout from "./HeistLayout";
import { DeTag } from "./HeistUI";
import { CLUES, TOTAL_CLUES_COUNT, updateCluesList } from "../clues";

export default function AdminPortal({ onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [gameSettings, setGameSettings] = useState({ isStarted: false, isPaused: false });
  const [teams, setTeams] = useState({});
  const [activeTab, setActiveTab] = useState("tracker"); // 'tracker' | 'content'
  const [cluesList, setCluesList] = useState([...CLUES]);
  const [editingClueId, setEditingClueId] = useState(null);
  const [editFormData, setEditFormData] = useState({ answer: "", image: "", description: "", stage: 1 });

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubSettings = dbService.subscribeGameSettings((s) => setGameSettings(s));
    const unsubTeams = dbService.subscribeTeams((t) => setTeams(t));
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
    if (window.confirm("RESET ALL MISSION DATA? THIS ACTION CANNOT BE UNDONE.")) {
      await dbService.resetGame();
    }
  };

  // Toggle individual team pause
  const handleTogglePauseTeam = async (teamName, isPaused) => {
    await dbService.updateTeam(teamName, { isPaused });
  };

  // Admin unlocks team
  const handleUnlockTeam = async (teamName) => {
    await dbService.updateTeam(teamName, { attempts: 0, locked: false });
  };

  // Edit clue content
  const startEditClue = (clue) => {
    setEditingClueId(clue.id);
    setEditFormData({
      answer: clue.answer,
      image: clue.image,
      description: clue.description,
      stage: clue.stage || 1
    });
  };

  const saveEditClue = (id) => {
    const updated = cluesList.map(c => {
      if (c.id === id) {
        return {
          ...c,
          answer: editFormData.answer.trim().toLowerCase(),
          image: editFormData.image.trim(),
          description: editFormData.description.trim(),
          stage: parseInt(editFormData.stage) || 1,
          stageName: parseInt(editFormData.stage) === 2 ? "Stage 2 (Final Vault)" : "Stage 1 (Initial Hunt)"
        };
      }
      return c;
    });
    setCluesList(updated);
    updateCluesList(updated);
    setEditingClueId(null);
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

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        
        {/* Left Column: SYSTEM COMMANDS */}
        <section className="heist-card" style={{ display: "flex", flexDirection: "column", gap: 20, alignSelf: "start", borderColor: "rgba(200, 16, 46, 0.4)" }}>
          <h2 className="heist-section-title" style={{ fontSize: 18, letterSpacing: 2 }}>SYSTEM COMMANDS</h2>

          <div style={{ background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "12px 16px", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, letterSpacing: 1, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>GLOBAL GAME STATUS</span>
            {gameSettings.isStarted ? (
              gameSettings.isPaused
                ? <span className="status-pill status-paused" style={{ background: "rgba(217, 119, 6, 0.15)", borderColor: "#d97706", color: "#d97706" }}>⏸ PAUSED</span>
                : <span className="status-pill status-running" style={{ background: "rgba(34, 197, 94, 0.15)", borderColor: "#22c55e", color: "#22c55e" }}>● LIVE &amp; ACTIVE</span>
            ) : (
              <span className="status-pill status-stopped" style={{ background: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.2)", color: "#aaa" }}>READY TO DEPLOY</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {!gameSettings.isStarted ? (
              <button
                className="heist-btn-solid"
                style={{ width: "100%", padding: "14px", fontSize: 14, fontWeight: 700 }}
                onClick={handleStartGame}
              >
                <Play size={18} /> START MISSION
              </button>
            ) : (
              <>
                {gameSettings.isPaused ? (
                  <button
                    className="heist-btn-solid"
                    style={{ width: "100%", padding: "14px", fontSize: 14, fontWeight: 700, background: "#22c55e", borderColor: "#22c55e" }}
                    onClick={handleResumeGame}
                  >
                    <Play size={18} /> RESUME GLOBAL GAME
                  </button>
                ) : (
                  <button
                    className="heist-btn-solid"
                    style={{ width: "100%", padding: "14px", fontSize: 14, fontWeight: 700, background: "#d97706", borderColor: "#d97706", color: "#fff" }}
                    onClick={handlePauseGame}
                  >
                    <Pause size={18} /> GLOBAL PAUSE (FREEZE ALL)
                  </button>
                )}
              </>
            )}

            <button
              className="heist-btn"
              style={{ width: "100%", padding: "12px", borderColor: "rgba(200, 16, 46, 0.4)", background: "rgba(200, 16, 46, 0.05)" }}
              onClick={handleResetGame}
            >
              <RefreshCw size={16} color="#C8102E" />
              <span style={{ color: "#C8102E", fontSize: 13, fontWeight: 600 }}>RESET ALL GAME DATA</span>
            </button>
          </div>

          {/* Navigation Tab Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <button
              className={activeTab === "tracker" ? "heist-btn-solid" : "heist-btn"}
              style={{ padding: "10px 8px", fontSize: 11, gap: 6 }}
              onClick={() => setActiveTab("tracker")}
            >
              <Trophy size={14} />
              <span>LIVE TRACKER</span>
            </button>
            <button
              className={activeTab === "content" ? "heist-btn-solid" : "heist-btn"}
              style={{ padding: "10px 8px", fontSize: 11, gap: 6 }}
              onClick={() => setActiveTab("content")}
            >
              <Layers size={14} />
              <span>CLUE CONTENT MANAGER</span>
            </button>
          </div>
        </section>

        {/* Right Column: Active Tab Content */}
        {activeTab === "tracker" ? (
          <section className="heist-card" style={{ minHeight: 480, borderColor: "rgba(200, 16, 46, 0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(200, 16, 46, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={22} color="#C8102E" />
                <h2 className="heist-section-title" style={{ fontSize: 18, letterSpacing: 1.5 }}>REAL-TIME TEAM TRACKER</h2>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: 1 }}>
                2 STAGES • {TOTAL_CLUES_COUNT} CLUES TOTAL
              </span>
            </div>

            <Leaderboard
              teams={teams}
              onTogglePauseTeam={handleTogglePauseTeam}
              onUnlockTeam={handleUnlockTeam}
            />
          </section>
        ) : (
          <section className="heist-card" style={{ minHeight: 480, borderColor: "rgba(200, 16, 46, 0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(200, 16, 46, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Layers size={22} color="#C8102E" />
                <h2 className="heist-section-title" style={{ fontSize: 18, letterSpacing: 1.5 }}>
                  CONTENT MANAGEMENT ({cluesList.length} CLUES)
                </h2>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "650px", overflowY: "auto", paddingRight: 8 }}>
              {cluesList.map((clue, index) => {
                const isEditing = editingClueId === clue.id;
                const isStage1 = (clue.stage || 1) === 1;

                return (
                  <div
                    key={clue.id}
                    style={{
                      background: "rgba(10, 10, 15, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 8,
                      padding: 20,
                      position: "relative"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          background: isStage1 ? "#C8102E" : "#d97706",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 3,
                          letterSpacing: 1
                        }}>
                          STAGE {clue.stage || 1}
                        </span>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>
                          Clue #{index + 1} ({clue.id})
                        </h3>
                      </div>

                      {!isEditing ? (
                        <button
                          className="heist-btn"
                          style={{ padding: "4px 12px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6 }}
                          onClick={() => startEditClue(clue)}
                        >
                          <Edit size={12} />
                          <span>EDIT</span>
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="heist-btn-solid"
                            style={{ padding: "4px 12px", fontSize: 11, background: "#22c55e", borderColor: "#22c55e", display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={() => saveEditClue(clue.id)}
                          >
                            <Check size={12} /> SAVE
                          </button>
                          <button
                            className="heist-btn"
                            style={{ padding: "4px 12px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={() => setEditingClueId(null)}
                          >
                            <X size={12} /> CANCEL
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, fontSize: 12 }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontSize: 10, display: "block", marginBottom: 2 }}>IMAGE PATH:</span>
                          <span style={{ fontFamily: "var(--font-mono)", color: "#ccc", wordBreak: "break-all" }}>{clue.image}</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontSize: 10, display: "block", marginBottom: 2 }}>CORRECT ANSWER:</span>
                          <span style={{ fontFamily: "var(--font-mono)", color: "#22c55e", fontWeight: 700 }}>{clue.answer}</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontSize: 10, display: "block", marginBottom: 2 }}>DESCRIPTION:</span>
                          <span style={{ color: "#ddd" }}>{clue.description}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>STAGE (1 or 2):</label>
                            <select
                              className="heist-input"
                              style={{ width: "100%", padding: "6px 10px", fontSize: 12 }}
                              value={editFormData.stage}
                              onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                            >
                              <option value={1}>Stage 1 (Initial Hunt)</option>
                              <option value={2}>Stage 2 (Final Vault)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>CORRECT ANSWER:</label>
                            <input
                              type="text"
                              className="heist-input"
                              style={{ width: "100%", padding: "6px 10px", fontSize: 12 }}
                              value={editFormData.answer}
                              onChange={(e) => setEditFormData({ ...editFormData, answer: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>IMAGE PATH:</label>
                            <input
                              type="text"
                              className="heist-input"
                              style={{ width: "100%", padding: "6px 10px", fontSize: 12 }}
                              value={editFormData.image}
                              onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>DESCRIPTION:</label>
                          <input
                            type="text"
                            className="heist-input"
                            style={{ width: "100%", padding: "6px 10px", fontSize: 12 }}
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </HeistLayout>
  );
}
