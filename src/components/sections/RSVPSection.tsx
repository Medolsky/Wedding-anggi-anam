"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { useInvitationStore } from "@/stores/invitationStore";
import { weddingData } from "@/data/weddingData";

type AttendanceStatus = "hadir" | "tidak_hadir" | null;

interface RSVPFormData {
  name: string;
  attendance: AttendanceStatus;
  guestCount: number;
  session: string;
  phone: string;
  message: string;
}

export function RSVPSection() {
  const guest = useInvitationStore((s) => s.guest);
  const rsvpSubmitted = useInvitationStore((s) => s.rsvpSubmitted);
  const setRsvpSubmitted = useInvitationStore((s) => s.setRsvpSubmitted);
  const { sectionBgs } = weddingData;

  const [formData, setFormData] = useState<RSVPFormData>({
    name: "",
    attendance: null,
    guestCount: 1,
    session: "keduanya",
    phone: "",
    message: "",
  });

  // Pre-fill name when guest data loads from URL
  useEffect(() => {
    if (guest.name && guest.name !== "Tamu Undangan") {
      setFormData((prev) => ({ ...prev, name: guest.name }));
    }
  }, [guest.name]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxGuest = guest.maxGuest || 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.attendance || !formData.name) return;

    setIsSubmitting(true);

    const rsvpItem = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      pax: formData.guestCount,
      status: formData.attendance === "hadir" ? "Hadir" : "Tidak Hadir",
      notes: formData.message || (formData.attendance === "hadir" ? `Hadir Sesi: ${formData.session}` : "Halangan Hadir"),
      createdAt: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Save to Cloud DB
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: "rsvps",
          item: rsvpItem,
        }),
      });
    } catch {
      // Fallback
    }

    // Save to LocalStorage fallback
    const existingRsvps = JSON.parse(
      localStorage.getItem("wedding_rsvps") || "[]"
    );
    existingRsvps.unshift(rsvpItem);
    localStorage.setItem("wedding_rsvps", JSON.stringify(existingRsvps));

    setIsSubmitting(false);
    setRsvpSubmitted(true);
  }

  return (
    <section
      id="rsvp"
      data-section="rsvp"
      className="section-rsvp relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#1c0a08] text-white"
    >
      {/* Background Image from Unsplash — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.rsvp}')`,
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
            Confirmation
          </p>
        </AnimatedText>

        <AnimatedText delay={0.1} variant="scaleUp" className="w-full text-center">
          <h2
            className="text-2xl md:text-3xl text-center mb-2 font-serif text-white drop-shadow-sm leading-snug"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Konfirmasi Kehadiran
          </h2>
        </AnimatedText>

        <AnimatedText delay={0.2} variant="fadeUp" className="w-full text-center">
          <p className="text-center text-xs opacity-90 mb-6 leading-relaxed text-white/90">
            Mohon konfirmasi kehadiran Anda agar kami dapat mempersiapkan
            segalanya dengan baik.
          </p>
        </AnimatedText>

        <AnimatePresence mode="wait">
          {rsvpSubmitted ? (
            /* Success confirmation */
            <motion.div
              key="success"
              className="gold-card-pro p-6 border border-[#d4af37]/40 shadow-2xl text-center w-full max-w-xs rounded-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#d4af37]/20 border border-[#d4af37]
                  flex items-center justify-center text-[#d4af37]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <span className="text-xl">💌</span>
              </motion.div>

              <h3
                className="text-lg mb-1.5 font-serif font-bold text-[#d4af37]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {formData.attendance === "hadir"
                  ? "Terima Kasih!"
                  : "Terima Kasih Atas Konfirmasinya"}
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                {formData.attendance === "hadir"
                  ? "Kami sangat menantikan kehadiran Anda di hari bahagia kami."
                  : "Doa dan restu Anda tetap sangat berarti bagi kami."}
              </p>
            </motion.div>
          ) : (
            /* RSVP Form Card — Gold Glassmorphism */
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="gold-card-pro p-4 md:p-5 border border-[#d4af37]/40 shadow-2xl space-y-3.5 w-full max-w-xs text-center flex flex-col items-center justify-center rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Attendance toggle */}
              <div className="w-full text-center">
                <label className="block text-[10px] uppercase tracking-[2px] text-[#d4af37] mb-2 text-center font-bold">
                  Apakah Anda akan hadir?
                </label>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all duration-300
                      ${
                        formData.attendance === "hadir"
                          ? "btn-modern-primary shadow-md scale-[1.02]"
                          : "btn-modern-secondary text-white/80"
                      }`}
                    onClick={() =>
                      setFormData({ ...formData, attendance: "hadir" })
                    }
                  >
                    ✓ Hadir
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all duration-300
                      ${
                        formData.attendance === "tidak_hadir"
                          ? "bg-white text-black shadow-md scale-[1.02]"
                          : "btn-modern-secondary text-white/80"
                      }`}
                    onClick={() =>
                      setFormData({ ...formData, attendance: "tidak_hadir" })
                    }
                  >
                    ✕ Tidak Hadir
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {formData.attendance && (
                  <motion.div
                    className="space-y-3 pt-1 w-full text-center flex flex-col items-center"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Name */}
                    <div className="w-full text-center">
                      <label className="block text-[9px] uppercase tracking-[1.5px] text-white/80 mb-1 font-semibold text-center leading-none">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="form-input text-center py-2 text-xs"
                        placeholder="Nama lengkap Anda"
                        required
                      />
                    </div>

                    {formData.attendance === "hadir" && (
                      <>
                        {/* Guest count */}
                        <div className="w-full text-center flex flex-col items-center">
                          <label className="block text-[9px] uppercase tracking-[1.5px] text-white/80 mb-1 font-semibold text-center leading-none">
                            Jumlah Kehadiran (maks. {maxGuest})
                          </label>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              className="w-7 h-7 rounded-full border border-[#d4af37]/50 bg-black/40 text-[#d4af37]
                                flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all font-bold text-sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  guestCount: Math.max(1, formData.guestCount - 1),
                                })
                              }
                            >
                              −
                            </button>
                            <span
                              className="text-lg font-bold min-w-[20px] text-center font-serif text-[#d4af37]"
                            >
                              {formData.guestCount}
                            </span>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-full border border-[#d4af37]/50 bg-black/40 text-[#d4af37]
                                flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all font-bold text-sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  guestCount: Math.min(
                                    maxGuest,
                                    formData.guestCount + 1
                                  ),
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Session */}
                        <div className="w-full text-center">
                          <label className="block text-[9px] uppercase tracking-[1.5px] text-white/80 mb-1 font-semibold text-center leading-none">
                            Sesi yang dihadiri
                          </label>
                          <select
                            value={formData.session}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                session: e.target.value,
                              })
                            }
                            className="form-input text-center py-1.5 text-xs bg-[#1c0a08]"
                          >
                            <option value="keduanya">Akad &amp; Resepsi</option>
                            <option value="akad">Akad Nikah</option>
                            <option value="resepsi">Resepsi</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Message */}
                    <div className="w-full text-center">
                      <label className="block text-[9px] uppercase tracking-[1.5px] text-white/80 mb-1 font-semibold text-center leading-none">
                        Pesan Singkat (opsional)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            message: e.target.value,
                          })
                        }
                        className="form-input form-textarea text-center py-1.5 text-xs"
                        placeholder="Tuliskan pesan atau konfirmasi..."
                        maxLength={500}
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      className="btn-modern-primary w-full py-2 rounded-full text-[10px] uppercase tracking-[1.5px] font-bold shadow-md mt-1"
                      disabled={isSubmitting || !formData.name}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            className="inline-block w-3 h-3 border-2 border-black/30 border-t-black rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          Mengirim...
                        </span>
                      ) : (
                        "Kirim Konfirmasi"
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
