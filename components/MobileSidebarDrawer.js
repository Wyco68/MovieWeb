"use client";

import { useState } from "react";

export default function MobileSidebarDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mobile-sidebar-drawer">
      <button
        type="button"
        className="mobile-sidebar-toggle"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar-panel"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
      >
        {isOpen ? "Hide Menu" : "Show Menu"}
      </button>

      <div
        id="mobile-sidebar-panel"
        className={`mobile-sidebar-panel-wrap ${isOpen ? "mobile-sidebar-panel-wrap-open" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
