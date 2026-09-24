import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { usePlatform } from "@/hooks/usePlatform";
import { MobileLayout } from "@/components/MobileLayout";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useNetworkRecovery } from "@/hooks/useNetworkRecovery";
import { useNativeApp } from "@/hooks/useNativeApp";
import Index from "./pages/Index";
import SpecialOfferNew from "./pages/SpecialOfferNew";
import DokiLogos from "./pages/DokiLogos";
import AdminWorkspace from "./pages/admin/AdminWorkspace";
import MobileHome from "./pages/mobile/MobileHome";
import MobileSearch from "./pages/mobile/MobileSearch";
import MobileProfile from "./pages/mobile/MobileProfile";
import MobileSpecialistDetail from "./pages/mobile/MobileSpecialistDetail";
import MobileBooking from "./pages/mobile/MobileBooking";
import MobileAppointments from "./pages/mobile/MobileAppointments";
import MobileTests from "./pages/mobile/MobileTests";
import MobileTestTaker from "./pages/mobile/MobileTestTaker";
import MobileLogin from "./pages/mobile/MobileLogin";
import MobileSignup from "./pages/mobile/MobileSignup";
import MobileDashboard from "./pages/mobile/MobileDashboard";
import MobilePatientDashboard from "./pages/mobile/MobilePatientDashboard";
import MobilePatientAppointments from "./pages/mobile/MobilePatientAppointments";
import MobilePatientFavorites from "./pages/mobile/MobilePatientFavorites";
import MobilePatientProfile from "./pages/mobile/MobilePatientProfile";
import MobilePatientTests from "./pages/mobile/MobilePatientTests";
import MobileSpecialistAppointments from "./pages/mobile/MobileSpecialistAppointments";
import MobileSpecialistNewAppointment from "./pages/mobile/MobileSpecialistNewAppointment";
import MobileSpecialistClients from "./pages/mobile/MobileSpecialistClients";
import MobileSpecialistProfile from "./pages/mobile/MobileSpecialistProfile";
import MobileSpecialistBlog from "./pages/mobile/MobileSpecialistBlog";
import MobileSpecialistContracts from "./pages/mobile/MobileSpecialistContracts";
import MobileSpecialistSupport from "./pages/mobile/MobileSpecialistSupport";
import MobileSpecialistSubscription from "./pages/mobile/MobileSpecialistSubscription";
import MobileSpecialistReferrals from "./pages/mobile/MobileSpecialistReferrals";
import MobileSpecialistPortfolio from "./pages/mobile/MobileSpecialistPortfolio";
import MobileBlogDetail from "./pages/mobile/MobileBlogDetail";
import MobileBlog from "./pages/mobile/MobileBlog";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import DoctorList from "./pages/DoctorList";
import DoctorProfile from "./pages/DoctorProfile";
import SpecialistReviewPage from "./pages/SpecialistReviewPage";
import BookAppointment from "./pages/BookAppointment";
import DanismanlikRandevusuAl from "./pages/DanismanlikRandevusuAl";
import RandevuSayfasi from "./pages/RandevuSayfasi";
import SpecialtyPage from "./pages/SpecialtyPage";
import Packages from "./pages/Packages";
import CampaignPackage from "./pages/CampaignPackage";
import CampaignPremiumPackage from "./pages/CampaignPremiumPackage";
import SpecialOffer from "./pages/SpecialOffer";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Privacy from "./pages/Privacy";
import DisclosureText from "./pages/DisclosureText";
import ExplicitConsent from "./pages/ExplicitConsent";
import DistanceSalesContract from "./pages/DistanceSalesContract";
import VisitorConsultantAgreement from "./pages/VisitorConsultantAgreement";
import CommentRules from "./pages/CommentRules";
import SSS from "./pages/SSS";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import TestInterface from "./components/TestInterface";
import TestTaking from "./components/TestTaking";
import TestResult from "./pages/TestResult";
import SpecialistRegistration from "./pages/SpecialistRegistration";
import VoiceAssistant from "./pages/VoiceAssistant";
import PatientSignup from "./pages/PatientSignup";
import PatientLogin from "./pages/PatientLogin";
import PatientDashboard from "./pages/PatientDashboard";
import ResetPassword from "./pages/ResetPassword";
import PartnerLogin from "./pages/PartnerLogin";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import Career from "./pages/Career";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";

// Create QueryClient outside of component to prevent re-creation on renders.
// Aggressive caching = clicks return cached data instantly, refetch happens in background.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,        // 5 min: data considered fresh
      gcTime: 1000 * 60 * 30,          // 30 min: keep in memory
      refetchOnWindowFocus: false,     // don't refetch when tabbing back
      refetchOnReconnect: false,
      refetchOnMount: false,           // use cache instantly on remount
    },
  },
});

const LegacyBlogRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/blog/${slug}` : "/blog"} replace />;
};

const MobileBlogDetailRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/mobile/blog/${slug}` : "/mobile/home"} replace />;
};

const AppContent = () => {
  const { isNative } = usePlatform();
  useNetworkRecovery();
  useNativeApp();

  return (
    <>
      <ScrollToTop />
      <AnalyticsTracker />
      <CookieConsent />
      <FloatingWhatsAppButton />
        <ErrorBoundary>
        <Routes>
          <Route path="/doki-logos" element={<DokiLogos />} />
          {/* Mobile Routes */}
          {isNative && (
            <Route path="/mobile" element={<MobileLayout />}>
              <Route index element={<Navigate to="/mobile/home" replace />} />
              <Route path="home" element={<MobileHome />} />
              <Route path="search" element={<MobileSearch />} />
              <Route path="specialist/:id" element={<MobileSpecialistDetail />} />
              <Route path="booking/:specialistId" element={<MobileBooking />} />
              <Route path="appointments" element={<MobileAppointments />} />
              <Route path="tests" element={<MobileTests />} />
              <Route path="tests/:testId" element={<MobileTestTaker />} />
              <Route path="profile" element={<MobileProfile />} />
              <Route path="login" element={<MobileLogin />} />
              <Route path="dashboard" element={<MobileDashboard />} />
              <Route path="specialist-appointments" element={<MobileSpecialistAppointments />} />
              <Route path="specialist-appointments/new" element={<MobileSpecialistNewAppointment />} />
              <Route path="specialist-clients" element={<MobileSpecialistClients />} />
              <Route path="specialist-profile" element={<MobileSpecialistProfile />} />
              <Route path="specialist-blog" element={<MobileSpecialistBlog />} />
              <Route path="specialist-contracts" element={<MobileSpecialistContracts />} />
              <Route path="specialist-support" element={<MobileSpecialistSupport />} />
              <Route path="specialist-subscription" element={<MobileSpecialistSubscription />} />
              <Route path="specialist-referrals" element={<MobileSpecialistReferrals />} />
              <Route path="specialist-portfolio" element={<MobileSpecialistPortfolio />} />
              <Route path="blog" element={<MobileBlog />} />
              <Route path="blog/:slug" element={<MobileBlogDetail />} />
              <Route path="register" element={<SpecialistRegistration />} />
              <Route path="signup" element={<MobileSignup />} />
              <Route path="patient-dashboard" element={<MobilePatientDashboard />} />
              <Route path="patient-appointments" element={<MobilePatientAppointments />} />
              <Route path="patient-favorites" element={<MobilePatientFavorites />} />
              <Route path="patient-profile" element={<MobilePatientProfile />} />
              <Route path="patient-tests" element={<MobilePatientTests />} />
            </Route>
          )}

          {/* Native: blog detay için /blog/:slug → mobil detay rotasına yönlendir */}
          {isNative && (
            <Route path="/blog/:slug" element={<MobileBlogDetailRedirect />} />
          )}

          {/* Native: ödeme & yasal sayfalara erişim (kayıt akışı için gerekli) */}
          {isNative && (
            <>
              <Route path="/odeme/:packageType" element={<Checkout />} />
              <Route path="/odeme-sayfasi" element={<Checkout />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/:packageType" element={<Checkout />} />
              <Route path="/odeme-basarili" element={<PaymentSuccess />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/gizlilik-politikasi" element={<Privacy />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/aydinlatma-metni" element={<DisclosureText />} />
              <Route path="/disclosure-text" element={<DisclosureText />} />
              <Route path="/acik-riza" element={<ExplicitConsent />} />
              <Route path="/explicit-consent" element={<ExplicitConsent />} />
              <Route path="/ziyaretci-danisman-sozlesmesi" element={<VisitorConsultantAgreement />} />
              <Route path="/visitor-consultant-agreement" element={<VisitorConsultantAgreement />} />
              <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSalesContract />} />
              <Route path="/distance-sales-contract" element={<DistanceSalesContract />} />
              <Route path="/kayit-ol" element={<SpecialistRegistration />} />
              <Route path="/sesli-asistan" element={<VoiceAssistant />} />
            </>
          )}

          {/* Redirect root to mobile if native */}
          {isNative ? (
            <Route path="/" element={<Navigate to="/mobile/home" replace />} />
          ) : (
            <>
              {/* Web Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/hakkimizda" element={<About />} />
              <Route path="/iletisim" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/blog" element={<Navigate to="/blog" replace />} />
              <Route path="/blog/partner-giris" element={<Navigate to="/partner-giris" replace />} />
              <Route path="/blog/partner" element={<Navigate to="/partner" replace />} />
              <Route path="/blog/ozel-firsat" element={<Navigate to="/ozel-firsat" replace />} />
              <Route path="/blog/bu-aya-ozel" element={<Navigate to="/bu-aya-ozel" replace />} />
              <Route path="/blog/danismanlik-randevusu-al" element={<Navigate to="/danismanlik-randevusu-al" replace />} />
              <Route path="/danismanlik-randevusu-al" element={<DanismanlikRandevusuAl />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/yazilar/:slug" element={<LegacyBlogRedirect />} />
              <Route path="/uzmanlar" element={<DoctorList />} />
              <Route path="/:specialtySlug/:doctorName/uzmani-degerlendir" element={<SpecialistReviewPage />} />
              <Route path="/:specialtySlug/:doctorName" element={<DoctorProfile />} />
              <Route path="/randevu-al/:specialtySlug/:doctorName" element={<BookAppointment />} />
              <Route path="/randevu-sayfasi" element={<RandevuSayfasi />} />
              <Route path="/uzmanlik/:specialty" element={<SpecialtyPage />} />
              <Route path="/paketler" element={<Navigate to="/ozel-firsat" replace />} />
              
              <Route path="/kampanyali-paket" element={<CampaignPackage />} />
              <Route path="/kampanyali-premium-paket" element={<CampaignPremiumPackage />} />
              <Route path="/indirimli-paket" element={<Navigate to="/ozel-firsat" replace />} />
              <Route path="/bu-aya-ozel" element={<SpecialOffer />} />
              <Route path="/ozel-firsat" element={<SpecialOfferNew />} />
              <Route path="/odeme/:packageType" element={<Checkout />} />
              <Route path="/odeme-sayfasi" element={<Checkout />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/:packageType" element={<Checkout />} />
              <Route path="/odeme-basarili" element={<PaymentSuccess />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/gizlilik-politikasi" element={<Privacy />} />
              <Route path="/disclosure-text" element={<DisclosureText />} />
              <Route path="/aydinlatma-metni" element={<DisclosureText />} />
              <Route path="/acik-riza" element={<ExplicitConsent />} />
              <Route path="/explicit-consent" element={<ExplicitConsent />} />
              <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSalesContract />} />
              <Route path="/visitor-consultant-agreement" element={<VisitorConsultantAgreement />} />
              <Route path="/ziyaretci-danisan-sozlesmesi" element={<VisitorConsultantAgreement />} />
              <Route path="/comment-rules" element={<CommentRules />} />
              <Route path="/yorum-kurallari" element={<CommentRules />} />
              <Route path="/sss" element={<SSS />} />
              <Route path="/sikca-sorulan-sorular" element={<SSS />} />
              <Route path="/anasayfa" element={<Landing />} />
              <Route path="/giris-yap" element={<LoginPage />} />
              <Route path="/sifre-sifirla" element={<ResetPassword />} />
              <Route path="/kayit-ol" element={<SpecialistRegistration />} />
              <Route path="/sesli-asistan" element={<VoiceAssistant />} />
              <Route path="/uye-ol" element={<PatientSignup />} />
              <Route path="/danisan-giris" element={<PatientLogin />} />
              <Route path="/danisan-paneli" element={<PatientDashboard />} />

              {/* Partner Portal */}
              <Route path="/partner-giris" element={<PartnerLogin />} />
              <Route path="/partner" element={<PartnerDashboard />} />
              
              
              {/* Panel is one self-contained workspace; cards never fetch another page chunk. */}
              <Route path="/divan_paneli/*" element={<AdminWorkspace />} />
              <Route path="/kariyer" element={<Career />} />
              
                
              {/* Test Routes */}
              <Route path="/test/:testId" element={<TestInterface />} />
              <Route path="/test/:testId/:specialistId" element={<TestInterface />} />
              <Route path="/test-al/:testId" element={<TestTaking />} />
              <Route path="/test-al/:testId/:specialistId" element={<TestTaking />} />
              <Route path="/test-sonuc/:testId/:specialistId" element={<TestResult />} />
              <Route path="/:specialtySlug/:specialistName/test/:testId" element={<TestInterface />} />
              <Route path="/:specialtySlug/:specialistName/uzmani-degerlendir" element={<SpecialistReviewPage />} />
              <Route path="/:specialtySlug/:specialistName" element={<DoctorProfile />} />
              
              {/* Doctor Routes */}
              <Route path="/doktor-paneli" element={<DoctorDashboard />} />
              
              {/* Dynamic catch-all for legacy blog slugs - handled by .htaccess in production */}
              
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
        </ErrorBoundary>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
