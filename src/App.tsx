import { Suspense, lazy } from "react";
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

// Critical pages - eagerly loaded
import Index from "./pages/Index";
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
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const RandevuSayfasi = lazy(() => import("./pages/RandevuSayfasi"));
const SpecialtyPage = lazy(() => import("./pages/SpecialtyPage"));
const Packages = lazy(() => import("./pages/Packages"));
const CampaignPackage = lazy(() => import("./pages/CampaignPackage"));
const CampaignPremiumPackage = lazy(() => import("./pages/CampaignPremiumPackage"));
const SpecialOffer = lazy(() => import("./pages/SpecialOffer"));
const SpecialOfferNew = lazy(() => import("./pages/SpecialOfferNew"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DisclosureText = lazy(() => import("./pages/DisclosureText"));
const ExplicitConsent = lazy(() => import("./pages/ExplicitConsent"));
const DistanceSalesContract = lazy(() => import("./pages/DistanceSalesContract"));
const VisitorConsultantAgreement = lazy(() => import("./pages/VisitorConsultantAgreement"));
const CommentRules = lazy(() => import("./pages/CommentRules"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TestInterface = lazy(() => import("./components/TestInterface"));
const TestTaking = lazy(() => import("./components/TestTaking"));
const TestResult = lazy(() => import("./pages/TestResult"));
const SpecialistRegistration = lazy(() => import("./pages/SpecialistRegistration"));
const PatientSignup = lazy(() => import("./pages/PatientSignup"));
const PatientLogin = lazy(() => import("./pages/PatientLogin"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Admin pages - lazy loaded (never needed on initial visit)
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserCreate = lazy(() => import("./pages/admin/UserCreate"));
const QuickRegister = lazy(() => import("./pages/admin/QuickRegister"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const SpecialistAdd = lazy(() => import("./pages/admin/SpecialistAdd"));
const SpecialistManagement = lazy(() => import("./pages/admin/SpecialistManagement"));
const SpecialistEdit = lazy(() => import("./pages/admin/SpecialistEdit"));
const AppointmentManagement = lazy(() => import("./pages/admin/AppointmentManagement"));
const BlogManagement = lazy(() => import("./pages/admin/BlogManagement"));
const CustomerManagement = lazy(() => import("./pages/admin/CustomerManagement"));
const ReviewManagement = lazy(() => import("./pages/admin/ReviewManagement"));
const PaymentManagement = lazy(() => import("./pages/admin/PaymentManagement"));
const NewOrder = lazy(() => import("./pages/admin/NewOrder"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const BankTransferNotifications = lazy(() => import("./pages/admin/BankTransferNotifications"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const MapboxSettings = lazy(() => import("./pages/admin/MapboxSettings"));
const SuccessStatistics = lazy(() => import("./pages/admin/SuccessStatistics"));
const LegalProceedings = lazy(() => import("./pages/admin/LegalProceedings"));
const EmployeeSalaryManagement = lazy(() => import("./pages/admin/EmployeeSalaryManagement"));
const ClientReferrals = lazy(() => import("./pages/admin/ClientReferrals"));
const ClientCalendar = lazy(() => import("./pages/admin/ClientCalendar"));
const PreInfoFormManagement = lazy(() => import("./pages/admin/PreInfoFormManagement"));
const PackageManagement = lazy(() => import("./pages/admin/PackageManagement"));
const TestManagement = lazy(() => import("./pages/admin/TestManagement"));
const SupportTickets = lazy(() => import("./pages/admin/SupportTickets"));
const ContractManagement = lazy(() => import("./pages/admin/ContractManagement"));
const SmsManagement = lazy(() => import("./pages/admin/SmsManagement"));
const PbxManagement = lazy(() => import("./pages/admin/PbxManagement"));
const ProspectiveRegistrations = lazy(() => import("./pages/admin/ProspectiveRegistrations"));
const LogManagement = lazy(() => import("./pages/admin/LogManagement"));
const SitemapManagement = lazy(() => import("./pages/admin/SitemapManagement"));
const ImageConverter = lazy(() => import("./pages/admin/ImageConverter"));
const SocialMediaManagement = lazy(() => import("./pages/admin/SocialMediaManagement"));
const DatabaseBackup = lazy(() => import("./pages/admin/DatabaseBackup"));
const AccountingDocuments = lazy(() => import("./pages/admin/AccountingDocuments"));
const CallReports = lazy(() => import("./pages/admin/CallReports"));
const IyzicoPayments = lazy(() => import("./pages/admin/IyzicoPayments"));
const LegalEvidenceManagement = lazy(() => import("./pages/admin/LegalEvidenceManagement"));
const CancellationFees = lazy(() => import("./pages/admin/CancellationFees"));
const SpecialistApplications = lazy(() => import("./pages/admin/SpecialistApplications"));
const StaffAttendance = lazy(() => import("./pages/admin/StaffAttendance"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));
const MobileActivityLogs = lazy(() => import("./pages/admin/MobileActivityLogs"));
const AdminAIAssistant = lazy(() => import("./pages/admin/AdminAIAssistant"));
const EmailLogs = lazy(() => import("./pages/admin/EmailLogs"));
const RegistrationAnalytics = lazy(() => import("./pages/admin/RegistrationAnalytics"));
const ConsentLogs = lazy(() => import("./pages/admin/ConsentLogs"));
const BulkEmail = lazy(() => import("./pages/admin/BulkEmail"));
const Career = lazy(() => import("./pages/Career"));
const CareerApplications = lazy(() => import("./pages/admin/CareerApplications"));
const SEOContentManagement = lazy(() => import("./pages/admin/SEOContentManagement"));
const SEOPublishedHistory = lazy(() => import("./pages/admin/SEOPublishedHistory"));
const SpecialistBlogStatus = lazy(() => import("./pages/admin/SpecialistBlogStatus"));

const ErrorBoundary = lazy(() => import("./components/ErrorBoundary"));

// Doctor pages
const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard"));

// Ultra-minimal loading fallback — empty div so navigation feels instant.
// Real content paints immediately when the (already-prefetched) chunk resolves.
const PageLoader = () => <div style={{ minHeight: '50vh' }} />;

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
              <Route path="/blog/ozel-firsat" element={<Navigate to="/ozel-firsat" replace />} />
              <Route path="/blog/bu-aya-ozel" element={<Navigate to="/bu-aya-ozel" replace />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/yazilar/:slug" element={<LegacyBlogRedirect />} />
              <Route path="/uzmanlar" element={<DoctorList />} />
              <Route path="/:specialtySlug/:doctorName" element={<DoctorProfile />} />
              <Route path="/randevu-al/:specialtySlug/:doctorName" element={<BookAppointment />} />
              <Route path="/randevu-sayfasi" element={<RandevuSayfasi />} />
              <Route path="/uzmanlik/:specialty" element={<SpecialtyPage />} />
              <Route path="/paketler" element={<Packages />} />
              
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
              <Route path="/anasayfa" element={<Landing />} />
              <Route path="/giris-yap" element={<LoginPage />} />
              <Route path="/sifre-sifirla" element={<ResetPassword />} />
              <Route path="/kayit-ol" element={<SpecialistRegistration />} />
              <Route path="/uye-ol" element={<PatientSignup />} />
              <Route path="/danisan-giris" element={<PatientLogin />} />
              <Route path="/danisan-paneli" element={<PatientDashboard />} />
              
              {/* Admin Routes - MUST be before dynamic catch-all routes */}
              <Route path="/divan_paneli" element={<AdminAuth />} />
              <Route path="/divan_paneli/dashboard" element={<AdminDashboard />} />
              <Route path="/divan_paneli/tests" element={<TestManagement />} />
              <Route path="/divan_paneli/packages" element={<PackageManagement />} />
              <Route path="/divan_paneli/pre-info-form" element={<PreInfoFormManagement />} />
              <Route path="/divan_paneli/users/create" element={<UserCreate />} />
              <Route path="/divan_paneli/quick-register" element={<QuickRegister />} />
              <Route path="/divan_paneli/users" element={<UserManagement />} />
              <Route path="/divan_paneli/specialists/add" element={<SpecialistAdd />} />
              <Route path="/divan_paneli/specialists" element={<SpecialistManagement />} />
              <Route path="/divan_paneli/specialists/edit/:id" element={<SpecialistEdit />} />
              <Route path="/divan_paneli/client-referrals" element={<ClientReferrals />} />
              <Route path="/divan_paneli/client-calendar" element={<ClientCalendar />} />
              <Route path="/divan_paneli/appointments" element={<AppointmentManagement />} />
              <Route path="/divan_paneli/blog" element={<BlogManagement />} />
              <Route path="/divan_paneli/customers" element={<CustomerManagement />} />
              <Route path="/divan_paneli/reviews" element={<ReviewManagement />} />
              <Route path="/divan_paneli/payments" element={<PaymentManagement />} />
              <Route path="/divan_paneli/orders/new" element={<NewOrder />} />
              <Route path="/divan_paneli/orders" element={<OrderManagement />} />
              <Route path="/divan_paneli/banka-havalesi-bildirimleri" element={<BankTransferNotifications />} />
              <Route path="/divan_paneli/analytics" element={<Analytics />} />
              <Route path="/divan_paneli/reports" element={<Reports />} />
              <Route path="/divan_paneli/mapbox" element={<MapboxSettings />} />
              <Route path="/divan_paneli/success-statistics" element={<SuccessStatistics />} />
              <Route path="/divan_paneli/legal-proceedings" element={<LegalProceedings />} />
              <Route path="/divan_paneli/employee-salaries" element={<EmployeeSalaryManagement />} />
              <Route path="/divan_paneli/support-tickets" element={<SupportTickets />} />
              <Route path="/divan_paneli/contracts" element={<ContractManagement />} />
              <Route path="/divan_paneli/sms-management" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><SmsManagement /></ErrorBoundary></Suspense>} />
              <Route path="/divan_paneli/pbx-management" element={<PbxManagement />} />
              <Route path="/divan_paneli/prospective-registrations" element={<ProspectiveRegistrations />} />
              <Route path="/divan_paneli/log-management" element={<LogManagement />} />
              <Route path="/divan_paneli/sitemap" element={<SitemapManagement />} />
              <Route path="/divan_paneli/image-converter" element={<ImageConverter />} />
              <Route path="/divan_paneli/accounting" element={<AccountingDocuments />} />
              <Route path="/divan_paneli/social-media" element={<SocialMediaManagement />} />
              <Route path="/divan_paneli/database-backup" element={<DatabaseBackup />} />
              <Route path="/divan_paneli/call-reports" element={<CallReports />} />
              <Route path="/divan_paneli/iyzico-payments" element={<IyzicoPayments />} />
              <Route path="/divan_paneli/legal-evidence" element={<LegalEvidenceManagement />} />
              <Route path="/divan_paneli/specialist-applications" element={<SpecialistApplications />} />
              <Route path="/divan_paneli/staff-attendance" element={<StaffAttendance />} />
              <Route path="/divan_paneli/cancellation-fees" element={<CancellationFees />} />
              <Route path="/divan_paneli/admin-activity-logs" element={<AdminActivityLogs />} />
              <Route path="/divan_paneli/mobile-activity-logs" element={<MobileActivityLogs />} />
              <Route path="/divan_paneli/ai-assistant" element={<AdminAIAssistant />} />
              <Route path="/divan_paneli/email-logs" element={<EmailLogs />} />
              <Route path="/divan_paneli/registration-analytics" element={<RegistrationAnalytics />} />
              <Route path="/divan_paneli/consent-logs" element={<ConsentLogs />} />
              <Route path="/divan_paneli/bulk-email" element={<BulkEmail />} />
              <Route path="/divan_paneli/career-applications" element={<CareerApplications />} />
              <Route path="/divan_paneli/seo-content" element={<SEOContentManagement />} />
              <Route path="/divan_paneli/seo-content/yayinlananlar" element={<SEOPublishedHistory />} />
              <Route path="/divan_paneli/seo-content/uzman-bloglari" element={<SpecialistBlogStatus />} />
              <Route path="/kariyer" element={<Career />} />
              
                
              {/* Test Routes */}
              <Route path="/test/:testId" element={<TestInterface />} />
              <Route path="/test/:testId/:specialistId" element={<TestInterface />} />
              <Route path="/test-al/:testId" element={<TestTaking />} />
              <Route path="/test-al/:testId/:specialistId" element={<TestTaking />} />
              <Route path="/test-sonuc/:testId/:specialistId" element={<TestResult />} />
              <Route path="/:specialtySlug/:specialistName/test/:testId" element={<TestInterface />} />
              <Route path="/:specialtySlug/:specialistName" element={<DoctorProfile />} />
              
              {/* Doctor Routes */}
              <Route path="/doktor-paneli" element={<DoctorDashboard />} />
              
              {/* Dynamic catch-all for legacy blog slugs - handled by .htaccess in production */}
              
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </Suspense>
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
