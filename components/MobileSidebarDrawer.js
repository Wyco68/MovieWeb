"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MOBILE_DRAWER_QUERY = "(max-width: 1200px)";

export default function MobileSidebarDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileDrawer, setIsMobileDrawer] = useState(false);
  const triggerRef = useRef(null);
  const sheetRef = useRef(null);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsOpen((current) => {
      if (current) triggerRef.current?.focus();
      return !current;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(MOBILE_DRAWER_QUERY);
    const updateViewport = () => setIsMobileDrawer(mediaQuery.matches);
    updateViewport();

    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileDrawer || isOpen) return undefined;

    const sheet = sheetRef.current;
    if (sheet?.contains(document.activeElement)) {
      triggerRef.current?.focus();
    }
  }, [isMobileDrawer, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") closeDrawer();
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [closeDrawer, isOpen]);

  return (
    <div className="mobile-sidebar-drawer">
      <button
        ref={triggerRef}
        type="button"
        className="mobile-sidebar-trigger"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar-sheet"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={toggleDrawer}
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
        onClick={closeDrawer}
      />

      <div
        ref={sheetRef}
        id="mobile-sidebar-sheet"
        className={`mobile-sidebar-sheet${isOpen ? " mobile-sidebar-sheet-open" : ""}`}
        inert={isMobileDrawer && !isOpen}
      >
        {children}
      </div>
    </div>
  );
}
