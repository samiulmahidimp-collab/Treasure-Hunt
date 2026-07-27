/**
 * App.jsx — Root router for LA CAZA DE TESORO
 *
 * Three possible states (no router library needed):
 *   null    → LandingPage (the ONE login screen)
 *   "player" → PlayerPortal (team select + game)
 *   "admin"  → AdminPortal (professor's command room)
 *
 * Role state is persisted in localStorage so browser refreshes maintain exact position!
 */
import React, { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import LandingPage from "./components/LandingPage";
import AdminPortal from "./components/AdminPortal";
import PlayerPortal from "./components/PlayerPortal";

export default function App() {
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem("heist_role") || null;
  });

  const handleSetRole = (newRole) => {
    if (newRole) {
      localStorage.setItem("heist_role", newRole);
    } else {
      localStorage.removeItem("heist_role");
    }
    setRoleState(newRole);
  };

  return (
    <>
      {role === null     && <LandingPage onSelectRole={handleSetRole} />}
      {role === "player" && <PlayerPortal onBack={() => handleSetRole(null)} />}
      {role === "admin"  && <AdminPortal  onBack={() => handleSetRole(null)} />}
      <Analytics />
    </>
  );
}
