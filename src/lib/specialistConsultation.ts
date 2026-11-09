interface ConsultationAvailability {
  online_consultation: boolean | null;
  face_to_face_consultation: boolean | null;
  city: string | null;
}

export function getSpecialistConsultation(specialist: ConsultationAvailability) {
  return {
    online: specialist.online_consultation === true,
    faceToFace: specialist.face_to_face_consultation === true,
    faceToFaceCity: specialist.face_to_face_consultation === true
      ? specialist.city?.trim() || null
      : null,
  };
}