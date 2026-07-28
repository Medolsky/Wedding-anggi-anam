/**
 * Utility functions for the wedding invitation
 */

/**
 * Get time-based greeting in Indonesian
 */
export function getGreeting(): string {
  const hourStr = new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    hour: "2-digit",
  });
  const hour = parseInt(hourStr, 10);
  if (hour >= 5 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Generate ICS calendar event file
 */
export function generateICS(event: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  description?: string;
}): string {
  const dateStr = event.date.replace(/[^0-9]/g, "");
  // Parse the Indonesian date format
  const eventDate = "20261212"; // Fallback to wedding date

  const startDT = `${eventDate}T${event.startTime.replace(":", "")}00`;
  const endDT = `${eventDate}T${event.endTime.replace(":", "")}00`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//EN",
    "BEGIN:VEVENT",
    `DTSTART:${startDT}`,
    `DTEND:${endDT}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.venue}, ${event.address}`,
    `DESCRIPTION:${event.description || event.title}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Download ICS file
 */
export function downloadICS(event: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
}) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format relative time in Indonesian
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Smooth scroll to section
 */
export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Parse guest parameters from URL search params
 */
export function parseGuestParams(searchParams: URLSearchParams) {
  return {
    name: searchParams.get("to")?.replace(/-/g, " ") || "Tamu Undangan",
    guestId: searchParams.get("guestId") || undefined,
    maxGuest: searchParams.get("maxGuest")
      ? parseInt(searchParams.get("maxGuest")!, 10)
      : undefined,
    category: searchParams.get("category") || undefined,
    session: searchParams.get("session") || undefined,
    code: searchParams.get("code") || undefined,
  };
}
