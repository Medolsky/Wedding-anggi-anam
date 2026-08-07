"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";
import { Countdown } from "@/components/ui/Countdown";
import { CharReveal, AnimatedText } from "@/components/ui/AnimatedText";

export function HeroSection() {
  const { sectionBgs, couple } = weddingData;

  return (
    <section
      id="home"
      data-section="hero"
      className="relative min-h-screen h-screen flex flex-col justify-between items-center overflow-hidden bg-[#FAF8F5] text-[#1A1815] transform-gpu py-8 px-6"
    >
      {/* Background Image — Clear & Vivid Photo */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transform-gpu"
          style={{
            backgroundImage: `url('${sectionBgs.hero}')`,
            filter: "brightness(0.95) contrast(1.02)",
          }}
        />
        <div className="absolute inset-0 photo-overlay-cinematic" />
        <div className="absolute inset-0 film-grain" />
      </div>

      {/* TOP GROUP: Ornament & Enlarged "The Wedding of" */}
      <div className="relative z-20 text-center w-full max-w-md mx-auto pt-2 flex flex-col items-center">
        <AnimatedText delay={0.1} variant="scaleUp" className="w-full flex justify-center mb-3">
          <div className="flex items-center justify-center gap-3">
            <span className="ornament-line" />
            <span className="ornament-dot" />
            <span className="ornament-line" />
          </div>
        </AnimatedText>

        {/* The Wedding of — Enlarged & Prominent */}
        <AnimatedText delay={0.2} variant="fadeUp" className="w-full text-center mt-1">
          <p
            className="text-xs md:text-sm uppercase tracking-[7px] text-[#B8860B] font-extrabold text-center leading-none drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The Wedding of
          </p>
        </AnimatedText>
      </div>

      {/* CENTER GROUP: Prominently Enlarged Couple Names, Date, & Countdown */}
      <div className="relative z-20 text-center w-full max-w-md mx-auto flex flex-col items-center justify-center my-auto py-2">
        {/* Stacked Vertical Couple Names — Frameless & Elegant */}
        <div className="flex flex-col items-center justify-center w-full text-center my-2 py-2">
          <CharReveal
            text={couple.groom.nickname}
            className="text-6xl md:text-7xl text-gold-gradient font-script text-center font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] leading-tight py-1"
            delay={0.4}
          />
          <motion.span
            className="text-3xl md:text-4xl text-[#C8A96B] font-serif my-1 leading-none font-bold drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]"
            style={{ fontFamily: "var(--font-heading)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            &amp;
          </motion.span>
          <CharReveal
            text={couple.bride.nickname}
            className="text-6xl md:text-7xl text-gold-gradient font-script text-center font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] leading-tight py-1"
            delay={0.6}
          />
        </div>

        {/* Date, Time & Venue Info above Countdown */}
        <AnimatedText delay={0.8} variant="scaleUp" className="w-full text-center my-3 space-y-1">
          <p
            className="text-base md:text-lg font-extrabold text-[#1A1815] text-center font-serif leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Sabtu, 10 Oktober 2026
          </p>
          <p className="text-xs text-[#8A6B35] font-extrabold tracking-wide text-center">
            08:00 WIB — Selesai
          </p>
          <p className="text-xs uppercase tracking-[2px] text-[#B8860B] font-extrabold text-center">
            📍 BALAI IKABAMA
          </p>
        </AnimatedText>

        {/* Countdown Card Frame */}
        <AnimatedText delay={1.0} variant="scaleUp" className="w-full flex justify-center mt-1">
          <div className="gold-card-pro p-3.5 border border-[#C8A96B] shadow-2xl w-full max-w-sm text-center">
            <Countdown targetDate={weddingData.weddingDate} />
          </div>
        </AnimatedText>
      </div>

      {/* BOTTOM GROUP: Scroll Down Indicator */}
      <div className="relative z-20 w-full flex flex-col items-center pb-1">
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          <span className="text-[#8A6B35] text-[9px] uppercase tracking-[3px] font-bold">
            Scroll Down
          </span>
          <motion.div
            className="w-[1.5px] h-6 bg-[#C8A96B] origin-top rounded-full shadow-[0_0_8px_#C8A96B]"
            animate={{ scaleY: [0, 1, 0], y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
