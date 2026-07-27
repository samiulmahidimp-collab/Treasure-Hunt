import React from "react";
import { CheckCircle, ShieldAlert, Pause, Play, Unlock } from "lucide-react";
import { TOTAL_CLUES_COUNT } from "../clues";

export default function Leaderboard({ teams, onTogglePauseTeam, onUnlockTeam }) {
  const teamNames = ["mahid", "oyshee", "prizon"];

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
            {onTogglePauseTeam && <th>ADMIN CONTROLS</th>}
          </tr>
        </thead>
        <tbody>
          {teamNames.map((name) => {
            const data = teams[name] || { score: 0, attempts: 0, locked: false, isPaused: false, solvedClues: [] };
            const solvedCount = data.solvedClues ? data.solvedClues.length : data.score;
            const remainingAttempts = 3 - (data.attempts || 0);
            const isDanger = remainingAttempts === 1 && !data.locked;

            // Determine stage and clue number
            let stageText = "Stage 1 (Initial Hunt)";
            let clueText = `Clue ${Math.min(solvedCount + 1, 8)}/8`;
            let stageColor = "#C8102E";

            if (solvedCount >= 8 && solvedCount < 10) {
              stageText = "Stage 2 (Semi-Final)";
              clueText = `Clue ${solvedCount - 7}/2`;
              stageColor = "#d97706";
            } else if (solvedCount === 10) {
              stageText = "Final Stage (Grand Vault)";
              clueText = `Clue 1/1`;
              stageColor = "#a855f7";
            } else if (solvedCount >= 11) {
              stageText = "Finished";
              clueText = "All 11 Clues Solved";
              stageColor = "#22c55e";
            }

            return (
              <tr key={name}>
                <td style={{ fontWeight: 700, letterSpacing: 1.5, fontFamily: "var(--font-stencil)", fontSize: 16 }}>
                  {name.toUpperCase()}
                </td>

                {/* CURRENT STAGE & CLUE */}
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: stageColor, fontSize: 12, fontWeight: 700 }}>
                      {stageText}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                      {clueText}
                    </span>
                  </div>
                </td>

                {/* TOTAL PROGRESS */}
                <td>
                  <div className="score-badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: 4, color: "#22c55e", fontWeight: 700, fontSize: 13 }}>
                    <CheckCircle size={14} color="#22c55e" />
                    <span>{solvedCount} / {TOTAL_CLUES_COUNT}</span>
                  </div>
                </td>

                {/* ATTEMPTS LEFT */}
                <td>
                  {data.locked ? (
                    <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>0</span>
                  ) : (
                    <span style={{
                      color: isDanger ? "var(--red-primary)" : "var(--text-secondary)",
                      fontWeight: isDanger ? 700 : 600,
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      animation: isDanger ? "blink 1s infinite" : "none",
                    }}>
                      {remainingAttempts}
                    </span>
                  )}
                </td>

                {/* STATUS */}
                <td>
                  {data.locked ? (
                    <span className="status-pill status-paused" style={{ gap: 5, background: "rgba(200, 16, 46, 0.15)", borderColor: "#C8102E", color: "#C8102E" }}>
                      <ShieldAlert size={11} /> LOCKED
                    </span>
                  ) : data.isPaused ? (
                    <span className="status-pill status-paused" style={{ gap: 5, background: "rgba(217, 119, 6, 0.15)", borderColor: "#d97706", color: "#d97706" }}>
                      <Pause size={11} /> PAUSED
                    </span>
                  ) : solvedCount >= TOTAL_CLUES_COUNT ? (
                    <span className="status-pill status-running" style={{ background: "rgba(34, 197, 94, 0.15)", borderColor: "#22c55e", color: "#22c55e" }}>
                      HEIST COMPLETE
                    </span>
                  ) : solvedCount >= 8 ? (
                    <span className="status-pill status-running" style={{ background: "rgba(34, 197, 94, 0.15)", borderColor: "#22c55e", color: "#22c55e" }}>
                      STAGE 1 COMPLETE
                    </span>
                  ) : (
                    <span className="status-pill" style={{ color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.06)" }}>
                      DECRYPTING
                    </span>
                  )}
                </td>

                {/* ADMIN CONTROLS FOR INDIVIDUAL TEAM */}
                {onTogglePauseTeam && (
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        className="heist-btn"
                        style={{
                          padding: "4px 10px",
                          fontSize: 11,
                          borderColor: data.isPaused ? "#22c55e" : "#d97706",
                          color: data.isPaused ? "#22c55e" : "#d97706",
                          background: data.isPaused ? "rgba(34, 197, 94, 0.1)" : "rgba(217, 119, 6, 0.1)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                        onClick={() => onTogglePauseTeam(name, !data.isPaused)}
                      >
                        {data.isPaused ? <Play size={12} /> : <Pause size={12} />}
                        <span>{data.isPaused ? "RESUME" : "PAUSE"}</span>
                      </button>

                      {data.locked && onUnlockTeam && (
                        <button
                          className="heist-btn"
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            borderColor: "#C8102E",
                            color: "#C8102E",
                            background: "rgba(200, 16, 46, 0.1)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                          onClick={() => onUnlockTeam(name)}
                        >
                          <Unlock size={12} />
                          <span>UNLOCK</span>
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
