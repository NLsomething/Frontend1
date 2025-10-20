import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePassword } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import loginbg from '../assets/images/loginbg.jpg'
import { useNotifications } from '../context/NotificationContext'
import { 
  createButton, 
  createInput,
  cn,
  labels,
  spacing,
  headers,
  typography,
  containers,
  authPages,
  buttons
} from '../styles/shared'

const styles = {
  screen: authPages.screen,
  container: authPages.container,
  card: cn(containers.card, containers.cardDefault),
  header: cn(headers.container, headers.containerDefault),
  form: spacing.form,
  buttonGroup: authPages.buttonGroup,
  titleLarge: cn(typography.h1, 'mb-2'),
  subtitle: cn(typography.body, typography.subtitle),
  label: cn(labels.base, labels.default),
  input: createInput(false),
  btnPrimary: createButton('primary', 'md', true),
  btnText: createButton('text', 'sm', true),
  icon: authPages.icon,
  iconBg: cn(authPages.iconBg, 'hover:bg-[#d0e8ff]'),
  errorAlert: authPages.errorAlert,
  successAlert: 'mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200',
  bgWhite: 'bg-white',
  textPrimary: typography.primary,
  textSecondaryHover: cn(typography.secondary, 'hover:text-[#1f5ca9]'),
  colorDarkBlue: buttons.primary,
}

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { notifySuccess } = useNotifications()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setError('Invalid or expired reset link. Please request a new password reset.')
          setIsValidToken(false)
        } else if (session) {
          setIsValidToken(true)
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.')
          setIsValidToken(false)
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('An error occurred. Please try again.')
        setIsValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await updatePassword(newPassword)
      
      if (updateError) {
        setError(updateError)
      } else {
        notifySuccess('Password updated successfully', {
          description: 'You can now sign in with your new password.'
        })
        
        // Sign out the user after password reset
        await supabase.auth.signOut()
        
        // Redirect to login
        setTimeout(() => {
          navigate('/')
        }, 1000)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div 
        className={styles.screen}
        style={{
          backgroundImage: `url(${loginbg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className={styles.container}>
          <div className={`${styles.card} ${styles.bgWhite}`}>
            <div className="text-center py-8 text-slate-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              Verifying reset link...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={styles.screen}
      style={{
        backgroundImage: `url(${loginbg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.bgWhite}`}>
          <div className={styles.header}>
            <div className={`${styles.icon} ${styles.iconBg}`}>
              <span className="text-xl">🔑</span>
            </div>
            <h1 className={`${styles.titleLarge} ${styles.textPrimary}`}>
              Reset Password
            </h1>
            <p className={styles.subtitle}>
              {isValidToken ? 'Enter your new password' : 'Invalid reset link'}
            </p>
          </div>

          {isValidToken ? (
            <form onSubmit={handleResetPassword} className={styles.form}>
              {error && (
                <div className={styles.errorAlert}>
                  {error}
                </div>
              )}
              
              <div>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={styles.input}
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label className={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={styles.input}
                  disabled={loading}
                  minLength={6}
                />
              </div>
              
              <button 
                type="submit"
                className={`${styles.btnPrimary} ${styles.colorDarkBlue}`}
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className={styles.form}>
              <div className={styles.errorAlert}>
                {error}
              </div>
              
              <button 
                onClick={() => navigate('/forgot-password')} 
                className={`${styles.btnPrimary} ${styles.colorDarkBlue}`}
              >
                Request New Reset Link
              </button>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button 
              onClick={() => navigate('/')} 
              className={`${styles.btnText} ${styles.textSecondaryHover}`}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
