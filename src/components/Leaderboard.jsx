import React from "react";
import { CheckCircle, ShieldAlert, Pause, Play, Unlock, Flag } from "lucide-react";
import { dbService } from "../firebase";

export default function Leaderboard({ teams, isAdmin = false }) {
  const teamNames = ["mahid", "oyshee", "prizon"];

  // Compute stage and clue position for a team based on solvedCount
  const getStageStatus = (solvedCount) => {
    if (solvedCount >= 11) {
      return { stageNum: 3, stageText: "Stage 3 (Final)", clueText: "COMPLETE", isFinished: true };
    }
    if (solvedCount >= 10) {
      return { stageNum: 3, stageText: "Stage 3 (Final)", clueText: "Final Clue (1/1)", isFinished: false };
    }
    if (solvedCount >= 8) {
      const clueIndex = solvedCount - 7;
      return { stageNum: 2, stageText: "Stage 2 (Qualifiers)", clueText: `Clue ${clueIndex}/2`, isFinished: false };
    }
    return { stageNum: 1, stageText: "Stage 1 (Initial Hunt)", clueText: `Clue ${solvedCount + 1}/8`, isFinished: false };
  };

  const handleToggleIndividualPause = async (teamName, currentPaused) => {
    await dbService.updateTeam(teamName, { paused: !currentPaused });
  };

  const handleUnlockTeam = async (teamName) => {
    await dbService.updateTeam(teamName, { attempts: 0, locked: false });
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table className="heist-table">
        <thead>
          <tr>
            <th>TEAM CODE</th>
            <th>CURRENT STAGE &amp; CLUE</th>
            <th>TOTAL PROGRESS</th>
            <th>ATTEMPTS LEFT</th>
            <th>STATUS</th>
            {isAdmin && <th>ADMIN CONTROLS</th>}
          </tr>
        </thead>
        <tbody>
          {teamNames.map((name) => {
            const data = teams[name] || { score: 0, attempts: 0, locked: false, paused: false, solvedClues: [] };
            const solvedCount = data.solvedClues ? data.solvedClues.length : data.score;
            const remainingAttempts = 3 - (data.attempts || 0);
            const isDanger = remainingAttempts === 1 && !data.locked;
            const stageInfo = getStageStatus(solvedCount);

            return (
              <tr key={name}>
                <td style={{ fontWeight: 600, letterSpacing: 1.5, fontFamily: "var(--font-stencil)", fontSize: 16 }}>
                  {name.toUpperCase()}
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: stageInfo.stageNum === 3 ? "#f59e0b" : stageInfo.stageNum === 2 ? "#3b82f6" : "#e50914" }}>
                      {stageInfo.stageText}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {stageInfo.clueText}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="score-badge">
                    <CheckCircle size={13} color="var(--green-ok)" />
                    <span>{solvedCount} / 11</span>
                  </div>
                </td>
                <td>
                  {data.locked ? (
                    <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>0</span>
                  ) : (
                    <span style={{
                      color: isDanger ? "var(--red-primary)" : "var(--text-secondary)",
                      fontWeight: isDanger ? 700 : 400,
                      fontFamily: "var(--font-mono)",
                      animation: isDanger ? "blink 1s infinite" : "none",
                    }}>
                      {remainingAttempts}
                    </span>
                  )}
                </td>
                <td>
                  {stageInfo.isFinished ? (
                    <span className="status-pill status-running" style={{ gap: 4 }}>
                      <Flag size={11} /> HEIST COMPLETE
                    </span>
                  ) : data.locked ? (
                    <span className="status-pill status-paused" style={{ gap: 4 }}>
                      <ShieldAlert size={11} /> LOCKED
                    </span>
                  ) : data.paused ? (
                    <span className="status-pill" style={{ color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)" }}>
                      ⏸ TEAM PAUSED
                    </span>
                  ) : (
                    <span className="status-pill" style={{ color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.06)" }}>
                      DECRYPTING
                    </span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        className="heist-btn"
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          borderColor: data.paused ? "var(--green-ok)" : "#f59e0b",
                          color: data.paused ? "var(--green-ok)" : "#f59e0b"
                        }}
                        onClick={() => handleToggleIndividualPause(name, data.paused)}
                        title={data.paused ? "Resume Team" : "Pause Team"}
                      >
                        {data.paused ? <Play size={12} /> : <Pause size={12} />}
                        <span>{data.paused ? "Resume" : "Pause"}</span>
                      </button>

                      {data.locked && (
                        <button
                          className="heist-btn"
                          style={{ padding: "4px 8px", fontSize: 11, borderColor: "var(--red-primary)", color: "var(--red-primary)" }}
                          onClick={() => handleUnlockTeam(name)}
                          title="Unlock Team"
                        >
                          <Unlock size={12} />
                          <span>Unlock</span>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
