"use client";

import { motion } from "framer-motion";

/**
 * Ultra-smooth luxury curtain transition between Welcome Page and Main Page.
 * Features dual Terracotta gold doors with central monogram seal that parts smoothly.
 */
export function TransitionCurtain({
  isAnimating,
  onComplete,
}: {
  isAnimating: boolean;
  onComplete: () => void;
}) {
  if (!isAnimating) return null;

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden">
      {/* Left Curtain Panel */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full bg-[#faf8f5] border-r border-[#d4af37]/40 shadow-2xl flex items-center justify-end"
        initial={{ x: 0 }}
        animate={{ x: "-100%" }}
        transition={{
          duration: 1.1,
          ease: [0.76, 0, 0.24, 1],
          delay: 0.4,
        }}
        onAnimationComplete={onComplete}
      >
        {/* Subtle inner gold line */}
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent mr-2" />
      </motion.div>

      {/* Right Curtain Panel */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full bg-[#faf8f5] border-l border-[#d4af37]/40 shadow-2xl flex items-center justify-start"
        initial={{ x: 0 }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.1,
          ease: [0.76, 0, 0.24, 1],
          delay: 0.4,
        }}
      >
        {/* Subtle inner gold line */}
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent ml-2" />
      </motion.div>

      {/* Center Monogram Seal */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 1.15 }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
          delay: 0.2,
        }}
      >
        <div className="w-16 h-16 rounded-full bg-white border-2 border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.5)] flex items-center justify-center">
          <span
            className="text-lg font-script text-gold-gradient font-bold"
            style={{ fontFamily: "var(--font-script)" }}
          >
            A &amp; R
          </span>
        </div>
      </motion.div>
    </div>
  );
}
