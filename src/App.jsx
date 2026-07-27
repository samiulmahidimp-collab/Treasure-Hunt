/**
 * App.jsx — Root router for LA CAZA DE TESORO
 *
 * Three possible states (no router library needed):
 *   null    → LandingPage (the ONE login screen)
 *   "player" → PlayerPortal (team select + game)
 *   "admin"  → AdminPortal (professor's command room)
 *
 * The HeistLayout (mask background) is applied inside each screen component,
 * so the background image is always visible regardless of state.
 */
import React, { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import LandingPage from "./components/LandingPage";
import AdminPortal from "./components/AdminPortal";
import PlayerPortal from "./components/PlayerPortal";

export default function App() {
  const [role, setRole] = useState(null); // null | "player" | "admin"

  return (
    <>
      {role === null     && <LandingPage onSelectRole={setRole} />}
      {role === "player" && <PlayerPortal onBack={() => setRole(null)} />}
      {role === "admin"  && <AdminPortal  onBack={() => setRole(null)} />}
      <Analytics />
    </>
  );
}
