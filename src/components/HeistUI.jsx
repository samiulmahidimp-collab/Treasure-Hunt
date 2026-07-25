/**
 * Shared UI primitives for the LA CAZA DE TESORO heist theme.
 *
 * DeTag     — Wraps standalone "DE" in a red stamped box consistently.
 * HeistTitle — Renders a string, auto-tagging any standalone "DE" word.
 */
import React from "react";

/**
 * Red stamped "DE" box — applies consistently everywhere
 * the word "DE" appears standalone in the UI.
 */
export function DeTag({ className = "", style = {} }) {
  return (
    <span className={`de-tag ${className}`} style={style} aria-label="DE">
      DE
    </span>
  );
}

/**
 * Renders a title string and wraps any standalone "DE" word
 * in the red stamp box automatically.
 *
 * @param {string} text      — e.g. "LA CAZA DE TESORO"
 * @param {string} className — CSS class on the wrapper <span>
 */
export function HeistTitle({ text, className = "" }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          {i > 0 && " "}
          {word === "DE" ? <DeTag /> : word}
        </React.Fragment>
      ))}
    </span>
  );
}
