import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import BlogPost from "./pages/BlogPost";
import DoctorList from "./pages/DoctorList";
import DoctorProfile from "./pages/DoctorProfile";
import BookAppointment from "./pages/BookAppointment";
import SpecialtyPage from "./pages/SpecialtyPage";
import Packages from "./pages/Packages";
import CampaignPackage from "./pages/CampaignPackage";
import CampaignPremiumPackage from "./pages/CampaignPremiumPackage";
import DiscountedPackage from "./pages/DiscountedPackage";
import PsychologistPackage from "./pages/PsychologistPackage";
import DietitianPackage from "./pages/DietitianPackage";
import PhysiotherapistPackage from "./pages/PhysiotherapistPackage";
import FamilyCounselorPackage from "./pages/FamilyCounselorPackage";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentError from "./pages/PaymentError";
import Privacy from "./pages/Privacy";
import DisclosureText from "./pages/DisclosureText";
import DistanceSalesContract from "./pages/DistanceSalesContract";
import VisitorConsultantAgreement from "./pages/VisitorConsultantAgreement";
import CommentRules from "./pages/CommentRules";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import TestInterface from "./components/TestInterface";
import TestTaking from "./components/TestTaking";
import TestResult from "./pages/TestResult";

// Admin pages
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserCreate from "./pages/admin/UserCreate";
import UserManagement from "./pages/admin/UserManagement";
import SpecialistAdd from "./pages/admin/SpecialistAdd";
import SpecialistManagement from "./pages/admin/SpecialistManagement";
import SpecialistEdit from "./pages/admin/SpecialistEdit";
import AppointmentManagement from "./pages/admin/AppointmentManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import ReviewManagement from "./pages/admin/ReviewManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import NewOrder from "./pages/admin/NewOrder";
import OrderManagement from "./pages/admin/OrderManagement";
import NewOrderPage from "./pages/admin/NewOrderPage";
import Reports from "./pages/admin/Reports";
import MapboxSettings from "./pages/admin/MapboxSettings";
import SuccessStatistics from "./pages/admin/SuccessStatistics";
import LegalProceedings from "./pages/admin/LegalProceedings";
import EmployeeSalaryManagement from "./pages/admin/EmployeeSalaryManagement";
import ClientReferrals from "./pages/admin/ClientReferrals";
import PreInfoFormManagement from "./pages/admin/PreInfoFormManagement";
import PackageManagement from "./pages/admin/PackageManagement";
import TestManagement from "./pages/admin/TestManagement";

// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/hakkimizda" element={<About />} />
              <Route path="/iletisim" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/yazilar/:slug" element={<BlogPost />} />
              <Route path="/uzmanlar" element={<DoctorList />} />
              <Route path="/:specialtySlug/:doctorName" element={<DoctorProfile />} />
              <Route path="/randevu-al/:specialtySlug/:doctorName" element={<BookAppointment />} />
              <Route path="/uzmanlik/:specialty" element={<SpecialtyPage />} />
              <Route path="/paketler" element={<Packages />} />
              <Route path="/kampanyali-paket" element={<CampaignPackage />} />
              <Route path="/kampanyali-premium-paket" element={<CampaignPremiumPackage />} />
              <Route path="/indirimli-paket" element={<DiscountedPackage />} />
              <Route path="/psikolog-paketi" element={<PsychologistPackage />} />
              <Route path="/diyetisyen-paketi" element={<DietitianPackage />} />
              <Route path="/fizyoterapist-paketi" element={<PhysiotherapistPackage />} />
              <Route path="/aile-danismani-paketi" element={<FamilyCounselorPackage />} />
              <Route path="/odeme/:packageType" element={<Checkout />} />
              <Route path="/odeme-sayfasi" element={<Checkout />} />
          <Route path="/odeme-basarili" element={<PaymentSuccess />} />
          <Route path="/tesekkurler" element={<PaymentSuccess />} />
          <Route path="/odeme-hatasi" element={<PaymentError />} />
              <Route path="/gizlilik-politikasi" element={<Privacy />} />
              <Route path="/aydinlatma-metni" element={<DisclosureText />} />
              <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSalesContract />} />
              <Route path="/ziyaretci-danisan-sozlesmesi" element={<VisitorConsultantAgreement />} />
              <Route path="/yorum-kurallari" element={<CommentRules />} />
              <Route path="/anasayfa" element={<Landing />} />
              <Route path="/giris-yap" element={<LoginPage />} />
              
              {/* Test Routes */}
              <Route path="/test/:testId" element={<TestInterface />} />
              <Route path="/test/:testId/:specialistId" element={<TestInterface />} />
              <Route path="/test-al/:testId" element={<TestTaking />} />
              <Route path="/test-al/:testId/:specialistId" element={<TestTaking />} />
              <Route path="/test-sonuc/:testId/:specialistId" element={<TestResult />} />
              
              {/* Admin Routes */}
              <Route path="/divan_paneli" element={<AdminAuth />} />
              <Route path="/divan_paneli/dashboard" element={<AdminDashboard />} />
              <Route path="/divan_paneli/tests" element={<TestManagement />} />
              <Route path="/divan_paneli/packages" element={<PackageManagement />} />
              <Route path="/divan_paneli/pre-info-form" element={<PreInfoFormManagement />} />
              <Route path="/divan_paneli/users/create" element={<UserCreate />} />
              <Route path="/divan_paneli/users" element={<UserManagement />} />
              <Route path="/divan_paneli/specialists/add" element={<SpecialistAdd />} />
              <Route path="/divan_paneli/specialists" element={<SpecialistManagement />} />
              <Route path="/divan_paneli/specialists/edit/:id" element={<SpecialistEdit />} />
              <Route path="/divan_paneli/client-referrals" element={<ClientReferrals />} />
              <Route path="/divan_paneli/appointments" element={<AppointmentManagement />} />
              <Route path="/divan_paneli/blog" element={<BlogManagement />} />
              <Route path="/divan_paneli/customers" element={<CustomerManagement />} />
              <Route path="/divan_paneli/reviews" element={<ReviewManagement />} />
              <Route path="/divan_paneli/payments" element={<PaymentManagement />} />
              <Route path="/divan_paneli/orders/new" element={<NewOrder />} />
              <Route path="/divan_paneli/orders" element={<NewOrderPage />} />
              <Route path="/divan_paneli/siparisler" element={<NewOrderPage />} />
              <Route path="/divan_paneli/reports" element={<Reports />} />
              <Route path="/divan_paneli/mapbox" element={<MapboxSettings />} />
              <Route path="/divan_paneli/success-statistics" element={<SuccessStatistics />} />
              <Route path="/divan_paneli/legal-proceedings" element={<LegalProceedings />} />
              <Route path="/divan_paneli/employee-salaries" element={<EmployeeSalaryManagement />} />
              
              {/* Doctor Routes */}
              <Route path="/doktor-paneli" element={<DoctorDashboard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
