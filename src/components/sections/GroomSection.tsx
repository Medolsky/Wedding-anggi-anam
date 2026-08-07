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
      className="section-groom relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden py-18 md:py-24 bg-[#FAF8F5] text-[#1A1815] transform-gpu"
    >
      {/* Background Image — Clear & Vivid */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transform-gpu"
          style={{
            backgroundImage: `url('${sectionBgs.groom}')`,
            filter: "brightness(0.95) contrast(1.02)",
          }}
        />
        <div className="absolute inset-0 photo-overlay-cinematic" />
        <div className="absolute inset-0 film-grain" />
      </div>

      <div className="relative z-20 w-full max-w-md mx-auto px-6 text-center flex flex-col items-center justify-center">
        {/* Section label */}
        <AnimatedText delay={0.1} variant="fadeUp" className="w-full text-center mb-2">
          <span
            className="inline-block bg-gradient-to-r from-[#C8A96B] via-[#B8860B] to-[#8A6B35] text-white text-[10px] md:text-xs font-black uppercase tracking-[4px] px-4 py-1 rounded-full shadow-md"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The Groom
          </span>
        </AnimatedText>

        <AnimatedText delay={0.2} variant="fadeUp" className="w-full text-center">
          <h2
            className="text-3xl md:text-5xl uppercase tracking-[3px] text-[#1A1815] font-serif mb-5 text-center leading-snug font-black"
            style={{
              fontFamily: "var(--font-heading)",
              textShadow: "0 0 16px #ffffff, 0 0 10px #ffffff, 0 0 4px #ffffff, 0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            Mempelai Pria
          </h2>
        </AnimatedText>

        {/* Unified Card Frame containing Photo, Name, Parents & Ig */}
        <div className="gold-card-pro p-5 md:p-6 border border-[#C8A96B] shadow-2xl w-full max-w-sm text-center flex flex-col items-center">
          {/* Groom Photo Frame */}
          <motion.div
            className="relative w-44 h-56 md:w-52 md:h-64 mx-auto mb-4 rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(200,169,107,0.25)] border-2 border-[#C8A96B] group transform-gpu"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src={groom.photo}
              alt={groom.fullName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-1.5 border border-white/40 rounded-xl pointer-events-none" />
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
          <div className="flex items-center justify-center gap-3 my-2">
            <span className="ornament-line" />
            <span className="ornament-dot" />
            <span className="ornament-line" />
          </div>

          {/* Parents & Description */}
          <p
            className="text-center text-xs md:text-sm text-[#1A1815] font-semibold leading-relaxed font-serif mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {groom.parents}
          </p>
          {groom.description && (
            <p className="text-center text-[10px] text-[#8A6B35] font-semibold italic opacity-95 leading-normal mb-3">
              "{groom.description}"
            </p>
          )}

          {/* Instagram Button */}
          <a
            href={`https://instagram.com/${groom.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-modern-primary text-[10px] py-2 px-5 rounded-full shadow-lg flex items-center justify-center gap-1.5 mt-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            {groom.instagram}
          </a>
        </div>
      </div>
    </section>
  );
}
