"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";
import { useInvitationStore } from "@/stores/invitationStore";
import { AnimatedText } from "@/components/ui/AnimatedText";

export function GallerySection() {
  const setLightboxIndex = useInvitationStore((s) => s.setLightboxIndex);
  const { gallery, sectionBgs } = weddingData;

  return (
    <section
      id="gallery"
      data-section="gallery"
      className="section-gallery relative py-20 md:py-28 overflow-hidden flex flex-col items-center justify-center text-center bg-[#0E0E0F] text-[#C8C5BE]"
    >
      {/* Background Image — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.gallery}')`,
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

      <div className="relative z-20 max-w-lg mx-auto px-6 w-full text-center flex flex-col items-center justify-center">
        {/* Section header frame card */}
        <AnimatedText delay={0} variant="fadeUp" className="w-full flex justify-center mb-10">
          <div className="gold-card-pro p-4 md:p-5 border border-[#806A42] shadow-xl rounded-2xl w-full max-w-xs text-center flex flex-col items-center justify-center">
            <p
              className="text-xs uppercase tracking-[5px] text-[#C8A96B] font-extrabold mb-1.5 text-center"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Our Moments
            </p>

            <h2
              className="text-3xl md:text-4xl text-center font-serif text-[#F5F1E8] font-bold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Galeri Foto
            </h2>
          </div>
        </AnimatedText>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {gallery.map((item, index) => (
            <motion.div
              key={item.id}
              className={`relative rounded-2xl overflow-hidden cursor-pointer group shadow-2xl border-2 border-[#806A42] bg-[#171719]
                ${item.orientation === "portrait" ? "row-span-2" : ""}`}
              style={{
                aspectRatio:
                  item.orientation === "portrait" ? "3/4" : "4/3",
              }}
              initial={{ opacity: 0, y: 35, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: (index % 4) * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => setLightboxIndex(index)}
              whileHover={{ scale: 1.03 }}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-300 flex items-center justify-center">
                <motion.div
                  className="text-[#E0C98F] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/75 p-2.5 rounded-full border border-[#C8A96B] shadow-md"
                  initial={false}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
