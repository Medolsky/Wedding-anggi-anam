"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";
import { AnimatedText } from "@/components/ui/AnimatedText";

export function StorySection() {
  const { loveStory, sectionBgs } = weddingData;

  return (
    <section
      id="story"
      data-section="story"
      className="section-story relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#faf8f5] text-[#2a2723]"
    >
      {/* Background Image from Unsplash — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.story}')`,
            filter: "brightness(0.85) contrast(1.05)",
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
        {/* Section header frame card */}
        <AnimatedText delay={0} variant="fadeUp" className="w-full flex justify-center mb-8">
          <div className="gold-card-pro p-4 md:p-5 border border-[#d4af37]/40 shadow-xl rounded-2xl w-full max-w-xs text-center flex flex-col items-center justify-center">
            <p
              className="text-[10px] uppercase tracking-[4px] text-[#b8860b] font-bold mb-1.5 text-center leading-none"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Our Journey
            </p>

            <h2
              className="text-2xl md:text-3xl text-center font-serif text-[#2a2723] drop-shadow-sm leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Kisah Cinta
            </h2>
          </div>
        </AnimatedText>

        {/* Timeline */}
        <div className="relative w-full">
          {/* Vertical timeline line */}
          <motion.div
            className="absolute left-[17px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#d4af37] via-[#c5a059] to-transparent origin-top"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />

          {/* Timeline items */}
          <div className="space-y-6 w-full">
            {loveStory.map((story, index) => (
              <motion.div
                key={index}
                className="relative flex gap-3.5 text-left"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Timeline dot */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    className="w-9 h-9 rounded-full bg-white border-2 border-[#d4af37]
                      flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                    whileInView={{ scale: [0, 1.2, 1] }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
                  </motion.div>
                </div>

                {/* Card Frame */}
                <div className="gold-card-pro p-4 border border-[#d4af37]/40 flex-1 shadow-xl rounded-2xl">
                  <span
                    className="inline-block text-[9px] font-extrabold uppercase tracking-[2px] text-white bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-2 py-0.5 rounded-full mb-1.5 shadow-xs leading-none"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {story.year}
                  </span>

                  <h3
                    className="text-sm md:text-base font-serif mb-1 font-bold text-[#2a2723] leading-snug"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {story.title}
                  </h3>

                  <p className="text-[11px] leading-relaxed text-[#66615c] mb-2.5">
                    {story.description}
                  </p>

                  <motion.div
                    className="w-full h-32 md:h-36 rounded-xl overflow-hidden shadow-md border border-white/15 group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={story.photo}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
