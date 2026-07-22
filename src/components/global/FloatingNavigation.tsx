"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInvitationStore } from "@/stores/invitationStore";
import { weddingData } from "@/data/weddingData";
import { scrollToSection } from "@/lib/utils";

export function FloatingNavigation() {
  const isNavOpen = useInvitationStore((s) => s.isNavOpen);
  const toggleNav = useInvitationStore((s) => s.toggleNav);
  const setNavOpen = useInvitationStore((s) => s.setNavOpen);
  const appState = useInvitationStore((s) => s.state);

  if (appState !== "OPENED") return null;

  function handleNavigate(sectionId: string) {
    scrollToSection(sectionId);
    setNavOpen(false);
  }

  return (
    <>
      {/* Floating hamburger button */}
      <motion.button
        className="fixed bottom-6 left-6 z-[90] w-12 h-12 rounded-full 
          bg-[var(--color-primary)] text-white shadow-lg shadow-black/20
          flex items-center justify-center
          hover:bg-[var(--color-primary-dark)] transition-colors"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 200 }}
        onClick={toggleNav}
        aria-label={isNavOpen ? "Tutup navigasi" : "Buka navigasi"}
      >
        <motion.div
          className="flex flex-col gap-[4px]"
          animate={isNavOpen ? "open" : "closed"}
        >
          <motion.span
            className="block w-5 h-[2px] bg-white rounded-full origin-center"
            variants={{
              open: { rotate: 45, y: 6 },
              closed: { rotate: 0, y: 0 },
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            className="block w-5 h-[2px] bg-white rounded-full"
            variants={{
              open: { opacity: 0 },
              closed: { opacity: 1 },
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="block w-5 h-[2px] bg-white rounded-full origin-center"
            variants={{
              open: { rotate: -45, y: -6 },
              closed: { rotate: 0, y: 0 },
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.button>

      {/* Navigation menu */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNavOpen(false)}
            />

            {/* Menu */}
            <motion.nav
              className="fixed bottom-20 left-6 z-[90] bg-[var(--color-surface)] 
                rounded-[var(--radius-lg)] shadow-2xl overflow-hidden min-w-[200px]"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="py-2">
                {weddingData.sections.map((section, i) => (
                  <motion.button
                    key={section.id}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left
                      hover:bg-[var(--color-secondary-light)] transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleNavigate(section.id)}
                  >
                    <span className="text-base">{section.icon}</span>
                    <span
                      className="text-sm tracking-wide"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {section.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
