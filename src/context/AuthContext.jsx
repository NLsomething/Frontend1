import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { onAuthStateChange, getCurrentUser } from '../services/authService'
import { getProfile } from '../services/profileService'

const AuthContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        const { user: currentUser } = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      try {
        const incomingUser = session?.user ?? null

        if (event === 'SIGNED_IN' && document.visibilityState === 'hidden') {
          return
        }

        console.log('Auth state changed:', event)

        setSession((prev) => {
          // shallow compare by user id to avoid unnecessary updates
          const prevId = prev?.user?.id ?? null
          const nextId = incomingUser?.id ?? null
          if (prevId === nextId) return prev
          return session
        })

        setUser((prevUser) => {
          const prevId = prevUser?.id ?? null
          const nextId = incomingUser?.id ?? null
          if (prevId === nextId) return prevUser
          return incomingUser
        })

        setLoading((prev) => (prev ? false : prev))
      } catch (err) {
        console.error('Error processing auth state change:', err)
      }
    })

    // Cleanup subscription on unmount
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)
      const { data, error } = await getProfile(user.id)

      if (error) {
        console.error('Error fetching profile:', error.message || error)
      }

      setProfile(data || null)
      setProfileLoading(false)
    }

    fetchProfile()
  }, [user])

  // Force refresh profile - useful after role changes
  const refreshProfileCb = useCallback(async () => {
    if (!user?.id) return
    setProfileLoading(true)
    const { data, error } = await getProfile(user.id)

    if (error) {
      console.error('Error refreshing profile:', error.message || error)
    }

    setProfile(data || null)
    setProfileLoading(false)
  }, [user?.id])

  const signOutCb = useCallback(async () => {
    setUser(null)
    setSession(null)
    setProfile(null)
    setProfileLoading(false)
  }, [])

  const memoValue = useMemo(() => ({
    user,
    session,
    loading,
    profile,
    role: profile?.role || user?.user_metadata?.role || null,
    profileLoading,
    refreshProfile: refreshProfileCb,
    signOut: signOutCb
  }), [user, session, loading, profile, profileLoading, refreshProfileCb, signOutCb])

  return (
    <AuthContext.Provider value={memoValue}>
      {children}
    </AuthContext.Provider>
  )
}
