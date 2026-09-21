import { Suspense, lazy, useEffect, useState } from "react";
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
import { useNetworkRecovery } from "@/hooks/useNetworkRecovery";
import { useNativeApp } from "@/hooks/useNativeApp";
import ErrorBoundary from "./components/ErrorBoundary";
import { Button } from "@/components/ui/button";

// Critical pages - eagerly loaded
import Index from "./pages/Index";
import SpecialOfferNew from "./pages/SpecialOfferNew";
const DokiLogos = lazy(() => import("./pages/DokiLogos"));

// Lazy loaded pages - reduces initial bundle significantly
const MobileHome = lazy(() => import("./pages/mobile/MobileHome"));
const MobileSearch = lazy(() => import("./pages/mobile/MobileSearch"));
const MobileProfile = lazy(() => import("./pages/mobile/MobileProfile"));
const MobileSpecialistDetail = lazy(() => import("./pages/mobile/MobileSpecialistDetail"));
const MobileBooking = lazy(() => import("./pages/mobile/MobileBooking"));
const MobileAppointments = lazy(() => import("./pages/mobile/MobileAppointments"));
const MobileTests = lazy(() => import("./pages/mobile/MobileTests"));
const MobileTestTaker = lazy(() => import("./pages/mobile/MobileTestTaker"));
const MobileLogin = lazy(() => import("./pages/mobile/MobileLogin"));
const MobileSignup = lazy(() => import("./pages/mobile/MobileSignup"));
const MobileDashboard = lazy(() => import("./pages/mobile/MobileDashboard"));
const MobilePatientDashboard = lazy(() => import("./pages/mobile/MobilePatientDashboard"));
const MobilePatientAppointments = lazy(() => import("./pages/mobile/MobilePatientAppointments"));
const MobilePatientFavorites = lazy(() => import("./pages/mobile/MobilePatientFavorites"));
const MobilePatientProfile = lazy(() => import("./pages/mobile/MobilePatientProfile"));
const MobilePatientTests = lazy(() => import("./pages/mobile/MobilePatientTests"));
const MobileSpecialistAppointments = lazy(() => import("./pages/mobile/MobileSpecialistAppointments"));
const MobileSpecialistNewAppointment = lazy(() => import("./pages/mobile/MobileSpecialistNewAppointment"));
const MobileSpecialistClients = lazy(() => import("./pages/mobile/MobileSpecialistClients"));
const MobileSpecialistProfile = lazy(() => import("./pages/mobile/MobileSpecialistProfile"));
const MobileSpecialistBlog = lazy(() => import("./pages/mobile/MobileSpecialistBlog"));
const MobileSpecialistContracts = lazy(() => import("./pages/mobile/MobileSpecialistContracts"));
const MobileSpecialistSupport = lazy(() => import("./pages/mobile/MobileSpecialistSupport"));
const MobileSpecialistSubscription = lazy(() => import("./pages/mobile/MobileSpecialistSubscription"));
const MobileSpecialistReferrals = lazy(() => import("./pages/mobile/MobileSpecialistReferrals"));
const MobileSpecialistPortfolio = lazy(() => import("./pages/mobile/MobileSpecialistPortfolio"));
const MobileBlogDetail = lazy(() => import("./pages/mobile/MobileBlogDetail"));
const MobileBlog = lazy(() => import("./pages/mobile/MobileBlog"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));

const DoctorList = lazy(() => import("./pages/DoctorList"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile"));
const SpecialistReviewPage = lazy(() => import("./pages/SpecialistReviewPage"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const DanismanlikRandevusuAl = lazy(() => import("./pages/DanismanlikRandevusuAl"));
const RandevuSayfasi = lazy(() => import("./pages/RandevuSayfasi"));
const SpecialtyPage = lazy(() => import("./pages/SpecialtyPage"));
const Packages = lazy(() => import("./pages/Packages"));
const CampaignPackage = lazy(() => import("./pages/CampaignPackage"));
const CampaignPremiumPackage = lazy(() => import("./pages/CampaignPremiumPackage"));
const SpecialOffer = lazy(() => import("./pages/SpecialOffer"));
// Reklam trafiği gelen kampanya sayfası: ayrı dosya beklemesin diye ana pakette
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DisclosureText = lazy(() => import("./pages/DisclosureText"));
const ExplicitConsent = lazy(() => import("./pages/ExplicitConsent"));
const DistanceSalesContract = lazy(() => import("./pages/DistanceSalesContract"));
const VisitorConsultantAgreement = lazy(() => import("./pages/VisitorConsultantAgreement"));
const CommentRules = lazy(() => import("./pages/CommentRules"));
const SSS = lazy(() => import("./pages/SSS"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TestInterface = lazy(() => import("./components/TestInterface"));
const TestTaking = lazy(() => import("./components/TestTaking"));
const TestResult = lazy(() => import("./pages/TestResult"));
const SpecialistRegistration = lazy(() => import("./pages/SpecialistRegistration"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const PatientSignup = lazy(() => import("./pages/PatientSignup"));
const PatientLogin = lazy(() => import("./pages/PatientLogin"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PartnerLogin = lazy(() => import("./pages/PartnerLogin"));
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));
// The panel is a large, self-contained workspace. Never reject its import with
// an artificial timer: Safari can still be downloading it on slower devices.
// Real module failures are handled globally by the vite:preloadError listener.
const AdminWorkspace = lazy(() => import("./pages/admin/AdminWorkspace"));
const Career = lazy(() => import("./pages/Career"));

// Doctor pages
const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard"));

const PageLoader = () => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setTimedOut(true), 15_000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-background px-4" role="status" aria-live="polite">
      {timedOut ? (
        <div className="max-w-sm text-center">
          <p className="mb-2 font-semibold text-foreground">Sayfa bağlantısı gecikti</p>
          <p className="mb-4 text-sm text-muted-foreground">İnternetiniz çalışıyor olsa da panel dosyası alınamadı.</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
          Sayfa yükleniyor...
        </div>
      )}
    </div>
  );
};

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
        <Suspense fallback={<PageLoader />}>
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
              <Route path="/odeme/:packageType" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/odeme-sayfasi" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/checkout/:packageType" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
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
              <Route path="/odeme/:packageType" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/odeme-sayfasi" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/checkout/:packageType" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
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
        </Suspense>
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
