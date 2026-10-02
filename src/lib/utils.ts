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
 * Safely parse any date representation (ISO, timestamp, Indonesian format, etc.)
 */
export function parseDateSafely(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === "number") {
    const d = new Date(input > 1e11 ? input : input * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(input).trim();
  if (
    !str ||
    str.toLowerCase() === "invalid date" ||
    str.toLowerCase() === "undefined" ||
    str.toLowerCase() === "null"
  ) {
    return null;
  }

  // 1. Numeric timestamp in string
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const d = new Date(num > 1e11 ? num : num * 1000);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Explicit Indonesian DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = str.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s*[, ]\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?/
  );
  if (dmyMatch) {
    const [, day, month, year, h = "00", min = "00", sec = "00"] = dmyMatch;
    const d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(h),
      Number(min),
      Number(sec)
    );
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Standard ISO / RFC parse
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  // 4. Remove Indonesian timezone suffixes (WIB, WITA, WIT)
  const cleanStr = str.replace(/\s*(WIB|WITA|WIT)/gi, "").trim();
  d = new Date(cleanStr);
  if (!isNaN(d.getTime())) return d;

  // 5. Convert time with dots instead of colons: e.g. "13.11" or "13.11.45"
  const timeFixed = cleanStr.replace(
    /(\d{1,2})\.(\d{2})(?:\.(\d{2}))?/g,
    (_, h, min, s) => (s ? `${h}:${min}:${s}` : `${h}:${min}`)
  );
  d = new Date(timeFixed);
  if (!isNaN(d.getTime())) return d;

  // 6. Indonesian month dictionary
  const monthMap: Record<string, string> = {
    jan: "Jan",
    januari: "Jan",
    feb: "Feb",
    februari: "Feb",
    mar: "Mar",
    maret: "Mar",
    apr: "Apr",
    april: "Apr",
    mei: "May",
    jun: "Jun",
    juni: "Jun",
    jul: "Jul",
    juli: "Jul",
    agu: "Aug",
    ags: "Aug",
    agustus: "Aug",
    sep: "Sep",
    september: "Sep",
    okt: "Oct",
    oktober: "Oct",
    nov: "Nov",
    november: "Nov",
    des: "Dec",
    desember: "Dec",
  };

  let enStr = timeFixed;
  for (const [idm, enm] of Object.entries(monthMap)) {
    const reg = new RegExp(`\\b${idm}\\b`, "gi");
    if (reg.test(enStr)) {
      enStr = enStr.replace(reg, enm);
      break;
    }
  }

  // If missing year (e.g. "2 Oct, 13:11"), append current year
  if (!/\b(20\d\d)\b/.test(enStr)) {
    enStr = `${enStr} ${new Date().getFullYear()}`;
  }

  d = new Date(enStr);
  if (!isNaN(d.getTime())) return d;

  return null;
}

/**
 * Format relative time in Indonesian with robust fallback against Invalid Date
 */
export function formatRelativeTime(dateInput?: unknown): string {
  if (!dateInput) return "Baru saja";

  const rawStr = String(dateInput).trim();
  if (
    rawStr.includes("lalu") ||
    rawStr.toLowerCase() === "baru saja" ||
    rawStr.toLowerCase() === "kemarin"
  ) {
    return rawStr;
  }

  const parsedDate = parseDateSafely(dateInput);

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    // If input already looks like a valid human date string and not 'Invalid Date'
    if (rawStr && !rawStr.toLowerCase().includes("invalid") && rawStr.length >= 3) {
      return rawStr;
    }
    return "Baru saja";
  }

  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();

  // Handle tiny future clock drift across devices
  if (diffMs < 0 && diffMs > -60000) {
    return "Baru saja";
  }

  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;

  try {
    const formatted = parsedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return formatted !== "Invalid Date" ? formatted : "Baru saja";
  } catch {
    return "Baru saja";
  }
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
  const rawTo =
    searchParams.get("to") ||
    searchParams.get("name") ||
    searchParams.get("tamu") ||
    searchParams.get("guest") ||
    searchParams.get("u") ||
    searchParams.get("n") ||
    searchParams.get("t");
  let name = "Tamu Undangan";
  if (rawTo) {
    let cleaned = rawTo;
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch {}
    cleaned = cleaned.replace(/\+/g, " ").trim();
    if (/%[0-9a-fA-F]{2}/.test(cleaned)) {
      try {
        cleaned = decodeURIComponent(cleaned);
      } catch {}
      cleaned = cleaned.replace(/\+/g, " ").trim();
    }
    // Only replace hyphens if no spaces exist (slug style 'nama-tamu') and not guest ID
    if (cleaned.includes("-") && !cleaned.includes(" ") && !cleaned.startsWith("guest-")) {
      cleaned = cleaned.replace(/-/g, " ");
    }
    name = cleaned.trim();
  }

  return {
    name: name || "Tamu Undangan",
    guestId: searchParams.get("guestId") || undefined,
    maxGuest: searchParams.get("maxGuest")
      ? parseInt(searchParams.get("maxGuest")!, 10)
      : undefined,
    category: searchParams.get("category") || undefined,
    session: searchParams.get("session") || undefined,
    code: searchParams.get("code") || searchParams.get("c") || undefined,
  };
}
