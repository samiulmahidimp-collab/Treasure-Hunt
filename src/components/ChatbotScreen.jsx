import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../firebase";
import { CLUES, TOTAL_CLUES_COUNT, STAGE_1_CLUES_COUNT, STAGE_2_CLUES_COUNT } from "../clues";
import { Send, LogOut, Check, HelpCircle, ZoomIn, Download, X } from "lucide-react";
import SystemLocked from "./SystemLocked";
import HeistLayout from "./HeistLayout";
import { DeTag } from "./HeistUI";

export default function ChatbotScreen({ teamName, teamData, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const messagesEndRef = useRef(null);

  // ── Initial messages ─────────────────────────────────────
  useEffect(() => {
    if (!teamData) return;
    const solvedCount = teamData.solvedClues ? teamData.solvedClues.length : 0;
    if (messages.length === 0) {
      if (solvedCount === 0 && !teamData.currentClueId) {
        setMessages([{
          sender: "professor",
          text: `Bella ciao, team ${teamName.toUpperCase()}. I am The Professor. The plan is set, the police are outside, and the vault is waiting. Are you ready to initiate the heist?`,
          type: "welcome",
        }]);
      } else {
        setMessages([{
          sender: "professor",
          text: `Operatives, welcome back to the channel. Decrypted logs show you have solved ${solvedCount} / ${TOTAL_CLUES_COUNT} clue(s). Let's continue the heist.`,
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

  const solvedCount     = teamData.solvedClues ? teamData.solvedClues.length : 0;
  const isLocked        = teamData.locked || false;
  const currentAttempts = teamData.attempts || 0;
  const isAllComplete   = solvedCount >= TOTAL_CLUES_COUNT;

  // Anti-collision clue selector with Stage gating (Stage 1: 8 clues, Stage 2: 3 clues)
  const getNextClue = async (solvedList) => {
    const allTeams = await dbService.getAllTeams();
    const activeClueIds = Object.values(allTeams)
      .map(t => t.currentClueId)
      .filter(Boolean);

    // Target current stage pool
    const targetStage = solvedList.length < STAGE_1_CLUES_COUNT ? 1 : 2;
    const stagePool = CLUES.filter(c => (c.stage || 1) === targetStage);

    // Prefer clues in this stage not solved by this team AND not active on any other team
    const candidates = stagePool.filter(
      c => !solvedList.includes(c.id) && !activeClueIds.includes(c.id)
    );

    // Fallback: any unsolved clue in this stage
    const fallback = stagePool.filter(c => !solvedList.includes(c.id));
    const pool = candidates.length > 0 ? candidates : fallback;

    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isLocked || isAllComplete) return;

    const userText = inputVal.trim();
    setInputVal("");
    setMessages(prev => [...prev, { sender: "player", text: userText }]);

    // Welcome flow & start commands
    const lastMsg = messages[messages.length - 1];
    const isWelcomeStep = lastMsg?.type === "welcome";
    const startKeywords = ["yes", "yeah", "si", "sí", "y", "ok", "ready", "sure", "start", "go", "begin", "play", "lets go", "let's go"];

    if (isWelcomeStep || (!teamData.currentClueId && solvedCount === 0)) {
      if (startKeywords.some(w => userText.toLowerCase().includes(w))) {
        setMessages(prev => [...prev, {
          sender: "professor",
          text: "Excellent. Remember, there is no turning back now. Initializing decoy signals. Stage 1 Clue 1 incoming...",
        }]);
        const firstClue = await getNextClue([]);
        if (firstClue) {
          await dbService.updateTeam(teamName, { currentClueId: firstClue.id, attempts: 0, locked: false });
          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: "professor",
              text: `STAGE 1 - CLUE #1: Analyze the visual file above. Enter the decryption code to proceed.`,
              clue: firstClue,
            }]);
          }, 1200);
        }
      } else {
        setMessages(prev => [...prev, {
          sender: "professor",
          text: "We don't have time for hesitation. Lives are on the line. When you are ready, type 'START' or 'YES'.",
        }]);
      }
      return;
    }

    // Gameplay answering
    if (teamData.currentClueId) {
      const activeClue = CLUES.find(c => c.id === teamData.currentClueId);
      if (!activeClue) return;

      const isCorrect = userText.toLowerCase() === activeClue.answer.toLowerCase();

      if (isCorrect) {
        setShowSuccessIndicator(true);
        setTimeout(() => setShowSuccessIndicator(false), 1500);

        const newSolvedClues = [...(teamData.solvedClues || []), activeClue.id];
        const newSolvedCount = newSolvedClues.length;

        const justCompletedStage1 = newSolvedCount === STAGE_1_CLUES_COUNT;

        setMessages(prev => [...prev, {
          sender: "professor",
          text: justCompletedStage1
            ? `STAGE 1 COMPLETE! All 8 initial clues decrypted. Advancing to Stage 2 (Final Vault)...`
            : `CORRECT CODE CRACKED! Progress: ${newSolvedCount} / ${TOTAL_CLUES_COUNT}.`,
          type: "success",
        }]);

        if (newSolvedCount >= TOTAL_CLUES_COUNT) {
          await dbService.updateTeam(teamName, {
            score: newSolvedCount, solvedClues: newSolvedClues,
            currentClueId: null, attempts: 0, locked: false,
          });
        } else {
          const nextClue = await getNextClue(newSolvedClues);
          if (nextClue) {
            await dbService.updateTeam(teamName, {
              score: newSolvedCount, solvedClues: newSolvedClues,
              currentClueId: nextClue.id, attempts: 0, locked: false,
            });
            setTimeout(() => {
              const currentStageNum = nextClue.stage || 1;
              const clueNumInStage = currentStageNum === 1 ? newSolvedCount + 1 : newSolvedCount - 7;
              setMessages(prev => [...prev, {
                sender: "professor",
                text: `STAGE ${currentStageNum} - CLUE #${clueNumInStage}: Analyze the visual file above. Enter the decryption code to proceed.`,
                clue: nextClue,
              }]);
            }, 1500);
          }
        }
      } else {
        const nextAttempts = currentAttempts + 1;
        if (nextAttempts >= 3) {
          await dbService.updateTeam(teamName, { attempts: nextAttempts, locked: true });
          setMessages(prev => [...prev, {
            sender: "professor",
            text: "WRONG ANSWER. System locked. Contact The Professor for override.",
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
    } else if (activeClue && (startKeywords.some(w => userText.toLowerCase().includes(w)) || userText.toLowerCase().includes("clue"))) {
      setMessages(prev => [...prev, {
        sender: "professor",
        text: `Active Clue #${solvedCount + 1}: Decode this visual file:`,
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

  const activeClue = CLUES.find(c => c.id === teamData.currentClueId);

  return (
    <HeistLayout>
      <div className="chat-root">
        {isLocked && <SystemLocked onUnlock={handleUnlockOverride} />}

        {/* Success flash */}
        {showSuccessIndicator && (
          <div className="success-flash">
            <div style={{ textAlign: "center", color: "#fff" }}>
              <Check size={64} color="#fff" />
              <h2 className="heist-title" style={{ marginTop: 16, letterSpacing: 4 }}>ACCESS GRANTED</h2>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="heist-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="pulse-dot" />
            <div>
              <div className="heist-header-logo" style={{ fontSize: 16 }}>
                SECURE NETWORK LINK
              </div>
              <p className="heist-subtitle" style={{ fontSize: 9, marginTop: 2 }}>
                OPERATIVE: {teamName.toUpperCase()} &nbsp;|&nbsp; LEVEL 1
              </p>
            </div>
          </div>
          <div className="heist-header-actions">
            <div className="heist-badge">PROGRESS: <strong>{solvedCount} / {TOTAL_CLUES_COUNT}</strong></div>
            <button className="heist-btn" style={{ padding: "7px 14px", fontSize: 12 }} onClick={onLogout}>
              <LogOut size={13} /> DISCONNECT
            </button>
          </div>
        </header>

        {/* Chat body */}
        <div className="chat-body">
          {isAllComplete ? (
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
              <div className="heist-card phase-complete-card">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                  <svg viewBox="0 0 100 120" style={{ width: 70, height: 88 }}>
                    <path d="M50,10 C25,10 15,35 15,60 C15,90 35,110 50,110 C65,110 85,90 85,60 C85,35 75,10 50,10 Z"
                      fill="none" stroke="#C8102E" strokeWidth="3.5" />
                    <path d="M30,50 Q37,45 44,50" fill="none" stroke="#C8102E" strokeWidth="2.5" />
                    <path d="M56,50 Q63,45 70,50" fill="none" stroke="#C8102E" strokeWidth="2.5" />
                    <circle cx="37" cy="53" r="2.5" fill="#fff" />
                    <circle cx="63" cy="53" r="2.5" fill="#fff" />
                    <path d="M50,75 Q35,70 25,65 Q35,80 50,85 Q65,80 75,65 Q65,70 50,75 Z" fill="#C8102E" />
                  </svg>
                </div>
                <h2 className="phase-complete-title">HEIST COMPLETE</h2>
                <p className="heist-subtitle" style={{ marginTop: 8, marginBottom: 24 }}>
                  ALL 2 STAGES &amp; 11 CLUES DECRYPTED SUCCESSFULLY
                </p>
                <div style={{ height: 1, background: "rgba(34,197,94,0.2)", width: "80%", margin: "0 auto 20px" }} />
                <p className="heist-subtitle" style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>
                  Congratulations Operative! You have unlocked all 11 core vaults. Maintain position and stand by for final standings.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Clue panel */}
              {activeClue && (
                <div className="clue-panel">
                  <div className="clue-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <HelpCircle size={15} color="#C8102E" />
                      <span className="clue-header-title">ACTIVE CLUE INTELLIGENCE</span>
                    </div>
                    <span className="clue-attempts">ATTEMPTS: {currentAttempts} / 3</span>
                  </div>
                  <div className="clue-body">
                    <div
                      className="clue-img-wrap"
                      onClick={() => setZoomImage({ src: activeClue.image, filename: activeClue.answer })}
                      title="Click to Zoom & Download"
                    >
                      <img
                        src={activeClue.image}
                        alt="Clue Visual"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/600x400/0D0D0D/C8102E?text=PICTURE+NOT+LOADED";
                        }}
                      />
                      <div className="clue-zoom-icon"><ZoomIn size={14} color="#fff" /></div>
                    </div>
                    <div className="clue-info">
                      <p className="clue-desc">{activeClue.description}</p>
                      <p className="clue-hint">Tip: Click the image to view fullscreen or download. Enter the code below.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="chat-messages">
                {messages.map((msg, i) => {
                  let bubbleClass = "chat-bubble ";
                  if (msg.sender === "professor") {
                    bubbleClass += msg.type === "success" ? "chat-bubble-success"
                      : msg.type === "error"   ? "chat-bubble-error"
                      : "chat-bubble-professor";
                  } else {
                    bubbleClass += "chat-bubble-player";
                  }

                  return (
                    <div key={i} style={{ display: "flex", justifyContent: msg.sender === "professor" ? "flex-start" : "flex-end" }}>
                      <div className={bubbleClass}>
                        <span className="chat-sender" style={{ color: msg.sender === "professor" ? "#C8102E" : "#fff" }}>
                          {msg.sender === "professor" ? "THE PROFESSOR" : "OPERATIVE"}
                        </span>
                        <p className="chat-text">{msg.text}</p>
                        {msg.clue && (
                          <div
                            style={{ marginTop: 10, maxWidth: 200, border: "1px solid var(--border-dim)", overflow: "hidden", cursor: "pointer", position: "relative" }}
                            onClick={() => setZoomImage({ src: msg.clue.image, filename: msg.clue.answer })}
                          >
                            <img
                              src={msg.clue.image}
                              alt="Clue visual"
                              style={{ width: "100%", height: "auto", display: "block" }}
                              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/300x200/0D0D0D/C8102E?text=IMAGE+NOT+FOUND"; }}
                            />
                            <div className="clue-zoom-icon" style={{ padding: 4 }}><ZoomIn size={11} color="#fff" /></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <form onSubmit={handleSend} className="chat-input-bar">
                <span className="chat-cmd-prefix">$</span>
                <input
                  type="text"
                  className="chat-input-field"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={activeClue ? "TYPE DECRYPTION KEY..." : "RESPOND TO THE PROFESSOR..."}
                  disabled={isLocked || isAllComplete}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="heist-btn-solid"
                  style={{ padding: "10px 16px" }}
                  disabled={isLocked || isAllComplete}
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Lightbox */}
        {zoomImage && (
          <div className="zoom-modal" onClick={() => setZoomImage(null)}>
            <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
              <button className="zoom-close" onClick={() => setZoomImage(null)}><X size={24} /></button>
              <img src={zoomImage.src} alt="Zoomed Clue" className="zoom-img" />
              <a href={zoomImage.src} download={zoomImage.filename + ".png"} className="heist-btn-solid" style={{ textDecoration: "none" }}>
                <Download size={15} /> DOWNLOAD CLUE
              </a>
            </div>
          </div>
        )}
      </div>
    </HeistLayout>
  );
}
