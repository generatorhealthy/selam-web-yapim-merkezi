import { Check, Star, Calendar, Search, Bell } from "lucide-react";

const APP_STORE = "https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=app.lovable.doktorumol";

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
    <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.67 1.37-.58.67-1.09 1.75-.96 2.79 1.02.08 2.06-.52 2.69-1.27z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <path fill="#34A853" d="M3.6 2.3 13.5 12l-9.9 9.7c-.3-.2-.5-.6-.5-1.1V3.4c0-.5.2-.9.5-1.1z" />
    <path fill="#FBBC04" d="m17 8.6-3.5 3.4L17 15.4l4-2.3c.9-.5.9-1.7 0-2.2z" />
    <path fill="#4285F4" d="M3.6 2.3c.3-.2.8-.2 1.2 0L17 8.6 13.5 12z" />
    <path fill="#EA4335" d="M13.5 12 17 15.4 4.8 21.7c-.4.2-.9.2-1.2 0z" />
  </svg>
);

const Phone = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`relative w-[150px] sm:w-[170px] aspect-[9/19] rounded-[2rem] bg-gray-900 p-[6px] shadow-2xl ${className}`}>
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-gray-900 rounded-full z-10" />
    <div className="w-full h-full rounded-[1.6rem] bg-white overflow-hidden">{children}</div>
  </div>
);

const Line = ({ w = "w-full", c = "bg-gray-200" }: { w?: string; c?: string }) => <div className={`h-1.5 rounded-full ${c} ${w}`} />;

const AppPromoSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 py-16">
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-2xl" />
    <div className="absolute -bottom-32 -left-20 w-[30rem] h-[30rem] bg-indigo-400/20 rounded-full blur-3xl" />
    <div className="container mx-auto px-4 relative">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white">
          <span className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs font-semibold mb-4">
            <Bell className="w-3.5 h-3.5" /> Yeni · Mobil Uygulama
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
            Doktorum Ol<br />Mobil Uygulaması
          </h2>
          <p className="mt-4 text-blue-50 leading-relaxed max-w-lg">
            Sağlık hizmetlerine erişim artık çok daha kolay! Randevularınızı yönetin, uzmanlarla iletişime geçin ve sağlık içeriklerine her an ulaşın.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              ["Tek ekrandan ", "yüzlerce uzmana", " hızlı erişim"],
              ["", "Online randevu takibi", " ve bildirimler"],
              ["Güncel ", "sağlık içeriklerine", " anında erişim"],
            ].map(([a, b, c], i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </span>
                <span className="text-blue-50">{a}<strong className="text-white">{b}</strong>{c}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={APP_STORE} target="_blank" rel="noopener noreferrer" aria-label="App Store'dan indir"
              className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white rounded-xl px-5 py-2.5 shadow-lg transition-transform hover:-translate-y-0.5">
              <AppleIcon />
              <span className="leading-tight text-left"><span className="block text-[10px] opacity-80">İndir</span><span className="block font-semibold">App Store</span></span>
            </a>
            <a href={PLAY_STORE} target="_blank" rel="noopener noreferrer" aria-label="Google Play'den indir"
              className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white rounded-xl px-5 py-2.5 shadow-lg transition-transform hover:-translate-y-0.5">
              <PlayIcon />
              <span className="leading-tight text-left"><span className="block text-[10px] opacity-80">İndir</span><span className="block font-semibold">Google Play</span></span>
            </a>
          </div>
        </div>

        <div className="relative flex justify-center items-end h-[380px] sm:h-[420px]">
          <Phone className="absolute left-1/2 -translate-x-[130%] sm:-translate-x-[135%] bottom-4 -rotate-6 scale-90 opacity-95">
            <div className="p-3 pt-7 space-y-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 mx-auto" />
              <Line w="w-2/3 mx-auto" c="bg-gray-300" />
              <Line w="w-1/2 mx-auto" c="bg-blue-200" />
              <div className="h-6 rounded-lg bg-blue-600 mt-3" />
              <div className="grid grid-cols-3 gap-1 pt-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded bg-gray-100" />)}</div>
              <Line /><Line w="w-4/5" /><Line w="w-3/5" />
            </div>
          </Phone>
          <Phone className="relative z-10 bottom-8">
            <div className="bg-blue-600 px-3 pt-7 pb-3 text-white">
              <p className="text-[9px] opacity-80">Merhaba</p>
              <p className="text-xs font-bold">Doktorum Ol</p>
              <div className="mt-2 flex items-center gap-1 bg-white rounded-md px-2 py-1">
                <Search className="w-2.5 h-2.5 text-gray-400" /><Line w="w-2/3" />
              </div>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-[9px] font-semibold text-gray-700">Popüler Branşlar</p>
              <div className="flex gap-1">{["Psikolog","Diyetisyen"].map(t => <span key={t} className="text-[7px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{t}</span>)}</div>
              <p className="text-[9px] font-semibold text-gray-700 pt-1">Son Değerlendirmeler</p>
              {[1,2].map(i => (
                <div key={i} className="rounded-lg border border-gray-100 p-1.5 space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-indigo-200" />
                    <div className="flex">{[...Array(5)].map((_, s) => <Star key={s} className="w-2 h-2 text-yellow-400 fill-yellow-400" />)}</div>
                  </div>
                  <Line /><Line w="w-3/4" />
                </div>
              ))}
              <div className="flex items-center gap-1 rounded-lg bg-green-50 p-1.5">
                <Calendar className="w-3 h-3 text-green-600" /><span className="text-[8px] text-green-700 font-medium">Randevunuz onaylandı</span>
              </div>
            </div>
          </Phone>
          <Phone className="absolute left-1/2 translate-x-[30%] sm:translate-x-[35%] bottom-4 rotate-6 scale-90 opacity-95">
            <div className="p-3 pt-7 space-y-2">
              <p className="text-[9px] font-semibold text-gray-700">Makaleler</p>
              {[1,2,3].map(i => (
                <div key={i} className="space-y-1">
                  <div className="h-14 rounded-lg bg-gradient-to-br from-slate-200 to-blue-100" />
                  <Line w="w-4/5" c="bg-gray-300" /><Line w="w-1/2" />
                </div>
              ))}
            </div>
          </Phone>
          <div className="absolute z-20 right-0 sm:right-4 bottom-0 bg-white rounded-xl shadow-xl px-4 py-3">
            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
            <p className="text-xs text-gray-700 mt-1 leading-snug">Kullanıcılar tarafından<br />yüksek puan</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AppPromoSection;
