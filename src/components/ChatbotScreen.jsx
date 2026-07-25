import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../firebase";
import { CLUES } from "../clues";
import { Send, LogOut, ShieldAlert, Check, HelpCircle, ZoomIn, Download, X } from "lucide-react";
import SystemLocked from "./SystemLocked";

export default function ChatbotScreen({ teamName, teamData, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [zoomImage, setZoomImage] = useState(null); // { src, filename }
  const messagesEndRef = useRef(null);

  // Set up initial chat messages
  useEffect(() => {
    if (!teamData) return;

    const solvedCount = teamData.solvedClues ? teamData.solvedClues.length : 0;
    
    // If the game hasn't started for this user (no messages yet)
    if (messages.length === 0) {
      if (solvedCount === 0 && !teamData.currentClueId) {
        // Welcome flow
        setMessages([
          {
            sender: "professor",
            text: `Bella ciao, team ${teamName.toUpperCase()}. I am The Professor. The plan is set, the police are outside, and the vault is waiting. Are you ready to initiate the heist?`,
            type: "welcome"
          }
        ]);
      } else {
        // Already playing: Restore state
        setMessages([
          {
            sender: "professor",
            text: `Operatives, welcome back to the channel. Decrypted logs show you have solved ${solvedCount} clue(s). Let's continue the heist.`,
            type: "system"
          }
        ]);
      }
    }
  }, [teamData]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, teamData]);

  if (!teamData) {
    return (
      <div style={styles.loading}>
        <div className="glitch-text" style={{ fontSize: "20px" }}>ESTABLISHING ENCRYPTED LINK...</div>
      </div>
    );
  }

  const solvedCount = teamData.solvedClues ? teamData.solvedClues.length : 0;
  const isLocked = teamData.locked || false;
  const currentAttempts = teamData.attempts || 0;
  
  // Phase 1 check
  const isPhase1Complete = solvedCount >= CLUES.length;

  // Select next random clue
  const getNextClue = (solvedList) => {
    const remainingClues = CLUES.filter(c => !solvedList.includes(c.id));
    if (remainingClues.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * remainingClues.length);
    return remainingClues[randomIndex];
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isLocked || isPhase1Complete) return;

    const userText = inputVal.trim();
    setInputVal("");

    // Add user message to state
    setMessages(prev => [...prev, { sender: "player", text: userText }]);

    // 1. Welcome Flow Yes/No logic
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.type === "welcome") {
      const positiveResponses = ["yes", "yeah", "si", "y", "ok", "ready", "sure"];
      if (positiveResponses.some(word => userText.toLowerCase().includes(word))) {
        setMessages(prev => [...prev, { 
          sender: "professor", 
          text: "Excellent. Remember, there is no turning back now. Initializing decoy signals. Clue 1 incoming..." 
        }]);

        // Select first clue
        const firstClue = getNextClue([]);
        if (firstClue) {
          await dbService.updateTeam(teamName, {
            currentClueId: firstClue.id,
            attempts: 0,
            locked: false
          });

          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: "professor",
              text: `CLUE #1: Solve this image code. The file name is the answer key.`,
              clue: firstClue
            }]);
          }, 1500);
        }
      } else {
        setMessages(prev => [...prev, { 
          sender: "professor", 
          text: "We don't have time for hesitation. Lives are on the line. When you are ready to answer the call of duty, type 'YES'." 
        }]);
      }
      return;
    }

    // 2. Gameplay Answering logic
    if (teamData.currentClueId) {
      const activeClue = CLUES.find(c => c.id === teamData.currentClueId);
      if (!activeClue) return;

      const isCorrect = userText.toLowerCase() === activeClue.answer.toLowerCase();

      if (isCorrect) {
        // Flash green screen
        setShowSuccessIndicator(true);
        setTimeout(() => setShowSuccessIndicator(false), 1500);

        // Update solved list & score in database
        const newSolvedClues = [...(teamData.solvedClues || []), activeClue.id];
        const newSolvedCount = newSolvedClues.length;

        // Log success
        setMessages(prev => [...prev, {
          sender: "professor",
          text: `CORRECT CODE CRACKED! Great job, team. Solved: ${newSolvedCount} / ${CLUES.length}.`,
          type: "success"
        }]);

        if (newSolvedCount >= CLUES.length) {
          // Finished Phase 1
          await dbService.updateTeam(teamName, {
            score: newSolvedCount,
            solvedClues: newSolvedClues,
            currentClueId: null,
            attempts: 0,
            locked: false
          });
        } else {
          // Get next random clue
          const nextClue = getNextClue(newSolvedClues);
          if (nextClue) {
            await dbService.updateTeam(teamName, {
              score: newSolvedCount,
              solvedClues: newSolvedClues,
              currentClueId: nextClue.id,
              attempts: 0,
              locked: false
            });

            setTimeout(() => {
              setMessages(prev => [...prev, {
                sender: "professor",
                text: `CLUE #${newSolvedCount + 1}: Decode the following visual file:`,
                clue: nextClue
              }]);
            }, 1500);
          } else {
            // Out of clues in pool (fail-safe)
            setMessages(prev => [...prev, {
              sender: "professor",
              text: `All available database records deciphered. Awaiting further commands.`
            }]);
          }
        }
      } else {
        // Wrong attempt
        const nextAttempts = currentAttempts + 1;
        
        if (nextAttempts >= 3) {
          // Trigger System Lockout
          await dbService.updateTeam(teamName, {
            attempts: nextAttempts,
            locked: true
          });
          
          setMessages(prev => [...prev, {
            sender: "professor",
            text: "Wrong answer. System locked.",
            type: "error"
          }]);
        } else {
          // Regular incorrect attempt
          await dbService.updateTeam(teamName, {
            attempts: nextAttempts
          });

          setMessages(prev => [...prev, {
            sender: "professor",
            text: "Wrong answer",
            type: "error"
          }]);
        }
      }
    } else {
      // Game started but no current clue set (user prompt after initial ready answer)
      setMessages(prev => [...prev, {
        sender: "professor",
        text: "The communications tunnel is active. Please focus on the mission protocols."
      }]);
    }
  };

  const handleUnlockOverride = async () => {
    // Unlock this team in the database
    await dbService.updateTeam(teamName, {
      attempts: 0,
      locked: false
    });

    setMessages(prev => [...prev, {
      sender: "professor",
      text: "SYSTEM OVERRIDE SUCCESSFUL. Access granted. You have 3 fresh attempts to solve the clue."
    }]);
  };

  const activeClue = CLUES.find(c => c.id === teamData.currentClueId);

  return (
    <div style={styles.container}>
      {/* Real-time single device lockout or overrides */}
      {isLocked && <SystemLocked onUnlock={handleUnlockOverride} />}
      
      {/* Green success indicator flash */}
      {showSuccessIndicator && (
        <div style={styles.successFlash}>
          <div style={styles.successFlashContent}>
            <Check size={64} color="#fff" />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", letterSpacing: "2px" }}>ACCESS GRANTED</h2>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.pulseDot}></span>
          <div>
            <h3 style={styles.channelTitle}>SECURE NETWORK LINK</h3>
            <p style={styles.channelSub}>OPERATIVE: {teamName.toUpperCase()} | LEVEL 1</p>
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <div style={styles.scoreBoard}>
            <span>CRACKED: <strong>{solvedCount} / {CLUES.length}</strong></span>
          </div>
          <button className="heist-btn" onClick={onLogout} style={styles.logoutBtn}>
            <LogOut size={14} />
            <span>DISCONNECT</span>
          </button>
        </div>
      </header>

      {/* Main chat layout */}
      <div style={styles.chatArea}>
        
        {/* Phase 1 Completion Graphic */}
        {isPhase1Complete ? (
          <div style={styles.completionContainer}>
            <div className="heist-card red-glow-border" style={styles.completionCard}>
              <div style={styles.maskStamp}>
                <svg viewBox="0 0 100 120" style={{ width: "80px", height: "100px" }}>
                  <path 
                    d="M 50,10 C 25,10 15,35 15,60 C 15,90 35,110 50,110 C 65,110 85,90 85,60 C 85,35 75,10 50,10 Z" 
                    fill="none" 
                    stroke="#e50914" 
                    strokeWidth="3.5"
                  />
                  <path d="M 30,50 Q 37,45 44,50" fill="none" stroke="#e50914" strokeWidth="2.5" />
                  <path d="M 56,50 Q 63,45 70,50" fill="none" stroke="#e50914" strokeWidth="2.5" />
                  <circle cx="37" cy="53" r="2.5" fill="#fff" />
                  <circle cx="63" cy="53" r="2.5" fill="#fff" />
                  <path d="M 50,75 Q 35,70 25,65 Q 35,80 50,85 Q 65,80 75,65 Q 65,70 50,75 Z" fill="#e50914" />
                  <path d="M 40,92 Q 50,97 60,92" fill="none" stroke="#fff" strokeWidth="2.5" />
                </svg>
              </div>
              <h2 className="glitch-text" style={styles.compTitle}>PHASE 1 COMPLETE</h2>
              <p style={styles.compSub}>Awaiting Semi-Final Instructions from The Professor</p>
              <div style={styles.statusDivider}></div>
              <p style={styles.compText}>
                You have successfully decrypted all {CLUES.length} core vaults. Stay tuned on this secure terminal channel. Do not disconnect your comms link.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Clue Panel (Desktop-split or Top-bar depending on size) */}
            {activeClue && (
              <div style={styles.cluePanel}>
                <div style={styles.clueHeader}>
                  <HelpCircle size={16} color="#e50914" />
                  <span style={styles.clueTitle}>ACTIVE CLUE INTELLIGENCE</span>
                  <span style={styles.clueAttempts}>ATTEMPTS: {currentAttempts} / 3</span>
                </div>
                <div style={styles.clueBody}>
                  <div 
                    style={{ ...styles.imageContainer, position: "relative", cursor: "pointer" }}
                    onClick={() => setZoomImage({ src: activeClue.image, filename: activeClue.answer })}
                    title="Click to Zoom & Download"
                  >
                    <img 
                      src={activeClue.image} 
                      alt="Clue Visual" 
                      style={styles.clueImage} 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://placehold.co/600x400/121212/e50914?text=PICTURE+NOT+LOADED+IN+/public/pictures/";
                      }}
                    />
                    <div style={styles.imageOverlayIcon}>
                      <ZoomIn size={16} color="#fff" />
                    </div>
                  </div>
                  <div style={styles.clueInfo}>
                    <p style={styles.clueDesc}>{activeClue.description}</p>
                    <span style={styles.clueHint}>Tip: Click the image to view fullscreen or download. Answer is case-insensitive.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Message Thread */}
            <div style={styles.messageThread}>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  style={{
                    ...styles.messageRow,
                    justifyContent: msg.sender === "professor" ? "flex-start" : "flex-end"
                  }}
                >
                  <div 
                    style={{
                      ...styles.messageBubble,
                      backgroundColor: msg.sender === "professor" 
                        ? (msg.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(22, 22, 22, 0.9)")
                        : "rgba(229, 9, 20, 0.15)",
                      borderColor: msg.sender === "professor" 
                        ? (msg.type === "success" ? "#22c55e" : "var(--border-color)")
                        : "var(--red-primary)"
                    }}
                  >
                    <span style={{
                      ...styles.senderLabel,
                      color: msg.sender === "professor" ? "#e50914" : "#ffffff"
                    }}>
                      {msg.sender === "professor" ? "THE PROFESSOR" : "OPERATIVE"}
                    </span>
                    <p style={styles.messageText}>{msg.text}</p>
                    
                    {msg.clue && (
                      <div 
                        style={{ ...styles.inlineClueImageContainer, cursor: "pointer", position: "relative" }}
                        onClick={() => setZoomImage({ src: msg.clue.image, filename: msg.clue.answer })}
                        title="Click to Zoom & Download"
                      >
                        <img 
                          src={msg.clue.image} 
                          alt="Clue visual inside chat" 
                          style={styles.inlineClueImage}
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "https://placehold.co/300x200/121212/e50914?text=PICTURE+NOT+FOUND";
                          }}
                        />
                        <div style={styles.inlineImageOverlayIcon}>
                          <ZoomIn size={12} color="#fff" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={styles.inputForm}>
              <span style={styles.cmdPrefix}>$</span>
              <input
                type="text"
                className="heist-input"
                style={styles.chatInput}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={activeClue ? "TYPE DECRYPTION KEY..." : "RESPOND TO THE PROFESSOR..."}
                disabled={isLocked || isPhase1Complete}
              />
              <button 
                type="submit" 
                className="heist-btn-solid" 
                style={styles.sendBtn}
                disabled={isLocked || isPhase1Complete}
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomImage && (
        <div style={styles.zoomModal} onClick={() => setZoomImage(null)}>
          <div style={styles.zoomContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.zoomCloseBtn} onClick={() => setZoomImage(null)}>
              <X size={24} />
            </button>
            <img src={zoomImage.src} alt="Zoomed Clue" style={styles.zoomImg} />
            <div style={styles.zoomActionBar}>
              <a 
                href={zoomImage.src} 
                download={zoomImage.filename + ".png"} 
                style={styles.zoomDownloadLink}
                className="heist-btn-solid"
              >
                <Download size={16} />
                <span>Download Clue</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    background: "#080808",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#080808",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "rgba(10, 10, 10, 0.95)",
    borderBottom: "1px solid var(--border-color)",
    zIndex: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  pulseDot: {
    width: "8px",
    height: "8px",
    background: "#22c55e",
    borderRadius: "50%",
    boxShadow: "0 0 10px #22c55e",
    animation: "blink 1.5s infinite alternate",
  },
  channelTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "14px",
    color: "#fff",
    letterSpacing: "1px",
  },
  channelSub: {
    fontSize: "9px",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  scoreBoard: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    border: "1px solid rgba(229,9,20,0.3)",
    background: "rgba(229,9,20,0.05)",
    padding: "6px 12px",
    borderRadius: "2px",
  },
  logoutBtn: {
    padding: "6px 12px",
    fontSize: "11px",
    gap: "4px",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    gap: "16px",
    overflow: "hidden",
    position: "relative",
    maxWidth: "1000px",
    width: "100%",
    margin: "0 auto",
  },
  cluePanel: {
    background: "rgba(18, 18, 18, 0.95)",
    border: "1px solid rgba(229, 9, 20, 0.3)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderRadius: "4px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  },
  clueHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(229, 9, 20, 0.2)",
    paddingBottom: "8px",
  },
  clueTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "13px",
    color: "#e50914",
    letterSpacing: "1px",
    fontWeight: "bold",
  },
  clueAttempts: {
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  clueBody: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  imageContainer: {
    flex: "1 1 200px",
    maxWidth: "320px",
    minHeight: "150px",
    background: "#000",
    border: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  clueImage: {
    width: "100%",
    height: "auto",
    objectFit: "contain",
  },
  clueInfo: {
    flex: "2 1 300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  clueDesc: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "var(--text-secondary)",
  },
  clueHint: {
    fontSize: "10px",
    color: "var(--text-muted)",
    marginTop: "8px",
    fontStyle: "italic",
  },
  messageThread: {
    flex: 1,
    overflowY: "auto",
    paddingRight: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    border: "1px solid",
    borderRadius: "2px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  senderLabel: {
    fontSize: "9px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  messageText: {
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#fff",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  inlineClueImageContainer: {
    marginTop: "10px",
    maxWidth: "200px",
    border: "1px solid var(--border-color)",
    overflow: "hidden",
  },
  inlineClueImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  inputForm: {
    display: "flex",
    alignItems: "center",
    background: "#121212",
    border: "1px solid var(--border-color)",
    padding: "4px 8px 4px 16px",
    borderRadius: "2px",
    gap: "12px",
  },
  cmdPrefix: {
    color: "#e50914",
    fontFamily: "var(--font-mono)",
    fontWeight: "bold",
    fontSize: "16px",
  },
  chatInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "10px 0",
    fontSize: "13px",
    color: "#fff",
    ":focus": {
      boxShadow: "none",
    }
  },
  sendBtn: {
    padding: "10px 16px",
  },
  successFlash: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(34, 197, 94, 0.95)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  successFlashContent: {
    textAlign: "center",
    color: "#fff",
  },
  completionContainer: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  completionCard: {
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
    padding: "48px 32px",
    background: "rgba(10, 10, 10, 0.95)",
    border: "2px solid #22c55e",
    boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)",
  },
  maskStamp: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
    filter: "drop-shadow(0 0 8px rgba(229, 9, 20, 0.6))",
  },
  compTitle: {
    color: "#22c55e",
    fontSize: "28px",
    marginBottom: "8px",
  },
  compSub: {
    color: "var(--text-secondary)",
    fontSize: "13px",
    letterSpacing: "1px",
    marginBottom: "24px",
  },
  statusDivider: {
    height: "1px",
    background: "rgba(34, 197, 94, 0.2)",
    width: "80%",
    margin: "0 auto 24px auto",
  },
  compText: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "var(--text-muted)",
  },
  zoomModal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(5, 5, 8, 0.95)",
    zIndex: 10000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  zoomContent: {
    position: "relative",
    maxWidth: "90%",
    maxHeight: "90%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  zoomCloseBtn: {
    position: "absolute",
    top: "-40px",
    right: "0px",
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  zoomImg: {
    maxWidth: "100%",
    maxHeight: "75vh",
    objectFit: "contain",
    borderRadius: "8px",
    boxShadow: "0 0 30px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)",
  },
  zoomActionBar: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  zoomDownloadLink: {
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  imageOverlayIcon: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.6)",
    borderRadius: "4px",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
    transition: "opacity 0.2s",
  },
  inlineImageOverlayIcon: {
    position: "absolute",
    bottom: "6px",
    right: "6px",
    background: "rgba(0,0,0,0.6)",
    borderRadius: "4px",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  }
};
