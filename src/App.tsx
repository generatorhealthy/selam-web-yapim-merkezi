import { Suspense } from "react";
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
import SuspenseTimeoutFallback from "@/components/SuspenseTimeoutFallback";

// Critical pages - eagerly loaded
import Index from "./pages/Index";
import SpecialOfferNew from "./pages/SpecialOfferNew";
import AdminWorkspace from "./pages/admin/AdminWorkspace";
import { safeLazy } from "@/utils/safeLazy";
const DokiLogos = safeLazy(() => import("./pages/DokiLogos"));

// Lazy loaded pages - reduces initial bundle significantly
const MobileHome = safeLazy(() => import("./pages/mobile/MobileHome"));
const MobileSearch = safeLazy(() => import("./pages/mobile/MobileSearch"));
const MobileProfile = safeLazy(() => import("./pages/mobile/MobileProfile"));
const MobileSpecialistDetail = safeLazy(() => import("./pages/mobile/MobileSpecialistDetail"));
const MobileBooking = safeLazy(() => import("./pages/mobile/MobileBooking"));
const MobileAppointments = safeLazy(() => import("./pages/mobile/MobileAppointments"));
const MobileTests = safeLazy(() => import("./pages/mobile/MobileTests"));
const MobileTestTaker = safeLazy(() => import("./pages/mobile/MobileTestTaker"));
const MobileLogin = safeLazy(() => import("./pages/mobile/MobileLogin"));
const MobileSignup = safeLazy(() => import("./pages/mobile/MobileSignup"));
const MobileDashboard = safeLazy(() => import("./pages/mobile/MobileDashboard"));
const MobilePatientDashboard = safeLazy(() => import("./pages/mobile/MobilePatientDashboard"));
const MobilePatientAppointments = safeLazy(() => import("./pages/mobile/MobilePatientAppointments"));
const MobilePatientFavorites = safeLazy(() => import("./pages/mobile/MobilePatientFavorites"));
const MobilePatientProfile = safeLazy(() => import("./pages/mobile/MobilePatientProfile"));
const MobilePatientTests = safeLazy(() => import("./pages/mobile/MobilePatientTests"));
const MobileSpecialistAppointments = safeLazy(() => import("./pages/mobile/MobileSpecialistAppointments"));
const MobileSpecialistNewAppointment = safeLazy(() => import("./pages/mobile/MobileSpecialistNewAppointment"));
const MobileSpecialistClients = safeLazy(() => import("./pages/mobile/MobileSpecialistClients"));
const MobileSpecialistProfile = safeLazy(() => import("./pages/mobile/MobileSpecialistProfile"));
const MobileSpecialistBlog = safeLazy(() => import("./pages/mobile/MobileSpecialistBlog"));
const MobileSpecialistContracts = safeLazy(() => import("./pages/mobile/MobileSpecialistContracts"));
const MobileSpecialistSupport = safeLazy(() => import("./pages/mobile/MobileSpecialistSupport"));
const MobileSpecialistSubscription = safeLazy(() => import("./pages/mobile/MobileSpecialistSubscription"));
const MobileSpecialistReferrals = safeLazy(() => import("./pages/mobile/MobileSpecialistReferrals"));
const MobileSpecialistPortfolio = safeLazy(() => import("./pages/mobile/MobileSpecialistPortfolio"));
const MobileBlogDetail = safeLazy(() => import("./pages/mobile/MobileBlogDetail"));
const MobileBlog = safeLazy(() => import("./pages/mobile/MobileBlog"));
const About = safeLazy(() => import("./pages/About"));
const Contact = safeLazy(() => import("./pages/Contact"));
const Blog = safeLazy(() => import("./pages/Blog"));
const BlogDetail = safeLazy(() => import("./pages/BlogDetail"));

const DoctorList = safeLazy(() => import("./pages/DoctorList"));
const DoctorProfile = safeLazy(() => import("./pages/DoctorProfile"));
const SpecialistReviewPage = safeLazy(() => import("./pages/SpecialistReviewPage"));
const BookAppointment = safeLazy(() => import("./pages/BookAppointment"));
const DanismanlikRandevusuAl = safeLazy(() => import("./pages/DanismanlikRandevusuAl"));
const RandevuSayfasi = safeLazy(() => import("./pages/RandevuSayfasi"));
const SpecialtyPage = safeLazy(() => import("./pages/SpecialtyPage"));
const Packages = safeLazy(() => import("./pages/Packages"));
const CampaignPackage = safeLazy(() => import("./pages/CampaignPackage"));
const CampaignPremiumPackage = safeLazy(() => import("./pages/CampaignPremiumPackage"));
const SpecialOffer = safeLazy(() => import("./pages/SpecialOffer"));
// Reklam trafiği gelen kampanya sayfası: ayrı dosya beklemesin diye ana pakette
const Checkout = safeLazy(() => import("./pages/Checkout"));
const PaymentSuccess = safeLazy(() => import("./pages/PaymentSuccess"));
const Privacy = safeLazy(() => import("./pages/Privacy"));
const DisclosureText = safeLazy(() => import("./pages/DisclosureText"));
const ExplicitConsent = safeLazy(() => import("./pages/ExplicitConsent"));
const DistanceSalesContract = safeLazy(() => import("./pages/DistanceSalesContract"));
const VisitorConsultantAgreement = safeLazy(() => import("./pages/VisitorConsultantAgreement"));
const CommentRules = safeLazy(() => import("./pages/CommentRules"));
const SSS = safeLazy(() => import("./pages/SSS"));
const NotFound = safeLazy(() => import("./pages/NotFound"));
const Landing = safeLazy(() => import("./pages/Landing"));
const LoginPage = safeLazy(() => import("./pages/LoginPage"));
const TestInterface = safeLazy(() => import("./components/TestInterface"));
const TestTaking = safeLazy(() => import("./components/TestTaking"));
const TestResult = safeLazy(() => import("./pages/TestResult"));
const SpecialistRegistration = safeLazy(() => import("./pages/SpecialistRegistration"));
const VoiceAssistant = safeLazy(() => import("./pages/VoiceAssistant"));
const PatientSignup = safeLazy(() => import("./pages/PatientSignup"));
const PatientLogin = safeLazy(() => import("./pages/PatientLogin"));
const PatientDashboard = safeLazy(() => import("./pages/PatientDashboard"));
const ResetPassword = safeLazy(() => import("./pages/ResetPassword"));
const PartnerLogin = safeLazy(() => import("./pages/PartnerLogin"));
const PartnerDashboard = safeLazy(() => import("./pages/partner/PartnerDashboard"));
const Career = safeLazy(() => import("./pages/Career"));

// Doctor pages
const DoctorDashboard = safeLazy(() => import("./pages/doctor/DoctorDashboard"));

// İlk panel dosyası hazırlanırken boş sayfa yerine sabit bir panel iskeleti gösterilir.
// Kart geçişleri AdminWorkspace içinde statiktir ve bu görünümü tekrar açmaz.
const PageLoader = () => (
  <div className="min-h-screen bg-background" aria-label="Sayfa hazırlanıyor">
    <div className="h-16 border-b border-border bg-card" />
    <div className="mx-auto grid max-w-7xl gap-5 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-lg border border-border bg-muted" />
      ))}
    </div>
  </div>
);

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
        <Suspense fallback={<SuspenseTimeoutFallback><PageLoader /></SuspenseTimeoutFallback>}>
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
