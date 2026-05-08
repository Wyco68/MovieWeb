"use client";

import { useEffect, useState } from "react";

export default function MobileSidebarDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  return (
    <div className="mobile-sidebar-drawer">
      <button
        type="button"
        className="mobile-sidebar-trigger"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar-sheet"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div
        role="presentation"
        className={`mobile-sidebar-backdrop${isOpen ? " mobile-sidebar-backdrop-visible" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <div
        id="mobile-sidebar-sheet"
        className={`mobile-sidebar-sheet${isOpen ? " mobile-sidebar-sheet-open" : ""}`}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}
