// Isolated narrow candidate gate; never imported by production. No payload logging.
export type ResultOwner = {patientUserId: string | null; specialistUserId: string};
export function mayRequestNotice(verifiedUserId: string | null, result: ResultOwner): boolean {
 return verifiedUserId !== null &&
  (verifiedUserId === result.patientUserId || verifiedUserId === result.specialistUserId);
}