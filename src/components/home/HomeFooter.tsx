import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import publication from "@/content/legal/publication.json";
import { canShowLegalCandidate } from "@/lib/legalPublication.js";
import { Brand } from "./Brand";

const legalLinks = [
  { to: "/about", label: "Hakkımızda" },
  { to: "/privacy", label: "Gizlilik Sözleşmesi" },
  { to: "/visitor-consultant-agreement", label: "Ziyaretçi-Danışan Sözleşmesi" },
  { to: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { to: "/aydinlatma-metni", label: "Aydınlatma Metni" },
  { to: "/acik-riza", label: "Açık Rıza Bilgilendirmesi" },
  { to: "/sss", label: "Sıkça Sorulan Sorular" },
  { to: "/comment-rules", label: "Yorum Yayınlanma Kuralları" },
];

const social = [
  { href: "https://www.facebook.com/doktorumol/", label: "Facebook", icon: Facebook },
  { href: "https://www.instagram.com/doktorumolcom.tr", label: "Instagram", icon: Instagram },
];

export default function HomeFooter() {
  return (
    <footer className="bg-home-blue py-10 text-home-ink">
      <div className="home-container">
        <div className="flex flex-col justify-between gap-7 border-b border-home-line pb-8 sm:flex-row sm:items-center">
          <div><Brand /><p className="mt-4 max-w-md text-sm leading-6 text-home-copy">Uzmanlarla güvenli, kolay ve hızlı bir şekilde buluşmanızı sağlayan dijital sağlık platformu.</p></div>
          <div className="flex gap-2.5">
            {social.map(({ href, label, icon: Icon }) => <a key={label} href={href} target="_blank" rel="me noopener noreferrer" aria-label={`Doktorum Ol ${label}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-home-brand shadow-sm transition-transform hover:-translate-y-1"><Icon size={17} /></a>)}
            <a href="https://x.com/Doktorum_Ol" target="_blank" rel="me noopener noreferrer" aria-label="Doktorum Ol X" className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-sm font-bold text-home-brand shadow-sm transition-transform hover:-translate-y-1">X</a>
            <a href="https://tr.linkedin.com/company/doktorum-ol" target="_blank" rel="me noopener noreferrer" aria-label="Doktorum Ol LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-home-brand shadow-sm transition-transform hover:-translate-y-1"><Linkedin size={17} /></a>
          </div>
        </div>
        <nav aria-label="Yasal ve destek bağlantıları" className="flex flex-wrap justify-center gap-2 py-7">
          {legalLinks.map((item) => <Link key={item.to} to={item.to} className="rounded-full border border-home-line bg-background px-4 py-2 text-[11px] font-medium text-home-ink transition-colors hover:text-home-brand">{item.label}</Link>)}
          {canShowLegalCandidate(publication.documents.call, window.location.hostname) && <Link to="/cagri-merkezi-aydinlatma-metni" className="rounded-full border border-home-line bg-background px-4 py-2 text-[11px] font-medium text-home-ink">Çağrı Merkezi Aydınlatma Metni</Link>}
          <button type="button" onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))} className="rounded-full border border-home-line bg-background px-4 py-2 text-[11px] font-medium text-home-ink">Çerez Tercihleri</button>
        </nav>
        <p className="rounded-2xl border border-background/70 bg-background/45 p-5 text-center text-[11px] leading-5 text-home-copy">Doktorumol.com.tr, sağlık profesyonelleri ile danışanlar arasında köprü kuran bağımsız bir dijital platformdur. Platformumuzda paylaşılan görüşler, ilgili uzmanların talebi veya ricası olmaksızın, kullanıcılar tarafından özgür iradeleriyle kaleme alınmaktadır. Amacımız, kamuoyunu sağlık konularında bilgilendirmek ve doktora ulaşım sürecini şeffaflaştırmaktır. Web sitemiz, herhangi bir sağlık kurumunu veya uzmanını referans göstermemekte; yalnızca bilgi sunumu ve erişim desteği sağlamaktadır.</p>
        <p className="mt-8 border-t border-home-line pt-6 text-center text-xs font-medium text-home-copy">Doktorumol.com.tr © Copyright 2026. Tüm Hakları saklıdır.</p>
      </div>
    </footer>
  );
}
