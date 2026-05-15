import { createBrowserRouter } from 'react-router-dom'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { BankLinkPage } from './pages/BankLinkPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OpsPage } from './pages/OpsPage'
import { SessionPage } from './pages/SessionPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/session',
    element: <SessionPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/app/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/app/bank-link',
    element: <BankLinkPage />,
  },
  {
    path: '/app/notifications',
    element: <NotificationsPage />,
  },
  {
    path: '/app/ops',
    element: <OpsPage />,
  },
])
