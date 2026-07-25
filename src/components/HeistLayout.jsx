/**
 * HeistLayout — Shared wrapper providing the consistent mask background,
 * vignette, red glow, and scanline overlay across ALL screens.
 *
 * Usage:
 *   <HeistLayout>
 *     <YourScreenContent />
 *   </HeistLayout>
 *
 * The mask background image (public/mask_bg.jpg) is position: fixed so it
 * persists through scrolling and never re-renders per screen.
 */
import React from "react";

export default function HeistLayout({ children, dimLevel = 0.72 }) {
  return (
    <div className="heist-bg-root">
      {/* Fixed mask background — reused on every screen, never swapped */}
      <div
        className="heist-mask-layer"
        style={{ "--mask-dim": dimLevel }}
        aria-hidden="true"
      />
      {/* Red rim-light glow from mask area */}
      <div className="heist-redglow-layer" aria-hidden="true" />
      {/* Film scanlines */}
      <div className="heist-scanlines" aria-hidden="true" />

      {/* Screen content — sits above all background layers */}
      <div className="heist-screen-content">
        {children}
      </div>
    </div>
  );
}
