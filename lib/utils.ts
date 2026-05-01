import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert time string to seconds for comparison
export function timeToSeconds(time: string): number {
  const parts = time.split(":");
  if (parts.length === 2) {
    // MM:SS.MS format
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  } else {
    // SS.MS format
    return parseFloat(time);
  }
}

// Format time for display
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);

  if (mins > 0) {
    return `${mins}:${secs.padStart(5, "0")}`;
  }
  return secs;
}

// Calculate improvement percentage
export function calculateImprovement(oldTime: string, newTime: string): number {
  const oldSeconds = timeToSeconds(oldTime);
  const newSeconds = timeToSeconds(newTime);

  // Negative means improvement (faster time)
  return ((newSeconds - oldSeconds) / oldSeconds) * 100;
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate time format (MM:SS.MS or SS.MS)
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^(\d{1,2}:)?\d{1,2}\.\d{2}$/;
  return timeRegex.test(time);
}

// Validate NIC number (exactly 12 digits)
export function isValidNICNumber(nic: string): boolean {
  const nicRegex = /^\d{12}$/;
  return nicRegex.test(nic.trim());
}

// Validate University ID (6 digits followed by 1 English letter)
export function isValidUniversityId(id: string): boolean {
  const idRegex = /^\d{6}[a-zA-Z]$/;
  return idRegex.test(id.trim());
}

// Validate Batch (2 digits: 10-99)
export function isValidBatch(batch: string | number): boolean {
  const num = typeof batch === "string" ? parseInt(batch, 10) : batch;
  return !isNaN(num) && num >= 10 && num <= 99;
}

// Get event category
export function getEventCategory(event: string): string {
  if (event.includes("freestyle")) return "Freestyle";
  if (event.includes("backstroke")) return "Backstroke";
  if (event.includes("breaststroke")) return "Breaststroke";
  if (event.includes("butterfly")) return "Butterfly";
  if (event.includes("medley")) return "Individual Medley";
  return "Other";
}

// Get event distance
export function getEventDistance(event: string): number {
  const match = event.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// Sort events by distance and stroke
export function sortEvents(events: string[]): string[] {
  return [...events].sort((a, b) => {
    const catA = getEventCategory(a);
    const catB = getEventCategory(b);

    if (catA !== catB) {
      return catA.localeCompare(catB);
    }

    return getEventDistance(a) - getEventDistance(b);
  });
}
