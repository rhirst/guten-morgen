import { lazy, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/components/router/protected-route'

const Dashboard = lazy(() => import('@/app/dashboard/page'))
const SignIn = lazy(() => import('@/app/auth/sign-in/page'))
const AppearanceSettings = lazy(() => import('@/app/settings/appearance/page'))
const SourcesSettings = lazy(() => import('@/app/settings/sources/page'))
const NotFound = lazy(() => import('@/app/errors/not-found/page'))

export interface RouteConfig {
  path: string
  element: ReactNode
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    element: <Navigate to="dashboard" replace />
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: "/auth/sign-in",
    element: (
      <GuestRoute>
        <SignIn />
      </GuestRoute>
    )
  },
  {
    path: "/settings/appearance",
    element: (
      <ProtectedRoute>
        <AppearanceSettings />
      </ProtectedRoute>
    )
  },
  {
    path: "/settings/sources",
    element: (
      <ProtectedRoute>
        <SourcesSettings />
      </ProtectedRoute>
    )
  },
  {
    path: "*",
    element: <NotFound />
  }
]
