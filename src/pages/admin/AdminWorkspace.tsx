import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminAuth from "@/pages/AdminAuth";
import AdminDashboard from "./AdminDashboard";

const AccountingDocuments = lazy(() => import("./AccountingDocuments"));
const AdminAIAssistant = lazy(() => import("./AdminAIAssistant"));
const AdminActivityLogs = lazy(() => import("./AdminActivityLogs"));
const Analytics = lazy(() => import("./Analytics"));
const AppointmentManagement = lazy(() => import("./AppointmentManagement"));
const BankTransferNotifications = lazy(() => import("./BankTransferNotifications"));
const BlogManagement = lazy(() => import("./BlogManagement"));
const BulkEmail = lazy(() => import("./BulkEmail"));
const CancellationFees = lazy(() => import("./CancellationFees"));
const CallReports = lazy(() => import("./CallReports"));
const CareerApplications = lazy(() => import("./CareerApplications"));
const ClientCalendar = lazy(() => import("./ClientCalendar"));
const ClientReferrals = lazy(() => import("./ClientReferrals"));
const ConsentLogs = lazy(() => import("./ConsentLogs"));
const ContractManagement = lazy(() => import("./ContractManagement"));
const CustomerManagement = lazy(() => import("./CustomerManagement"));
const DatabaseBackup = lazy(() => import("./DatabaseBackup"));
const EmailLogs = lazy(() => import("./EmailLogs"));
const EmployeeSalaryManagement = lazy(() => import("./EmployeeSalaryManagement"));
const ImageConverter = lazy(() => import("./ImageConverter"));
const InstagramPosts = lazy(() => import("./InstagramPosts"));
const IyzicoPayments = lazy(() => import("./IyzicoPayments"));
const LegalEvidenceManagement = lazy(() => import("./LegalEvidenceManagement"));
const LegalProceedings = lazy(() => import("./LegalProceedings"));
const LogManagement = lazy(() => import("./LogManagement"));
const MapboxSettings = lazy(() => import("./MapboxSettings"));
const MetaLeads = lazy(() => import("./MetaLeads"));
const MobileActivityLogs = lazy(() => import("./MobileActivityLogs"));
const NewOrder = lazy(() => import("./NewOrder"));
const OrderManagement = lazy(() => import("./OrderManagement"));
const PackageManagement = lazy(() => import("./PackageManagement"));
const PartnerManagement = lazy(() => import("./PartnerManagement"));
const PaymentManagement = lazy(() => import("./PaymentManagement"));
const PbxManagement = lazy(() => import("./PbxManagement"));
const PreInfoFormManagement = lazy(() => import("./PreInfoFormManagement"));
const ProspectiveRegistrations = lazy(() => import("./ProspectiveRegistrations"));
const QuickRegister = lazy(() => import("./QuickRegister"));
const RegistrationAnalytics = lazy(() => import("./RegistrationAnalytics"));
const Reports = lazy(() => import("./Reports"));
const ReviewManagement = lazy(() => import("./ReviewManagement"));
const SEOContentManagement = lazy(() => import("./SEOContentManagement"));
const SEOPublishedHistory = lazy(() => import("./SEOPublishedHistory"));
const SitemapManagement = lazy(() => import("./SitemapManagement"));
const SmsManagement = lazy(() => import("./SmsManagement"));
const SocialMediaManagement = lazy(() => import("./SocialMediaManagement"));
const SpecialistAdd = lazy(() => import("./SpecialistAdd"));
const SpecialistApplications = lazy(() => import("./SpecialistApplications"));
const SpecialistBlogStatus = lazy(() => import("./SpecialistBlogStatus"));
const SpecialistEdit = lazy(() => import("./SpecialistEdit"));
const SpecialistManagement = lazy(() => import("./SpecialistManagement"));
const StaffAttendance = lazy(() => import("./StaffAttendance"));
const SuccessStatistics = lazy(() => import("./SuccessStatistics"));
const SupportTickets = lazy(() => import("./SupportTickets"));
const TestManagement = lazy(() => import("./TestManagement"));
const UserCreate = lazy(() => import("./UserCreate"));
const UserManagement = lazy(() => import("./UserManagement"));
const UzmanApplications = lazy(() => import("./UzmanApplications"));
const WhatsappBotManagement = lazy(() => import("./WhatsappBotManagement"));
const WhatsappBulkSend = lazy(() => import("./WhatsappBulkSend"));
const WhatsappManagement = lazy(() => import("./WhatsappManagement"));

// Panel kartları arasında geçişte "yükleniyor" ekranı gösterilmez.
const PanelLoader = () => null;

const AdminWorkspace = () => (
  <ErrorBoundary>
    <Suspense fallback={<PanelLoader />}>
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
    </Suspense>
  </ErrorBoundary>
);

export default AdminWorkspace;