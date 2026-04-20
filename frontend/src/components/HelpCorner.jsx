import { useState } from "react";
import "./HelpCorner.css";

const EXAMPLES = [
  "Forgot a calculator for an exam?",
  "Need a drill for the weekend?",
  "Short a textbook for one semester?",
  "Camera for a shoot tomorrow?",
];

export default function HelpCorner() {
  const [open, setOpen] = useState(false);
  const [exIdx] = useState(() => Math.floor(Math.random() * EXAMPLES.length));

  return (
    <div className={`help-corner ${open ? "help-corner--open" : ""}`}>
      {open && (
        <div className="help-corner__panel animate-scale-in">
          <button className="help-corner__close" onClick={() => setOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          <p className="help-corner__ex">{EXAMPLES[exIdx]}</p>
          <p className="help-corner__main">
            Upload a request. Anyone nearby who has it can lend it — free, or for a small fee. No waiting, no stores.
          </p>

          <div className="help-corner__steps">
            <div className="help-corner__step">
              <span className="help-corner__step-num">01</span>
              <span className="help-corner__step-text">Post what you need</span>
            </div>
            <div className="help-corner__step-arrow">→</div>
            <div className="help-corner__step">
              <span className="help-corner__step-num">02</span>
              <span className="help-corner__step-text">Neighbours see it</span>
            </div>
            <div className="help-corner__step-arrow">→</div>
            <div className="help-corner__step">
              <span className="help-corner__step-num">03</span>
              <span className="help-corner__step-text">You borrow it</span>
            </div>
          </div>

          <a href="/requests" className="help-corner__cta">Post a request</a>
        </div>
      )}

      <button
        className="help-corner__trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="How Udhaari works"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <span className="help-corner__trigger-label">How it works</span>
        )}
      </button>
    </div>
  );
}
