import React from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { CLUES } from "../clues";

export default function Leaderboard({ teams }) {
  const teamNames = ["mahid", "oyshee", "prizon"];

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            <th style={styles.th}>TEAM CODE</th>
            <th style={styles.th}>CLUES SOLVED</th>
            <th style={styles.th}>ATTEMPTS LEFT</th>
            <th style={styles.th}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {teamNames.map((name) => {
            const data = teams[name] || { score: 0, attempts: 0, locked: false, solvedClues: [] };
            const solvedCount = data.solvedClues ? data.solvedClues.length : data.score;
            const remainingAttempts = 3 - (data.attempts || 0);

            return (
              <tr key={name} style={styles.row}>
                <td style={styles.teamName}>{name.toUpperCase()}</td>
                <td style={styles.scoreCell}>
                  <div style={styles.scoreBadge}>
                    <CheckCircle size={14} color="#22c55e" />
                    <span>{solvedCount} / {CLUES.length}</span>
                  </div>
                </td>
                <td style={styles.attemptsCell}>
                  {data.locked ? (
                    <span style={styles.attemptsLocked}>0</span>
                  ) : (
                    <span style={remainingAttempts === 1 ? styles.attemptsDanger : styles.attemptsNormal}>
                      {remainingAttempts}
                    </span>
                  )}
                </td>
                <td style={styles.statusCell}>
                  {data.locked ? (
                    <span style={styles.statusLocked}>
                      <ShieldAlert size={12} />
                      <span>LOCKED</span>
                    </span>
                  ) : solvedCount >= CLUES.length ? (
                    <span style={styles.statusFinished}>PHASE 1 COMPLETE</span>
                  ) : (
                    <span style={styles.statusActive}>DECRYPTING</span>
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

const styles = {
  container: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "#fff",
    textAlign: "left",
  },
  headerRow: {
    borderBottom: "2px solid var(--red-primary)",
  },
  th: {
    padding: "12px 16px",
    fontWeight: "bold",
    letterSpacing: "1px",
    color: "#e50914",
    fontSize: "11px",
  },
  row: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background 0.2s ease",
    ":hover": {
      background: "rgba(229, 9, 20, 0.05)",
    }
  },
  teamName: {
    padding: "16px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  scoreCell: {
    padding: "16px",
  },
  scoreBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    padding: "4px 8px",
    borderRadius: "2px",
    fontWeight: "bold",
  },
  attemptsCell: {
    padding: "16px",
  },
  attemptsNormal: {
    color: "var(--text-secondary)",
  },
  attemptsDanger: {
    color: "#e50914",
    fontWeight: "bold",
    animation: "blink 1s infinite",
  },
  attemptsLocked: {
    color: "#777",
    textDecoration: "line-through",
  },
  statusCell: {
    padding: "16px",
  },
  statusActive: {
    color: "#3b82f6",
    fontSize: "11px",
    letterSpacing: "1.5px",
    fontWeight: "bold",
  },
  statusLocked: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "#e50914",
    fontSize: "11px",
    letterSpacing: "1.5px",
    fontWeight: "bold",
    textShadow: "0 0 10px rgba(229, 9, 20, 0.4)",
  },
  statusFinished: {
    color: "#22c55e",
    fontSize: "11px",
    letterSpacing: "1.5px",
    fontWeight: "bold",
    textShadow: "0 0 10px rgba(34, 197, 94, 0.4)",
  }
};
