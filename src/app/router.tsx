import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { PageLoader } from '@/components/ui/Primitives'

// Route-level code splitting: each area ships only what it needs.
const page = (load: () => Promise<{ default: ComponentType }>): LazyExoticComponent<ComponentType> => lazy(load)

const AuthRoot = page(() => import('@/features/auth/AuthRoot'))
const MarketingLayout = page(() => import('@/layouts/MarketingLayout'))
const DashboardLayout = page(() => import('@/layouts/DashboardLayout'))
const AdminLayout = page(() => import('@/layouts/AdminLayout'))

const LandingPage = page(() => import('@/features/marketing/LandingPage'))
const TemplatesPage = page(() => import('@/features/templates/TemplatesPage'))
const TemplateDetailPage = page(() => import('@/features/templates/TemplateDetailPage'))
const StaticPage = page(() => import('@/features/marketing/StaticPage'))
const NotFoundPage = page(() => import('@/features/marketing/NotFoundPage'))

const PublicInvitationPage = page(() => import('@/features/invitation/PublicInvitationPage'))
const TemplateDemoPage = page(() => import('@/features/invitation/TemplateDemoPage'))
const LivePreviewPage = page(() => import('@/features/invitation/LivePreviewPage'))
const OwnerPreviewPage = page(() => import('@/features/invitation/OwnerPreviewPage'))

const LoginPage = page(() => import('@/features/auth/LoginPage'))
const RegisterPage = page(() => import('@/features/auth/RegisterPage'))
const ForgotPasswordPage = page(() => import('@/features/auth/ForgotPasswordPage'))
const ResetPasswordPage = page(() => import('@/features/auth/ResetPasswordPage'))
const AdminLoginPage = page(() => import('@/features/auth/AdminLoginPage'))

const DashboardHome = page(() => import('@/features/dashboard/DashboardHome'))
const WeddingOverviewPage = page(() => import('@/features/dashboard/WeddingOverviewPage'))
const AccountPage = page(() => import('@/features/dashboard/AccountPage'))
const WeddingWizard = page(() => import('@/features/weddings/wizard/WeddingWizard'))

const AdminDashboardPage = page(() => import('@/features/admin/AdminDashboardPage'))
const AdminTemplatesPage = page(() => import('@/features/admin/AdminTemplatesPage'))
const AdminTemplateEditorPage = page(() => import('@/features/admin/AdminTemplateEditorPage'))
const AdminCategoriesPage = page(() => import('@/features/admin/AdminCategoriesPage'))
const AdminLibraryPage = page(() => import('@/features/admin/AdminLibraryPage'))

function Suspended() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <Suspended />,
    children: [
      // Guest-facing: no auth client, minimal JavaScript.
      { path: 'w/:slug', element: <PublicInvitationPage /> },
      { path: 'preview/live', element: <LivePreviewPage /> },
      { path: 'preview/:slug', element: <TemplateDemoPage /> },
      {
        element: <AuthRoot />,
        children: [
          {
            element: <MarketingLayout />,
            children: [
              { index: true, element: <LandingPage /> },
              { path: 'templates', element: <TemplatesPage /> },
              { path: 'templates/:slug', element: <TemplateDetailPage /> },
              { path: 'about', element: <StaticPage /> },
              { path: 'contact', element: <StaticPage /> },
              { path: 'terms', element: <StaticPage /> },
              { path: 'privacy', element: <StaticPage /> },
              { path: 'login', element: <LoginPage /> },
              { path: 'register', element: <RegisterPage /> },
              { path: 'forgot-password', element: <ForgotPasswordPage /> },
              { path: 'reset-password', element: <ResetPasswordPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
          { path: 'admin/login', element: <AdminLoginPage /> },
          // Guards live inside these layouts (RequireAuth / RequireAdmin).
          {
            path: 'dashboard',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHome /> },
              { path: 'account', element: <AccountPage /> },
              { path: 'weddings/:id', element: <WeddingOverviewPage /> },
              { path: 'weddings/:id/edit/:step?', element: <WeddingWizard /> },
            ],
          },
          { path: 'dashboard/weddings/:id/preview', element: <OwnerPreviewPage /> },
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'templates', element: <AdminTemplatesPage /> },
              { path: 'templates/:id', element: <AdminTemplateEditorPage /> },
              { path: 'categories', element: <AdminCategoriesPage /> },
              { path: 'library', element: <AdminLibraryPage /> },
            ],
          },
        ],
      },
    ],
  },
])
