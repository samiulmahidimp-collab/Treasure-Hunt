import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../firebase";
import { CLUES, TOTAL_CLUES_COUNT } from "../clues";
import { Send, LogOut, Check, HelpCircle, ZoomIn, Download, X, Camera, AlertTriangle, ChevronUp, ChevronDown, Play, Clock } from "lucide-react";
import SystemLocked from "./SystemLocked";
import HeistLayout from "./HeistLayout";
import QRScannerModal from "./QRScannerModal";

export default function ChatbotScreen({ teamName, teamId, teamData, isGameStarted = false, onLogout }) {
  const effectiveTeamId = teamId || teamData?.id || teamName;
  const storageKey = `heist_chat_${effectiveTeamId}`;

  // Default active clue fallback so clue box NEVER disappears
  const safeTeamData = teamData || {
    id: effectiveTeamId,
    name: teamName,
    score: 0,
    solvedClues: [],
    currentClueId: null,
    attempts: 0,
    locked: false,
    isPaused: false,
    needsHelp: false
  };

  const solvedCount     = safeTeamData.solvedClues ? safeTeamData.solvedClues.length : 0;
  const isLocked        = safeTeamData.locked || false;
  const currentAttempts = safeTeamData.attempts || 0;
  const isAllComplete   = solvedCount >= TOTAL_CLUES_COUNT;

  // Track previous needsHelp state to notify when Admin resolves SOS
  const prevNeedsHelpRef = useRef(safeTeamData.needsHelp);

  // Lock outer window scrolling for Messenger-style fixed app experience
  useEffect(() => {
    document.documentElement.classList.add("chat-active");
    document.body.classList.add("chat-active");

    const syncViewport = () => {
      if (window.visualViewport) {
        document.documentElement.style.setProperty("--vv-height", `${window.visualViewport.height}px`);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncViewport);
      window.visualViewport.addEventListener("scroll", syncViewport);
      syncViewport();
    }

    return () => {
      document.documentElement.classList.remove("chat-active");
      document.body.classList.remove("chat-active");
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", syncViewport);
        window.visualViewport.removeEventListener("scroll", syncViewport);
      }
    };
  }, []);

  // Sync Admin Resolution of Help Alert in real time
  useEffect(() => {
    if (prevNeedsHelpRef.current && !safeTeamData.needsHelp) {
      setAlertNotice("✅ ALERT RESOLVED BY ADMIN! You may proceed with your mission.");
      setTimeout(() => setAlertNotice(""), 4500);

      setMessages((prev) => {
        const resolveMsg = {
          sender: "professor",
          text: "✅ ADMIN ALERT RESOLVED: The Professor / Admin has marked your help request as resolved. Maintain position and proceed with decryption.",
          type: "success"
        };
        const updated = [...prev, resolveMsg];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        dbService.updateTeam(effectiveTeamId, { chatMessages: updated });
        return updated;
      });
    }
    prevNeedsHelpRef.current = safeTeamData.needsHelp;
  }, [safeTeamData.needsHelp, effectiveTeamId, storageKey]);

  // Anti-collision clue selector with Stage gating & Strict No-Duplicate Shuffle Enforcement
  const getNextClue = async (solvedList = []) => {
    const solvedSet = new Set(solvedList || []);

    // 1. Strictly filter out any clue already solved by this team in this game
    const unsolvedClues = CLUES.filter(c => !solvedSet.has(c.id));
    if (unsolvedClues.length === 0) return null;

    // 2. Determine target stage based on progress
    let targetStage = 1;
    if (solvedList.length >= 10) {
      targetStage = 3;
    } else if (solvedList.length >= 8) {
      targetStage = 2;
    }

    // 3. Filter unsolved clues by stage
    const stageUnsolved = unsolvedClues.filter(c => (c.stage || 1) === targetStage);
    const poolToUse = stageUnsolved.length > 0 ? stageUnsolved : unsolvedClues;

    // 4. Exclude clues currently active on opponent teams to minimize collisions
    const allTeams = await dbService.getAllTeams();
    const activeOpponentClueIds = Object.values(allTeams)
      .map(t => t?.currentClueId)
      .filter(Boolean);

    const nonCollidingPool = poolToUse.filter(c => !activeOpponentClueIds.includes(c.id));
    const finalPool = nonCollidingPool.length > 0 ? nonCollidingPool : poolToUse;

    // 5. Pick a random, shuffled clue from eligible unsolved pool
    const randomIndex = Math.floor(Math.random() * finalPool.length);
    return finalPool[randomIndex];
  };

  // Immediate default active clue so clue panel renders instantly on frame 1 without repeating solved clues
  let activeClue = CLUES.find(c => c.id === safeTeamData.currentClueId);
  if (!activeClue && !isAllComplete) {
    const solvedSet = new Set(safeTeamData.solvedClues || []);
    const stage1Unsolved = CLUES.filter(c => (c.stage || 1) === 1 && !solvedSet.has(c.id));
    
    // Deterministic hash based on team ID so DIFFERENT teams get DIFFERENT starting clues!
    let hash = 0;
    for (let i = 0; i < (effectiveTeamId || "").length; i++) {
      hash += effectiveTeamId.charCodeAt(i);
    }
    const teamClueIndex = stage1Unsolved.length > 0 ? Math.abs(hash) % stage1Unsolved.length : 0;
    activeClue = stage1Unsolved[teamClueIndex] || CLUES[0];
  }

  const initialWelcomeMsg = [{
    sender: "professor",
    text: isGameStarted
      ? `Bella ciao, team ${teamName.toUpperCase()}. I am The Professor. The plan is set, the police are outside, and the vault is waiting. Are you ready to initiate the heist mission?`
      : `Bella ciao, team ${teamName.toUpperCase()}. I am The Professor. The plan is set, the police are outside, and the vault is waiting. Stand by... The Admin has not started the game yet.`,
    type: "welcome",
    showStartButton: isGameStarted
  }];

  // Instant message state initialization
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialWelcomeMsg;
  });

  const [inputVal, setInputVal] = useState("");
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isClueCollapsed, setIsClueCollapsed] = useState(false);
  const [alertNotice, setAlertNotice] = useState("");
  const messagesEndRef = useRef(null);

  const lastResetTokenRef = useRef(teamData?.resetToken);
  const prevGameStartedRef = useRef(isGameStarted);

  // Notify when Admin starts the game
  useEffect(() => {
    if (!prevGameStartedRef.current && isGameStarted) {
      setAlertNotice("🚀 GAME STARTED BY ADMIN! Tapping mission button to begin.");
      setTimeout(() => setAlertNotice(""), 5000);

      setMessages(prev => {
        // Enable start button on existing welcome message if present
        const hasStartMsg = prev.some(m => m.showStartButton);
        if (!hasStartMsg) {
          const startMsg = {
            sender: "professor",
            text: `🚨 ATTENTION OPERATIVES: The Admin has officially initiated the game! Press below to begin your mission.`,
            type: "welcome",
            showStartButton: true
          };
          const updated = [...prev, startMsg];
          localStorage.setItem(storageKey, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
    prevGameStartedRef.current = isGameStarted;
  }, [isGameStarted, storageKey]);

  // Listen for global game reset event
  useEffect(() => {
    const handleReset = () => {
      localStorage.removeItem(storageKey);
      setMessages(initialWelcomeMsg);
    };

    window.addEventListener("heist-game-reset", handleReset);
    return () => window.removeEventListener("heist-game-reset", handleReset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Sync server chat messages if available or wipe if game was reset
  useEffect(() => {
    if (teamData) {
      const hasResetTokenChanged = teamData.resetToken && teamData.resetToken !== lastResetTokenRef.current;
      const isTeamReset =
        (!teamData.solvedClues || teamData.solvedClues.length === 0) &&
        (!teamData.chatMessages || teamData.chatMessages.length === 0) &&
        (!teamData.score || teamData.score === 0);

      if (hasResetTokenChanged || isTeamReset) {
        lastResetTokenRef.current = teamData.resetToken;
        localStorage.removeItem(storageKey);
        setMessages(initialWelcomeMsg);
      } else if (Array.isArray(teamData.chatMessages) && teamData.chatMessages.length > 0) {
        setMessages(teamData.chatMessages);
        localStorage.setItem(storageKey, JSON.stringify(teamData.chatMessages));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamData, storageKey]);

  // Interactive Start Mission button handler
  const handleStartHeist = () => {
    const updatedMessages = [
      {
        sender: "professor",
        text: `Bella ciao, team ${teamName.toUpperCase()}. I am The Professor. The plan is set, the police are outside, and the vault is waiting.`,
        type: "welcome",
        showStartButton: false
      },
      {
        sender: "player",
        text: "WE ARE READY! INITIATE THE HEIST MISSION."
      },
      {
        sender: "professor",
        text: "THE HEIST HAS BEGUN! Analyze the active visual clue above and enter the decryption key to proceed.",
        type: "success"
      }
    ];
    updateMessagesAndSync(updatedMessages);
  };

  // Save chat thread to localStorage & sync to DB
  const updateMessagesAndSync = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem(storageKey, JSON.stringify(newMessages));
    dbService.updateTeam(effectiveTeamId, { chatMessages: newMessages });
  };

  // Auto-assign clue to DB if currentClueId is missing
  useEffect(() => {
    if (isLocked || isAllComplete || safeTeamData.currentClueId) return;

    const autoAssign = async () => {
      const solvedSet = new Set(safeTeamData.solvedClues || []);
      const stage1Unsolved = CLUES.filter(c => (c.stage || 1) === 1 && !solvedSet.has(c.id));
      const anyUnsolved = CLUES.filter(c => !solvedSet.has(c.id));
      const pool = stage1Unsolved.length > 0 ? stage1Unsolved : anyUnsolved;
      
      let hash = 0;
      for (let i = 0; i < (effectiveTeamId || "").length; i++) {
        hash += effectiveTeamId.charCodeAt(i);
      }
      const teamClueIndex = pool.length > 0 ? Math.abs(hash) % pool.length : 0;
      const defaultTarget = pool[teamClueIndex] || pool[0] || CLUES[0];

      if (defaultTarget) {
        await dbService.updateTeam(effectiveTeamId, { currentClueId: defaultTarget.id, attempts: 0, locked: false });
      }
    };
    autoAssign();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTeamData.currentClueId, isLocked, isAllComplete, effectiveTeamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Alert Admin SOS Toggle
  const handleAlertAdmin = async () => {
    const nextState = !safeTeamData.needsHelp;
    await dbService.updateTeam(effectiveTeamId, { needsHelp: nextState, helpRequestedAt: Date.now() });

    if (nextState) {
      setAlertNotice("ADMIN ALERT TRANSMITTED! Operative assistance requested.");
      setTimeout(() => setAlertNotice(""), 4500);

      const alertMsg = {
        sender: "professor",
        text: `🚨 ADMIN SOS ALERT SENT: The Professor has been notified that Team ${teamName.toUpperCase()} requires assistance. An operative is being dispatched.`,
        type: "error"
      };
      const updated = [...messages, alertMsg];
      updateMessagesAndSync(updated);
    } else {
      setAlertNotice("ADMIN ALERT CANCELLED.");
      setTimeout(() => setAlertNotice(""), 3000);
    }
  };

  // Smart QR Code Scanner Handler
  const handleQRScanned = (scannedText) => {
    setShowQRScanner(false);
    if (!scannedText) return;

    const raw = scannedText.trim();
    let finalCode = raw;

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        window.open(raw, "_blank", "noopener,noreferrer");
      } catch (e) {
        console.error("Popup blocked:", e);
      }

      try {
        const parsedUrl = new URL(raw);
        const params = new URLSearchParams(parsedUrl.search);
        const paramCode = params.get("code") || params.get("ans") || params.get("key") || params.get("answer") || params.get("c");

        if (paramCode) {
          finalCode = paramCode.trim();
          setAlertNotice(`🌐 QR LINK OPENED IN NEW TAB! Extracted code parameter: "${finalCode}"`);
        } else {
          finalCode = raw;
          setAlertNotice(`🌐 QR LINK OPENED IN NEW TAB! Scanned link auto-filled. Inspect open tab for clue!`);
        }
      } catch (e) {
        finalCode = raw;
        setAlertNotice(`🌐 QR LINK OPENED IN NEW TAB! Press Send to submit.`);
      }
    } else {
      setAlertNotice(`📷 QR CODE SCANNED: "${finalCode}". Press Send to submit!`);
    }

    setInputVal(finalCode);
    setTimeout(() => setAlertNotice(""), 6000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isLocked || isAllComplete || !isGameStarted) return;

    const userText = inputVal.trim();
    setInputVal("");

    const newPlayerMsg = { sender: "player", text: userText };
    let currentMsgList = [...messages, newPlayerMsg];
    updateMessagesAndSync(currentMsgList);

    let clueToCheck = activeClue;
    if (!clueToCheck) {
      clueToCheck = await getNextClue(safeTeamData.solvedClues || []);
      if (clueToCheck) {
        await dbService.updateTeam(effectiveTeamId, { currentClueId: clueToCheck.id, attempts: 0, locked: false });
        activeClue = clueToCheck;
      }
    }

    if (!clueToCheck) {
      currentMsgList = [...currentMsgList, {
        sender: "professor",
        text: "No active clue assigned. Contact The Professor.",
      }];
      updateMessagesAndSync(currentMsgList);
      return;
    }

    const isCorrect = userText.toLowerCase() === clueToCheck.answer.toLowerCase();

    if (isCorrect) {
      setShowSuccessIndicator(true);
      setTimeout(() => setShowSuccessIndicator(false), 1500);

      const newSolvedClues = [...(safeTeamData.solvedClues || []), clueToCheck.id];
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
              text: `STAGE ${currentStageNum} - CLUE #${clueNumInStage}: Analyze the visual file above. Enter the decryption code to proceed.`
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
      const nextAttempts = currentAttempts + 1;
      const remaining = Math.max(0, 3 - nextAttempts);

      if (nextAttempts >= 3) {
        await dbService.updateTeam(effectiveTeamId, { attempts: nextAttempts, locked: true });
        currentMsgList = [...currentMsgList, {
          sender: "professor",
          text: `WRONG ANSWER: "${userText}". 3 consecutive failed attempts reached! System locked. Enter Admin Access Code to unlock and resume.`,
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
      text: "ADMIN OVERRIDE SUCCESSFUL. Access restored. You have 3 fresh attempts for your active clue.",
    }];
    updateMessagesAndSync(overrideMsgList);
  };

  return (
    <HeistLayout>
      <div className="chat-root" style={{ height: "var(--vv-height, 100dvh)" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pulse-dot" />
            <div>
              <div className="heist-header-logo" style={{ fontSize: 15 }}>
                SECURE NETWORK LINK
              </div>
              <p className="heist-subtitle" style={{ fontSize: 9, marginTop: 1 }}>
                OPERATIVE: {teamName.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="heist-header-actions">
            <div className="heist-badge">PROGRESS: <strong>{solvedCount} / {TOTAL_CLUES_COUNT}</strong></div>
            
            {/* ALERT ADMIN BUTTON */}
            <button
              className="heist-btn"
              style={{
                padding: "6px 12px",
                fontSize: 11,
                borderColor: safeTeamData.needsHelp ? "#ef4444" : "rgba(239, 68, 68, 0.5)",
                color: "#ef4444",
                background: safeTeamData.needsHelp ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.08)"
              }}
              onClick={handleAlertAdmin}
              title="Alert Admin for immediate assistance"
            >
              <AlertTriangle size={13} color="#ef4444" />
              <span>{safeTeamData.needsHelp ? "ADMIN ALERTED" : "ALERT ADMIN"}</span>
            </button>

            <button className="heist-btn" style={{ padding: "6px 12px", fontSize: 11 }} onClick={onLogout}>
              <LogOut size={13} /> DISCONNECT
            </button>
          </div>
        </header>

        {/* Admin Game Start Waiting Bar */}
        {!isGameStarted && (
          <div style={{
            background: "rgba(217, 119, 6, 0.95)",
            color: "#fff",
            textAlign: "center",
            padding: "8px 16px",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            letterSpacing: 1,
            zIndex: 95,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}>
            <Clock size={14} color="#fff" />
            <span>⏳ WAITING FOR THE PROFESSOR / ADMIN TO START THE GAME...</span>
          </div>
        )}

        {/* Alert Notification Bar */}
        {alertNotice && (
          <div style={{
            background: "rgba(200, 16, 46, 0.95)",
            color: "#fff",
            textAlign: "center",
            padding: "8px 16px",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            letterSpacing: 1,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}>
            <span>{alertNotice}</span>
          </div>
        )}

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
              {/* Active Clue Intelligence panel */}
              {activeClue && (
                <div className="clue-panel">
                  <div className="clue-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <HelpCircle size={15} color="#C8102E" />
                      <span className="clue-header-title">ACTIVE CLUE INTELLIGENCE</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="clue-attempts">ATTEMPTS: {currentAttempts} / 3</span>
                      <button
                        type="button"
                        className="heist-btn"
                        style={{ padding: "2px 8px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}
                        onClick={() => setIsClueCollapsed(!isClueCollapsed)}
                      >
                        {isClueCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                        <span>{isClueCollapsed ? "EXPAND" : "MINIMIZE"}</span>
                      </button>
                    </div>
                  </div>

                  {!isClueCollapsed && (
                    <div className="clue-body">
                      <div
                        className="clue-img-wrap"
                        onClick={() => setZoomImage({ src: activeClue.image, filename: activeClue.answer })}
                        title="Click to Zoom & Download"
                      >
                        <img
                          src={activeClue.image}
                          alt="Active Clue Visual"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/600x400/0D0D0D/C8102E?text=PICTURE+NOT+LOADED";
                          }}
                        />
                        <div className="clue-zoom-icon"><ZoomIn size={14} color="#fff" /></div>
                      </div>
                      <div className="clue-info">
                        <p className="clue-desc">{activeClue.description}</p>
                        <p className="clue-hint">Tip: Tap image to view full view. Enter answer or scan QR code below.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Messages Stream */}
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

                  // Hide old/solved clue images inside past chat bubbles so chat stays clean
                  const showClueMedia =
                    msg.clue &&
                    msg.clue.id === activeClue?.id &&
                    !(safeTeamData.solvedClues || []).includes(msg.clue.id);

                  return (
                    <div key={i} style={{ display: "flex", justifyContent: msg.sender === "professor" ? "flex-start" : "flex-end" }}>
                      <div className={bubbleClass}>
                        <span className="chat-sender" style={{ color: msg.sender === "professor" ? "#C8102E" : "#fff" }}>
                          {msg.sender === "professor" ? "THE PROFESSOR" : "OPERATIVE"}
                        </span>
                        <p className="chat-text">{msg.text}</p>
                        
                        {msg.showStartButton && isGameStarted && (
                          <div style={{ marginTop: 12 }}>
                            <button
                              type="button"
                              className="heist-btn-solid"
                              style={{
                                padding: "8px 16px",
                                fontSize: 12,
                                letterSpacing: 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                background: "#C8102E",
                                borderColor: "#C8102E",
                                cursor: "pointer",
                                boxShadow: "0 0 12px rgba(200, 16, 46, 0.4)"
                              }}
                              onClick={handleStartHeist}
                            >
                              <Play size={14} />
                              <span>START THE HEIST MISSION</span>
                            </button>
                          </div>
                        )}
                        
                        {showClueMedia && (
                          <div
                            style={{ marginTop: 8, maxWidth: 180, border: "1px solid var(--border-dim)", overflow: "hidden", cursor: "pointer", position: "relative" }}
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

              {/* Chat Input & Action Bar */}
              <form onSubmit={handleSend} className="chat-input-bar">
                <span className="chat-cmd-prefix">$</span>
                <input
                  type="text"
                  className="chat-input-field"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={
                    !isGameStarted
                      ? "WAITING FOR ADMIN TO START GAME..."
                      : activeClue
                      ? "TYPE DECRYPTION KEY OR SCAN QR..."
                      : "RESPOND TO THE PROFESSOR..."
                  }
                  disabled={!isGameStarted || isLocked || isAllComplete}
                  autoComplete="off"
                />

                {/* QR Code Camera Scanner Trigger Button */}
                <button
                  type="button"
                  className="heist-btn"
                  style={{ padding: "8px 12px", borderColor: "var(--border-red)" }}
                  onClick={() => setShowQRScanner(true)}
                  title="Scan QR Code using Camera"
                  disabled={!isGameStarted || isLocked || isAllComplete}
                >
                  <Camera size={16} color="#C8102E" />
                </button>

                <button
                  type="submit"
                  className="heist-btn-solid"
                  style={{ padding: "8px 16px" }}
                  disabled={!isGameStarted || isLocked || isAllComplete || !inputVal.trim()}
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>

        {/* QR Code Scanner Modal */}
        {showQRScanner && (
          <QRScannerModal
            onScanSuccess={handleQRScanned}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {/* Lightbox / Zoom Modal */}
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
