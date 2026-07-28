"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";
import { AnimatedText, CharReveal } from "@/components/ui/AnimatedText";

export function GroomSection() {
  const { groom } = weddingData.couple;
  const { sectionBgs } = weddingData;

  return (
    <section
      id="groom"
      data-section="groom"
      className="section-groom relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden py-18 md:py-24 bg-[#faf8f5] text-[#2a2723] transform-gpu"
    >
      {/* Background Image from Unsplash — Clear & Vivid */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transform-gpu"
          style={{
            backgroundImage: `url('${sectionBgs.groom}')`,
            filter: "brightness(0.85) contrast(1.05)",
          }}
        />
        <div className="absolute inset-0 photo-overlay-cinematic" />
        <div className="absolute inset-0 film-grain" />
      </div>

      <div className="relative z-20 w-full max-w-md mx-auto px-6 text-center flex flex-col items-center justify-center">
        {/* Section label */}
        <AnimatedText delay={0.1} variant="fadeUp" className="w-full text-center">
          <p
            className="text-[10px] uppercase tracking-[4px] text-[#b8860b] font-bold mb-1.5 text-center leading-none"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The Groom
          </p>
        </AnimatedText>

        <AnimatedText delay={0.2} variant="fadeUp" className="w-full text-center">
          <h2
            className="text-2xl md:text-4xl uppercase tracking-[2.5px] text-[#2a2723] font-serif mb-5 text-center leading-snug"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Mempelai Pria
          </h2>
        </AnimatedText>

        {/* Groom Photo Card Frame */}
        <motion.div
          className="relative w-48 h-60 md:w-56 md:h-70 mx-auto mb-5 rounded-2xl overflow-hidden shadow-[0_12px_35px_rgba(212,175,55,0.2)] border-2 border-[#d4af37]/50 group transform-gpu"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <img
            src={groom.photo}
            alt={groom.fullName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-2 border border-white/20 rounded-xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        </motion.div>

        {/* Name */}
        <div className="text-center w-full mb-2">
          <CharReveal
            text={groom.fullName}
            className="text-2xl md:text-3xl text-gold-gradient font-serif text-center font-bold leading-tight"
            delay={0.3}
          />
        </div>

        {/* Ornament */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span className="ornament-line" />
          <span className="ornament-dot" />
          <span className="ornament-line" />
        </motion.div>

        {/* Parents Card Frame */}
        <AnimatedText delay={0.5} variant="fadeUp" className="w-full flex justify-center">
          <div className="gold-card-pro p-4 border border-[#d4af37]/40 text-center w-full max-w-xs shadow-xl">
            <p
              className="text-center text-xs md:text-sm text-[#2a2723] font-medium leading-relaxed font-serif mb-1"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {groom.parents}
            </p>
            <p className="text-center text-[10px] text-[#b8860b] italic opacity-90 leading-normal">
              "{groom.description}"
            </p>
          </div>
        </AnimatedText>

        {/* Instagram Button */}
        <AnimatedText delay={0.6} variant="scaleUp" className="mt-4 w-full flex justify-center">
          <a
            href={`https://instagram.com/${groom.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-modern-primary text-[10px] py-2 px-5 rounded-full shadow-lg flex items-center justify-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            {groom.instagram}
          </a>
        </AnimatedText>
      </div>
    </section>
  );
}
