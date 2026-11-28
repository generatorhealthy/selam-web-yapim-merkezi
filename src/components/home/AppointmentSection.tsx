import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { clientUrl, iconUrl } from "./media";

export default function AppointmentSection() {
  return (
    <section className="home-wave-section overflow-hidden py-16 md:py-24">
      <div className="home-container relative z-10 grid items-center gap-10 md:grid-cols-2">
        <div className="relative mx-auto w-full max-w-lg">
          <span className="absolute left-[4%] top-[18%] text-5xl font-light leading-none text-home-brand" aria-hidden="true">″</span>
          <img src={clientUrl} alt="Telefonuyla online görüşmeye hazırlanan danışan" width="1000" height="1000" loading="lazy" className="mx-auto w-full max-w-[480px]" />
          <div className="home-float-card left-1/2 right-auto top-[24%] -ml-[145px] w-[290px] justify-center sm:left-auto sm:right-[2%] sm:top-[12%] sm:ml-0 sm:w-auto">
            <img src={iconUrl} alt="" width="36" height="36" />
            <span><strong>Doktorum Ol</strong><small>Görüşmeniz başlamak üzere</small></span>
          </div>
        </div>
        <div className="max-w-lg">
          <p className="text-sm font-medium text-home-copy">Bekleme derdi artık yok!</p>
          <h2 className="home-section-title mt-3">Görüşmenizi hallolmuş bilin</h2>
          <p className="mt-5 text-base leading-7 text-home-copy">Uygun saati seçin, randevunuz anında onaylansın. Hatırlatmalar zamanında gelsin, görüşmeye tek dokunuşla bağlanın.</p>
          <Link to="/danismanlik-randevusu-al" className="home-button home-button-outline mt-7">Detaylı bilgi <ArrowUpRight size={17} /></Link>
        </div>
      </div>
    </section>
  );
}
