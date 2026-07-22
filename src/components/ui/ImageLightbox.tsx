"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback } from "react";
import { useInvitationStore } from "@/stores/invitationStore";
import { weddingData } from "@/data/weddingData";

export function ImageLightbox() {
  const lightboxIndex = useInvitationStore((s) => s.lightboxIndex);
  const setLightboxIndex = useInvitationStore((s) => s.setLightboxIndex);
  const gallery = weddingData.gallery;
  const isOpen = lightboxIndex !== null;

  const goNext = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % gallery.length);
    }
  }, [lightboxIndex, gallery.length, setLightboxIndex]);

  const goPrev = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex(
        (lightboxIndex - 1 + gallery.length) % gallery.length
      );
    }
  }, [lightboxIndex, gallery.length, setLightboxIndex]);

  const close = useCallback(() => {
    setLightboxIndex(null);
  }, [setLightboxIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, goNext, goPrev]);

  return (
    <AnimatePresence>
      {isOpen && lightboxIndex !== null && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-5 right-5 z-30 w-11 h-11 flex items-center justify-center
              rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-xl"
            aria-label="Tutup galeri"
          >
            ✕
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-white/70 text-xs font-mono tracking-widest z-30">
            {lightboxIndex + 1} / {gallery.length}
          </div>

          {/* Previous button */}
          <button
            onClick={goPrev}
            className="absolute left-3 md:left-8 z-30 w-11 h-11 flex items-center justify-center
              rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white text-2xl"
            aria-label="Foto sebelumnya"
          >
            ‹
          </button>

          {/* Real Photo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={lightboxIndex}
              className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center z-20"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={gallery[lightboxIndex].src}
                alt={gallery[lightboxIndex].alt}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
              />
            </motion.div>
          </AnimatePresence>

          {/* Next button */}
          <button
            onClick={goNext}
            className="absolute right-3 md:right-8 z-30 w-11 h-11 flex items-center justify-center
              rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white text-2xl"
            aria-label="Foto berikutnya"
          >
            ›
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
