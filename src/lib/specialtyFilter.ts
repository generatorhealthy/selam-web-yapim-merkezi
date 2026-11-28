import { createSpecialtySlug } from "@/utils/doctorUtils";

export function matchesSpecialty(specialty: string | null | undefined, selected: string): boolean {
  if (!selected || selected === "all" || !selected.trim()) return true;
  if (!specialty) return false;
  return specialty.toLowerCase() === selected.toLowerCase() ||
    createSpecialtySlug(specialty) === createSpecialtySlug(selected);
}

export function matchesAppointmentType(
  specialist: { online_consultation?: boolean; face_to_face_consultation?: boolean },
  selected: string,
): boolean {
  if (selected === "online") return specialist.online_consultation === true;
  if (selected === "yüzyüze") return specialist.face_to_face_consultation === true;
  return true;
}
