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
      className="section-story relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#0E0E0F] text-[#C8C5BE]"
    >
      {/* Background Image — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.story}')`,
            filter: "brightness(0.92) contrast(1.02)",
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
          <div className="gold-card-pro p-4 md:p-5 border border-[#806A42] shadow-xl rounded-2xl w-full max-w-xs text-center flex flex-col items-center justify-center">
            <p
              className="text-[10px] uppercase tracking-[4px] text-[#C8A96B] font-extrabold mb-1.5 text-center leading-none"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Our Journey
            </p>

            <h2
              className="text-2xl md:text-3xl text-center font-serif text-[#F5F1E8] font-bold leading-snug"
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
            className="absolute left-[17px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#E0C98F] via-[#C8A96B] to-transparent origin-top"
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
                    className="w-9 h-9 rounded-full bg-[#171719] border-2 border-[#C8A96B]
                      flex items-center justify-center shadow-[0_0_10px_rgba(200,169,107,0.4)]"
                    whileInView={{ scale: [0, 1.2, 1] }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E0C98F]" />
                  </motion.div>
                </div>

                {/* Card Frame */}
                <div className="gold-card-pro p-4 border border-[#806A42] flex-1 shadow-xl rounded-2xl">
                  <span
                    className="inline-block text-[9px] font-extrabold uppercase tracking-[2px] text-[#0E0E0F] bg-gradient-to-r from-[#E0C98F] via-[#C8A96B] to-[#8A6B35] px-2.5 py-0.5 rounded-full mb-2 shadow-xs leading-none"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {story.year}
                  </span>

                  <h3
                    className="text-base md:text-lg font-serif mb-1.5 font-bold text-[#F5F1E8] leading-snug"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {story.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-[#C8C5BE] font-medium mb-3">
                    {story.description}
                  </p>

                  <motion.div
                    className="w-full h-36 md:h-40 rounded-xl overflow-hidden shadow-md border border-[#806A42]/60 group"
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
