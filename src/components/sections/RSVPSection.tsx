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



    setIsSubmitting(false);
    setShowForm(false);
    setRsvpSubmitted(true);
  }

  return (
    <section
      id="rsvp"
      data-section="rsvp"
      className="section-rsvp relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#faf8f5] text-[#2a2723]"
    >
      {/* Background Image from Unsplash — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.rsvp}')`,
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
        <AnimatedText delay={0} variant="fadeUp" className="w-full flex justify-center mb-6">
          <div className="gold-card-pro p-4 md:p-5 border border-[#d4af37]/40 shadow-xl rounded-2xl w-full max-w-xs text-center flex flex-col items-center justify-center">
            <p
              className="text-[10px] uppercase tracking-[4px] text-[#b8860b] font-bold mb-1.5 text-center leading-none"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Confirmation
            </p>

            <h2
              className="text-2xl md:text-3xl text-center mb-2 font-serif text-[#2a2723] drop-shadow-sm leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Konfirmasi Kehadiran
            </h2>

            <p className="text-center text-xs opacity-90 leading-relaxed text-[#555555]">
              Mohon konfirmasi kehadiran Anda agar kami dapat mempersiapkan
              segalanya dengan baik.
            </p>
          </div>
        </AnimatedText>

        <AnimatePresence mode="wait">
          {!showForm ? (
            /* Digital E-Ticket Barcode Card (Primary View) */
            <motion.div
              key="eticket"
              className="gold-card-pro p-5 md:p-6 border-2 border-[#d4af37] shadow-2xl text-center w-full max-w-xs rounded-2xl bg-white/95"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-2.5 mb-3">
                <span className="text-[10px] uppercase tracking-[2px] font-extrabold text-[#b8860b]">
                  🎫 DIGITAL E-TICKET
                </span>
                <span className="text-[9px] bg-[#d4af37]/20 text-[#8a662d] px-2 py-0.5 rounded-full font-bold">
                  {guest.category || "TAMU VIP"}
                </span>
              </div>

              <h3
                className="text-xl font-serif font-bold text-[#2a2723] leading-snug mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {guest.name || "Tamu Undangan"}
              </h3>
              <p className="text-[11px] text-[#66615c] mb-3">
                Acara: <strong className="text-[#b8860b]">Akad &amp; Resepsi</strong>
              </p>

              {/* QR / Barcode Card Frame */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-[#d4af37]/40 shadow-inner flex flex-col items-center justify-center my-3">
                <QRCodeCanvas
                  data={guest.code || guest.name || "GUEST-VIP"}
                  size={180}
                  className="rounded-lg drop-shadow-sm"
                />
                <div className="mt-2.5 text-[11px] font-mono font-extrabold tracking-[3px] text-[#2a2723] bg-[#FAF8F5] px-3.5 py-1 rounded-lg border border-[#d4af37]/40 shadow-sm">
                  {guest.code || "GUEST-" + (guest.name || "VIP").replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase()}
                </div>
              </div>

              <p className="text-[10.5px] text-[#555555] leading-relaxed mb-4">
                Tunjukkan QR/Barcode ini kepada panitia / admin di pintu masuk acara untuk konfirmasi kedatangan Anda.
              </p>

              <div className="pt-2 border-t border-[#d4af37]/30">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="btn-modern-secondary text-[11px] w-full py-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#f7ebbf]/40"
                >
                  <span>✏️ Isi / Ubah Form Kehadiran</span>
                </button>
              </div>
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
                <label className="block text-[10px] uppercase tracking-[2px] text-[#b8860b] mb-2 text-center font-bold">
                  Apakah Anda akan hadir?
                </label>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all duration-300
                      ${
                        formData.attendance === "hadir"
                          ? "btn-modern-primary shadow-md scale-[1.02]"
                          : "btn-modern-secondary text-[#2a2723]"
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
                          ? "bg-[#2a2723] text-white shadow-md scale-[1.02]"
                          : "btn-modern-secondary text-[#2a2723]"
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
                      <label className="block text-[9px] uppercase tracking-[1.5px] text-[#66615c] mb-1 font-semibold text-center leading-none">
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
                          <label className="block text-[9px] uppercase tracking-[1.5px] text-[#66615c] mb-1 font-semibold text-center leading-none">
                            Jumlah Kehadiran (maks. {maxGuest})
                          </label>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              className="w-7 h-7 rounded-full border border-[#d4af37]/50 bg-[#f7ebbf]/40 text-[#b8860b]
                                flex items-center justify-center hover:bg-[#d4af37] hover:text-white transition-all font-bold text-sm"
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
                              className="text-lg font-bold min-w-[20px] text-center font-serif text-[#b8860b]"
                            >
                              {formData.guestCount}
                            </span>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-full border border-[#d4af37]/50 bg-[#f7ebbf]/40 text-[#b8860b]
                                flex items-center justify-center hover:bg-[#d4af37] hover:text-white transition-all font-bold text-sm"
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
                          <label className="block text-[9px] uppercase tracking-[1.5px] text-[#66615c] mb-1 font-semibold text-center leading-none">
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
                            className="form-input text-center py-1.5 text-xs bg-white text-[#2a2723]"
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
                      <label className="block text-[9px] uppercase tracking-[1.5px] text-[#66615c] mb-1 font-semibold text-center leading-none">
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
                      className="text-[10px] text-[#66615c] hover:underline pt-1 cursor-pointer hover:text-[#2a2723] block text-center w-full font-semibold"
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
