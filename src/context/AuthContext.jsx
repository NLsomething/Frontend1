import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChange, getCurrentUser, syncProfileRole } from '../services/authService'
import { getProfile } from '../services/profileService'

const AuthContext = createContext({})

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
        if (currentUser) {
          await syncProfileRole(currentUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        await syncProfileRole(session.user)
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

  const value = {
    user,
    session,
    loading,
    profile,
    role: profile?.role || user?.user_metadata?.role || null,
    profileLoading,
    signOut: async () => {
      setUser(null)
      setSession(null)
      setProfile(null)
      setProfileLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
