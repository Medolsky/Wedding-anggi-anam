"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useInvitationStore } from "@/stores/invitationStore";
import { weddingData } from "@/data/weddingData";

export function ImageLightbox() {
  const [mounted, setMounted] = useState(false);
  const lightboxIndex = useInvitationStore((s) => s.lightboxIndex);
  const setLightboxIndex = useInvitationStore((s) => s.setLightboxIndex);
  const gallery = weddingData.gallery;
  const isOpen = lightboxIndex !== null && gallery.length > 0;

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goNext = useCallback(() => {
    if (lightboxIndex !== null && gallery.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % gallery.length);
    }
  }, [lightboxIndex, gallery.length, setLightboxIndex]);

  const goPrev = useCallback(() => {
    if (lightboxIndex !== null && gallery.length > 0) {
      setLightboxIndex(
        (lightboxIndex - 1 + gallery.length) % gallery.length
      );
    }
  }, [lightboxIndex, gallery.length, setLightboxIndex]);

  const close = useCallback(() => {
    setLightboxIndex(null);
  }, [setLightboxIndex]);

  // Lock document scroll and handle Esc & arrow keys
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close, goNext, goPrev]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 45) {
      goNext();
    } else if (diff < -45) {
      goPrev();
    }
    touchStartX.current = null;
  };

  if (!mounted) return null;

  const currentPhoto = lightboxIndex !== null ? gallery[lightboxIndex] : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && currentPhoto && lightboxIndex !== null && (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md select-none touch-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Header Bar with Safe-Area padding */}
          <div
            className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 pt-[max(1rem,env(safe-area-inset-top,1rem))] pointer-events-none"
          >
            {/* Photo Counter Pill */}
            <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171719]/90 border border-[#806A42] text-[#E0C98F] text-xs font-mono font-bold tracking-wider shadow-lg">
              <span>{lightboxIndex + 1}</span>
              <span className="opacity-50">/</span>
              <span>{gallery.length}</span>
            </div>

            {/* Prominent High-Contrast Gold Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171719]/95 border-2 border-[#C8A96B] text-[#F5F1E8] shadow-[0_0_20px_rgba(200,169,107,0.4)] hover:bg-[#252528] active:scale-95 transition-all cursor-pointer"
              aria-label="Tutup foto"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E0C98F"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span className="text-xs font-bold text-[#E0C98F] tracking-wide">Tutup (✕)</span>
            </button>
          </div>

          {/* Desktop Left / Right Arrows */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="hidden sm:flex absolute left-4 md:left-8 z-50 w-12 h-12 items-center justify-center rounded-full bg-[#171719]/85 border border-[#806A42] hover:border-[#C8A96B] hover:bg-[#1f1f23] transition-all text-[#E0C98F] shadow-xl active:scale-90 cursor-pointer"
            aria-label="Foto sebelumnya"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="hidden sm:flex absolute right-4 md:right-8 z-50 w-12 h-12 items-center justify-center rounded-full bg-[#171719]/85 border border-[#806A42] hover:border-[#C8A96B] hover:bg-[#1f1f23] transition-all text-[#E0C98F] shadow-xl active:scale-90 cursor-pointer"
            aria-label="Foto berikutnya"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Real Photo with Smooth Fade & Scale Transition */}
          <div
            className="relative w-full h-full flex items-center justify-center px-4 py-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                className="relative max-w-[92vw] max-h-[72vh] sm:max-h-[80vh] flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={
                    (currentPhoto as { fullSrc?: string }).fullSrc ||
                    currentPhoto.src
                  }
                  alt={currentPhoto.alt}
                  className="max-w-[92vw] max-h-[72vh] sm:max-h-[80vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-[#806A42]/50"
                  loading="eager"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Controls Bar for Mobile & Desktop Thumb Reach */}
          <div
            className="absolute bottom-4 sm:bottom-6 inset-x-0 z-50 flex items-center justify-center gap-3 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] pointer-events-none"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full bg-[#171719]/90 border border-[#806A42] text-[#E0C98F] shadow-lg hover:border-[#C8A96B] active:scale-95 transition-all"
              aria-label="Foto Sebelumnya"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Bottom Quick Close Button (Easy thumb reach on mobile) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#99793D] via-[#C8A96B] to-[#99793D] text-[#0E0E0F] font-bold text-xs shadow-xl active:scale-95 transition-all"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Tutup Foto</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full bg-[#171719]/90 border border-[#806A42] text-[#E0C98F] shadow-lg hover:border-[#C8A96B] active:scale-95 transition-all"
              aria-label="Foto Berikutnya"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
