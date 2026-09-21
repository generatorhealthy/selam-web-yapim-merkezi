import { Route, Routes } from "react-router-dom";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminAuth from "@/pages/AdminAuth";
import AdminDashboard from "./AdminDashboard";
import AccountingDocuments from "./AccountingDocuments";
import AdminAIAssistant from "./AdminAIAssistant";
import AdminActivityLogs from "./AdminActivityLogs";
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
  <ErrorBoundary>
    <Routes>
        <Route index element={<AdminAuth />} />
        <Route element={<AdminRouteGuard />}>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="tests" element={<TestManagement />} />
      <Route path="packages" element={<PackageManagement />} />
      <Route path="pre-info-form" element={<PreInfoFormManagement />} />
      <Route path="users/create" element={<UserCreate />} />
      <Route path="quick-register" element={<QuickRegister />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="partners" element={<PartnerManagement />} />
      <Route path="specialists/add" element={<SpecialistAdd />} />
      <Route path="specialists" element={<SpecialistManagement />} />
      <Route path="specialists/edit/:id" element={<SpecialistEdit />} />
      <Route path="client-referrals" element={<ClientReferrals />} />
      <Route path="meta-leads" element={<MetaLeads />} />
      <Route path="uzman-basvurulari" element={<UzmanApplications />} />
      <Route path="client-calendar" element={<ClientCalendar />} />
      <Route path="whatsapp-bot" element={<WhatsappBotManagement />} />
      <Route path="appointments" element={<AppointmentManagement />} />
      <Route path="blog" element={<BlogManagement />} />
      <Route path="customers" element={<CustomerManagement />} />
      <Route path="reviews" element={<ReviewManagement />} />
      <Route path="payments" element={<PaymentManagement />} />
      <Route path="orders/new" element={<NewOrder />} />
      <Route path="orders" element={<ErrorBoundary><OrderManagement /></ErrorBoundary>} />
      <Route path="banka-havalesi-bildirimleri" element={<BankTransferNotifications />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="reports" element={<Reports />} />
      <Route path="mapbox" element={<MapboxSettings />} />
      <Route path="success-statistics" element={<SuccessStatistics />} />
      <Route path="legal-proceedings" element={<LegalProceedings />} />
      <Route path="employee-salaries" element={<EmployeeSalaryManagement />} />
      <Route path="support-tickets" element={<SupportTickets />} />
      <Route path="contracts" element={<ContractManagement />} />
      <Route path="sms-management" element={<SmsManagement />} />
      <Route path="pbx-management" element={<PbxManagement />} />
      <Route path="prospective-registrations" element={<ProspectiveRegistrations />} />
      <Route path="log-management" element={<LogManagement />} />
      <Route path="sitemap" element={<SitemapManagement />} />
      <Route path="image-converter" element={<ImageConverter />} />
      <Route path="accounting" element={<AccountingDocuments />} />
      <Route path="social-media" element={<SocialMediaManagement />} />
      <Route path="database-backup" element={<DatabaseBackup />} />
      <Route path="call-reports" element={<CallReports />} />
      <Route path="iyzico-payments" element={<IyzicoPayments />} />
      <Route path="legal-evidence" element={<LegalEvidenceManagement />} />
      <Route path="specialist-applications" element={<SpecialistApplications />} />
      <Route path="staff-attendance" element={<StaffAttendance />} />
      <Route path="instagram-posts" element={<InstagramPosts />} />
      <Route path="cancellation-fees" element={<CancellationFees />} />
      <Route path="admin-activity-logs" element={<AdminActivityLogs />} />
      <Route path="mobile-activity-logs" element={<MobileActivityLogs />} />
      <Route path="ai-assistant" element={<AdminAIAssistant />} />
      <Route path="email-logs" element={<EmailLogs />} />
      <Route path="registration-analytics" element={<RegistrationAnalytics />} />
      <Route path="consent-logs" element={<ConsentLogs />} />
      <Route path="bulk-email" element={<BulkEmail />} />
      <Route path="career-applications" element={<CareerApplications />} />
      <Route path="seo-content" element={<SEOContentManagement />} />
      <Route path="seo-content/yayinlananlar" element={<SEOPublishedHistory />} />
      <Route path="seo-content/uzman-bloglari" element={<SpecialistBlogStatus />} />
      <Route path="whatsapp-bulk" element={<WhatsappBulkSend />} />
      <Route path="whatsapp" element={<WhatsappManagement />} />
        </Route>
    </Routes>
  </ErrorBoundary>
);

export default AdminWorkspace;