"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";

export function WelcomeCover() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background Video — welcome1.mp4 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transform-gpu scale-105"
        style={{ filter: "brightness(0.92) contrast(1.02)" }}
      >
        <source src="/image/welcome1.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 photo-overlay-cinematic" />
      <div className="absolute inset-0 film-grain" />

      {/* Floating Gold Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#C8A96B] shadow-[0_0_8px_#C8A96B]"
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
    <div className="relative z-20 flex flex-col items-center justify-end min-h-screen px-6 pb-28 md:pb-36 text-center">
      {/* Guest Name Card — Transparent with Gold Trim, Appearing at 7 Seconds */}
      <motion.div
        className="mb-3.5 px-4 py-2.5 bg-black/35 backdrop-blur-xs border border-[#C8A96B] shadow-[0_8px_30px_rgba(0,0,0,0.6)] max-w-[230px] w-full text-center rounded-2xl"
        initial={{ opacity: 0, y: 25, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.0, delay: 7.0, ease: "easeOut" }}
      >
        <p
          className="text-[9px] uppercase tracking-[2.5px] text-[#E0C98F] font-extrabold mb-0.5 leading-none text-center drop-shadow-xs"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Kepada Yth.
        </p>
        <p
          className="text-sm md:text-base font-bold tracking-wide text-[#F5F1E8] text-center font-serif leading-snug drop-shadow-sm"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {guestName}
        </p>
      </motion.div>

      {/* Open Button — Appearing at 7.2 Seconds */}
      <motion.button
        className="btn-invitation group text-[10.5px] py-2 px-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 7.2, ease: "easeOut" }}
        onClick={onOpen}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="flex items-center gap-1.5">
          <svg
            width="13"
            height="13"
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
