"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

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
        className="mobile-sidebar-trigger bg-white dark:bg-[#1c1e54] text-[#061b31] dark:text-white border-[#e5edf5] dark:border-white/10 hover:border-[#533afd] transition-all"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar-sheet"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={toggleDrawer}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
