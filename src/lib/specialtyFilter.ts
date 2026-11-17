export function matchesSpecialty(specialty: string | null | undefined, selected: string): boolean {
  if (!selected || selected === "all" || !selected.trim()) return true;
  return Boolean(specialty && specialty.toLowerCase() === selected.toLowerCase());
}