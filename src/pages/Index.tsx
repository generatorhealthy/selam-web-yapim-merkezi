import { Helmet } from "react-helmet-async";
import AppDownloadSheet from "@/components/AppDownloadSheet";
import HomeHeader from "@/components/home/HomeHeader";
import Hero from "@/components/home/Hero";
import PromoCards from "@/components/home/PromoCards";
import AppointmentSection from "@/components/home/AppointmentSection";
import AppSection from "@/components/home/AppSection";
import Testimonials from "@/components/home/Testimonials";
import FeaturedExperts from "@/components/home/FeaturedExperts";
import ExpertJoin from "@/components/home/ExpertJoin";
import BlogSection from "@/components/home/BlogSection";
import FAQ from "@/components/home/FAQ";
import HomeFooter from "@/components/home/HomeFooter";
import "@/components/home/home.css";

export default function Index() {
  return (
    <div className="home-page min-h-screen bg-background">
      <Helmet>
        <title>Doktorum Ol | Yeni Nesil Sağlık Teknolojileri</title>
        <meta name="description" content="Doktorum Ol; uzmanlara özel yazılım, yapay zekâ destekli otomasyon, online randevu, danışan takip sistemleri ve yenilikçi dijital yönetim çözümleri sunar." />
        <link rel="canonical" href="https://doktorumol.com.tr/" />
        <meta property="og:url" content="https://doktorumol.com.tr/" />
      </Helmet>
      <HomeHeader />
      <main>
        <Hero />
        <PromoCards />
        <AppointmentSection />
        <AppSection />
        <Testimonials />
        <FeaturedExperts />
        <ExpertJoin />
        <BlogSection />
        <FAQ />
      </main>
      <HomeFooter />
      <AppDownloadSheet />
    </div>
  );
}
