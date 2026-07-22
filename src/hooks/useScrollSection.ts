"use client";

import { useEffect, useRef } from "react";
import { useInvitationStore } from "@/stores/invitationStore";

/**
 * Track which section is currently in view using IntersectionObserver.
 * Updates the active section in the store for background transitions.
 */
export function useScrollSection() {
  const setActiveSection = useInvitationStore((s) => s.setActiveSection);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = document.querySelectorAll("[data-section]");

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let maxRatio = 0;
        let activeId = "";

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            activeId = entry.target.getAttribute("data-section") || "";
          }
        });

        if (activeId && maxRatio > 0.15) {
          setActiveSection(activeId);
        }
      },
      {
        threshold: [0, 0.15, 0.3, 0.5, 0.7, 1],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    sections.forEach((section) => {
      observerRef.current?.observe(section);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [setActiveSection]);
}
