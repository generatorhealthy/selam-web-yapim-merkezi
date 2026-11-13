import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { privateFileUrl } from '@/lib/privateStorage';

export default function PrivateEvidenceImage({ path, index }: { path: string; index: number }) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl(undefined);
    setFailed(false);
    privateFileUrl(path, 'legal-evidence').then(value => {
      if (active) setUrl(value);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [path]);
  async function open() {
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    try {
      const fresh = await privateFileUrl(path, 'legal-evidence');
      if (tab) tab.location.replace(fresh);
    } catch {
      tab?.close();
      setFailed(true);
    }
  }
  return <div className="relative border rounded-md overflow-hidden h-48">
    {url ? <img src={url} alt={`Ekran görüntüsü ${index + 1}`} className="w-full h-full object-cover" onError={() => { setUrl(undefined); setFailed(true); }} />
      : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{failed ? 'Belge erişimi doğrulanamadı.' : 'Yükleniyor…'}</div>}
    <Button variant="secondary" size="icon" className="absolute bottom-2 right-2" disabled={!url} onClick={open} aria-label="Görüntüyü indir" title="Görüntüyü indir"><Download className="w-4 h-4" /></Button>
  </div>;
}