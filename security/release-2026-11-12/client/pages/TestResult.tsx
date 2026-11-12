// Candidate completion screen. No patient PII/health values in navigation history or URLs.
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
export default function TestResult(){const navigate=useNavigate();return <main className="mx-auto max-w-2xl space-y-6 p-6">
 <h1 className="text-2xl font-semibold">Testiniz kaydedildi</h1>
 <p className="text-muted-foreground">Yanıtlarınız ilgili uzmanın değerlendirmesine sunuldu.</p>
 <Button onClick={()=>navigate('/')}>Ana Sayfaya Dön</Button>
 </main>;}