export const IVR_LINES = [
  { prefix: "81", phone: "905317893880", label: "0531 789 38 80" },
  { prefix: "80", phone: "905328222275", label: "0532 822 22 75" },
] as const;

// Old helpers must remain single-line until the new atomic allocator is installed.
export function ivrDialPrefix(status: { dual_line?: boolean }): "auto" | "81" {
  return status.dual_line === true ? "auto" : "81";
}