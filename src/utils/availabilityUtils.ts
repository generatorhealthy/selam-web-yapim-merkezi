
export const DEFAULT_TIME_SLOTS = [
  "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
  "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
  "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

export interface AvailabilityData {
  default: string[];
  dates?: Record<string, string[]>;
}

/**
 * Parses available_time_slots from DB (could be old flat array or new object format)
 */
export function parseAvailability(raw: any): AvailabilityData {
  if (!raw) {
    return { default: DEFAULT_TIME_SLOTS, dates: {} };
  }
  // Old format: flat string array
  if (Array.isArray(raw)) {
    return { default: raw.length > 0 ? raw : DEFAULT_TIME_SLOTS, dates: {} };
  }
  // New format: { default: [...], dates: { "2026-03-15": [...] } }
  if (typeof raw === 'object' && raw.default) {
    return {
      default: raw.default || DEFAULT_TIME_SLOTS,
      dates: raw.dates || {}
    };
  }
  return { default: DEFAULT_TIME_SLOTS, dates: {} };
}

/**
 * Get available time slots for a specific date string (YYYY-MM-DD).
 * If there's a date-specific override, use that. Otherwise use defaults.
 * An empty array override means the day is unavailable.
 */
export function getSlotsForDate(availability: AvailabilityData, dateStr: string): string[] {
  if (availability.dates && dateStr in availability.dates) {
    return availability.dates[dateStr];
  }
  return availability.default;
}

/**
 * Check if a specific date is marked as unavailable (empty override)
 */
export function isDateUnavailable(availability: AvailabilityData, dateStr: string): boolean {
  if (availability.dates && dateStr in availability.dates) {
    return availability.dates[dateStr].length === 0;
  }
  return false;
}

/**
 * Convenience: get slots from raw DB value + date
 */
export function getAvailableSlotsForDate(raw: any, dateStr: string): string[] {
  const availability = parseAvailability(raw);
  return getSlotsForDate(availability, dateStr);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
