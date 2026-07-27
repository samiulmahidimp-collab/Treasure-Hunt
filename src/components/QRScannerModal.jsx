import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera } from "lucide-react";

export default function QRScannerModal({ onScanSuccess, onClose }) {
  const [error, setError] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    const elementId = "qr-reader-region";
    let isStopped = false;
    const html5QrCode = new Html5Qrcode(elementId);
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        if (isStopped) return;
        isStopped = true;
        html5QrCode.stop().then(() => {
          onScanSuccess(decodedText);
        }).catch(() => {
          onScanSuccess(decodedText);
        });
      },
      () => {
        // Frame scan iteration - no error needed
      }
    ).catch((err) => {
      console.error("Camera access error:", err);
      setError("CAMERA ACCESS DENIED OR UNAVAILABLE. PLEASE GRANT PERMISSION TO SCAN.");
    });

    return () => {
      isStopped = true;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.log("Stop error:", e));
      }
    };
  }, [onScanSuccess]);

  const handleClose = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => onClose()).catch(() => onClose());
    } else {
      onClose();
    }
  };

  return (
    <div className="zoom-modal" style={{ zIndex: 10000 }}>
      <div className="heist-card" style={{ maxWidth: 420, width: "100%", padding: 24, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Camera color="#C8102E" size={20} />
            <span className="clue-header-title">QR CODE OPTICAL SCANNER</span>
          </div>
          <button onClick={handleClose} className="heist-btn" style={{ padding: "4px 8px" }}>
            <X size={18} />
          </button>
        </div>

        <p className="clue-desc" style={{ marginBottom: 16 }}>
          ALIGN QR CODE INSIDE SCANNER FRAME TO AUTOMATICALLY CAPTURE &amp; ENTER DECRYPTION KEY.
        </p>

        {error ? (
          <div className="heist-error" style={{ margin: "16px 0" }}>{error}</div>
        ) : (
          <div id="qr-reader-region" style={{ width: "100%", minHeight: 250, overflow: "hidden", borderRadius: 4, background: "#000", border: "1px solid var(--border-red)" }} />
        )}

        <button onClick={handleClose} className="heist-btn" style={{ width: "100%", marginTop: 16 }}>
          CANCEL SCAN
        </button>
      </div>
    </div>
  );
}
