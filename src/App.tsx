import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

import Landing from './pages/Landing';
import Index from './pages/Index';
import About from './pages/About';
import Packages from './pages/Packages';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import BlogPost from './pages/BlogPost';
import DoctorList from './pages/DoctorList';
import DoctorProfile from './pages/DoctorProfile';
import SpecialtyPage from './pages/SpecialtyPage';
import BookAppointment from './pages/BookAppointment';
import PsychologistPackage from './pages/PsychologistPackage';
import FamilyCounselorPackage from './pages/FamilyCounselorPackage';
import DietitianPackage from './pages/DietitianPackage';
import PhysiotherapistPackage from './pages/PhysiotherapistPackage';
import CampaignPackage from './pages/CampaignPackage';
import CampaignPremiumPackage from './pages/CampaignPremiumPackage';
import DiscountedPackage from './pages/DiscountedPackage';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import TestResult from './pages/TestResult';
import AdminAuth from './pages/AdminAuth';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import UserCreate from './pages/admin/UserCreate';
import TestManagement from './pages/admin/TestManagement';
import PackageManagement from './pages/admin/PackageManagement';
import PreInfoFormManagement from './pages/admin/PreInfoFormManagement';
import SpecialistManagement from './pages/admin/SpecialistManagement';
import SpecialistAdd from './pages/admin/SpecialistAdd';
import SpecialistEdit from './pages/admin/SpecialistEdit';
import ClientReferrals from './pages/admin/ClientReferrals';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import BlogManagement from './pages/admin/BlogManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import ReviewManagement from './pages/admin/ReviewManagement';
import LegalProceedings from './pages/admin/LegalProceedings';
import OrderManagement from './pages/admin/OrderManagement';
import NewOrder from './pages/admin/NewOrder';
import Reports from './pages/admin/Reports';
import SuccessStatistics from './pages/admin/SuccessStatistics';
import EmployeeSalaryManagement from './pages/admin/EmployeeSalaryManagement';
import SupportTickets from './pages/admin/SupportTickets';
import ContractManagement from './pages/admin/ContractManagement';
import SmsManagement from './pages/admin/SmsManagement';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import Privacy from './pages/legal/Privacy';
import DisclosureText from './pages/legal/DisclosureText';
import DistanceSalesContract from './pages/legal/DistanceSalesContract';
import VisitorConsultantAgreement from './pages/legal/VisitorConsultantAgreement';
import CommentRules from './pages/legal/CommentRules';
import NotFound from './pages/NotFound';
import PbxManagement from "@/pages/admin/PbxManagement";

function App() {
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/index" element={<Index />} />
            <Route path="/hakkimizda" element={<About />} />
            <Route path="/paketler" element={<Packages />} />
            <Route path="/iletisim" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/:slug" element={<BlogDetail />} />
            <Route path="/yazilar/:slug" element={<BlogPost />} />
            <Route path="/uzmanlar" element={<DoctorList />} />
            <Route path="/:specialtySlug/:doctorName" element={<DoctorProfile />} />
            <Route path="/uzmanlar/:specialty" element={<SpecialtyPage />} />
            <Route path="/randevu-al" element={<BookAppointment />} />
            <Route path="/psikolog-paketi" element={<PsychologistPackage />} />
            <Route path="/aile-danismani-paketi" element={<FamilyCounselorPackage />} />
            <Route path="/diyetisyen-paketi" element={<DietitianPackage />} />
            <Route path="/fizyoterapist-paketi" element={<PhysiotherapistPackage />} />
            <Route path="/kampanya-paketi" element={<CampaignPackage />} />
            <Route path="/premium-kampanya-paketi" element={<CampaignPremiumPackage />} />
            <Route path="/indirimli-paket" element={<DiscountedPackage />} />
            <Route path="/odeme" element={<Checkout />} />
            <Route path="/odeme-basarili" element={<PaymentSuccess />} />
            <Route path="/test-sonucu/:id" element={<TestResult />} />
            <Route path="/admin-giris" element={<AdminAuth />} />
            <Route path="/giris" element={<LoginPage />} />
            
            {/* Divan Paneli Routes */}
            <Route path="/divan_paneli" element={<AdminDashboard />} />
            <Route path="/divan_paneli/dashboard" element={<AdminDashboard />} />
            <Route path="/divan_paneli/users" element={<UserManagement />} />
            <Route path="/divan_paneli/users/create" element={<UserCreate />} />
            <Route path="/divan_paneli/tests" element={<TestManagement />} />
            <Route path="/divan_paneli/packages" element={<PackageManagement />} />
            <Route path="/divan_paneli/pre-info-form" element={<PreInfoFormManagement />} />
            <Route path="/divan_paneli/specialists" element={<SpecialistManagement />} />
            <Route path="/divan_paneli/specialists/add" element={<SpecialistAdd />} />
            <Route path="/divan_paneli/specialists/edit/:id" element={<SpecialistEdit />} />
            <Route path="/divan_paneli/client-referrals" element={<ClientReferrals />} />
            <Route path="/divan_paneli/appointments" element={<AppointmentManagement />} />
            <Route path="/divan_paneli/blog" element={<BlogManagement />} />
            <Route path="/divan_paneli/customers" element={<CustomerManagement />} />
            <Route path="/divan_paneli/reviews" element={<ReviewManagement />} />
            <Route path="/divan_paneli/legal-proceedings" element={<LegalProceedings />} />
            <Route path="/divan_paneli/orders" element={<OrderManagement />} />
            <Route path="/divan_paneli/orders/new" element={<NewOrder />} />
            <Route path="/divan_paneli/reports" element={<Reports />} />
            <Route path="/divan_paneli/success-statistics" element={<SuccessStatistics />} />
            <Route path="/divan_paneli/employee-salaries" element={<EmployeeSalaryManagement />} />
            <Route path="/divan_paneli/support-tickets" element={<SupportTickets />} />
            <Route path="/divan_paneli/contracts" element={<ContractManagement />} />
            <Route path="/divan_paneli/sms-management" element={<SmsManagement />} />
            <Route path="/divan_paneli/pbx-management" element={<PbxManagement />} />

            {/* Doctor Panel Routes */}
            <Route path="/doktor-paneli" element={<DoctorDashboard />} />

            {/* Legal Pages */}
            <Route path="/gizlilik-politikasi" element={<Privacy />} />
            <Route path="/on-bilgilendirme-formu" element={<DisclosureText />} />
            <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSalesContract />} />
            <Route path="/ziyaretci-danisan-sozlesmesi" element={<VisitorConsultantAgreement />} />
            <Route path="/yorum-kurallari" element={<CommentRules />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
