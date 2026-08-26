"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { useInvitationStore } from "@/stores/invitationStore";
import { weddingData } from "@/data/weddingData";
import { QRCodeCanvas } from "@/components/ui/QRCodeCanvas";

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
  const [showForm, setShowForm] = useState(false);

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
      createdAt: new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB",
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



    setIsSubmitting(false);
    setShowForm(false);
    setRsvpSubmitted(true);
  }

  return (
    <section
      id="rsvp"
      data-section="rsvp"
      className="section-rsvp relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#0E0E0F] text-[#C8C5BE]"
    >
      {/* Background Image — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.rsvp}')`,
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
        <AnimatedText delay={0} variant="fadeUp" className="w-full flex justify-center mb-6">
          <div className="gold-card-pro p-4 md:p-5 border border-[#806A42] shadow-xl rounded-2xl w-full max-w-xs text-center flex flex-col items-center justify-center">
            <p
              className="text-[10px] uppercase tracking-[4px] text-[#C8A96B] font-extrabold mb-1.5 text-center leading-none"
              style={{ fontFamily: "var(--font-body)" }}
            >
              RSVP
            </p>

            <h2
              className="text-2xl md:text-3xl text-center font-serif text-[#F5F1E8] font-bold leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Konfirmasi Kehadiran
            </h2>
          </div>
        </AnimatedText>

        <AnimatePresence mode="wait">
          {!showForm ? (
            /* Digital E-Ticket Barcode Card (Primary View) */
            <motion.div
              key="confirmed"
              className="gold-card-pro p-5 md:p-6 border border-[#806A42] shadow-2xl text-center w-full max-w-xs rounded-2xl space-y-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-600 flex items-center justify-center mx-auto text-emerald-300 text-xl font-bold">
                ✓
              </div>

              <h3
                className="text-lg font-serif font-bold text-[#F5F1E8] leading-snug"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Konfirmasi Tersimpan
              </h3>

              <p className="text-xs text-[#C8C5BE] leading-relaxed">
                Terima kasih, <strong className="text-[#E0C98F]">{formData.name || guest.name}</strong>. Konfirmasi kehadiran Anda telah berhasil dicatat.
              </p>

              <div className="pt-2 border-t border-[#806A42]/40 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("eticket");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="btn-modern-primary text-[11px] w-full py-2.5 font-bold flex items-center justify-center gap-1.5 cursor-pointer rounded-full shadow-md"
                >
                  <span>🎟️ Lihat Barcode / E-Ticket di Atas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="btn-modern-secondary text-[10.5px] w-full py-2 font-bold flex items-center justify-center gap-1 cursor-pointer rounded-full"
                >
                  <span>✏️ Ubah Konfirmasi Kehadiran</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* RSVP Form Card — Soft Black & Muted Gold */
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="gold-card-pro p-4 md:p-5 border border-[#806A42] shadow-2xl space-y-3.5 w-full max-w-xs text-center flex flex-col items-center justify-center rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Attendance toggle */}
              <div className="w-full text-center">
                <label className="block text-[10px] uppercase tracking-[2px] text-[#C8A96B] mb-2 text-center font-bold">
                  Apakah Anda akan hadir?
                </label>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all duration-300
                      ${formData.attendance === "hadir"
                        ? "btn-modern-primary shadow-md scale-[1.02]"
                        : "btn-modern-secondary text-[#C8C5BE]"
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
                      ${formData.attendance === "tidak_hadir"
                        ? "bg-[#806A42] text-[#F5F1E8] shadow-md scale-[1.02]"
                        : "btn-modern-secondary text-[#C8C5BE]"
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
                      <label className="block text-[9px] uppercase tracking-[1.5px] text-[#8C8983] mb-1 font-semibold text-center leading-none">
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
                          <label className="block text-[9px] uppercase tracking-[1.5px] text-[#8C8983] mb-1 font-semibold text-center leading-none">
                            Jumlah Kehadiran (maks. {maxGuest})
                          </label>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              className="w-7 h-7 rounded-full border border-[#806A42] bg-[#171719] text-[#E0C98F]
                                flex items-center justify-center hover:bg-[#C8A96B] hover:text-[#0E0E0F] transition-all font-bold text-sm"
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
                              className="text-lg font-bold min-w-[20px] text-center font-serif text-[#F5F1E8]"
                            >
                              {formData.guestCount}
                            </span>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-full border border-[#806A42] bg-[#171719] text-[#E0C98F]
                                flex items-center justify-center hover:bg-[#C8A96B] hover:text-[#0E0E0F] transition-all font-bold text-sm"
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
                          <label className="block text-[9px] uppercase tracking-[1.5px] text-[#8C8983] mb-1 font-semibold text-center leading-none">
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
                            className="form-input text-center py-1.5 text-xs bg-[#171719] text-[#F5F1E8]"
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
                      <label className="block text-[9px] uppercase tracking-[1.5px] text-[#8C8983] mb-1 font-semibold text-center leading-none">
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
                      className="btn-modern-primary w-full py-2.5 rounded-full text-[10px] uppercase tracking-[1.5px] font-bold shadow-md mt-1"
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
                        "Simpan & Tampilkan Barcode"
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-[10px] text-[#8C8983] hover:underline pt-1 cursor-pointer hover:text-[#E0C98F] block text-center w-full font-semibold"
                    >
                      ← Kembali ke Barcode E-Ticket
                    </button>
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
