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
      className="section-quote relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#FAF8F5] text-[#1A1815]"
    >
      {/* Background Image — Clear & Vivid Photo */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.quote}')`,
            filter: "brightness(0.95) contrast(1.02)",
          }}
          initial={{ scale: 1.15 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 10, ease: "linear" }}
        />
        <div className="absolute inset-0 photo-overlay-cinematic" />
        <div className="absolute inset-0 film-grain" />
      </div>

      <div className="relative z-20 max-w-md mx-auto px-6 w-full text-center flex flex-col items-center justify-center">
        {/* Card Frame containing Quote & Quranic Verse */}
        <AnimatedText delay={0} variant="fadeUp" className="w-full flex justify-center">
          <div className="gold-card-pro p-6 md:p-8 border border-[#C8A96B] shadow-2xl rounded-2xl w-full text-center flex flex-col items-center justify-center">
            {/* Top ornament */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="ornament-line" />
              <span className="ornament-dot" />
              <span className="ornament-line" />
            </div>

            {/* Arabic Quranic Text */}
            <p
              className="text-xl md:text-2xl text-[#C8A96B] font-serif mb-4 leading-loose font-bold text-center"
              style={{ fontFamily: "var(--font-heading)" }}
              dir="rtl"
            >
              وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
            </p>

            {/* Indonesian Translation Quote */}
            <blockquote
              className="text-xs md:text-sm leading-relaxed text-[#1A1815] font-serif font-medium mb-4 italic opacity-95 text-center"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              "{quote.text}"
            </blockquote>

            {/* Source */}
            <cite className="text-[10px] uppercase tracking-[3px] text-[#B8860B] font-extrabold not-italic text-center block leading-none">
              — {quote.source} —
            </cite>
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
          className="gold-card-pro p-5 md:p-6 border border-[#806A42] shadow-2xl w-full my-2 text-center transform-gpu"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="space-y-3.5 text-center">
            {quote.text.split("\n\n").map((para, idx) => (
              <p
                key={idx}
                className="text-xs md:text-sm leading-relaxed text-[#F5F1E8] font-medium text-center"
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
            className="text-[10px] tracking-[2.5px] uppercase font-extrabold text-[#D2B573] text-center leading-relaxed italic font-serif"
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
