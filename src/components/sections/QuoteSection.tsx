"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { SectionDivider } from "@/components/ui/SectionDivider";

export function QuoteSection() {
  const { quote, sectionBgs } = weddingData;

  return (
    <section
      id="quote"
      data-section="quote"
      className="section-quote relative py-20 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#faf8f5] text-[#2a2723] transform-gpu"
    >
      {/* Unsplash Background Photo — Clear & Vivid */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transform-gpu"
          style={{
            backgroundImage: `url('${sectionBgs.quote}')`,
            filter: "brightness(0.85) contrast(1.05)",
          }}
        />
        <div className="absolute inset-0 photo-overlay-cinematic" />
        <div className="absolute inset-0 film-grain" />
      </div>

      {/* Decorative corner ornaments */}
      <motion.div
        className="absolute top-6 left-6 w-10 h-10 opacity-50 z-20"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.5, scale: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L0 40C0 20 20 0 40 0L0 0Z" stroke="#d4af37" strokeWidth="1.5" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-6 right-6 w-10 h-10 opacity-50 rotate-180 z-20"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.5, scale: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L0 40C0 20 20 0 40 0L0 0Z" stroke="#d4af37" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Content */}
      <div className="relative z-20 max-w-md mx-auto px-6 text-center flex flex-col items-center justify-center w-full">
        {/* Opening quote mark */}
        <AnimatedText delay={0.1} variant="scaleUp" className="flex justify-center w-full">
          <div
            className="text-4xl text-[#d4af37] opacity-90 mb-1 leading-none text-center font-serif"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            ❝
          </div>
        </AnimatedText>

        {/* Quote Title */}
        {quote.title && (
          <AnimatedText delay={0.15} variant="fadeUp" className="w-full text-center mb-3">
            <h3
              className="text-xl md:text-2xl text-gold-gradient font-serif italic font-bold leading-snug text-center"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              "{quote.title}"
            </h3>
          </AnimatedText>
        )}

        {/* Quote Card Frame */}
        <motion.div
          className="gold-card-pro p-5 md:p-6 border border-[#d4af37]/40 shadow-2xl w-full my-2 text-center transform-gpu"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="space-y-3.5 text-center">
            {quote.text.split("\n\n").map((para, idx) => (
              <p
                key={idx}
                className="text-xs md:text-sm leading-relaxed text-[#2a2723] text-center font-normal"
              >
                {para}
              </p>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-5 mb-3">
            <span className="ornament-line" />
            <span className="ornament-dot" />
            <span className="ornament-line" />
          </div>

          <p
            className="text-[10px] tracking-[2.5px] uppercase font-bold text-[#b8860b] text-center leading-relaxed italic font-serif"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {quote.source}
          </p>
        </motion.div>
      </div>

      <SectionDivider variant="ornament" className="mt-6 relative z-20" />
    </section>
  );
}
