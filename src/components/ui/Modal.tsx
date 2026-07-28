"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  className = "",
}: ModalProps) {
  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Modal Content — Bottom sheet on mobile, centered modal on desktop */}
          <motion.div
            className={`relative z-10 w-full md:max-w-lg bg-white/90 backdrop-blur-2xl text-[#2a2723] border-2 border-[#d4af37]/50 
              rounded-t-[24px] md:rounded-[var(--radius-lg)] 
              max-h-[85vh] overflow-y-auto shadow-2xl ${className}`}
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 md:hidden">
              <div className="w-10 h-1 rounded-full bg-[#d4af37]" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-[#d4af37]/20">
                <h3
                  className="text-lg font-semibold text-[#2a2723]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full 
                    hover:bg-[#f7ebbf]/50 text-[#2a2723] transition-colors text-xl"
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
            )}

            {/* Close button (no title) */}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center 
                  rounded-full bg-black/10 hover:bg-black/20 transition-colors text-lg z-10"
                aria-label="Tutup"
              >
                ×
              </button>
            )}

            {/* Body */}
            <div className="px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
