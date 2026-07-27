import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, ZoomIn, ZoomOut, Check, RefreshCw } from "lucide-react";

export default function QRScannerModal({ onScanSuccess, onClose }) {
  const [error, setError] = useState("");
  const [pendingResult, setPendingResult] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasZoomSupport, setHasZoomSupport] = useState(false);
  const [zoomCapabilities, setZoomCapabilities] = useState({ min: 1, max: 3, step: 0.1 });
  const scannerRef = useRef(null);

  useEffect(() => {
    const elementId = "qr-reader-region";
    const html5QrCode = new Html5Qrcode(elementId);
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Pause scanning and ask confirmation
        setPendingResult(decodedText);
      },
      () => {}
    ).then(() => {
      // Check camera capabilities for hardware zoom support
      try {
        const runningTrack = html5QrCode.getRunningTrackCapabilities();
        if (runningTrack && runningTrack.zoom) {
          setHasZoomSupport(true);
          setZoomCapabilities({
            min: runningTrack.zoom.min || 1,
            max: runningTrack.zoom.max || 3,
            step: runningTrack.zoom.step || 0.1
          });
        }
      } catch (e) {
        console.log("Track capabilities check fallback:", e);
      }
    }).catch((err) => {
      console.error("Camera access error:", err);
      setError("CAMERA ACCESS DENIED OR UNAVAILABLE. PLEASE GRANT PERMISSION TO SCAN.");
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.log("Stop error:", e));
      }
    };
  }, []);

  const applyZoom = async (newZoom) => {
    setZoomLevel(newZoom);
    try {
      if (scannerRef.current) {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ zoom: newZoom }]
        });
      }
    } catch (e) {
      console.log("Hardware zoom apply fallback:", e);
    }
  };

  const handleConfirm = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        onScanSuccess(pendingResult);
      }).catch(() => {
        onScanSuccess(pendingResult);
      });
    } else {
      onScanSuccess(pendingResult);
    }
  };

  const handleRescan = () => {
    setPendingResult(null);
  };

  const handleClose = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => onClose()).catch(() => onClose());
    } else {
      onClose();
    }
  };

  return (
    <div className="zoom-modal" style={{ zIndex: 10000 }}>
      <div className="heist-card" style={{ maxWidth: 440, width: "100%", padding: 24, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Camera color="#C8102E" size={20} />
            <span className="clue-header-title">QR OPTICAL SCANNER</span>
          </div>
          <button onClick={handleClose} className="heist-btn" style={{ padding: "4px 8px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Confirmation modal if QR caught */}
        {pendingResult ? (
          <div style={{ background: "rgba(200, 16, 46, 0.12)", border: "1.5px solid var(--red-primary)", padding: 20, borderRadius: 4, margin: "12px 0" }}>
            <span style={{ color: "#22c55e", fontSize: 11, letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
              🎯 QR CODE DETECTED!
            </span>
            
            <p style={{
              background: "#000",
              border: "1px solid var(--border-dim)",
              padding: "10px 12px",
              color: "#fff",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              wordBreak: "break-all",
              margin: "10px 0 16px"
            }}>
              {pendingResult}
            </p>

            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 16 }}>
              Would you like to proceed with this QR code?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={handleConfirm} className="heist-btn-solid" style={{ width: "100%", padding: "12px" }}>
                <Check size={16} /> PROCEED WITH THIS QR
              </button>
              <button onClick={handleRescan} className="heist-btn" style={{ width: "100%", padding: "10px" }}>
                <RefreshCw size={14} /> RESCAN / TRY AGAIN
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="clue-desc" style={{ marginBottom: 14 }}>
              ALIGN CAMERA WITH QR CODE. CAMERA WILL AUTOMATICALLY CATCH THE QR.
            </p>

            {error ? (
              <div className="heist-error" style={{ margin: "16px 0" }}>{error}</div>
            ) : (
              <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: 4, background: "#000", border: "1px solid var(--border-red)" }}>
                <div id="qr-reader-region" style={{ width: "100%", minHeight: 240 }} />
                
                {/* Camera Zoom Control Bar */}
                <div style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  right: 10,
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(4px)",
                  padding: "6px 12px",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  zIndex: 20
                }}>
                  <ZoomOut size={16} color="#fff" onClick={() => applyZoom(Math.max(zoomCapabilities.min, zoomLevel - 0.5))} style={{ cursor: "pointer" }} />
                  
                  <input
                    type="range"
                    min={zoomCapabilities.min}
                    max={zoomCapabilities.max}
                    step={zoomCapabilities.step}
                    value={zoomLevel}
                    onChange={(e) => applyZoom(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: "#C8102E", height: 4, cursor: "pointer" }}
                  />

                  <ZoomIn size={16} color="#fff" onClick={() => applyZoom(Math.min(zoomCapabilities.max, zoomLevel + 0.5))} style={{ cursor: "pointer" }} />
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#fff", width: 28, textAlign: "right" }}>{zoomLevel.toFixed(1)}x</span>
                </div>
              </div>
            )}

            <button onClick={handleClose} className="heist-btn" style={{ width: "100%", marginTop: 16 }}>
              CANCEL SCAN
            </button>
          </>
        )}
      </div>
    </div>
  );
}
