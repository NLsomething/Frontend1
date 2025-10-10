import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute component wrapper
 * Automatically redirects unauthenticated users to the login page
 * 
 * Usage:
 * <Route path="/protected" element={
 *   <ProtectedRoute>
 *     <YourProtectedComponent />
 *   </ProtectedRoute>
 * } />
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading, profileLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true })
      return
    }

    if (!loading && !profileLoading && allowedRoles?.length) {
      const hasAccess = allowedRoles.includes(role)
      if (!hasAccess) {
        navigate('/', { replace: true })
      }
    }
  }, [user, role, loading, profileLoading, allowedRoles, navigate])

  if (loading || profileLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  const roleAllowed = !allowedRoles?.length || allowedRoles.includes(role)

  return user && roleAllowed ? children : null
}

export default ProtectedRoute
