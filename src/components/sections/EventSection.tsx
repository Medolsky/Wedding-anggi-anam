"use client";

import { motion } from "framer-motion";
import { weddingData } from "@/data/weddingData";
import { AnimatedText } from "@/components/ui/AnimatedText";

export function EventSection() {
  const { events, sectionBgs } = weddingData;
  const event = events[0];

  return (
    <section
      id="event"
      data-section="event"
      className="section-event relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#FAF8F5] text-[#1A1815]"
    >
      {/* Background Photo — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.event}')`,
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
        {/* Section header frame card */}
        <AnimatedText delay={0} variant="fadeUp" className="w-full flex justify-center mb-6">
          <div className="gold-card-pro p-4 md:p-5 border border-[#C8A96B] shadow-xl rounded-2xl w-full max-w-xs text-center flex flex-col items-center justify-center">
            <p
              className="text-[10px] uppercase tracking-[4px] text-[#B8860B] font-extrabold mb-1.5 text-center leading-none"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Wedding Agenda
            </p>

            <h2
              className="text-2xl md:text-3xl text-center font-serif text-[#1A1815] font-bold leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Rangkaian Acara
            </h2>
          </div>
        </AnimatedText>

        {/* Unified Main Event Card */}
        <AnimatedText delay={0.2} variant="fadeUp" className="w-full flex justify-center">
          <div className="gold-card-pro p-5 md:p-6 border-2 border-[#C8A96B] shadow-2xl rounded-2xl w-full max-w-sm text-center flex flex-col items-center justify-center">
            {/* Top Date Header */}
            <div className="w-full border-b border-[#C8A96B]/40 pb-4 mb-5 text-center">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-[3px] text-[#B8860B] bg-[#C8A96B]/15 px-3 py-1 rounded-full mb-2 border border-[#C8A96B]">
                SABTU, 10 OKTOBER 2026
              </span>
              <p
                className="text-xl md:text-2xl font-serif font-bold text-[#1A1815] text-center leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Hari Bahagia Kami
              </p>
            </div>

            {/* Combined Sessions Breakdown: Akad Nikah & Resepsi */}
            <div className="w-full grid grid-cols-2 gap-3 mb-5">
              {/* Akad Nikah Box */}
              <div className="bg-white/90 p-3.5 rounded-xl border border-[#C8A96B] shadow-sm flex flex-col items-center text-center">
                <div className="w-7 h-7 rounded-full bg-[#C8A96B]/20 border border-[#C8A96B] flex items-center justify-center text-sm mb-1.5">
                  💍
                </div>
                <h3
                  className="text-sm font-serif font-bold text-[#1A1815] mb-1 leading-snug text-center"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Akad Nikah
                </h3>
                <p className="text-[11px] font-bold text-[#B8860B]">08:00 - 10:00 WIB</p>
                <p className="text-[9.5px] text-[#66615C] mt-1 font-medium">Khusus Keluarga &amp; Kerabat</p>
              </div>

              {/* Resepsi Box */}
              <div className="bg-white/90 p-3.5 rounded-xl border border-[#C8A96B] shadow-sm flex flex-col items-center text-center">
                <div className="w-7 h-7 rounded-full bg-[#C8A96B]/20 border border-[#C8A96B] flex items-center justify-center text-sm mb-1.5">
                  🥂
                </div>
                <h3
                  className="text-sm font-serif font-bold text-[#1A1815] mb-1 leading-snug text-center"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Resepsi
                </h3>
                <p className="text-[11px] font-bold text-[#B8860B]">13:00 - 17:00 WIB</p>
                <p className="text-[9.5px] text-[#66615C] mt-1 font-medium">Tamu Undangan VIP &amp; Umum</p>
              </div>
            </div>

            {/* Venue & Location Section */}
            <div className="w-full border-t border-[#C8A96B]/40 pt-4 mb-4 text-center flex flex-col items-center">
              <div className="flex items-center justify-center gap-1.5 text-[#B8860B] mb-1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span className="text-[11px] font-extrabold uppercase tracking-[2px]">Lokasi Acara</span>
              </div>

              <p
                className="text-lg md:text-xl font-serif font-bold text-[#1A1815] text-center leading-snug mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                BALAI IKABAMA
              </p>

              <p className="text-xs text-[#66615C] leading-relaxed text-center mb-3.5 max-w-xs font-medium">
                {event.address}
              </p>

              {/* Real Venue Location Image */}
              <div className="w-full h-36 md:h-40 rounded-xl overflow-hidden shadow-md border border-[#C8A96B] mb-4 relative group">
                <img
                  src="/image/balai1.png"
                  alt="Balai Ikabama Venue Location"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-2 left-2 right-2 text-[9.5px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-xs text-center border border-white/20">
                  BALAI IKABAMA — Gedung Pernikahan
                </span>
              </div>
            </div>

            {/* Action Buttons: Google Maps & Add to Calendar */}
            <div className="w-full flex flex-col gap-2 pt-1">
              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-modern-primary text-[11px] py-2.5 w-full font-bold shadow-md text-center flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span>Buka Google Maps</span>
              </a>

              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Wedding+Anam+%26+Anggi&dates=20261010T010000Z/20261010T100000Z&details=Pernikahan+Anam+%26+Anggi+di+BALAI+IKABAMA&location=BALAI+IKABAMA`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-modern-secondary text-[11px] py-2 w-full font-bold text-center flex items-center justify-center gap-2"
              >
                <span>📅 Simpan ke Google Calendar</span>
              </a>
            </div>
          </div>
        </AnimatedText>
      </div>
    </section>
  );
}
