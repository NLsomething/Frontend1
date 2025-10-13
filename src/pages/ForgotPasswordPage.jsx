import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService'
import { useAuth } from '../context/AuthContext'
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
  bgWhite: 'bg-white',
  textPrimary: typography.primary,
  textSecondaryHover: cn(typography.secondary, 'hover:text-[#1f5ca9]'),
  colorDarkBlue: buttons.primary,
}

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifySuccess } = useNotifications()
  
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState('')
  const forgotEmailRef = useRef(null)

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user, navigate])

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotPasswordError('')
    
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Please enter your email address.')
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(forgotPasswordEmail)
      
      if (error) {
        setForgotPasswordError(error)
      } else {
        notifySuccess('Password reset email sent', {
          description: 'Check your inbox for further instructions.'
        })
        navigate('/')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setForgotPasswordError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
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
              <span className="text-xl">🔐</span>
            </div>
            <h1 className={`${styles.titleLarge} ${styles.textPrimary}`}>
              Forgot Password
            </h1>
            <p className={styles.subtitle}>
              Enter your email to reset password
            </p>
          </div>

          <div className={styles.form}>
            {forgotPasswordError && (
              <div className={styles.errorAlert}>
                {forgotPasswordError}
              </div>
            )}
            
            <div>
              <label className={styles.label}>Email Address</label>
              <input
                ref={forgotEmailRef}
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleForgotPassword(e)
                  }
                }}
                placeholder="Enter your email address"
                className={styles.input}
                disabled={loading}
              />
            </div>
            
            <button 
              onClick={handleForgotPassword} 
              className={`${styles.btnPrimary} ${styles.colorDarkBlue}`}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>

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

export default ForgotPasswordPage
