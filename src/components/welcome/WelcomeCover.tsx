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
      >
        <source src="/image/welcome1.mp4" type="video/mp4" />
      </video>

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
    <div className="absolute inset-x-0 top-[55%] -translate-y-1/2 z-20 flex flex-col items-center justify-center px-6 text-center">
      {/* Guest Name Card — Locked in the empty space of the video, appearing at 8.0s */}
      <motion.div
        className="mb-3 px-5 py-3 bg-black/45 backdrop-blur-md border border-[#C8A96B] shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-[240px] w-full text-center rounded-2xl"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.0, delay: 8.0, ease: "easeOut" }}
      >
        <p
          className="text-[9.5px] uppercase tracking-[2.5px] text-[#E0C98F] font-extrabold mb-0.5 leading-none text-center drop-shadow-xs"
          style={{ fontFamily: "var(--font-body)" }}
        >
          KEPADA YTH.
        </p>
        <p
          className="text-base font-bold tracking-wide text-[#F5F1E8] text-center font-serif leading-snug drop-shadow-sm"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {guestName}
        </p>
      </motion.div>

      {/* Open Button — Appearing at 8.2s */}
      <motion.button
        className="btn-invitation group text-[11px] py-2.5 px-6 shadow-xl cursor-pointer"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 8.2, ease: "easeOut" }}
        onClick={onOpen}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="flex items-center gap-1.5 font-extrabold tracking-widest">
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
          BUKA UNDANGAN
        </span>
      </motion.button>
    </div>
  );
}
