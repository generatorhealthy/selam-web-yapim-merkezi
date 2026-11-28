const items = ["ONLINE GÖRÜŞME", "YÜZ YÜZE RANDEVU", "GÜVENLİ PLATFORM"];

function MarqueeContent({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => <div key={item} className="flex items-center gap-10 pr-10 text-sm font-bold tracking-[0.06em]"><span>{item}</span><span aria-hidden="true">✦</span></div>)}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="overflow-hidden bg-home-brand py-4 text-primary-foreground" aria-label="Online görüşme, yüz yüze randevu, güvenli platform">
      <div className="home-marquee-track"><MarqueeContent /><MarqueeContent hidden /><MarqueeContent hidden /><MarqueeContent hidden /></div>
    </div>
  );
}
