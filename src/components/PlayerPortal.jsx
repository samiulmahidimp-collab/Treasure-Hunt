import React, { useState, useEffect } from "react";
import { dbService } from "../firebase";
import { AlertTriangle, Pause, LogOut, Users, Play } from "lucide-react";
import ChatbotScreen from "./ChatbotScreen";
import HeistLayout from "./HeistLayout";
import { DeTag } from "./HeistUI";

export default function PlayerPortal({ onBack }) {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [activeTeam, setActiveTeam] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [gameSettings, setGameSettings] = useState({ isStarted: false, isPaused: false });
  const [teamData, setTeamData] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validTeams = ["mahid", "oyshee", "prizon"];

  useEffect(() => {
    const unsub = dbService.subscribeGameSettings((s) => setGameSettings(s));
    return () => unsub();
  }, []);

  // Restore session from localStorage — runs ONCE on mount before render
  useEffect(() => {
    const storedTeam  = localStorage.getItem("heist_team");
    const storedToken = localStorage.getItem("heist_session_token");
    if (storedTeam && storedToken && validTeams.includes(storedTeam)) {
      setActiveTeam(storedTeam);
      setSessionToken(storedToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to team doc for single-device enforcement
  useEffect(() => {
    if (!activeTeam) return;
    const unsub = dbService.subscribeTeam(activeTeam, (data) => {
      setTeamData(data);
      if (data?.sessionToken && sessionToken && data.sessionToken !== sessionToken) {
        alert("SECURITY BREACH: Your team logged in on another device! Disconnecting.");
        handleLogout();
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam, sessionToken]);

  const handleTeamSelect = async (e) => {
    e.preventDefault();
    const teamLower = selectedTeam.trim().toLowerCase();
    if (!validTeams.includes(teamLower)) {
      setLoginError("INVALID TEAM SIGNATURE. ACCESS REJECTED.");
      return;
    }
    setLoginError("");
    setIsSubmitting(true);

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    await dbService.updateTeam(teamLower, {
      sessionToken: token,
      score: teamData?.score || 0,
      solvedClues: teamData?.solvedClues || [],
      attempts: teamData?.attempts || 0,
      locked: teamData?.locked || false,
    });

    // Write to localStorage BEFORE updating state to avoid false kick-outs
    localStorage.setItem("heist_team", teamLower);
    localStorage.setItem("heist_session_token", token);

    setSessionToken(token);
    setActiveTeam(teamLower);
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("heist_team");
    localStorage.removeItem("heist_session_token");
    setActiveTeam("");
    setSessionToken("");
    setTeamData(null);
  };

  // ── Team selection form ──────────────────────────────────
  if (!activeTeam) {
    return (
      <HeistLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "24px" }}>
          <div className="heist-card" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <Users size={32} color="#C8102E" />
              <h2 className="heist-section-title">SQUAD <DeTag /> IDENTITY</h2>
              <p className="heist-subtitle" style={{ marginTop: 4 }}>
                SYNC YOUR TEAM SIGNATURE TO ENTER THE CHANNEL
              </p>
            </div>

            <form onSubmit={handleTeamSelect} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div className="login-field">
                <label className="heist-label" htmlFor="team-select">SELECT TEAM CODE</label>
                <select
                  id="team-select"
                  className="heist-input"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required
                >
                  <option value="" disabled>-- CHOOSE TEAM --</option>
                  {validTeams.map((t) => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {loginError && <div className="heist-error">{loginError}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                <button type="submit" className="heist-btn-solid" style={{ width: "100%" }} disabled={isSubmitting}>
                  {isSubmitting ? "CONNECTING..." : "ACTIVATE CHANNEL"}
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

  // ── Game not started ────────────────────────────────────
  if (!gameSettings.isStarted) {
    return (
      <HeistLayout>
        <div className="heist-waiting">
          <div className="heist-card heist-waiting-card">
            <AlertTriangle size={48} color="#C8102E" className="pulse-glow" />
            <h2 className="heist-waiting-title">CHANNEL ENCRYPTED</h2>
            <p className="heist-waiting-text">
              THE PROFESSOR HAS NOT DEPLOYED THE SIGNAL YET. YOU CAN STAND BY OR LAUNCH DIRECTLY.
            </p>
            <p className="heist-badge">OPERATIVE: {activeTeam.toUpperCase()}</p>

            <button
              className="heist-btn-solid"
              style={{ width: "100%", marginTop: 8 }}
              onClick={async () => {
                await dbService.updateGameSettings({ isStarted: true, isPaused: false });
              }}
            >
              <Play size={16} /> ACTIVATE MISSION &amp; ENTER CHAT
            </button>

            <button className="heist-btn" onClick={handleLogout} style={{ width: "100%", marginTop: 4 }}>
              <LogOut size={14} /> DISCONNECT
            </button>
          </div>
        </div>
      </HeistLayout>
    );
  }

  // ── Game paused (Globally or Individually by Admin) ─────────────────
  if (gameSettings.isPaused || teamData?.paused) {
    return (
      <HeistLayout>
        <div className="heist-waiting">
          <div className="heist-card heist-waiting-card">
            <Pause size={48} color="#d97706" style={{ animation: "pulse 1.5s infinite alternate" }} />
            <h2 className="heist-waiting-title" style={{ color: "#d97706" }}>GAME PAUSED BY ADMIN</h2>
            <p className="heist-waiting-text">
              {teamData?.paused && !gameSettings.isPaused
                ? `Operative ${activeTeam.toUpperCase()}, your team channel has been individually paused by Admin. Maintain position.`
                : "THE PROFESSOR HAS PAUSED THE GAME FOR ALL TEAMS. MAINTAIN POSITIONS AND STAND BY."}
            </p>
            <p className="heist-badge">OPERATIVE: {activeTeam.toUpperCase()}</p>
            <button className="heist-btn" onClick={handleLogout} style={{ width: "100%", marginTop: 8 }}>
              <LogOut size={14} /> DISCONNECT
            </button>
          </div>
        </div>
      </HeistLayout>
    );
  }

  // ── Active game ─────────────────────────────────────────
  return (
    <ChatbotScreen
      teamName={activeTeam}
      teamData={teamData}
      onLogout={handleLogout}
    />
  );
}
