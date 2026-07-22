"use client";

import { create } from "zustand";

export type InvitationState = "CLOSED" | "OPENING" | "OPENED";

interface GuestData {
  name: string;
  guestId?: string;
  maxGuest?: number;
  category?: string;
  session?: string;
  code?: string;
}

interface InvitationStore {
  // App state
  state: InvitationState;
  setState: (state: InvitationState) => void;

  // Guest data
  guest: GuestData;
  setGuest: (guest: GuestData) => void;

  // Music
  isMusicPlaying: boolean;
  setMusicPlaying: (playing: boolean) => void;
  toggleMusic: () => void;

  // Active section (for background transitions)
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Navigation
  isNavOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;

  // Lightbox
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;

  // RSVP
  rsvpSubmitted: boolean;
  setRsvpSubmitted: (submitted: boolean) => void;
}

export const useInvitationStore = create<InvitationStore>((set) => ({
  // App state
  state: "CLOSED",
  setState: (state) => set({ state }),

  // Guest
  guest: { name: "Tamu Undangan" },
  setGuest: (guest) => set({ guest }),

  // Music
  isMusicPlaying: false,
  setMusicPlaying: (playing) => set({ isMusicPlaying: playing }),
  toggleMusic: () =>
    set((s) => ({ isMusicPlaying: !s.isMusicPlaying })),

  // Active section
  activeSection: "hero",
  setActiveSection: (section) => set({ activeSection: section }),

  // Navigation
  isNavOpen: false,
  setNavOpen: (open) => set({ isNavOpen: open }),
  toggleNav: () => set((s) => ({ isNavOpen: !s.isNavOpen })),

  // Lightbox
  lightboxIndex: null,
  setLightboxIndex: (index) => set({ lightboxIndex: index }),

  // RSVP
  rsvpSubmitted: false,
  setRsvpSubmitted: (submitted) => set({ rsvpSubmitted: submitted }),
}));
