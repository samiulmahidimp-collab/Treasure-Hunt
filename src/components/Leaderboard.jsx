import React from "react";
import { CheckCircle, ShieldAlert } from "lucide-react";
import { CLUES } from "../clues";

export default function Leaderboard({ teams }) {
  const teamNames = ["mahid", "oyshee", "prizon"];

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table className="heist-table">
        <thead>
          <tr>
            <th>TEAM CODE</th>
            <th>CLUES SOLVED</th>
            <th>ATTEMPTS LEFT</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {teamNames.map((name) => {
            const data = teams[name] || { score: 0, attempts: 0, locked: false, solvedClues: [] };
            const solvedCount = data.solvedClues ? data.solvedClues.length : data.score;
            const remainingAttempts = 3 - (data.attempts || 0);
            const isDanger = remainingAttempts === 1 && !data.locked;

            return (
              <tr key={name}>
                <td style={{ fontWeight: 600, letterSpacing: 1.5, fontFamily: "var(--font-stencil)", fontSize: 18 }}>
                  {name.toUpperCase()}
                </td>
                <td>
                  <div className="score-badge">
                    <CheckCircle size={13} color="var(--green-ok)" />
                    <span>{solvedCount} / {CLUES.length}</span>
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
                  {data.locked ? (
                    <span className="status-pill status-paused" style={{ gap: 5 }}>
                      <ShieldAlert size={11} /> LOCKED
                    </span>
                  ) : solvedCount >= CLUES.length ? (
                    <span className="status-pill status-running">PHASE 1 COMPLETE</span>
                  ) : (
                    <span className="status-pill" style={{ color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.06)" }}>
                      DECRYPTING
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
