"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";

interface CountdownProps {
  targetDate: string;
  className?: string;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1.5 md:py-2.5 md:px-2 rounded-xl bg-[#faf8f5]/80 backdrop-blur-md border border-[#d4af37]/60 shadow-sm w-full">
      <div className="h-7 md:h-8 flex items-center justify-center overflow-hidden w-full relative">
        <span
          className="block text-2xl md:text-3xl font-bold font-serif text-gold-gradient tabular-nums leading-none text-center"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        className="text-[9px] uppercase tracking-[1.5px] mt-1 text-[#8a662d] font-bold leading-none text-center"
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
          className="text-lg md:text-xl italic text-gold-gradient font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Hari Bahagia Telah Tiba
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-2 w-full max-w-[320px] mx-auto ${className}`}>
      <CountdownUnit value={days} label="Hari" />
      <CountdownUnit value={hours} label="Jam" />
      <CountdownUnit value={minutes} label="Menit" />
      <CountdownUnit value={seconds} label="Detik" />
    </div>
  );
}
