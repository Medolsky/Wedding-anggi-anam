"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { scrollToSection } from "@/lib/utils";

export function FooterSection() {
  const { footer, sectionBgs } = weddingData;

  return (
    <section
      id="footer"
      data-section="footer"
      className="section-footer relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#faf8f5] text-[#2a2723]"
    >
      {/* Closing Background Photo — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.footer}')`,
            filter: "brightness(0.92) contrast(1.02)",
          }}
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 10, ease: "linear" }}
        />
        <div className="absolute inset-0 photo-overlay-cinematic" />
        <div className="absolute inset-0 film-grain" />
      </div>

      {/* Falling petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[#d4af37] opacity-40"
            style={{
              left: `${8 + i * 12}%`,
              top: "-5%",
              fontSize: "14px",
            }}
            animate={{
              y: ["0vh", "110vh"],
              rotate: [0, 360 + i * 60],
              x: [0, (i % 2 ? 30 : -30)],
            }}
            transition={{
              duration: 14 + i * 2.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5,
            }}
          >
            🌸
          </motion.div>
        ))}
      </div>

      <div className="relative z-20 max-w-md mx-auto px-6 w-full text-center flex flex-col items-center justify-center">
        {/* Ornament */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-5"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8 }}
        >
          <span className="ornament-line" />
          <span className="ornament-dot" />
          <span className="ornament-line" />
        </motion.div>

        {/* Thank you message */}
        <AnimatedText delay={0.2} variant="fadeUp" className="w-full text-center">
          <p
            className="text-base md:text-lg leading-relaxed opacity-95 mb-5 whitespace-pre-line font-serif text-[#2a2723] text-center font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {footer.message}
          </p>
        </AnimatedText>

        {/* Closing */}
        <AnimatedText delay={0.3} variant="fadeUp" className="w-full text-center">
          <p
            className="text-[10px] uppercase tracking-[3px] text-[#b8860b] mb-2 text-center font-bold leading-none"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {footer.closing}
          </p>
        </AnimatedText>

        {/* Couple names — signature style */}
        <AnimatedText delay={0.5} variant="maskReveal" className="w-full text-center">
          <h3
            className="text-5xl md:text-6xl mb-5 text-gold-gradient font-script text-center font-bold drop-shadow-md leading-tight"
            style={{ fontFamily: "var(--font-script)" }}
          >
            {weddingData.couple.groom.nickname} &{" "}
            {weddingData.couple.bride.nickname}
          </h3>
        </AnimatedText>

        {/* Hashtag */}
        <AnimatedText delay={0.7} variant="scaleUp" className="w-full text-center">
          <p className="text-[11px] uppercase tracking-[4px] text-[#8a662d] font-extrabold mb-8 text-center leading-none">
            {footer.hashtag}
          </p>
        </AnimatedText>

        {/* Ornament line */}
        <motion.div
          className="w-[1px] h-10 bg-gradient-to-b from-[#d4af37] to-transparent mx-auto mb-5"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />

        {/* Copyright */}
        <AnimatedText delay={0.9} variant="fadeUp" className="w-full text-center">
          <div className="opacity-80 text-[10px] uppercase tracking-[2.5px] space-y-1 text-center text-[#66615c] font-medium">
            <p>© {footer.year} Wedding Invitation</p>
            <p>Made with ❤️</p>
          </div>
        </AnimatedText>

        {/* Back to top */}
        <motion.button
          className="mt-6 mx-auto flex flex-col items-center justify-center gap-1 text-[#b8860b] hover:text-[#d4af37] transition-colors"
          onClick={() => scrollToSection("home")}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 1.0 }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </motion.div>
          <span className="text-[8px] uppercase tracking-[2.5px] font-extrabold">
            Kembali ke atas
          </span>
        </motion.button>
      </div>
    </section>
  );
}
