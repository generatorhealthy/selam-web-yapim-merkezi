import { Route, Routes } from "react-router-dom";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminAuth from "@/pages/AdminAuth";
import AccountingDocuments from "./AccountingDocuments";
import AdminAIAssistant from "./AdminAIAssistant";
import AdminActivityLogs from "./AdminActivityLogs";
import AdminDashboard from "./AdminDashboard";
import Analytics from "./Analytics";
import AppointmentManagement from "./AppointmentManagement";
import BankTransferNotifications from "./BankTransferNotifications";
import BlogManagement from "./BlogManagement";
import BulkEmail from "./BulkEmail";
import CancellationFees from "./CancellationFees";
import CallReports from "./CallReports";
import CareerApplications from "./CareerApplications";
import ClientCalendar from "./ClientCalendar";
import ClientReferrals from "./ClientReferrals";
import ConsentLogs from "./ConsentLogs";
import ContractManagement from "./ContractManagement";
import CustomerManagement from "./CustomerManagement";
import DatabaseBackup from "./DatabaseBackup";
import EmailLogs from "./EmailLogs";
import EmployeeSalaryManagement from "./EmployeeSalaryManagement";
import ImageConverter from "./ImageConverter";
import InstagramPosts from "./InstagramPosts";
import IyzicoPayments from "./IyzicoPayments";
import LegalEvidenceManagement from "./LegalEvidenceManagement";
import LegalProceedings from "./LegalProceedings";
import LogManagement from "./LogManagement";
import MapboxSettings from "./MapboxSettings";
import MetaLeads from "./MetaLeads";
import MobileActivityLogs from "./MobileActivityLogs";
import NewOrder from "./NewOrder";
import OrderManagement from "./OrderManagement";
import PackageManagement from "./PackageManagement";
import PartnerManagement from "./PartnerManagement";
import PaymentManagement from "./PaymentManagement";
import PbxManagement from "./PbxManagement";
import PreInfoFormManagement from "./PreInfoFormManagement";
import ProspectiveRegistrations from "./ProspectiveRegistrations";
import QuickRegister from "./QuickRegister";
import RegistrationAnalytics from "./RegistrationAnalytics";
import Reports from "./Reports";
import ReviewManagement from "./ReviewManagement";
import SEOContentManagement from "./SEOContentManagement";
import SEOPublishedHistory from "./SEOPublishedHistory";
import SitemapManagement from "./SitemapManagement";
import SmsManagement from "./SmsManagement";
import SocialMediaManagement from "./SocialMediaManagement";
import SpecialistAdd from "./SpecialistAdd";
import SpecialistApplications from "./SpecialistApplications";
import SpecialistBlogStatus from "./SpecialistBlogStatus";
import SpecialistEdit from "./SpecialistEdit";
import SpecialistManagement from "./SpecialistManagement";
import StaffAttendance from "./StaffAttendance";
import SuccessStatistics from "./SuccessStatistics";
import SupportTickets from "./SupportTickets";
import TestManagement from "./TestManagement";
import UserCreate from "./UserCreate";
import UserManagement from "./UserManagement";
import UzmanApplications from "./UzmanApplications";
import WhatsappBotManagement from "./WhatsappBotManagement";
import WhatsappBulkSend from "./WhatsappBulkSend";
import WhatsappManagement from "./WhatsappManagement";

const AdminWorkspace = () => (
  <Routes>
    <Route path="/divan_paneli" element={<AdminAuth />} />
    <Route element={<AdminRouteGuard />}>
      <Route path="/divan_paneli/dashboard" element={<AdminDashboard />} />
      <Route path="/divan_paneli/tests" element={<TestManagement />} />
      <Route path="/divan_paneli/packages" element={<PackageManagement />} />
      <Route path="/divan_paneli/pre-info-form" element={<PreInfoFormManagement />} />
      <Route path="/divan_paneli/users/create" element={<UserCreate />} />
      <Route path="/divan_paneli/quick-register" element={<QuickRegister />} />
      <Route path="/divan_paneli/users" element={<UserManagement />} />
      <Route path="/divan_paneli/partners" element={<PartnerManagement />} />
      <Route path="/divan_paneli/specialists/add" element={<SpecialistAdd />} />
      <Route path="/divan_paneli/specialists" element={<SpecialistManagement />} />
      <Route path="/divan_paneli/specialists/edit/:id" element={<SpecialistEdit />} />
      <Route path="/divan_paneli/client-referrals" element={<ClientReferrals />} />
      <Route path="/divan_paneli/meta-leads" element={<MetaLeads />} />
      <Route path="/divan_paneli/uzman-basvurulari" element={<UzmanApplications />} />
      <Route path="/divan_paneli/client-calendar" element={<ClientCalendar />} />
      <Route path="/divan_paneli/whatsapp-bot" element={<WhatsappBotManagement />} />
      <Route path="/divan_paneli/appointments" element={<AppointmentManagement />} />
      <Route path="/divan_paneli/blog" element={<BlogManagement />} />
      <Route path="/divan_paneli/customers" element={<CustomerManagement />} />
      <Route path="/divan_paneli/reviews" element={<ReviewManagement />} />
      <Route path="/divan_paneli/payments" element={<PaymentManagement />} />
      <Route path="/divan_paneli/orders/new" element={<NewOrder />} />
      <Route path="/divan_paneli/orders" element={<ErrorBoundary><OrderManagement /></ErrorBoundary>} />
      <Route path="/divan_paneli/banka-havalesi-bildirimleri" element={<BankTransferNotifications />} />
      <Route path="/divan_paneli/analytics" element={<Analytics />} />
      <Route path="/divan_paneli/reports" element={<Reports />} />
      <Route path="/divan_paneli/mapbox" element={<MapboxSettings />} />
      <Route path="/divan_paneli/success-statistics" element={<SuccessStatistics />} />
      <Route path="/divan_paneli/legal-proceedings" element={<LegalProceedings />} />
      <Route path="/divan_paneli/employee-salaries" element={<EmployeeSalaryManagement />} />
      <Route path="/divan_paneli/support-tickets" element={<SupportTickets />} />
      <Route path="/divan_paneli/contracts" element={<ContractManagement />} />
      <Route path="/divan_paneli/sms-management" element={<SmsManagement />} />
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
      <Route path="/divan_paneli/instagram-posts" element={<InstagramPosts />} />
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
      <Route path="/divan_paneli/whatsapp-bulk" element={<WhatsappBulkSend />} />
      <Route path="/divan_paneli/whatsapp" element={<WhatsappManagement />} />
    </Route>
  </Routes>
);

export default AdminWorkspace;