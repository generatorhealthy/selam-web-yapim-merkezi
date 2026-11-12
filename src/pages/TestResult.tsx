import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export default function TestResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = typeof location.state?.resultId === 'string';
  return <main className="mx-auto max-w-2xl space-y-6 p-6">
    <h1 className="text-2xl font-semibold">{saved ? 'Testiniz kaydedildi' : 'Kayıt doğrulanamadı'}</h1>
    <p className="text-muted-foreground">{saved ? 'Yanıtlarınız ilgili uzmanın panelinde değerlendirmeye sunuldu. Otomatik klinik puanlama yapılmaz.' : 'Bu bağlantı bir testin kaydedildiğini doğrulamıyor. Lütfen hesabınızdan kontrol edin.'}</p>
    <Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>
  </main>;
}
