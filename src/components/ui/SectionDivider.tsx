"use client";

import { motion } from "framer-motion";

interface SectionDividerProps {
  variant?: "wave" | "ornament" | "line";
  className?: string;
  flip?: boolean;
  color?: string;
}

export function SectionDivider({
  variant = "ornament",
  className = "",
  flip = false,
  color,
}: SectionDividerProps) {
  if (variant === "wave") {
    return (
      <div
        className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
      >
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-[30px] md:h-[60px]"
          preserveAspectRatio="none"
        >
          <path
            d="M0 30C240 0 480 60 720 30C960 0 1200 60 1440 30V60H0V30Z"
            fill={color || "var(--section-bg)"}
          />
        </svg>
      </div>
    );
  }

  if (variant === "line") {
    return (
      <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
        <div className="ornament-line" />
        <div className="ornament-dot" />
        <div className="ornament-line" />
      </div>
    );
  }

  // Ornament divider (default)
  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-6 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <svg
        width="120"
        height="24"
        viewBox="0 0 120 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-40"
      >
        <path
          d="M0 12H45M75 12H120M60 2C56 2 52 6 52 12C52 18 56 22 60 22C64 22 68 18 68 12C68 6 64 2 60 2Z"
          stroke={color || "var(--color-accent)"}
          strokeWidth="1"
        />
        <circle cx="60" cy="12" r="3" fill={color || "var(--color-accent)"} />
      </svg>
    </motion.div>
  );
}
