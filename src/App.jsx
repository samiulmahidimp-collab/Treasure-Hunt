import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import AdminPortal from "./components/AdminPortal";
import PlayerPortal from "./components/PlayerPortal";

export default function App() {
  const [role, setRole] = useState(null); // 'admin' | 'player' | null

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleBackToLobby = () => {
    setRole(null);
  };

  return (
    <div style={styles.app}>
      {role === null && (
        <LandingPage onSelectRole={handleSelectRole} />
      )}
      
      {role === "admin" && (
        <AdminPortal onBack={handleBackToLobby} />
      )}
      
      {role === "player" && (
        <PlayerPortal onBack={handleBackToLobby} />
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    width: "100%",
    background: "#080808",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
  }
};
