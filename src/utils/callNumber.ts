export const CALL_CENTER_NUMBER = "05308232275";

/**
 * Uzman telefonu santral numarası (eski 0216 hatları) ise yeni santral
 * numarasını döndürür. Boşsa da santral numarasını döndürür.
 */
export const resolveCallNumber = (phone?: string | null): string => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return CALL_CENTER_NUMBER;
  if (digits.endsWith("2167060611") || digits.endsWith("2162350650")) {
    return CALL_CENTER_NUMBER;
  }
  return phone as string;
};
