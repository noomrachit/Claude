import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/Spinner'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
