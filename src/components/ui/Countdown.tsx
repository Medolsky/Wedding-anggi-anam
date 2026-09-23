"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";

interface CountdownProps {
  targetDate: string;
  className?: string;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-1.5 px-1 md:py-2 md:px-1.5 rounded-lg bg-[#171719]/90 backdrop-blur-md border border-[#806A42]/80 shadow-md w-full">
      <div className="h-6 md:h-7 flex items-center justify-center overflow-hidden w-full relative">
        <span
          className="block text-xl md:text-2xl font-bold font-serif text-gold-gradient tabular-nums leading-none text-center"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        className="text-[8px] md:text-[9px] uppercase tracking-[1px] mt-0.5 text-[#E0C98F] font-bold leading-none text-center"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function Countdown({ targetDate, className = "" }: CountdownProps) {
  const { days, hours, minutes, seconds, isExpired } =
    useCountdown(targetDate);

  if (isExpired) {
    return (
      <motion.div
        className={`text-center ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <p
          className="text-base md:text-lg italic text-gold-gradient font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Hari Bahagia Telah Tiba
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-1.5 w-full max-w-[260px] mx-auto ${className}`}>
      <CountdownUnit value={days} label="Hari" />
      <CountdownUnit value={hours} label="Jam" />
      <CountdownUnit value={minutes} label="Menit" />
      <CountdownUnit value={seconds} label="Detik" />
    </div>
  );
}
