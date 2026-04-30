import logo1 from "@/assets/doki-logo-option-1.png";
import logo2 from "@/assets/doki-logo-option-2.png";
import logo3 from "@/assets/doki-logo-option-3.png";
import logo4 from "@/assets/doki-logo-option-4.png";
import logo5 from "@/assets/doki-logo-option-5.png";

const options = [
  { id: 1, src: logo1, title: "Klasik Asterisk", desc: "Doktorum Ol'a en yakın, sade ve profesyonel" },
  { id: 2, src: logo2, title: "Robot Maskot", desc: "Sevimli AI asistan karakteri" },
  { id: 3, src: logo3, title: "Sohbet Balonu + Yıldız", desc: "AI chatbot kimliği" },
  { id: 4, src: logo4, title: "Parıltılı Yıldız", desc: "Premium gradient + AI sparkle" },
  { id: 5, src: logo5, title: "D Monogram + Yıldız", desc: "Marka harfi birleşimi" },
];

export default function DokiLogos() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Doki Logo Seçenekleri</h1>
        <p className="text-muted-foreground mb-8">5 seçenek arasından beğendiğini söyle.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((o) => (
            <div key={o.id} className="bg-card border rounded-2xl p-6 flex flex-col items-center shadow-sm">
              <div className="w-40 h-40 flex items-center justify-center bg-white rounded-xl mb-4">
                <img src={o.src} alt={o.title} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="text-sm font-semibold text-primary">Seçenek {o.id}</div>
              <div className="text-lg font-bold mt-1">{o.title}</div>
              <div className="text-sm text-muted-foreground text-center mt-1">{o.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
