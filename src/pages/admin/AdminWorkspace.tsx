import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminAuth from "@/pages/AdminAuth";
import AdminDashboard from "./AdminDashboard";
import { safeLazy } from "@/utils/safeLazy";
import SuspenseTimeoutFallback from "@/components/SuspenseTimeoutFallback";
const QuickRegister = safeLazy(() => import("./QuickRegister"));
const AccountingDocuments = safeLazy(() => import("./AccountingDocuments"));
const AdminAIAssistant = safeLazy(() => import("./AdminAIAssistant"));
const AdminActivityLogs = safeLazy(() => import("./AdminActivityLogs"));
const Analytics = safeLazy(() => import("./Analytics"));
const AppointmentManagement = safeLazy(() => import("./AppointmentManagement"));
const BankTransferNotifications = safeLazy(() => import("./BankTransferNotifications"));
const BlogManagement = safeLazy(() => import("./BlogManagement"));
const BulkEmail = safeLazy(() => import("./BulkEmail"));
const CancellationFees = safeLazy(() => import("./CancellationFees"));
const CallReports = safeLazy(() => import("./CallReports"));
const CareerApplications = safeLazy(() => import("./CareerApplications"));
const ClientCalendar = safeLazy(() => import("./ClientCalendar"));
const ClientReferrals = safeLazy(() => import("./ClientReferrals"));
const ConsentLogs = safeLazy(() => import("./ConsentLogs"));
const ContractManagement = safeLazy(() => import("./ContractManagement"));
const CustomerManagement = safeLazy(() => import("./CustomerManagement"));
const DatabaseBackup = safeLazy(() => import("./DatabaseBackup"));
const EmailLogs = safeLazy(() => import("./EmailLogs"));
const EmployeeSalaryManagement = safeLazy(() => import("./EmployeeSalaryManagement"));
const ImageConverter = safeLazy(() => import("./ImageConverter"));
const InstagramPosts = safeLazy(() => import("./InstagramPosts"));
const IyzicoPayments = safeLazy(() => import("./IyzicoPayments"));
const LegalEvidenceManagement = safeLazy(() => import("./LegalEvidenceManagement"));
const LegalProceedings = safeLazy(() => import("./LegalProceedings"));
const LogManagement = safeLazy(() => import("./LogManagement"));
const MapboxSettings = safeLazy(() => import("./MapboxSettings"));
const MetaLeads = safeLazy(() => import("./MetaLeads"));
const MobileActivityLogs = safeLazy(() => import("./MobileActivityLogs"));
const NewOrder = safeLazy(() => import("./NewOrder"));
const OrderManagement = safeLazy(() => import("./OrderManagement"));
const PackageManagement = safeLazy(() => import("./PackageManagement"));
const PartnerManagement = safeLazy(() => import("./PartnerManagement"));
const PaymentManagement = safeLazy(() => import("./PaymentManagement"));
const PbxManagement = safeLazy(() => import("./PbxManagement"));
const PreInfoFormManagement = safeLazy(() => import("./PreInfoFormManagement"));
const ProspectiveRegistrations = safeLazy(() => import("./ProspectiveRegistrations"));
const RegistrationAnalytics = safeLazy(() => import("./RegistrationAnalytics"));
const Reports = safeLazy(() => import("./Reports"));
const ReviewManagement = safeLazy(() => import("./ReviewManagement"));
const SEOContentManagement = safeLazy(() => import("./SEOContentManagement"));
const SEOPublishedHistory = safeLazy(() => import("./SEOPublishedHistory"));
const SitemapManagement = safeLazy(() => import("./SitemapManagement"));
const SmsManagement = safeLazy(() => import("./SmsManagement"));
const SocialMediaManagement = safeLazy(() => import("./SocialMediaManagement"));
const SpecialistAdd = safeLazy(() => import("./SpecialistAdd"));
const SpecialistApplications = safeLazy(() => import("./SpecialistApplications"));
const SpecialistBlogStatus = safeLazy(() => import("./SpecialistBlogStatus"));
const SpecialistEdit = safeLazy(() => import("./SpecialistEdit"));
const SpecialistManagement = safeLazy(() => import("./SpecialistManagement"));
const StaffAttendance = safeLazy(() => import("./StaffAttendance"));
const SuccessStatistics = safeLazy(() => import("./SuccessStatistics"));
const SupportTickets = safeLazy(() => import("./SupportTickets"));
const TestManagement = safeLazy(() => import("./TestManagement"));
const UserCreate = safeLazy(() => import("./UserCreate"));
const UserManagement = safeLazy(() => import("./UserManagement"));
const UzmanApplications = safeLazy(() => import("./UzmanApplications"));
const WhatsappBotManagement = safeLazy(() => import("./WhatsappBotManagement"));
const WhatsappBulkSend = safeLazy(() => import("./WhatsappBulkSend"));
const WhatsappManagement = safeLazy(() => import("./WhatsappManagement"));

const PanelPageFallback = () => (
  <div className="min-h-screen bg-background">
    <div className="h-16 border-b border-border bg-card" />
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-lg border border-border bg-card" />
        ))}
      </div>
    </div>
  </div>
);

const AdminWorkspace = () => (
  <ErrorBoundary>
    <Suspense fallback={<SuspenseTimeoutFallback><PanelPageFallback /></SuspenseTimeoutFallback>}>
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