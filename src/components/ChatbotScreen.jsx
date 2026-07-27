import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../firebase";
import { CLUES, TOTAL_CLUES_COUNT, STAGE_1_CLUES_COUNT, STAGE_2_CLUES_COUNT } from "../clues";
import { Send, LogOut, Check, HelpCircle, ZoomIn, Download, X } from "lucide-react";
import SystemLocked from "./SystemLocked";
import HeistLayout from "./HeistLayout";
import { DeTag } from "./HeistUI";

export default function ChatbotScreen({ teamName, teamId, teamData, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const messagesEndRef = useRef(null);

  const effectiveTeamId = teamId || teamData?.id || teamName;
  const storageKey = `heist_chat_${effectiveTeamId}`;

  const hasInitializedRef = useRef(false);

  // ── Restore Chat Thread from DB or localStorage on mount ───
  useEffect(() => {
    if (!teamData || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // 1. Prefer chat history from server DB if available
    if (teamData.chatMessages && Array.isArray(teamData.chatMessages) && teamData.chatMessages.length > 0) {
      setMessages(teamData.chatMessages);
      localStorage.setItem(storageKey, JSON.stringify(teamData.chatMessages));
      return;
    }

    // 2. Fallback to localStorage
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.error("Error restoring local chat thread:", e);
      }
    }

    // 3. Initial welcome message
    const solvedCount = teamData.solvedClues ? teamData.solvedClues.length : 0;
    if (solvedCount === 0 && !teamData.currentClueId) {
      setMessages([{
        sender: "professor",
        text: `Bella ciao, team ${teamName.toUpperCase()}. I am The Professor. The plan is set, the police are outside, and the vault is waiting. Type your answer code below or type 'START' to receive your first clue.`,
        type: "welcome",
      }]);
    } else {
      setMessages([{
        sender: "professor",
        text: `Operatives, welcome back to the channel. Decrypted logs show you have solved ${solvedCount} / ${TOTAL_CLUES_COUNT} clue(s). Let's continue the heist.`,
        type: "system",
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamData]);

  // Save chat thread to localStorage & sync to DB
  const updateMessagesAndSync = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem(storageKey, JSON.stringify(newMessages));
    dbService.updateTeam(effectiveTeamId, { chatMessages: newMessages });
  };

  // ── Auto-assign clue if missing ───────────────────────────
  useEffect(() => {
    if (!teamData || isLocked || isAllComplete || teamData.currentClueId) return;

    const autoAssign = async () => {
      const firstClue = await getNextClue(teamData.solvedClues || []);
      if (firstClue) {
        await dbService.updateTeam(effectiveTeamId, { currentClueId: firstClue.id, attempts: 0, locked: false });
      }
    };
    autoAssign();
  }, [teamData?.currentClueId, isLocked, isAllComplete, effectiveTeamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, teamData]);

  const safeTeamData = teamData || {
    id: effectiveTeamId,
    name: teamName,
    score: 0,
    solvedClues: [],
    currentClueId: null,
    attempts: 0,
    locked: false,
    isPaused: false
  };

  const solvedCount     = safeTeamData.solvedClues ? safeTeamData.solvedClues.length : 0;
  const isLocked        = safeTeamData.locked || false;
  const currentAttempts = safeTeamData.attempts || 0;
  const isAllComplete   = solvedCount >= TOTAL_CLUES_COUNT;

  // Resolve active clue from DB
  let activeClue = CLUES.find(c => c.id === safeTeamData.currentClueId);

  // Anti-collision clue selector with Stage gating (Stage 1: 8 clues, Stage 2: 2 clues, Final: 1 clue)
  const getNextClue = async (solvedList) => {
    const allTeams = await dbService.getAllTeams();
    const activeClueIds = Object.values(allTeams)
      .map(t => t.currentClueId)
      .filter(Boolean);

    let targetStage = 1;
    if (solvedList.length >= 10) {
      targetStage = 3;
    } else if (solvedList.length >= 8) {
      targetStage = 2;
    }

    const stagePool = CLUES.filter(c => (c.stage || 1) === targetStage);
    const candidates = stagePool.filter(
      c => !solvedList.includes(c.id) && !activeClueIds.includes(c.id)
    );
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

    const newPlayerMsg = { sender: "player", text: userText };
    let currentMsgList = [...messages, newPlayerMsg];
    updateMessagesAndSync(currentMsgList);

    const startKeywords = ["yes", "yeah", "si", "sí", "y", "ok", "ready", "sure", "start", "go", "begin", "play", "lets go", "let's go"];

    // Ensure target clue exists
    let clueToCheck = activeClue;
    if (!clueToCheck) {
      clueToCheck = await getNextClue(teamData.solvedClues || []);
      if (clueToCheck) {
        await dbService.updateTeam(effectiveTeamId, { currentClueId: clueToCheck.id, attempts: 0, locked: false });
        activeClue = clueToCheck;
      }
    }

    // Check if input is a simple start keyword when no clue has been answered yet
    if (startKeywords.includes(userText.toLowerCase()) && solvedCount === 0) {
      if (clueToCheck) {
        currentMsgList = [...currentMsgList, {
          sender: "professor",
          text: `STAGE 1 - CLUE #1: Analyze the visual file above. Enter the decryption code to proceed.`,
          clue: clueToCheck,
        }];
        updateMessagesAndSync(currentMsgList);
      }
      return;
    }

    if (!clueToCheck) {
      currentMsgList = [...currentMsgList, {
        sender: "professor",
        text: "No active clue assigned. Contact The Professor.",
      }];
      updateMessagesAndSync(currentMsgList);
      return;
    }

    // Evaluate answer correctness
    const isCorrect = userText.toLowerCase() === clueToCheck.answer.toLowerCase();

    if (isCorrect) {
      setShowSuccessIndicator(true);
      setTimeout(() => setShowSuccessIndicator(false), 1500);

      const newSolvedClues = [...(teamData.solvedClues || []), clueToCheck.id];
      const newSolvedCount = newSolvedClues.length;

      let successMsg = `CORRECT CODE CRACKED! Progress: ${newSolvedCount} / ${TOTAL_CLUES_COUNT}.`;
      if (newSolvedCount === 8) {
        successMsg = `STAGE 1 COMPLETE! All 8 initial clues decrypted. Advancing to Stage 2 (Semi-Final)...`;
      } else if (newSolvedCount === 10) {
        successMsg = `STAGE 2 COMPLETE! Advancing to Final Stage (Grand Vault)...`;
      }

      currentMsgList = [...currentMsgList, {
        sender: "professor",
        text: successMsg,
        type: "success",
      }];
      updateMessagesAndSync(currentMsgList);

      if (newSolvedCount >= TOTAL_CLUES_COUNT) {
        await dbService.updateTeam(effectiveTeamId, {
          score: newSolvedCount, solvedClues: newSolvedClues,
          currentClueId: null, attempts: 0, locked: false,
        });
      } else {
        const nextClue = await getNextClue(newSolvedClues);
        if (nextClue) {
          await dbService.updateTeam(effectiveTeamId, {
            score: newSolvedCount, solvedClues: newSolvedClues,
            currentClueId: nextClue.id, attempts: 0, locked: false,
          });
          setTimeout(() => {
            const currentStageNum = nextClue.stage || 1;
            let clueNumInStage = newSolvedCount + 1;
            if (currentStageNum === 2) clueNumInStage = newSolvedCount - 7;
            if (currentStageNum === 3) clueNumInStage = 1;

            const nextClueMsg = {
              sender: "professor",
              text: `STAGE ${currentStageNum} - CLUE #${clueNumInStage}: Analyze the visual file above. Enter the decryption code to proceed.`,
              clue: nextClue,
            };
            setMessages(prev => {
              const updated = [...prev, nextClueMsg];
              localStorage.setItem(storageKey, JSON.stringify(updated));
              dbService.updateTeam(effectiveTeamId, { chatMessages: updated });
              return updated;
            });
          }, 1200);
        }
      }
    } else {
      // Incorrect answer
      const nextAttempts = currentAttempts + 1;
      const remaining = Math.max(0, 3 - nextAttempts);

      if (nextAttempts >= 3) {
        await dbService.updateTeam(effectiveTeamId, { attempts: nextAttempts, locked: true });
        currentMsgList = [...currentMsgList, {
          sender: "professor",
          text: `WRONG ANSWER: "${userText}". 3 failed attempts reached. System locked. Request Professor override to unlock.`,
          type: "error",
        }];
        updateMessagesAndSync(currentMsgList);
      } else {
        await dbService.updateTeam(effectiveTeamId, { attempts: nextAttempts });
        currentMsgList = [...currentMsgList, {
          sender: "professor",
          text: `WRONG ANSWER: "${userText}". Attempts: ${nextAttempts} / 3 (${remaining} remaining). Try again!`,
          type: "error",
        }];
        updateMessagesAndSync(currentMsgList);
      }
    }
  };

  const handleUnlockOverride = async () => {
    await dbService.updateTeam(effectiveTeamId, { attempts: 0, locked: false });
    const overrideMsgList = [...messages, {
      sender: "professor",
      text: "SYSTEM OVERRIDE SUCCESSFUL. Access granted. You have 3 fresh attempts to solve the clue.",
    }];
    updateMessagesAndSync(overrideMsgList);
  };

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
                OPERATIVE: {teamName.toUpperCase()}
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
                  ALL STAGES &amp; {TOTAL_CLUES_COUNT} CLUES DECRYPTED SUCCESSFULLY
                </p>
                <div style={{ height: 1, background: "rgba(34,197,94,0.2)", width: "80%", margin: "0 auto 20px" }} />
                <p className="heist-subtitle" style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>
                  Congratulations Operative! You have unlocked all {TOTAL_CLUES_COUNT} core vaults. Maintain position and stand by for final standings.
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
