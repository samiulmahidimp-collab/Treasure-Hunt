import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../firebase";
import { CLUES, STAGE_1_CLUES, STAGE_2_CLUES, FINAL_STAGE_CLUES, TOTAL_CLUES_COUNT } from "../clues";
import { Send, LogOut, Check, HelpCircle, ZoomIn, Download, X, Camera, AlertTriangle, ChevronUp, ChevronDown, Play, Clock, Trophy, Award, FileText } from "lucide-react";
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
    const count = solvedList.length;

    // 1. Stage 3 (Final Vault PDF Clue): Unlocked after solving 8 Stage 1 + 3 Stage 2 clues (count >= 11)
    if (count >= 11) {
      return FINAL_STAGE_CLUES[0]; // clue_final_1 (FInal-Clue.pdf)
    }

    // 2. Stage 2 (Semi-Final): Unlocked after solving 8 Stage 1 clues (count 8, 9, 10)
    // All teams solve the EXACT SAME 3 Stage 2 clues in identical order!
    if (count >= 8) {
      const stage2Index = count - 8; // 0 for 9th clue, 1 for 10th clue, 2 for 11th clue
      return STAGE_2_CLUES[stage2Index] || STAGE_2_CLUES[0];
    }

    // 3. Stage 1 (Initial Hunt): Spreads initial clues dynamically across 58 Stage 1 clues
    const unsolvedStage1 = STAGE_1_CLUES.filter(c => !solvedSet.has(c.id));
    if (unsolvedStage1.length === 0) return STAGE_1_CLUES[0];

    // Anti-collision for Stage 1 clues across live teams
    const allTeams = await dbService.getAllTeams();
    const activeOpponentClueIds = Object.values(allTeams)
      .map(t => t?.currentClueId)
      .filter(Boolean);

    const nonCollidingPool = unsolvedStage1.filter(c => !activeOpponentClueIds.includes(c.id));
    const finalPool = nonCollidingPool.length > 0 ? nonCollidingPool : unsolvedStage1;

    const randomIndex = Math.floor(Math.random() * finalPool.length);
    return finalPool[randomIndex];
  };

  // Immediate default active clue fallback for frame 1
  let activeClue = CLUES.find(c => c.id === safeTeamData.currentClueId);
  if (!activeClue && !isAllComplete) {
    const solvedList = safeTeamData.solvedClues || [];
    const count = solvedList.length;
    if (count >= 11) {
      activeClue = FINAL_STAGE_CLUES[0];
    } else if (count >= 8) {
      activeClue = STAGE_2_CLUES[count - 8] || STAGE_2_CLUES[0];
    } else {
      const solvedSet = new Set(solvedList);
      const stage1Unsolved = STAGE_1_CLUES.filter(c => !solvedSet.has(c.id));
      let hash = 0;
      for (let i = 0; i < (effectiveTeamId || "").length; i++) {
        hash += effectiveTeamId.charCodeAt(i);
      }
      const teamClueIndex = stage1Unsolved.length > 0 ? Math.abs(hash) % stage1Unsolved.length : 0;
      activeClue = stage1Unsolved[teamClueIndex] || STAGE_1_CLUES[0];
    }
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
  const [showStage1CongratsModal, setShowStage1CongratsModal] = useState(false);
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
      const solvedList = safeTeamData.solvedClues || [];
      const count = solvedList.length;
      let targetClue = null;

      if (count >= 11) {
        targetClue = FINAL_STAGE_CLUES[0];
      } else if (count >= 8) {
        targetClue = STAGE_2_CLUES[count - 8] || STAGE_2_CLUES[0];
      } else {
        const solvedSet = new Set(solvedList);
        const stage1Unsolved = STAGE_1_CLUES.filter(c => !solvedSet.has(c.id));
        let hash = 0;
        for (let i = 0; i < (effectiveTeamId || "").length; i++) {
          hash += effectiveTeamId.charCodeAt(i);
        }
        const teamClueIndex = stage1Unsolved.length > 0 ? Math.abs(hash) % stage1Unsolved.length : 0;
        targetClue = stage1Unsolved[teamClueIndex] || STAGE_1_CLUES[0];
      }

      if (targetClue) {
        await dbService.updateTeam(effectiveTeamId, { currentClueId: targetClue.id, attempts: 0, locked: false });
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

    const userClean = userText.trim().toLowerCase();
    const isCorrect = userClean === clueToCheck.answer.toLowerCase() ||
      (clueToCheck.altAnswers && clueToCheck.altAnswers.map(a => a.toLowerCase()).includes(userClean));

    if (isCorrect) {
      setShowSuccessIndicator(true);
      setTimeout(() => setShowSuccessIndicator(false), 1500);

      const newSolvedClues = [...(safeTeamData.solvedClues || []), clueToCheck.id];
      const newSolvedCount = newSolvedClues.length;

      let successMsg = `CORRECT CODE CRACKED! Progress: ${newSolvedCount} / ${TOTAL_CLUES_COUNT}.`;
      
      if (newSolvedCount === 8) {
        // Trigger Stage 1 victory celebration modal
        setShowStage1CongratsModal(true);
        successMsg = `🎉 CONGRATULATIONS OPERATIVES! STAGE 1 IS OFFICIALLY CLEARED! You have decrypted all 8 core vaults of Stage 1 with outstanding precision. The Professor commends Team ${teamName.toUpperCase()}. Advancing to Stage 2 (Semi-Final)...`;
      } else if (newSolvedCount === 11) {
        successMsg = `🎉 STAGE 2 COMPLETE! You have solved all 3 Stage 2 semi-final clues. Advancing to Final Stage (Grand Vault - PDF Intel Document)...`;
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
              text: currentStageNum === 3
                ? `🚨 FINAL VAULT UNLOCKED (STAGE 3): Download and inspect the encrypted PDF document above to decode the ultimate heist key!`
                : `STAGE ${currentStageNum} - CLUE #${clueNumInStage}: Analyze the visual file above. Enter the decryption code to proceed.`
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

        {/* Stage 1 Completion Celebration Modal */}
        {showStage1CongratsModal && (
          <div className="zoom-modal" onClick={() => setShowStage1CongratsModal(false)}>
            <div
              className="heist-card"
              style={{
                maxWidth: 440,
                width: "92%",
                textAlign: "center",
                border: "2px solid #22c55e",
                boxShadow: "0 0 35px rgba(34, 197, 94, 0.4)",
                padding: "32px 24px"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Trophy size={54} color="#22c55e" style={{ filter: "drop-shadow(0 0 12px rgba(34,197,94,0.6))" }} />
              </div>
              <h2 className="heist-title" style={{ color: "#22c55e", fontSize: 24, letterSpacing: 2, marginBottom: 8 }}>
                🎉 STAGE 1 CLEARED! 🎉
              </h2>
              <p className="heist-subtitle" style={{ fontSize: 13, color: "var(--text-secondary)", margin: "14px 0 20px", lineHeight: 1.6 }}>
                OUTSTANDING WORK OPERATIVE! TEAM <strong style={{ color: "#fff" }}>{teamName.toUpperCase()}</strong> HAS DECRYPTED ALL 8 CORE VAULTS OF STAGE 1!
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34, 197, 94, 0.15)", border: "1px solid #22c55e", borderRadius: 4, color: "#22c55e", fontSize: 12, fontWeight: 700, padding: "8px 16px", marginBottom: 24 }}>
                <Award size={16} color="#22c55e" />
                <span>ADVANCING TO STAGE 2 (SEMI-FINALS)</span>
              </div>
              <button
                className="heist-btn-solid"
                style={{ background: "#22c55e", borderColor: "#22c55e", color: "#000", fontWeight: 800, width: "100%", padding: "12px", fontSize: 13 }}
                onClick={() => setShowStage1CongratsModal(false)}
              >
                PROCEED TO STAGE 2 CLUES
              </button>
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
              {/* Active Clue Intelligence panel — Hidden until Admin starts game */}
              {isGameStarted && activeClue && (
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
                      {activeClue.isPDF || activeClue.image.endsWith(".pdf") ? (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "10px 14px",
                          background: "rgba(200, 16, 46, 0.15)",
                          border: "1px dashed #C8102E",
                          borderRadius: 6,
                          width: "100%",
                          flexWrap: "wrap"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 160 }}>
                            <FileText size={32} color="#C8102E" style={{ flexShrink: 0 }} />
                            <div style={{ textAlign: "left" }}>
                              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: 1 }}>
                                FINAL VAULT PDF INTEL
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.3 }}>
                                Inspect document to decode final key
                              </div>
                            </div>
                          </div>

                          <a
                            href={activeClue.image}
                            download="FInal-Clue.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="heist-btn-solid"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "8px 14px",
                              fontSize: 12,
                              background: "#C8102E",
                              borderColor: "#C8102E",
                              color: "#fff",
                              textDecoration: "none",
                              fontWeight: 800,
                              borderRadius: 4,
                              flexShrink: 0
                            }}
                          >
                            <Download size={15} /> DOWNLOAD PDF
                          </a>
                        </div>
                      ) : (
                        <>
                          <div
                            className="clue-img-wrap"
                            onClick={() => setZoomImage({ src: activeClue.image, filename: activeClue.answer, isVideo: activeClue.isVideo })}
                            title="Click to Zoom & Download"
                          >
                            {activeClue.isVideo || activeClue.image.toLowerCase().endsWith(".mp4") ? (
                              <video
                                src={activeClue.image}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{ width: "100%", maxHeight: 220, borderRadius: 4, display: "block" }}
                              />
                            ) : (
                              <img
                                src={activeClue.image}
                                alt="Active Clue Visual"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/600x400/0D0D0D/C8102E?text=PICTURE+NOT+LOADED";
                                }}
                              />
                            )}
                            <div className="clue-zoom-icon"><ZoomIn size={14} color="#fff" /></div>
                          </div>
                          <div className="clue-info">
                            <p className="clue-desc">{activeClue.description}</p>
                            <p className="clue-hint">Tip: Tap image or video to view full view. Enter answer or scan QR code below.</p>
                          </div>
                        </>
                      )}
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
                            onClick={() => setZoomImage({ src: msg.clue.image, filename: msg.clue.answer, isVideo: msg.clue.isVideo || msg.clue.image.toLowerCase().endsWith(".mp4") })}
                          >
                            {msg.clue.isVideo || msg.clue.image.toLowerCase().endsWith(".mp4") ? (
                              <video
                                src={msg.clue.image}
                                style={{ width: "100%", height: "auto", display: "block" }}
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={msg.clue.image}
                                alt="Clue visual"
                                style={{ width: "100%", height: "auto", display: "block" }}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/300x200/0D0D0D/C8102E?text=IMAGE+NOT+FOUND"; }}
                              />
                            )}
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
              {zoomImage.isVideo || zoomImage.src.toLowerCase().endsWith(".mp4") ? (
                <video
                  src={zoomImage.src}
                  controls
                  autoPlay
                  loop
                  playsInline
                  style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8, display: "block", margin: "0 auto 16px" }}
                />
              ) : (
                <img src={zoomImage.src} alt="Zoomed Clue" className="zoom-img" />
              )}
              <a href={zoomImage.src} download={zoomImage.filename + (zoomImage.src.endsWith(".mp4") ? ".mp4" : ".png")} className="heist-btn-solid" style={{ textDecoration: "none" }}>
                <Download size={15} /> DOWNLOAD CLUE INTEL
              </a>
            </div>
          </div>
        )}
      </div>
    </HeistLayout>
  );
}
