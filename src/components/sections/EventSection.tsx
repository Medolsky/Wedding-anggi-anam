"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { weddingData } from "@/data/weddingData";
import { AnimatedText, StaggerContainer, StaggerItem } from "@/components/ui/AnimatedText";
import { downloadICS, copyToClipboard } from "@/lib/utils";

export function EventSection() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { sectionBgs } = weddingData;

  async function handleCopyAddress(address: string, eventId: string) {
    const success = await copyToClipboard(address);
    if (success) {
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <section
      id="event"
      data-section="event"
      className="section-event relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#0E0E0F] text-[#C8C5BE] transform-gpu"
    >
      {/* Background Image — Clear & Vivid */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transform-gpu"
          style={{
            backgroundImage: `url('${sectionBgs.event}')`,
            filter: "brightness(0.92) contrast(1.02)",
          }}
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
              Save The Date
            </p>

            <h2
              className="text-2xl md:text-3xl text-center font-serif text-[#F5F1E8] font-bold leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Acara Pernikahan
            </h2>
          </div>
        </AnimatedText>

        {/* Event cards */}
        <StaggerContainer delay={0.2} staggerDelay={0.2} className="space-y-5 w-full">
          {weddingData.events.map((event) => {
            const ev = event as {
              id: string;
              type: string;
              title: string;
              date: string;
              startTime: string;
              endTime: string;
              akadTime?: string;
              resepsiTime?: string;
              venue: string;
              address: string;
              latitude: number;
              longitude: number;
              mapsUrl: string;
              dressCode?: string;
              photo: string;
            };
            return (
              <StaggerItem key={ev.id}>
                <motion.div
                  className="gold-card-pro overflow-hidden shadow-2xl border border-[#806A42] text-center w-full rounded-2xl transform-gpu"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Event Photo Header */}
                  <div className="relative h-44 md:h-48 w-full overflow-hidden">
                    <img
                      src={ev.photo}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#171719]/90 via-[#09090A]/30 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                      <span className="text-base md:text-lg font-bold tracking-wide font-serif text-[#F5F1E8] drop-shadow-md">
                        {ev.title}
                      </span>
                      <span className="text-[10px] bg-gradient-to-r from-[#E0C98F] via-[#C8A96B] to-[#8A6B35] text-[#0E0E0F] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                        {ev.type}
                      </span>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-4 text-center flex flex-col items-center justify-center">
                    <div className="space-y-3 mb-4 text-xs w-full text-center">
                      {/* Date */}
                      <div className="flex items-center justify-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C8A96B" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="font-bold text-sm text-[#F5F1E8]">{ev.date}</span>
                      </div>

                      {/* Time Breakdown if akadTime and resepsiTime exist */}
                      {ev.akadTime && ev.resepsiTime ? (
                        <div className="grid grid-cols-2 gap-2 my-2 w-full">
                          <div className="bg-[#C8A96B]/15 rounded-xl p-2.5 text-center border border-[#806A42] shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-[#E0C98F] tracking-wider mb-0.5">
                              Akad Nikah
                            </p>
                            <p className="text-xs font-semibold text-[#F5F1E8]">
                              {ev.akadTime}
                            </p>
                          </div>
                          <div className="bg-[#C8A96B]/15 rounded-xl p-2.5 text-center border border-[#806A42] shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-[#E0C98F] tracking-wider mb-0.5">
                              Resepsi
                            </p>
                            <p className="text-xs font-semibold text-[#F5F1E8]">
                              {ev.resepsiTime}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A96B" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="text-[#C8C5BE] font-medium">
                            {ev.startTime} — {ev.endTime}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex flex-col items-center justify-center gap-0.5 pt-1.5 border-t border-[#806A42]/40">
                        <div className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A96B" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <p className="font-bold text-xs md:text-sm text-[#F5F1E8]">{ev.venue}</p>
                        </div>
                        <p className="text-[#C8C5BE] text-[10px] max-w-xs text-center leading-relaxed">{ev.address}</p>
                      </div>

                      {ev.dressCode && (
                        <div className="pt-1.5 border-t border-[#806A42]/40 text-center">
                          <span className="text-[10px] text-[#8C8983]">
                            Dress Code: <strong className="text-[#E0C98F] font-semibold">{ev.dressCode}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 w-full pt-1.5 border-t border-[#806A42]/40">
                      <a
                        href={ev.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-modern-primary w-full py-2 px-3 text-[10px] font-bold shadow-md flex items-center justify-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        Google Maps Location
                      </a>

                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => downloadICS(ev)}
                          className="btn-modern-secondary flex-1 py-1.5 px-2 text-[10px] font-semibold flex items-center justify-center gap-1"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Simpan Tanggal
                        </button>

                        <button
                          onClick={() =>
                            handleCopyAddress(
                              `${ev.venue}, ${ev.address}`,
                              ev.id
                            )
                          }
                          className="btn-modern-secondary flex-1 py-1.5 px-2 text-[10px] font-semibold flex items-center justify-center gap-1"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                          </svg>
                          {copiedId === ev.id ? "Tersalin" : "Salin Alamat"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
