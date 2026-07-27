import React, { useState, useEffect } from "react";
import { dbService } from "../firebase";
import { AlertTriangle, Pause, LogOut, Users, Lock } from "lucide-react";
import ChatbotScreen from "./ChatbotScreen";
import HeistLayout from "./HeistLayout";
import { DeTag } from "./HeistUI";
import { TEAMS_CONFIG, getTeamById } from "../teamsConfig";

export default function PlayerPortal({ onBack }) {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [activeTeam, setActiveTeam] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [gameSettings, setGameSettings] = useState({ isStarted: true, isPaused: false });
  const [bypassedWaiting, setBypassedWaiting] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validTeamIds = TEAMS_CONFIG.map(t => t.id);

  useEffect(() => {
    const unsub = dbService.subscribeGameSettings((s) => setGameSettings(s));
    return () => unsub();
  }, []);

  // Restore session from localStorage — runs ONCE on mount before render
  useEffect(() => {
    const storedTeam  = localStorage.getItem("heist_team");
    const storedToken = localStorage.getItem("heist_session_token");
    if (storedTeam && storedToken && validTeamIds.includes(storedTeam)) {
      setActiveTeam(storedTeam);
      setSessionToken(storedToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to team doc for single-device session enforcement
  useEffect(() => {
    if (!activeTeam) return;
    const unsub = dbService.subscribeTeam(activeTeam, (data) => {
      if (!data) return;
      setTeamData(data);
      const activeLocalToken = localStorage.getItem("heist_session_token");
      if (data.sessionToken && activeLocalToken && data.sessionToken !== activeLocalToken) {
        handleLogout();
        setLoginError("SESSION DISCONNECTED: Your team account logged in on another device.");
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam]);

  const handleTeamSelect = async (e) => {
    e.preventDefault();
    setLoginError("");

    const teamObj = getTeamById(selectedTeam);
    if (!teamObj) {
      setLoginError("INVALID TEAM SIGNATURE. ACCESS REJECTED.");
      return;
    }

    // Password validation (case-insensitive trim check)
    if (passwordVal.trim().toLowerCase() !== teamObj.password.toLowerCase()) {
      setLoginError("INVALID TEAM PASSWORD. ACCESS DENIED.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

      // 1. Set LocalStorage & session state BEFORE updating DB
      localStorage.setItem("heist_team", teamObj.id);
      localStorage.setItem("heist_session_token", newToken);
      setSessionToken(newToken);

      // 2. Update ONLY sessionToken in DB so currentClueId, score, & solvedClues are 100% preserved
      await dbService.updateTeam(teamObj.id, {
        sessionToken: newToken
      });

      // 3. Activate team state to display portal
      setActiveTeam(teamObj.id);
    } catch (err) {
      console.error("Login update error:", err);
      setLoginError("NETWORK ERROR DURING AUTHENTICATION. PLEASE RETRY.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("heist_team");
    localStorage.removeItem("heist_session_token");
    localStorage.removeItem("heist_role");
    setActiveTeam("");
    setSessionToken("");
    setPasswordVal("");
    setTeamData(null);
  };

  const activeTeamObj = getTeamById(activeTeam);
  const activeTeamDisplayName = activeTeamObj ? activeTeamObj.name : activeTeam.toUpperCase();

  // ── Team selection form ──────────────────────────────────
  if (!activeTeam) {
    return (
      <HeistLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "24px" }}>
          <div className="heist-card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <Users size={34} color="#C8102E" />
              <h2 className="heist-section-title">SQUAD <DeTag /> IDENTITY</h2>
              <p className="heist-subtitle" style={{ marginTop: 4 }}>
                SELECT YOUR TEAM AND ENTER ACCESS PASSWORD
              </p>
            </div>

            <form onSubmit={handleTeamSelect} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div className="login-field">
                <label className="heist-label" htmlFor="team-select">SELECT TEAM NAME</label>
                <select
                  id="team-select"
                  className="heist-input"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required
                >
                  <option value="" disabled>-- CHOOSE YOUR TEAM --</option>
                  {TEAMS_CONFIG.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="login-field">
                <label className="heist-label" htmlFor="team-password">TEAM PASSWORD</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="team-password"
                    type="password"
                    className="heist-input"
                    value={passwordVal}
                    onChange={(e) => setPasswordVal(e.target.value)}
                    placeholder="ENTER PASSWORD..."
                    required
                  />
                </div>
              </div>

              {loginError && <div className="heist-error">{loginError}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                <button type="submit" className="heist-btn-solid" style={{ width: "100%" }} disabled={isSubmitting}>
                  {isSubmitting ? "AUTHENTICATING..." : "ACTIVATE CHANNEL"}
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

  // ── Game paused (Global or Individual) ───────────────────
  if (gameSettings.isPaused || teamData?.isPaused) {
    return (
      <HeistLayout>
        <div className="heist-waiting">
          <div className="heist-card heist-waiting-card">
            <Pause size={48} color="#d97706" style={{ animation: "pulse 1.5s infinite alternate" }} />
            <h2 className="heist-waiting-title" style={{ color: "#d97706" }}>
              {teamData?.isPaused && !gameSettings.isPaused ? "TEAM PAUSED" : "MISSION ON HOLD"}
            </h2>
            <p className="heist-waiting-text">
              {teamData?.isPaused && !gameSettings.isPaused
                ? "THE PROFESSOR HAS PAUSED YOUR TEAM'S CHANNEL. STAND BY FOR OVERRIDE."
                : "THE PROFESSOR HAS PAUSED THE GAME CHANNELS. MAINTAIN POSITIONS AND STAND BY."
              }
            </p>
            <p className="heist-badge">OPERATIVE: {activeTeamDisplayName}</p>
            <button className="heist-btn" onClick={handleLogout} style={{ width: "100%", marginTop: 8 }}>
              <LogOut size={14} /> DISCONNECT
            </button>
          </div>
        </div>
      </HeistLayout>
    );
  }

  // ── Active game or waiting for Admin signal ───────────────
  return (
    <ChatbotScreen
      teamName={activeTeamDisplayName}
      teamId={activeTeam}
      teamData={teamData}
      isGameStarted={gameSettings.isStarted}
      onLogout={handleLogout}
    />
  );
}
