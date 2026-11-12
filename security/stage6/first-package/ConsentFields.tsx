// UNCONNECTED SCREEN DRAFT. Publication and real flow verification are required.
import { Checkbox } from '../../../src/components/ui/checkbox';
import { Label } from '../../../src/components/ui/label';
export function ConsentFields({ checked, onChange, purpose }: { checked: boolean; onChange(value: boolean): void; purpose: 'test' | 'appointment' }) {
  const id = `health-consent-${purpose}`;
  return <section className="space-y-3 border-t border-border pt-4 text-foreground">
    <p className="text-sm text-muted-foreground">{purpose === 'test'
      ? 'Yanıtlarınız psikolojik değerlendirme amacıyla işlenir. Sonucunuza siz ve ilgili yetkili uzman erişebilir.'
      : 'Genel randevu talebinizi sağlık açıklaması paylaşmadan iletebilirsiniz. Sağlık açıklaması ve destek türü ayrı değerlendirilir.'}</p>
    <p className="text-sm"><a className="text-primary underline" href="/kvkk-taslak/aydinlatma-metni">Veri türleri, sağlayıcılar, saklama ve başvuru bilgileri</a></p>
    <div className="flex items-start gap-3"><Checkbox id={id} checked={checked} onCheckedChange={value => onChange(value === true)} />
      <Label htmlFor={id} className="text-sm leading-relaxed">{purpose === 'test' ? 'Test yanıtlarımdaki sağlık verilerinin belirtilen değerlendirme amacıyla işlenmesine açık rıza veriyorum.' : 'İsteğe bağlı sağlık açıklamamın ve destek türümün ilgili uzmana yönlendirilmek amacıyla işlenmesine açık rıza veriyorum.'}</Label></div>
    <a className="text-sm text-primary underline" href="/kvkk-taslak/acik-riza">Ayrı açık rıza metni</a>
  </section>;
}