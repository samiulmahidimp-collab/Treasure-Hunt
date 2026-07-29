import React from "react";
import { CheckCircle, ShieldAlert, Pause, Play, Unlock, FileText, Eye, Trophy, Award } from "lucide-react";
import { CLUES, TOTAL_CLUES_COUNT } from "../clues";
import { TEAMS_CONFIG } from "../teamsConfig";

export default function Leaderboard({ teams, onTogglePauseTeam, onUnlockTeam, onResolveHelpTeam, onPreviewClue }) {
  // Sort teams dynamically by highest score / solved clues first (Strict Hierarchy)
  const sortedTeams = TEAMS_CONFIG.map((t) => {
    const data = (teams && (teams[t.id] || teams[t.name])) || { score: 0, attempts: 0, locked: false, isPaused: false, solvedClues: [], needsHelp: false, currentClueId: null };
    const solvedCount = data.solvedClues ? data.solvedClues.length : (data.score || 0);
    return { teamConfig: t, data, solvedCount };
  }).sort((a, b) => {
    // 1. Highest solved clues count first
    if (b.solvedCount !== a.solvedCount) {
      return b.solvedCount - a.solvedCount;
    }
    // 2. Fewer failed attempts as tiebreaker
    return (a.data.attempts || 0) - (b.data.attempts || 0);
  });

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table className="heist-table">
        <thead>
          <tr>
            <th style={{ width: 70, textAlign: "center" }}>RANK</th>
            <th>SQUAD IDENTITY</th>
            <th>ATTENDING CLUE &amp; INTEL</th>
            <th>TOTAL PROGRESS</th>
            <th>ATTEMPTS LEFT</th>
            <th>STATUS</th>
            {onTogglePauseTeam && <th>ADMIN CONTROLS</th>}
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map(({ teamConfig: t, data, solvedCount }, rankIdx) => {
            const rank = rankIdx + 1;
            const remainingAttempts = 3 - (data.attempts || 0);
            const isDanger = remainingAttempts === 1 && !data.locked;

            // Find active clue currently assigned to this team
            const activeClue = CLUES.find(c => c.id === data.currentClueId);

            // Determine stage text and color
            let stageText = "Stage 1";
            let stageColor = "#C8102E";

            if (activeClue) {
              if (activeClue.stage === 2) {
                stageText = "Stage 2 (Semi-Final)";
                stageColor = "#d97706";
              } else if (activeClue.stage === 3) {
                stageText = "Final Stage (Grand Vault)";
                stageColor = "#a855f7";
              }
            } else if (solvedCount >= 8 && solvedCount < 11) {
              stageText = "Stage 2 (Semi-Final)";
              stageColor = "#d97706";
            } else if (solvedCount >= 11) {
              stageText = "Final Stage (Grand Vault)";
              stageColor = "#a855f7";
            }

            // Rank styling
            let rankBadge = (
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                #{rank}
              </span>
            );

            if (rank === 1) {
              rankBadge = (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(234, 179, 8, 0.2)", border: "1px solid #eab308", color: "#eab308", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                  <Trophy size={13} color="#eab308" />
                  <span>#1</span>
                </div>
              );
            } else if (rank === 2) {
              rankBadge = (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(148, 163, 184, 0.2)", border: "1px solid #94a3b8", color: "#94a3b8", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                  <Award size={13} color="#94a3b8" />
                  <span>#2</span>
                </div>
              );
            } else if (rank === 3) {
              rankBadge = (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(217, 119, 6, 0.2)", border: "1px solid #d97706", color: "#d97706", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                  <Award size={13} color="#d97706" />
                  <span>#3</span>
                </div>
              );
            }

            return (
              <tr key={t.id} style={{ background: rank === 1 ? "rgba(234, 179, 8, 0.04)" : "transparent" }}>
                {/* RANK POSITION */}
                <td style={{ textAlign: "center" }}>
                  {rankBadge}
                </td>

                {/* TEAM NAME */}
                <td style={{ fontWeight: 700, letterSpacing: 1, fontFamily: "var(--font-stencil)", fontSize: 15 }}>
                  {t.name}
                  {rank === 1 && (
                    <span style={{ fontSize: 9, color: "#eab308", background: "rgba(234,179,8,0.15)", padding: "1px 5px", borderRadius: 3, marginLeft: 8, letterSpacing: 0.5 }}>
                      LEADER
                    </span>
                  )}
                </td>

                {/* CURRENTLY ATTENDING CLUE & INTEL */}
                <td>
                  {solvedCount >= TOTAL_CLUES_COUNT ? (
                    <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle size={14} color="#22c55e" />
                      <span>HEIST COMPLETED (ALL CLUES SOLVED)</span>
                    </div>
                  ) : activeClue ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
                      {/* Media Thumbnail */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 6,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.2)",
                          background: "#000",
                          flexShrink: 0,
                          cursor: "pointer",
                          position: "relative"
                        }}
                        onClick={() => onPreviewClue && onPreviewClue(activeClue)}
                        title="Click to preview active clue"
                      >
                        {activeClue.isPDF || activeClue.image.endsWith(".pdf") ? (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(200, 16, 46, 0.25)" }}>
                            <FileText size={20} color="#C8102E" />
                          </div>
                        ) : activeClue.image.endsWith(".mp4") ? (
                          <video src={activeClue.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                        ) : (
                          <img src={activeClue.image} alt={activeClue.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} className="thumb-hover">
                          <Eye size={14} color="#fff" />
                        </div>
                      </div>

                      {/* Clue Details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ color: stageColor, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {stageText}
                          </span>
                          <span style={{ background: "rgba(200,16,46,0.2)", border: "1px solid rgba(200,16,46,0.4)", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 3, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                            {activeClue.id}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#22c55e", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          KEY: <span style={{ color: "#fff", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 3 }}>{activeClue.answer}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          FILE: {activeClue.image.split("/").pop()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 11, fontStyle: "italic" }}>Awaiting clue assignment...</span>
                  )}
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
                  {data.needsHelp && (
                    <div style={{ marginBottom: 6 }}>
                      <span className="status-pill" style={{ background: "rgba(239, 68, 68, 0.2)", borderColor: "#ef4444", color: "#ef4444", animation: "blink 1s infinite", gap: 4 }}>
                        <ShieldAlert size={12} /> 🚨 SOS HELP NEEDED
                      </span>
                    </div>
                  )}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {data.needsHelp && (
                        <button
                          type="button"
                          className="heist-btn-solid"
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            background: "#ef4444",
                            borderColor: "#ef4444",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer"
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (onResolveHelpTeam) {
                              await onResolveHelpTeam(t.id);
                            } else {
                              await dbService.updateTeam(t.id, { needsHelp: false });
                              if (t.name) await dbService.updateTeam(t.name, { needsHelp: false });
                            }
                          }}
                        >
                          <CheckCircle size={12} />
                          <span>RESOLVE HELP</span>
                        </button>
                      )}

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
                        onClick={() => onTogglePauseTeam(t.id, !data.isPaused)}
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
                          onClick={() => onUnlockTeam(t.id)}
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
