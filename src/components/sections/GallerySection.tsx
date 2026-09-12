"use client";

import { useMemo } from "react";
import { weddingData } from "@/data/weddingData";
import { useInvitationStore } from "@/stores/invitationStore";
import { AnimatedText } from "@/components/ui/AnimatedText";

type PhotoItem = (typeof weddingData.gallery)[number];

interface MarqueeRowProps {
  photos: PhotoItem[];
  direction: "left" | "right";
  duration?: number;
  onPhotoClick: (item: PhotoItem) => void;
}

function MarqueeRow({
  photos,
  direction,
  duration,
  onPhotoClick,
}: MarqueeRowProps) {
  // Ensure enough items to seamlessly loop across all viewports
  const { items, computedDuration } = useMemo(() => {
    if (photos.length === 0) return { items: [], computedDuration: 80 };
    let base = [...photos];
    // Need base length of at least 10 to fill wide screen
    while (base.length < 10) {
      base = [...base, ...photos];
    }
    // Duplicate base so second half is identical for seamless 50% loop
    const autoDuration = Math.round(base.length * 4.5);
    return {
      items: [...base, ...base],
      computedDuration: duration || autoDuration,
    };
  }, [photos, duration]);

  const animationClass =
    direction === "left" ? "animate-marquee-left" : "animate-marquee-right";

  return (
    <div className="marquee-track relative w-full overflow-hidden py-1">
      <div
        className={`${animationClass} flex items-center gap-2.5 sm:gap-3.5`}
        style={
          {
            "--marquee-duration": `${computedDuration}s`,
          } as React.CSSProperties
        }
      >
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            onClick={() => onPhotoClick(item)}
            className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#806A42]/60 bg-[#171719] hover:border-[#C8A96B] transition-transform duration-200 active:scale-95 shadow-md shadow-black/40"
            style={{
              height: "clamp(145px, 28vw, 195px)",
              aspectRatio: "3/4",
              transform: "translateZ(0)",
              WebkitTransform: "translateZ(0)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <img
              src={item.src}
              alt={item.alt}
              className="w-full h-full object-cover pointer-events-none"
              loading="eager"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GallerySection() {
  const setLightboxIndex = useInvitationStore((s) => s.setLightboxIndex);
  const { gallery, sectionBgs } = weddingData;

  // Split the 29 prewedding photos (1 - 29) into 3 balanced rows:
  // Baris 1: Foto 1 - 10 (Bergerak ke Kiri)
  const row1 = useMemo(() => gallery.slice(0, 10), [gallery]);

  // Baris 2: Foto 11 - 19 (Bergerak ke Kanan)
  const row2 = useMemo(() => gallery.slice(10, 19), [gallery]);

  // Baris 3: Foto 20 - 29 (Bergerak ke Kiri)
  const row3 = useMemo(() => gallery.slice(19, 29), [gallery]);

  const handlePhotoClick = (item: PhotoItem) => {
    const idx = gallery.findIndex((p) => p.id === item.id);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  };

  return (
    <section
      id="gallery"
      data-section="gallery"
      className="section-gallery relative py-16 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#0E0E0F] text-[#C8C5BE]"
    >
      {/* Background Image — Elegant dark atmospheric texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.gallery}')`,
            filter: "brightness(0.50) contrast(1.1)",
          }}
        />
        <div className="absolute inset-0 bg-[#0E0E0F]/85 backdrop-blur-[2px]" />
        {/* Soft Gold Glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 35% at 50% 15%, rgba(200, 169, 107, 0.10) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-20 w-full flex flex-col items-center">
        {/* Section header frame card */}
        <AnimatedText
          delay={0}
          variant="fadeUp"
          className="w-full flex justify-center mb-8 px-6"
        >
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

            <p className="text-[11px] text-[#C8A96B]/75 mt-2 tracking-wider flex items-center gap-1.5 font-medium">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
              Klik foto untuk memperbesar • Tahan untuk menjeda
            </p>
          </div>
        </AnimatedText>

        {/* Running Photos (Continuous Marquee Ticker) — 3 Baris Berjalan Otomatis */}
        <div className="relative w-full overflow-hidden space-y-2.5 sm:space-y-3.5">
          {/* Baris 1: Foto 1 - 10 (Bergerak ke Kiri) */}
          <MarqueeRow
            photos={row1}
            direction="left"
            duration={70}
            onPhotoClick={handlePhotoClick}
          />

          {/* Baris 2: Foto 11 - 19 (Bergerak ke Kanan) */}
          <MarqueeRow
            photos={row2}
            direction="right"
            duration={65}
            onPhotoClick={handlePhotoClick}
          />

          {/* Baris 3: Foto 20 - 29 (Bergerak ke Kiri) */}
          <MarqueeRow
            photos={row3}
            direction="left"
            duration={70}
            onPhotoClick={handlePhotoClick}
          />
        </div>
      </div>
    </section>
  );
}
