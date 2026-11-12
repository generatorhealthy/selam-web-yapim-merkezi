const disclosureText = 'Bu hizmet, belirlenen taahhüt süresi kapsamında özel indirimden yararlanmaktadır. Taahhüt sebebiyle hizmet bedeli 6.500 TL yerine 4.000 TL olarak uygulanmaktadır.';
const registrationLinkDisclosureText = 'Bu hizmet, belirlenen taahhüt süresi kapsamında özel indirimden yararlanmaktadır. Taahhüt sebebiyle hizmet bedeli 8.500 TL yerine 5.000 TL olarak uygulanmaktadır.';

export function shouldAddCommitmentDisclosure(price: number, alreadyIncluded: boolean): boolean {
  return (price === 4000 || price === 5000) && !alreadyIncluded;
}

// Presentation-only repair: never overwrite the signed order snapshot.
export function withCommitmentDisclosure(html: string, price: number): string {
  const plainText = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
  const alreadyIncluded = plainText.includes('Taahhüt sebebiyle hizmet bedeli');
  if (!shouldAddCommitmentDisclosure(price, alreadyIncluded)) return html;

  const paragraph = `<p><strong>Bilgilendirme:</strong> ${price === 5000 ? registrationLinkDisclosureText : disclosureText}</p>`;
  const anchor = /<p\b[^>]*>\s*<strong\b[^>]*>Toplam Hizmet Süresi|<h[1-6]\b[^>]*>\s*TARİHLER:/i;
  const match = anchor.exec(html);
  if (match) return html.slice(0, match.index) + paragraph + '\n' + html.slice(match.index);
  return html + '\n' + paragraph;
}