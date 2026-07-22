"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";
import { useInvitationStore } from "@/stores/invitationStore";
import { weddingData } from "@/data/weddingData";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMusicPlaying = useInvitationStore((s) => s.isMusicPlaying);
  const setMusicPlaying = useInvitationStore((s) => s.setMusicPlaying);
  const toggleMusic = useInvitationStore((s) => s.toggleMusic);
  const appState = useInvitationStore((s) => s.state);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(weddingData.music.src);
    audioRef.current.loop = true;
    audioRef.current.volume = weddingData.music.defaultVolume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isMusicPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setMusicPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isMusicPlaying, setMusicPlaying]);

  // Pause on tab hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && audioRef.current) {
        audioRef.current.pause();
      } else if (!document.hidden && isMusicPlaying && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isMusicPlaying]);

  // Don't show until invitation is opened
  if (appState !== "OPENED") return null;

  return (
    <AnimatePresence>
      <motion.button
        className="fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full 
          bg-[var(--color-primary)] text-white shadow-lg shadow-black/20
          flex items-center justify-center
          hover:bg-[var(--color-primary-dark)] transition-colors"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        onClick={toggleMusic}
        aria-label={isMusicPlaying ? "Matikan musik" : "Nyalakan musik"}
        title={weddingData.music.title}
      >
        {isMusicPlaying ? (
          <motion.div
            className="flex items-end gap-[2px] h-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-[3px] bg-white rounded-full"
                animate={{
                  height: ["6px", "16px", "8px", "14px", "6px"],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        )}
      </motion.button>
    </AnimatePresence>
  );
}
