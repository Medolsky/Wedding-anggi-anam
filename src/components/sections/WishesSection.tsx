"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { formatRelativeTime } from "@/lib/utils";
import { weddingData } from "@/data/weddingData";

interface WishItem {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export function WishesSection() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { sectionBgs } = weddingData;

  // Load wishes from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("wedding_wishes") || "[]");
    setWishes(stored);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newWish: WishItem = {
        id: Date.now().toString(),
        name: name.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newWish, ...wishes];
      setWishes(updated);
      localStorage.setItem("wedding_wishes", JSON.stringify(updated));

      setName("");
      setMessage("");
      setIsSubmitting(false);
    }, 800);
  }

  const displayedWishes = showAll ? wishes : wishes.slice(0, 5);

  return (
    <section
      id="wishes"
      data-section="wishes"
      className="section-wishes relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#1c0a08] text-white"
    >
      {/* Background Image from Unsplash — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.wishes}')`,
            filter: "brightness(0.6) contrast(1.05)",
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
        {/* Section header */}
        <AnimatedText delay={0} variant="fadeUp" className="w-full text-center">
          <p
            className="text-[10px] uppercase tracking-[4px] text-[#d4af37] font-bold mb-1.5 text-center leading-none"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Wishes & Prayers
          </p>
        </AnimatedText>

        <AnimatedText delay={0.1} variant="scaleUp" className="w-full text-center">
          <h2
            className="text-2xl md:text-3xl text-center mb-2 font-serif text-white drop-shadow-sm leading-snug"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Ucapan & Doa
          </h2>
        </AnimatedText>

        <AnimatedText delay={0.2} variant="fadeUp" className="w-full text-center">
          <p className="text-center text-xs opacity-90 mb-6 leading-relaxed text-white/90">
            Berikan ucapan dan doa terbaik Anda untuk kedua mempelai.
          </p>
        </AnimatedText>

        {/* Form Card Frame */}
        <motion.form
          onSubmit={handleSubmit}
          className="gold-card-pro p-4 md:p-5 border border-[#d4af37]/40 shadow-2xl space-y-3 mb-6 w-full max-w-xs text-center flex flex-col items-center rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input text-center py-1.5 text-xs"
            placeholder="Nama Anda"
            maxLength={100}
            required
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="form-input form-textarea text-center py-1.5 text-xs"
            placeholder="Tuliskan ucapan dan doa Anda..."
            maxLength={500}
            required
          />
          <motion.button
            type="submit"
            className="btn-modern-primary w-full py-2 rounded-full text-[10px] uppercase tracking-[1.5px] font-bold shadow-md mt-1"
            disabled={isSubmitting || !name.trim() || !message.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Ucapan"}
          </motion.button>
        </motion.form>

        {/* Wishes list */}
        <div className="space-y-2.5 w-full max-w-xs text-center">
          <AnimatePresence>
            {displayedWishes.map((wish, index) => (
              <motion.div
                key={wish.id}
                className="gold-card-pro p-3 border border-[#d4af37]/30 shadow-md text-left w-full rounded-xl"
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#d4af37] text-black 
                      flex items-center justify-center text-[10px] font-bold shadow-xs">
                      {wish.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white leading-none">{wish.name}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#d4af37] font-mono">
                    {formatRelativeTime(wish.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed pl-8">
                  {wish.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load more */}
          {wishes.length > 5 && !showAll && (
            <motion.button
              className="w-full py-2 text-[11px] uppercase tracking-widest font-bold text-[#d4af37] hover:underline transition-all"
              onClick={() => setShowAll(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Lihat {wishes.length - 5} ucapan lainnya...
            </motion.button>
          )}

          {wishes.length === 0 && (
            <p className="text-center text-xs text-white/70 py-3 italic font-medium">
              Jadilah yang pertama memberikan ucapan! 💕
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
