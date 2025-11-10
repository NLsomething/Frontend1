import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import loginbg from '../assets/images/loginbg.jpg'
import '../styles/LoginPageStyle.css'

const styles = {
  screen: 'auth-screen',
  container: 'auth-container',
  card: 'auth-card',
  header: 'auth-header',
  form: 'auth-form',
  buttonGroup: 'auth-buttonGroup',
  titleLarge: 'auth-titleLarge',
  subtitle: 'auth-subtitle',
  label: 'auth-label',
  input: 'auth-input',
  btnPrimary: 'auth-btnPrimary',
  btnSecondary: 'auth-btnPrimary',
  btnText: 'auth-btnText',
  icon: 'auth-icon',
  iconBg: 'auth-iconBg',
  errorAlert: 'auth-errorAlert',
  bgWhite: 'bg-white',
  textPrimary: 'text-primary',
  textSecondaryHover: 'text-secondary',
  colorDarkBlue: 'auth-btnPrimary',
  colorLightBlue: 'auth-btnPrimary',
}

function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Refs for login form
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    if (!formData.usernameOrEmail || !formData.password) {
      setLoginError('Please enter both email and password.')
      return
    }

    setLoading(true)

    try {
      const { user, session, error } = await signIn(formData.usernameOrEmail, formData.password)
      
      if (error) {
        setLoginError(error)
      } else if (user && session) {
        navigate('/home')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('An unexpected error occurred. Please try again.')
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
              <span className="text-xl">🏫</span>
            </div>
            <h1 className={`${styles.titleLarge} ${styles.textPrimary}`}>
              Welcome
            </h1>
            <p className={styles.subtitle}>
              Sign in to access ClassroomInsight
            </p>
          </div>

          <div className={styles.form}>
            {loginError && (
              <div className={styles.errorAlert}>
                {loginError}
              </div>
            )}
            
            <div>
              <label className={styles.label}>
                Email
              </label>
              <input
                ref={emailInputRef}
                type="email"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    passwordInputRef.current?.focus()
                  }
                }}
                placeholder="Enter your email"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div>
              <label className={styles.label}>
                Password
              </label>
              <input
                ref={passwordInputRef}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleLogin(e)
                  }
                }}
                placeholder="Enter your password"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <button 
              onClick={handleLogin} 
              className={`${styles.btnPrimary} ${styles.colorDarkBlue}`}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button 
              onClick={() => navigate('/register')} 
              className={`${styles.btnSecondary} ${styles.colorLightBlue}`}
            >
              Register
            </button>
            
            <button 
              onClick={() => navigate('/forgot-password')} 
              className={`${styles.btnText} ${styles.textSecondaryHover}`}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage