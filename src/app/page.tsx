"use client";

import { useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useInvitationStore } from "@/stores/invitationStore";
import { parseGuestParams } from "@/lib/utils";
import { useScrollSection } from "@/hooks/useScrollSection";
import { weddingData } from "@/data/weddingData";

// Welcome Cover
import { WelcomeCover, WelcomeContent } from "@/components/welcome/WelcomeCover";

// Global Controls
import { MusicPlayer } from "@/components/global/MusicPlayer";
import { FloatingNavigation } from "@/components/global/FloatingNavigation";

// Main Page Sections
import { HeroSection } from "@/components/sections/HeroSection";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { GroomSection } from "@/components/sections/GroomSection";
import { BrideSection } from "@/components/sections/BrideSection";
import { EventSection } from "@/components/sections/EventSection";
import { StorySection } from "@/components/sections/StorySection";
import { GallerySection } from "@/components/sections/GallerySection";
import { RSVPSection } from "@/components/sections/RSVPSection";
import { GiftSection } from "@/components/sections/GiftSection";
import { WishesSection } from "@/components/sections/WishesSection";
import { FooterSection } from "@/components/sections/FooterSection";

// UI
import { ImageLightbox } from "@/components/ui/ImageLightbox";

function InvitationContent() {
  const searchParams = useSearchParams();
  const state = useInvitationStore((s) => s.state);
  const setState = useInvitationStore((s) => s.setState);
  const guest = useInvitationStore((s) => s.guest);
  const setGuest = useInvitationStore((s) => s.setGuest);
  const setMusicPlaying = useInvitationStore((s) => s.setMusicPlaying);

  // Initialize scroll section tracking
  useScrollSection();

  // Parse guest params from URL
  useEffect(() => {
    const guestData = parseGuestParams(searchParams);
    setGuest(guestData);
  }, [searchParams, setGuest]);

  // Direct open transition from Welcome Page to Main Page
  const handleOpen = useCallback(() => {
    setState("OPENING");
    setMusicPlaying(true);

    // Transition directly to OPENED after slide up animation
    setTimeout(() => {
      setState("OPENED");
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, 850);
  }, [setState, setMusicPlaying]);

  return (
    <div className="min-h-screen w-full bg-[#120605] text-[var(--color-text)] flex justify-center items-center relative overflow-x-hidden">
      {/* Desktop Ambient Background */}
      <div
        className="fixed inset-0 hidden md:block bg-cover bg-center pointer-events-none opacity-25 filter blur-2xl scale-110"
        style={{ backgroundImage: `url('${weddingData.couple.heroCover}')` }}
      />
      <div className="fixed inset-0 hidden md:block bg-gradient-to-b from-[#1c0a08]/80 via-[#2e0f0c]/70 to-[#1c0a08]/90 pointer-events-none" />

      {/* Main Centered Mobile Frame Stage */}
      <div className="w-full max-w-[480px] min-h-screen relative bg-[var(--color-background)] shadow-[0_0_60px_rgba(0,0,0,0.5)] border-x border-[#5c1d18]/40 overflow-x-hidden">
        {/* ==========================================
            WELCOME PAGE OVERLAY (CLOSED / OPENING)
            Direct smooth slide-up reveal into Main Page
            ========================================== */}
        <AnimatePresence>
          {(state === "CLOSED" || state === "OPENING") && (
            <motion.div
              className="fixed inset-0 z-[100] h-full w-full max-w-[480px] mx-auto bg-[#1c0a08]"
              initial={{ y: 0, opacity: 1 }}
              animate={
                state === "OPENING"
                  ? { y: "-100%", opacity: 0.95 }
                  : { y: 0, opacity: 1 }
              }
              exit={{ y: "-100%", opacity: 0 }}
              transition={{
                duration: 0.85,
                ease: [0.76, 0, 0.24, 1],
              }}
            >
              <WelcomeCover />
              <WelcomeContent
                guestName={guest.name}
                onOpen={handleOpen}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==========================================
            MAIN PAGE (State: OPENED or OPENING)
            ========================================== */}
        <main
          className={`relative w-full transition-opacity duration-500 ${
            state === "CLOSED" ? "h-screen overflow-hidden opacity-90" : "opacity-100"
          }`}
        >
          <HeroSection />
          <QuoteSection />
          <GroomSection />
          <BrideSection />
          <EventSection />
          <StorySection />
          <GallerySection />
          <RSVPSection />
          <GiftSection />
          <WishesSection />
          <FooterSection />
        </main>

        {/* ==========================================
            GLOBAL OVERLAYS
            ========================================== */}
        <MusicPlayer />
        <FloatingNavigation />
        <ImageLightbox />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 flex items-center justify-center bg-[#1c0a08]"
        >
          <motion.div
            className="text-[var(--color-accent)] text-sm uppercase tracking-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading...
          </motion.div>
        </div>
      }
    >
      <InvitationContent />
    </Suspense>
  );
}
