import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

// Auth Pages - Keep these eager loaded as they're needed immediately
import GetStarted from '../modules/auth/pages/GetStarted';
import SelectLanguage from '../modules/auth/pages/SelectLanguage';
import MobileInput from '../modules/auth/pages/MobileInput';
import OTPVerification from '../modules/auth/pages/OTPVerification';
import CompleteProfile from '../modules/auth/pages/CompleteProfile';

// Lazy load all other pages for better initial load performance
// User Pages
const UserHome = lazy(() => import('../modules/user/pages/UserHome'));
const HireWorkers = lazy(() => import('../modules/user/pages/HireWorkers'));
const FindContractor = lazy(() => import('../modules/user/pages/FindContractor'));
const Requests = lazy(() => import('../modules/user/pages/Requests'));
const ContractorRequest = lazy(() => import('../modules/user/pages/ContractorRequest'));
const WorkersRequest = lazy(() => import('../modules/user/pages/WorkersRequest'));
const Settings = lazy(() => import('../modules/user/pages/Settings'));
const PersonalDetails = lazy(() => import('../modules/user/pages/PersonalDetails'));
const MyProjects = lazy(() => import('../modules/user/pages/MyProjects'));
const PostJob = lazy(() => import('../modules/user/pages/PostJob'));
const Legal = lazy(() => import('../modules/user/pages/Legal'));
const ContactUs = lazy(() => import('../modules/user/pages/ContactUs'));
const AboutUs = lazy(() => import('../modules/user/pages/AboutUs'));
const Subscription = lazy(() => import('../modules/user/pages/Subscription'));
const Notifications = lazy(() => import('../modules/user/pages/Notifications'));
const UserHistory = lazy(() => import('../modules/user/pages/History'));
const UserChat = lazy(() => import('../modules/user/pages/Chat'));
const UserChatConversation = lazy(() => import('../modules/user/pages/ChatConversation'));

// Contractor Pages
const ContractorHome = lazy(() => import('../modules/contractor/pages/ContractorHome'));
const ContractorBusinessDetails = lazy(() => import('../modules/contractor/pages/BusinessDetails'));
const ContractorHireWorkers = lazy(() => import('../modules/contractor/pages/HireWorkers'));
const ContractorFindUser = lazy(() => import('../modules/contractor/pages/FindUser'));
const ContractorRequests = lazy(() => import('../modules/contractor/pages/Requests'));
const ContractorUserRequest = lazy(() => import('../modules/contractor/pages/UserRequest'));
const ContractorWorkersRequest = lazy(() => import('../modules/contractor/pages/WorkersRequest'));
const ContractorSettings = lazy(() => import('../modules/contractor/pages/Settings'));
const ContractorPersonalDetails = lazy(() => import('../modules/contractor/pages/PersonalDetails'));
const ContractorMyProjects = lazy(() => import('../modules/contractor/pages/MyProjects'));
const ContractorMyProjectForUser = lazy(() => import('../modules/contractor/pages/MyProjectForUser'));
const ContractorPostJob = lazy(() => import('../modules/contractor/pages/PostJob'));
const ContractorLegal = lazy(() => import('../modules/contractor/pages/Legal'));
const ContractorAboutUs = lazy(() => import('../modules/contractor/pages/AboutUs'));
const ContractorContactUs = lazy(() => import('../modules/contractor/pages/ContactUs'));
const ContractorNotifications = lazy(() => import('../modules/contractor/pages/Notifications'));
const ContractorSubscription = lazy(() => import('../modules/contractor/pages/Subscription'));
const ContractorHistory = lazy(() => import('../modules/contractor/pages/History'));
const ContractorChatList = lazy(() => import('../modules/contractor/pages/ChatList'));
const ContractorChatConversation = lazy(() => import('../modules/contractor/pages/ChatConversation'));

// Labour Pages
const LabourDetails = lazy(() => import('../modules/labour/pages/LabourDetails'));
const LabourDashboard = lazy(() => import('../modules/labour/pages/LabourDashboard'));
const LabourFindUser = lazy(() => import('../modules/labour/pages/FindUser'));
const LabourFindContractor = lazy(() => import('../modules/labour/pages/FindContractor'));
const LabourRequests = lazy(() => import('../modules/labour/pages/Requests'));
const LabourUserRequest = lazy(() => import('../modules/labour/pages/UserRequest'));
const LabourContractorRequest = lazy(() => import('../modules/labour/pages/ContractorRequest'));
const LabourSettings = lazy(() => import('../modules/labour/pages/LabourSettings'));
const LabourPersonalDetails = lazy(() => import('../modules/labour/pages/LabourPersonalDetails'));
const LabourWorkDetails = lazy(() => import('../modules/labour/pages/LabourWorkDetails'));
const LabourLegalDetails = lazy(() => import('../modules/labour/pages/LabourLegalDetails'));
const LabourPaymentDetails = lazy(() => import('../modules/labour/pages/LabourPaymentDetails'));
const LabourContactUs = lazy(() => import('../modules/labour/pages/ContactUs'));
const LabourAboutUs = lazy(() => import('../modules/labour/pages/AboutUs'));
const LabourNotifications = lazy(() => import('../modules/labour/pages/Notifications'));
const LabourSubscription = lazy(() => import('../modules/labour/pages/Subscription'));
const CreateLabourCard = lazy(() => import('../modules/labour/pages/CreateLabourCard'));
const LabourMyCard = lazy(() => import('../modules/labour/pages/LabourMyCard'));
const History = lazy(() => import('../modules/labour/pages/History'));
const LabourChatList = lazy(() => import('../modules/labour/pages/ChatList'));
const LabourChatConversation = lazy(() => import('../modules/labour/pages/ChatConversation'));

// Admin Pages
const AdminLogin = lazy(() => import('../modules/admin/pages/AdminLogin'));
const ProfessionalDashboard = lazy(() => import('../modules/admin/pages/ProfessionalDashboard'));
const DashboardHome = lazy(() => import('../modules/admin/pages/ProfessionalDashboard').then(module => ({ default: module.DashboardHome })));
const UserManagement = lazy(() => import('../modules/admin/pages/UserManagement'));
const LabourManagement = lazy(() => import('../modules/admin/pages/LabourManagement'));
const ContractorManagement = lazy(() => import('../modules/admin/pages/ContractorManagement'));
const VerificationManagement = lazy(() => import('../modules/admin/pages/VerificationManagement'));
const AdminSettings = lazy(() => import('../modules/admin/pages/AdminSettings'));
const RoleProtectedRoute = lazy(() => import('../modules/admin/components/RoleProtectedRoute'));
const LabourCategoryManagement = lazy(() => import('../modules/admin/pages/LabourCategoryManagement'));
const BroadcastManagement = lazy(() => import('../modules/admin/pages/BroadcastManagement'));
const BannerSection = lazy(() => import('../modules/admin/pages/BannerSection'));
const GetStartedSlides = lazy(() => import('../modules/admin/pages/GetStartedSlides'));
const AdminManagement = lazy(() => import('../modules/admin/pages/AdminManagement'));

// Loading component for Suspense fallback
const PageLoader = () => (
    <div className="flex items-center justify-center bg-gray-50" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
        </div>
    </div>
);

const AppRoutes = () => {
    const location = useLocation();

    // Scroll to top and prevent layout shift on route change
    useEffect(() => {
        window.scrollTo(0, 0);
        // Force reflow to prevent header shift
        document.body.offsetHeight;
    }, [location.pathname]);

    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Auth Routes */}
                <Route path="/" element={<GetStarted />} />
                <Route path="/get-started" element={<GetStarted />} />
                <Route path="/select-language" element={<SelectLanguage />} />
                <Route path="/mobile-login" element={<MobileInput />} />
                <Route path="/mobile-input" element={<MobileInput />} /> {/* Alias for backward compatibility */}
                <Route path="/otp-verify" element={<OTPVerification />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />

                {/* User Module Routes - Protected */}
                <Route path="/user/home" element={<ProtectedRoute><UserHome /></ProtectedRoute>} />
                <Route path="/user/hire-workers" element={<ProtectedRoute><HireWorkers /></ProtectedRoute>} />
                <Route path="/user/find-contractor" element={<ProtectedRoute><FindContractor /></ProtectedRoute>} />
                <Route path="/user/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
                <Route path="/user/contractor-request" element={<ProtectedRoute><ContractorRequest /></ProtectedRoute>} />
                <Route path="/user/workers-request" element={<ProtectedRoute><WorkersRequest /></ProtectedRoute>} />
                <Route path="/user/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/user/personal-details" element={<ProtectedRoute><PersonalDetails /></ProtectedRoute>} />
                <Route path="/user/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
                <Route path="/user/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
                <Route path="/user/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
                <Route path="/user/contact-us" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
                <Route path="/user/about-us" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
                <Route path="/user/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/user/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/user/history" element={<ProtectedRoute><UserHistory /></ProtectedRoute>} />
                <Route path="/user/chat" element={<ProtectedRoute><UserChat /></ProtectedRoute>} />
                <Route path="/user/chat/:id" element={<ProtectedRoute><UserChatConversation /></ProtectedRoute>} />

                {/* Contractor Module Routes - Protected */}
                <Route path="/contractor/home" element={<ProtectedRoute><ContractorHome /></ProtectedRoute>} />
                <Route path="/contractor/business-details" element={<ProtectedRoute><ContractorBusinessDetails /></ProtectedRoute>} />
                <Route path="/contractor/hire-workers" element={<ProtectedRoute><ContractorHireWorkers /></ProtectedRoute>} />
                <Route path="/contractor/find-user" element={<ProtectedRoute><ContractorFindUser /></ProtectedRoute>} />
                <Route path="/contractor/requests" element={<ProtectedRoute><ContractorRequests /></ProtectedRoute>} />
                <Route path="/contractor/user-request" element={<ProtectedRoute><ContractorUserRequest /></ProtectedRoute>} />
                <Route path="/contractor/workers-request" element={<ProtectedRoute><ContractorWorkersRequest /></ProtectedRoute>} />
                <Route path="/contractor/settings" element={<ProtectedRoute><ContractorSettings /></ProtectedRoute>} />
                <Route path="/contractor/personal-details" element={<ProtectedRoute><ContractorPersonalDetails /></ProtectedRoute>} />
                <Route path="/contractor/my-projects" element={<ProtectedRoute><ContractorMyProjects /></ProtectedRoute>} />
                <Route path="/contractor/my-project-for-user" element={<ProtectedRoute><ContractorMyProjectForUser /></ProtectedRoute>} />
                <Route path="/contractor/post-job" element={<ProtectedRoute><ContractorPostJob /></ProtectedRoute>} />
                <Route path="/contractor/legal" element={<ProtectedRoute><ContractorLegal /></ProtectedRoute>} />
                <Route path="/contractor/about-us" element={<ProtectedRoute><ContractorAboutUs /></ProtectedRoute>} />
                <Route path="/contractor/contact-us" element={<ProtectedRoute><ContractorContactUs /></ProtectedRoute>} />
                <Route path="/contractor/notifications" element={<ProtectedRoute><ContractorNotifications /></ProtectedRoute>} />
                <Route path="/contractor/subscription" element={<ProtectedRoute><ContractorSubscription /></ProtectedRoute>} />
                <Route path="/contractor/history" element={<ProtectedRoute><ContractorHistory /></ProtectedRoute>} />
                <Route path="/contractor/chat" element={<ProtectedRoute><ContractorChatList /></ProtectedRoute>} />
                <Route path="/contractor/chat/:id" element={<ProtectedRoute><ContractorChatConversation /></ProtectedRoute>} />

                {/* Labour Module Routes - Protected */}
                <Route path="/labour/home" element={<Navigate to="/labour/find-user" replace />} />
                <Route path="/labour/details" element={<ProtectedRoute><LabourDetails /></ProtectedRoute>} />
                <Route path="/labour/hire-workers" element={<ProtectedRoute><LabourDashboard /></ProtectedRoute>} />
                <Route path="/labour/find-user" element={<ProtectedRoute><LabourFindUser /></ProtectedRoute>} />
                <Route path="/labour/find-contractor" element={<ProtectedRoute><LabourFindContractor /></ProtectedRoute>} />
                <Route path="/labour/requests" element={<ProtectedRoute><LabourRequests /></ProtectedRoute>} />
                <Route path="/labour/user-request" element={<ProtectedRoute><LabourUserRequest /></ProtectedRoute>} />
                <Route path="/labour/contractor-request" element={<ProtectedRoute><LabourContractorRequest /></ProtectedRoute>} />
                <Route path="/labour/settings" element={<ProtectedRoute><LabourSettings /></ProtectedRoute>} />
                <Route path="/labour/personal-details" element={<ProtectedRoute><LabourPersonalDetails /></ProtectedRoute>} />
                <Route path="/labour/work-details" element={<ProtectedRoute><LabourWorkDetails /></ProtectedRoute>} />
                <Route path="/labour/legal-details" element={<ProtectedRoute><LabourLegalDetails /></ProtectedRoute>} />
                <Route path="/labour/payment-details" element={<ProtectedRoute><LabourPaymentDetails /></ProtectedRoute>} />
                <Route path="/labour/contact-us" element={<ProtectedRoute><LabourContactUs /></ProtectedRoute>} />
                <Route path="/labour/about-us" element={<ProtectedRoute><LabourAboutUs /></ProtectedRoute>} />
                <Route path="/labour/notifications" element={<ProtectedRoute><LabourNotifications /></ProtectedRoute>} />
                <Route path="/labour/subscription" element={<ProtectedRoute><LabourSubscription /></ProtectedRoute>} />
                <Route path="/labour/create-card" element={<ProtectedRoute><CreateLabourCard /></ProtectedRoute>} />
                <Route path="/labour/my-card" element={<ProtectedRoute><LabourMyCard /></ProtectedRoute>} />
                <Route path="/labour/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/labour/chat" element={<ProtectedRoute><LabourChatList /></ProtectedRoute>} />
                <Route path="/labour/chat/:id" element={<ProtectedRoute><LabourChatConversation /></ProtectedRoute>} />

                {/* Admin Module Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_USER', 'ADMIN_LABOUR', 'ADMIN_CONTRACTOR']}><ProfessionalDashboard /></RoleProtectedRoute></Suspense>}>
                    <Route index element={<DashboardHome />} />
                    <Route path="home" element={<DashboardHome />} />
                    <Route path="users" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_USER']}><UserManagement /></RoleProtectedRoute></Suspense>} />
                    <Route path="labours" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_LABOUR']}><LabourManagement /></RoleProtectedRoute></Suspense>} />
                    <Route path="categories" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_LABOUR']}><LabourCategoryManagement /></RoleProtectedRoute></Suspense>} />
                    <Route path="contractors" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_CONTRACTOR']}><ContractorManagement /></RoleProtectedRoute></Suspense>} />
                    <Route path="verification" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}><VerificationManagement /></RoleProtectedRoute></Suspense>} />
                    <Route path="broadcasts" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_USER']}><BroadcastManagement /></RoleProtectedRoute></Suspense>} />
                    <Route path="banners" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}><BannerSection /></RoleProtectedRoute></Suspense>} />
                    <Route path="get-started-slides" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}><GetStartedSlides /></RoleProtectedRoute></Suspense>} />
                    <Route path="admins" element={<Suspense fallback={<PageLoader />}><RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminManagement /></RoleProtectedRoute></Suspense>} />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
