import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../firebase";
import { DEFAULT_CLUES, STAGE_CONFIG, getDynamicImagePath } from "../clues";
import { Send, LogOut, Check, HelpCircle, ZoomIn, Download, X, Trophy } from "lucide-react";
import SystemLocked from "./SystemLocked";
import HeistLayout from "./HeistLayout";
import { DeTag } from "./HeistUI";

export default function ChatbotScreen({ teamName, teamData, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [cluesList, setCluesList] = useState(DEFAULT_CLUES);
  const messagesEndRef = useRef(null);

  // Subscribe to Real-Time Clue updates from Admin
  useEffect(() => {
    const unsubClues = dbService.subscribeClues((updatedClues) => {
      if (updatedClues && updatedClues.length > 0) {
        setCluesList(updatedClues);
      }
    });
    return () => unsubClues();
  }, []);

  // ── Initial Welcome Messages ──────────────────────────────
  useEffect(() => {
    if (!teamData) return;
    const solvedCount = teamData.solvedClues ? teamData.solvedClues.length : 0;
    if (messages.length === 0) {
      if (solvedCount === 0 && !teamData.currentClueId) {
        setMessages([{
          sender: "professor",
          text: `Bella ciao, team ${teamName.toUpperCase()}. I am The Professor. Stage 1 (The Initial Hunt) is active. Are you ready to initiate the heist?`,
          type: "welcome",
        }]);
      } else {
        setMessages([{
          sender: "professor",
          text: `Operatives ${teamName.toUpperCase()}, welcome back to mission control. Decrypted logs show you have solved ${solvedCount} clue(s). Let's continue the heist.`,
          type: "system",
        }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, teamData]);

  if (!teamData) {
    return (
      <HeistLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <span className="heist-section-title blink-text">ESTABLISHING ENCRYPTED LINK...</span>
        </div>
      </HeistLayout>
    );
  }

  const solvedCount      = teamData.solvedClues ? teamData.solvedClues.length : 0;
  const isLocked         = teamData.locked || false;
  const currentAttempts  = teamData.attempts || 0;
  const isGameComplete   = solvedCount >= 11;

  // Determine current stage & clue based on solvedCount
  const getCurrentStageInfo = (solvedIndex) => {
    if (solvedIndex >= 11) return { stage: 3, stageName: "Stage 3: The Final Round", clueInStage: 1, totalInStage: 1 };
    if (solvedIndex >= 10) return { stage: 3, stageName: "Stage 3: The Final Round", clueInStage: 1, totalInStage: 1 };
    if (solvedIndex >= 8)  return { stage: 2, stageName: "Stage 2: The Qualifiers", clueInStage: solvedIndex - 7, totalInStage: 2 };
    return { stage: 1, stageName: "Stage 1: The Initial Hunt", clueInStage: solvedIndex + 1, totalInStage: 8 };
  };

  const currentStageMeta = getCurrentStageInfo(solvedCount);

  // Active clue from real-time cluesList
  const activeClue = cluesList.find(c => c.id === teamData.currentClueId) || cluesList[solvedCount] || cluesList[0];

  // Helper to safely format image URL
  const getClueImageUrl = (clue) => {
    if (!clue) return "/pictures/stage1/afrewa.png";
    if (clue.image_path) return clue.image_path;
    return getDynamicImagePath(clue.stage || 1, clue.imageFilename || clue.image);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isLocked || isGameComplete) return;

    const userText = inputVal.trim();
    setInputVal("");
    setMessages(prev => [...prev, { sender: "player", text: userText }]);

    // Welcome flow & start commands
    const lastMsg = messages[messages.length - 1];
    const isWelcomeStep = lastMsg?.type === "welcome";
    const startKeywords = ["yes", "yeah", "si", "sí", "y", "ok", "ready", "sure", "start", "go", "begin", "play", "lets go", "let's go"];

    if (isWelcomeStep || (!teamData.currentClueId && solvedCount === 0)) {
      if (startKeywords.some(w => userText.toLowerCase().includes(w))) {
        const firstClue = cluesList[0] || DEFAULT_CLUES[0];
        await dbService.updateTeam(teamName, { currentClueId: firstClue.id, stage: 1, attempts: 0, locked: false });
        setMessages(prev => [...prev, {
          sender: "professor",
          text: "Excellent. Stage 1 (The Initial Hunt) begins now. Clue 1 incoming...",
        }]);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            sender: "professor",
            text: `STAGE 1 — CLUE #1: Analyze this image and enter the secret code to proceed.`,
            clue: firstClue,
          }]);
        }, 1000);
      } else {
        setMessages(prev => [...prev, {
          sender: "professor",
          text: "We don't have time for hesitation. Lives are on the line. When you are ready, type 'START' or 'YES'.",
        }]);
      }
      return;
    }

    // Gameplay answering logic
    if (activeClue) {
      // Secure Answer Check: normalize whitespace and lowercase comparison
      const normalizedInput = userText.trim().toLowerCase();
      const normalizedAnswer = (activeClue.answer || "").trim().toLowerCase();

      const isCorrect = normalizedInput === normalizedAnswer;

      if (isCorrect) {
        setShowSuccessIndicator(true);
        setTimeout(() => setShowSuccessIndicator(false), 1500);

        const newSolvedClues = [...(teamData.solvedClues || []), activeClue.id];
        const newSolvedCount = newSolvedClues.length;

        setMessages(prev => [...prev, {
          sender: "professor",
          text: `CORRECT CODE CRACKED! Solved: ${newSolvedCount} / 11 total.`,
          type: "success",
        }]);

        if (newSolvedCount >= 11) {
          // Game Completed
          await dbService.updateTeam(teamName, {
            score: newSolvedCount,
            solvedClues: newSolvedClues,
            currentClueId: null,
            stage: 3,
            attempts: 0,
            locked: false,
          });
        } else {
          // Get next sequential clue from real-time list
          const nextClue = cluesList[newSolvedCount] || cluesList[cluesList.length - 1];
          const nextStageInfo = getCurrentStageInfo(newSolvedCount);

          await dbService.updateTeam(teamName, {
            score: newSolvedCount,
            solvedClues: newSolvedClues,
            currentClueId: nextClue.id,
            stage: nextStageInfo.stage,
            attempts: 0,
            locked: false,
          });

          // Check if entering new stage
          let stageAnnouncement = "";
          if (newSolvedCount === 8) {
            stageAnnouncement = "🏆 STAGE 1 COMPLETE! STAGE 2 (THE QUALIFIERS) UNLOCKED! ";
          } else if (newSolvedCount === 10) {
            stageAnnouncement = "🔥 STAGE 2 COMPLETE! STAGE 3 (THE FINAL ROUND) UNLOCKED! ";
          }

          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: "professor",
              text: `${stageAnnouncement}${nextStageInfo.stageName} — Clue #${nextStageInfo.clueInStage}: Analyze this visual file and enter the secret code:`,
              clue: nextClue,
            }]);
          }, 1200);
        }
      } else {
        // Wrong attempt
        const nextAttempts = currentAttempts + 1;
        if (nextAttempts >= 3) {
          await dbService.updateTeam(teamName, { attempts: nextAttempts, locked: true });
          setMessages(prev => [...prev, {
            sender: "professor",
            text: "WRONG ANSWER. 3 strikes reached! Security system locked. Contact The Professor to unlock.",
            type: "error",
          }]);
        } else {
          await dbService.updateTeam(teamName, { attempts: nextAttempts });
          setMessages(prev => [...prev, {
            sender: "professor",
            text: `WRONG ANSWER. Attempts: ${nextAttempts} / 3. Try again, operative.`,
            type: "error",
          }]);
        }
      }
    } else if (startKeywords.some(w => userText.toLowerCase().includes(w)) || userText.toLowerCase().includes("clue")) {
      setMessages(prev => [...prev, {
        sender: "professor",
        text: `Active ${currentStageMeta.stageName} (Clue #${currentStageMeta.clueInStage}): Decode this visual file:`,
        clue: activeClue,
      }]);
    } else {
      setMessages(prev => [...prev, {
        sender: "professor",
        text: "The communications tunnel is active. Please focus on the mission protocols.",
      }]);
    }
  };

  const handleUnlockOverride = async () => {
    await dbService.updateTeam(teamName, { attempts: 0, locked: false });
    setMessages(prev => [...prev, {
      sender: "professor",
      text: "SYSTEM OVERRIDE SUCCESSFUL. Access granted. You have 3 fresh attempts to solve the clue.",
    }]);
  };

  return (
    <HeistLayout>
      {/* 3-Strike Lockout Overlay */}
      {isLocked && <SystemLocked onUnlock={handleUnlockOverride} />}

      {/* Success Indicator Overlay */}
      {showSuccessIndicator && (
        <div className="heist-flash-overlay">
          <div style={{ textAlign: "center", color: "#fff" }}>
            <Check size={64} color="#22c55e" />
            <h2 className="heist-section-title" style={{ color: "#22c55e", fontSize: 32, letterSpacing: 3 }}>
              ACCESS GRANTED
            </h2>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="heist-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e", animation: "blink 1.5s infinite alternate" }} />
          <div>
            <div className="heist-header-logo">
              SECURE MISSION LINK
            </div>
            <p className="heist-subtitle" style={{ fontSize: 9, letterSpacing: "1.5px", margin: 0 }}>
              OPERATIVE: {teamName.toUpperCase()} | <span style={{ color: currentStageMeta.stage === 3 ? "#f59e0b" : currentStageMeta.stage === 2 ? "#3b82f6" : "#e50914", fontWeight: 700 }}>{currentStageMeta.stageName.toUpperCase()}</span>
            </p>
          </div>
        </div>

        <div className="heist-header-actions">
          <div className="heist-badge">
            PROGRESS: <strong>{solvedCount} / 11</strong>
          </div>
          <button className="heist-btn" style={{ padding: "7px 14px", fontSize: 12 }} onClick={onLogout}>
            <LogOut size={13} /> DISCONNECT
          </button>
        </div>
      </header>

      {/* Main Chat Body */}
      <div className="chat-body">
        {isGameComplete ? (
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <div className="heist-card phase-complete-card">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <Trophy size={64} color="#f59e0b" />
              </div>
              <h2 className="phase-complete-title" style={{ color: "#f59e0b" }}>HEIST COMPLETE!</h2>
              <p className="heist-subtitle" style={{ marginTop: 8, marginBottom: 24 }}>
                OPERATIVE {teamName.toUpperCase()} HAS DECRYPTED ALL 11 CLUES ACROSS ALL 3 STAGES!
              </p>
              <div style={{ height: 1, background: "rgba(245,158,11,0.3)", width: "80%", margin: "0 auto 20px" }} />
              <p className="heist-subtitle" style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>
                Congratulations, champions! You have successfully completed Stage 1 (Initial Hunt), Stage 2 (Qualifiers), and Stage 3 (Final Round).
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Active Clue Panel */}
            {activeClue && (
              <div className="clue-panel">
                <div className="clue-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HelpCircle size={15} color="#C8102E" />
                    <span className="clue-header-title">
                      {currentStageMeta.stageName.toUpperCase()} — {currentStageMeta.clueText.toUpperCase()}
                    </span>
                  </div>
                  <span className="clue-attempts">ATTEMPTS: {currentAttempts} / 3</span>
                </div>
                <div className="clue-body">
                  <div
                    className="clue-img-wrap"
                    onClick={() => setZoomImage({ src: getClueImageUrl(activeClue), filename: activeClue.answer })}
                    title="Click to Zoom & Download"
                  >
                    <img
                      src={getClueImageUrl(activeClue)}
                      alt="Active Clue Visual"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/0D0D0D/C8102E?text=IMAGE+NOT+FOUND+IN+/public/pictures/";
                      }}
                    />
                    <div className="clue-zoom-icon"><ZoomIn size={14} color="#fff" /></div>
                  </div>
                  <div className="clue-info">
                    <p className="clue-desc">{activeClue.description}</p>
                    <p className="clue-hint">Tip: Click image to view fullscreen or download. Answer is case-insensitive.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Thread */}
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-msg-row ${msg.sender === "professor" ? "prof" : "player"}`}
                >
                  <div className={`chat-bubble ${msg.sender === "professor" ? "prof" : "player"} ${msg.type === "success" ? "success" : ""}`}>
                    <span className="sender-label">
                      {msg.sender === "professor" ? "THE PROFESSOR" : "OPERATIVE"}
                    </span>
                    <p className="msg-text">{msg.text}</p>
                    {msg.clue && (
                      <div
                        className="inline-clue-img"
                        onClick={() => setZoomImage({ src: getClueImageUrl(msg.clue), filename: msg.clue.answer })}
                        title="Click to Zoom & Download"
                      >
                        <img
                          src={getClueImageUrl(msg.clue)}
                          alt="Clue visual in chat"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/300x200/0D0D0D/C8102E?text=IMAGE+NOT+FOUND";
                          }}
                        />
                        <div className="clue-zoom-icon"><ZoomIn size={12} color="#fff" /></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="chat-input-form">
              <span style={{ color: "#C8102E", fontFamily: "var(--font-mono)", fontWeight: 700 }}>$</span>
              <input
                type="text"
                className="chat-input-field"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={activeClue ? `ENTER ${currentStageMeta.stageName.toUpperCase()} CODE...` : "TYPE 'START' TO BEGIN..."}
                disabled={isLocked || isGameComplete}
              />
              <button
                type="submit"
                className="heist-btn-solid"
                style={{ padding: "8px 16px", borderRadius: 4 }}
                disabled={isLocked || isGameComplete}
              >
                <Send size={15} />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setZoomImage(null)}>
              <X size={20} />
            </button>
            <img src={zoomImage.src} alt="Zoomed Clue" className="lightbox-img" />
            <div className="lightbox-actions">
              <a href={zoomImage.src} download={(zoomImage.filename || "clue") + ".png"} className="heist-btn-solid" style={{ textDecoration: "none" }}>
                <Download size={15} />
                <span>DOWNLOAD CLUE IMAGE</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </HeistLayout>
  );
}
