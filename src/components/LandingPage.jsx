/**
 * LandingPage — THE single login screen for LA CAZA DE TESORO.
 *
 * Flow: user picks role → clicks ENTRAR → onSelectRole(role) fires ONCE.
 * App.jsx receives this and immediately renders the correct portal.
 * There is no second login screen — PlayerPortal and AdminPortal check
 * auth internally (team/password) but do NOT render a duplicate landing.
 */
import React, { useState } from "react";
import HeistLayout from "./HeistLayout";
import { HeistTitle, DeTag } from "./HeistUI";

export default function LandingPage({ onSelectRole }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEntering, setIsEntering] = useState(false);

  const handleEnter = async (e) => {
    e.preventDefault();
    if (!selectedRole || isEntering) return;

    setIsEntering(true);
    // Brief dramatic pause for cinematic effect
    await new Promise((res) => setTimeout(res, 550));
    // Fire callback — App.jsx will replace this screen immediately
    onSelectRole(selectedRole);
    // No need to reset state since this component unmounts after onSelectRole
  };

  return (
    <HeistLayout>
      {/* Full-screen flex centering for the login card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        <div className="login-card" role="main" aria-label="Login">
          {/* Bronze corner accent */}
          <div className="card-corner-tl" aria-hidden="true" />
          <div className="card-corner-br" aria-hidden="true" />

          {/* CLASIFICADO stamp */}
          <div className="login-stamp" aria-hidden="true">
            CLASIFICADO
          </div>

          {/* ── Header / Logo ───────────────────────────────── */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            {/* Drip accents */}
            <div className="login-drip" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>

            <h1 className="heist-title" style={{ fontSize: "40px", lineHeight: 1.05 }}>
              <HeistTitle text="LA CAZA DE TESORO" />
            </h1>

            <p className="heist-subtitle" style={{ marginTop: "10px" }}>
              EL GOLPE &nbsp;·&nbsp; LA MISIÓN &nbsp;·&nbsp; EL TESORO
            </p>
          </div>

          {/* Connection Status Badge */}
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            gap: 6, 
            fontSize: 10, 
            fontFamily: "var(--font-mono)",
            color: (window.__HEIST_DB_MODE__ === "FIRESTORE_LIVE") ? "#22c55e" : "#d97706",
            background: (window.__HEIST_DB_MODE__ === "FIRESTORE_LIVE") ? "rgba(34, 197, 94, 0.08)" : "rgba(217, 119, 6, 0.08)",
            border: `1px solid ${(window.__HEIST_DB_MODE__ === "FIRESTORE_LIVE") ? "rgba(34, 197, 94, 0.2)" : "rgba(217, 119, 6, 0.2)"}`,
            padding: "4px 12px",
            borderRadius: 4,
            width: "fit-content",
            margin: "0 auto 20px auto"
          }}>
            <span style={{ 
              width: 6, 
              height: 6, 
              borderRadius: "50%", 
              background: (window.__HEIST_DB_MODE__ === "FIRESTORE_LIVE") ? "#22c55e" : "#d97706",
              display: "inline-block"
            }} />
            <span>{(window.__HEIST_DB_MODE__ === "FIRESTORE_LIVE") ? "DATABASE: FIRESTORE LIVE" : "DATABASE: LOCAL OFFLINE MODE"}</span>
          </div>

          {/* Ornamental divider */}
          <div className="login-divider" aria-hidden="true">
            <span className="login-divider-icon">◆</span>
          </div>

          {/* ── Form ────────────────────────────────────────── */}
          <form className="login-form" onSubmit={handleEnter} id="heist-login-form">

            {/* Role selection — this IS the authentication step */}
            <div className="login-field">
              <label className="heist-label">
                ROL <DeTag /> OPERACIÓN
              </label>
              <div className="login-role-row">
                <button
                  type="button"
                  id="role-player-btn"
                  className={`role-btn ${selectedRole === "player" ? "active" : ""}`}
                  onClick={() => setSelectedRole("player")}
                  aria-pressed={selectedRole === "player"}
                >
                  <span className="role-icon" aria-hidden="true">🎭</span>
                  OPERATIVO
                </button>
                <button
                  type="button"
                  id="role-admin-btn"
                  className={`role-btn ${selectedRole === "admin" ? "active" : ""}`}
                  onClick={() => setSelectedRole("admin")}
                  aria-pressed={selectedRole === "admin"}
                >
                  <span className="role-icon" aria-hidden="true">🎓</span>
                  EL PROFESOR
                </button>
              </div>
            </div>

            {/* ENTRAR — single submit action */}
            <button
              type="submit"
              id="entrar-btn"
              className="entrar-btn"
              disabled={!selectedRole || isEntering}
              aria-label="Entrar al heist"
            >
              {isEntering ? "INICIANDO..." : "ENTRAR"}
            </button>
          </form>

          {/* Footer */}
          <footer className="login-footer" aria-label="Version info">
            PROTOCOLO <DeTag style={{ fontSize: "9px", letterSpacing: "1px", padding: "0 4px" }} />
            {" "}MISIÓN v2.0 &nbsp;·&nbsp; CANAL CIFRADO
          </footer>
        </div>
      </div>
    </HeistLayout>
  );
}
