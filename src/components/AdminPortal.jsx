import React, { useState, useEffect } from "react";
import { dbService } from "../firebase";
import { Lock, Play, Pause, RefreshCw, LogOut, Trophy, Edit3, Save, Layers, Check } from "lucide-react";
import Leaderboard from "./Leaderboard";
import HeistLayout from "./HeistLayout";
import { DeTag } from "./HeistUI";
import { DEFAULT_CLUES, STAGE_CONFIG, getDynamicImagePath } from "../clues";

export default function AdminPortal({ onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [gameSettings, setGameSettings] = useState({ isStarted: false, isPaused: false });
  const [teams, setTeams] = useState({});
  const [clues, setClues] = useState(DEFAULT_CLUES);
  const [activeTab, setActiveTab] = useState("tracker"); // "tracker" | "content"
  const [editingClueId, setEditingClueId] = useState(null);
  const [editForm, setEditForm] = useState({ answer: "", description: "", imageFilename: "" });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubSettings = dbService.subscribeGameSettings((s) => setGameSettings(s));
    const unsubTeams    = dbService.subscribeTeams((t) => setTeams(t));
    const unsubClues    = dbService.subscribeClues((c) => setClues(c));
    return () => { unsubSettings(); unsubTeams(); unsubClues(); };
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
    if (window.confirm("RESET ALL MISSION DATA & CLUE PROGRESS? THIS ACTION CANNOT BE UNDONE.")) {
      await dbService.resetGame();
    }
  };

  // Clue Editor handlers
  const handleStartEditClue = (clue) => {
    setEditingClueId(clue.id);
    setEditForm({
      answer: clue.answer || "",
      description: clue.description || "",
      imageFilename: clue.imageFilename || (clue.image_path ? clue.image_path.split("/").pop() : "")
    });
  };

  const handleSaveClue = async (clueId) => {
    const updatedList = clues.map((c) => {
      if (c.id === clueId) {
        const dynamicPath = getDynamicImagePath(c.stage, editForm.imageFilename);
        return {
          ...c,
          answer: editForm.answer.trim().toLowerCase(),
          description: editForm.description.trim(),
          imageFilename: editForm.imageFilename.trim(),
          image_path: dynamicPath
        };
      }
      return c;
    });

    await dbService.updateClues(updatedList);
    setEditingClueId(null);
    setSaveSuccessMsg(`Clue ${clueId} updated successfully!`);
    setTimeout(() => setSaveSuccessMsg(""), 3000);
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

      {/* Main Admin Grid */}
      <div className="admin-grid">
        {/* Controls card */}
        <section className="heist-card" style={{ display: "flex", flexDirection: "column", gap: 20, alignSelf: "start" }}>
          <h2 className="heist-section-title">SYSTEM COMMANDS</h2>

          <div className="admin-status-row">
            <span className="heist-label">GLOBAL GAME STATUS</span>
            {gameSettings.isStarted ? (
              gameSettings.isPaused
                ? <span className="status-pill status-paused">⏸ GLOBAL PAUSE</span>
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
                    <Play size={18} /> RESUME ALL TEAMS
                  </button>
                ) : (
                  <button
                    className="heist-btn-solid"
                    style={{ width: "100%", background: "#d97706", borderColor: "#d97706" }}
                    onClick={handlePauseGame}
                  >
                    <Pause size={18} /> GLOBAL PAUSE (FREEZE ALL)
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
              <span style={{ color: "#C8102E" }}>RESET ALL GAME DATA</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              className={`heist-btn ${activeTab === "tracker" ? "heist-btn-solid" : ""}`}
              style={{ flex: 1, padding: "8px", fontSize: 12 }}
              onClick={() => setActiveTab("tracker")}
            >
              <Trophy size={14} /> LIVE TRACKER
            </button>
            <button
              className={`heist-btn ${activeTab === "content" ? "heist-btn-solid" : ""}`}
              style={{ flex: 1, padding: "8px", fontSize: 12 }}
              onClick={() => setActiveTab("content")}
            >
              <Layers size={14} /> CLUE CONTENT MANAGER
            </button>
          </div>
        </section>

        {/* Tab 1: Live Tracker / Leaderboard */}
        {activeTab === "tracker" && (
          <section className="heist-card" style={{ minHeight: 360 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={22} color="#C8102E" />
                <h2 className="heist-section-title">REAL-TIME TEAM TRACKER</h2>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                3 STAGES • 11 CLUES TOTAL
              </span>
            </div>
            <Leaderboard teams={teams} isAdmin={true} />
          </section>
        )}

        {/* Tab 2: Content Management (Clue Editor) */}
        {activeTab === "content" && (
          <section className="heist-card" style={{ minHeight: 360 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Layers size={22} color="#C8102E" />
                <h2 className="heist-section-title">CONTENT MANAGEMENT (11 CLUES)</h2>
              </div>
              {saveSuccessMsg && (
                <span style={{ color: "var(--green-ok)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={14} /> {saveSuccessMsg}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: 520, overflowY: "auto", paddingRight: 6 }}>
              {clues.map((clue, index) => {
                const isEditing = editingClueId === clue.id;
                const stageMeta = STAGE_CONFIG[clue.stage] || {};

                return (
                  <div
                    key={clue.id}
                    style={{
                      background: "rgba(10,10,15,0.6)",
                      border: isEditing ? "1px solid #e50914" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          background: clue.stage === 3 ? "#f59e0b" : clue.stage === 2 ? "#3b82f6" : "#e50914",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontFamily: "var(--font-mono)"
                        }}>
                          STAGE {clue.stage}
                        </span>
                        <strong style={{ fontSize: 14, color: "#fff" }}>Clue #{index + 1} ({clue.id})</strong>
                      </div>

                      {!isEditing ? (
                        <button
                          className="heist-btn"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => handleStartEditClue(clue)}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="heist-btn-solid"
                            style={{ padding: "4px 10px", fontSize: 11 }}
                            onClick={() => handleSaveClue(clue.id)}
                          >
                            <Save size={12} /> Save
                          </button>
                          <button
                            className="heist-btn"
                            style={{ padding: "4px 10px", fontSize: 11 }}
                            onClick={() => setEditingClueId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* View mode vs Edit mode */}
                    {!isEditing ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, fontSize: 12 }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>IMAGE PATH:</span>
                          <div style={{ fontFamily: "var(--font-mono)", color: "#fff", wordBreak: "break-all" }}>
                            {clue.image_path || getDynamicImagePath(clue.stage, clue.imageFilename)}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>CORRECT ANSWER:</span>
                          <div style={{ fontFamily: "var(--font-mono)", color: "var(--green-ok)", fontWeight: 700 }}>
                            {clue.answer}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>DESCRIPTION:</span>
                          <div style={{ color: "var(--text-secondary)" }}>
                            {clue.description}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
                        <div>
                          <label className="heist-label" style={{ fontSize: 10 }}>IMAGE FILENAME</label>
                          <input
                            type="text"
                            className="heist-input"
                            style={{ fontSize: 12, padding: "6px 10px" }}
                            value={editForm.imageFilename}
                            onChange={(e) => setEditForm({ ...editForm, imageFilename: e.target.value })}
                            placeholder="e.g. afrewa.png"
                          />
                        </div>
                        <div>
                          <label className="heist-label" style={{ fontSize: 10 }}>CORRECT ANSWER</label>
                          <input
                            type="text"
                            className="heist-input"
                            style={{ fontSize: 12, padding: "6px 10px" }}
                            value={editForm.answer}
                            onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                            placeholder="e.g. afrewa"
                          />
                        </div>
                        <div>
                          <label className="heist-label" style={{ fontSize: 10 }}>PROMPT DESCRIPTION</label>
                          <input
                            type="text"
                            className="heist-input"
                            style={{ fontSize: 12, padding: "6px 10px" }}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Prompt text shown to players..."
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
