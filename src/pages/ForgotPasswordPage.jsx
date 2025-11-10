import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import loginbg from '../assets/images/loginbg.jpg'
import { useNotifications } from '../context/NotificationContext'
import '../styles/ForgotPasswordPageStyle.css'

const styles = {
  screen: 'fp-screen',
  container: 'fp-container',
  card: 'fp-card',
  header: 'fp-header',
  form: 'fp-form',
  buttonGroup: 'fp-buttonGroup',
  titleLarge: 'fp-titleLarge',
  subtitle: 'fp-subtitle',
  label: 'fp-label',
  input: 'fp-input',
  btnPrimary: 'fp-btnPrimary',
  btnText: 'fp-btnText',
  icon: 'fp-icon',
  iconBg: 'fp-iconBg',
  errorAlert: 'fp-errorAlert',
  bgWhite: 'bg-white',
  textPrimary: 'text-primary',
  textSecondaryHover: 'text-secondary',
  colorDarkBlue: 'fp-btnPrimary',
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
