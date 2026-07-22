"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";

export function WelcomeCover() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background — Clear & Vivid Unsplash Wedding Photo */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${weddingData.couple.welcomeCover}')`,
          filter: "brightness(0.65) contrast(1.05)",
        }}
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 18, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Terracotta Merah Bata Overlay */}
      <div className="absolute inset-0 photo-overlay-cinematic" />

      {/* Film grain */}
      <div className="absolute inset-0 film-grain" />

      {/* Floating Gold Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]"
            style={{
              left: `${10 + i * 9}%`,
              top: `${15 + (i % 4) * 20}%`,
              opacity: 0.3 + (i % 3) * 0.15,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, (i % 2 ? 15 : -15), 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 5 + i * 1.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function WelcomeContent({
  guestName,
  onOpen,
}: {
  guestName: string;
  onOpen: () => void;
}) {
  return (
    <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center text-white">
      {/* Ornament Top */}
      <motion.div
        className="flex items-center justify-center gap-3 mb-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <span className="ornament-line" />
        <span className="ornament-dot" />
        <span className="ornament-line" />
      </motion.div>

      {/* The Wedding of */}
      <motion.p
        className="text-[11px] uppercase tracking-[5px] text-[#f3e5ab] font-bold mb-2 leading-none drop-shadow-sm"
        style={{ fontFamily: "var(--font-body)" }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        The Wedding of
      </motion.p>

      {/* Couple Names */}
      <motion.h1
        className="text-5xl md:text-6xl mb-1 font-script text-gold-gradient drop-shadow-md leading-tight"
        style={{ fontFamily: "var(--font-script)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {weddingData.couple.bride.nickname}
      </motion.h1>

      <motion.p
        className="text-2xl md:text-3xl my-1 text-[#d4af37] font-serif leading-none"
        style={{ fontFamily: "var(--font-heading)" }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        &amp;
      </motion.p>

      <motion.h1
        className="text-5xl md:text-6xl mb-5 font-script text-gold-gradient drop-shadow-md leading-tight"
        style={{ fontFamily: "var(--font-script)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
      >
        {weddingData.couple.groom.nickname}
      </motion.h1>

      {/* Date */}
      <motion.p
        className="text-xs tracking-[4px] uppercase text-[#f3e5ab] font-semibold mb-6 leading-none"
        style={{ fontFamily: "var(--font-heading)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        10 • 10 • 2026
      </motion.p>

      {/* Guest Name Card */}
      <motion.div
        className="mb-6 gold-card-pro px-5 py-4 border border-[#d4af37]/40 shadow-2xl max-w-xs w-full text-center"
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        <p
          className="text-[10px] uppercase tracking-[3px] text-[#d4af37] font-bold mb-1 leading-none text-center"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Kepada Yth.
        </p>
        <p
          className="text-base md:text-lg font-bold tracking-wide text-white text-center font-serif leading-snug"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {guestName}
        </p>
      </motion.div>

      {/* Open Button */}
      <motion.button
        className="btn-invitation group text-[11px] py-2.5 px-7"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        onClick={onOpen}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Buka Undangan
        </span>
      </motion.button>
    </div>
  );
}
