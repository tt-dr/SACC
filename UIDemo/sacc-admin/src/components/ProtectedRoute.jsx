import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const { currentUser, isHydrating } = useAuth()
  const location = useLocation()

  if (isHydrating) {
    return null
  }

  if (!currentUser) {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
