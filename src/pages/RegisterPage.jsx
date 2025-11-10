import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import loginbg from '../assets/images/loginbg.jpg'
import { useNotifications } from '../context/NotificationContext'
import '../styles/RegisterPageStyle.css'

const styles = {
  screen: 'reg-screen',
  container: 'reg-container',
  card: 'reg-card',
  header: 'reg-header',
  form: 'reg-form',
  buttonGroup: 'reg-buttonGroup',
  titleLarge: 'reg-titleLarge',
  subtitle: 'reg-subtitle',
  label: 'reg-label',
  input: 'reg-input',
  btnPrimary: 'reg-btnPrimary',
  btnText: 'reg-btnText',
  icon: 'reg-icon',
  iconBg: 'reg-iconBg',
  errorAlert: 'reg-errorAlert',
  bgWhite: 'bg-white',
  textPrimary: 'text-primary',
  textSecondaryHover: 'text-secondary',
  colorLightBlue: 'reg-btnPrimary',
}

function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifySuccess } = useNotifications()
  
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  // Refs for registration form
  const regUsernameRef = useRef(null)
  const regEmailRef = useRef(null)
  const regPasswordRef = useRef(null)
  const regConfirmPasswordRef = useRef(null)

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user, navigate])

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegisterError('')
    
    if (!registerData.username || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      setRegisterError('Please fill in all fields.')
      return
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match!')
      return
    }

    if (registerData.password.length < 6) {
      setRegisterError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      const { user, error } = await signUp(
        registerData.email,
        registerData.password,
        { username: registerData.username }
      )
      
      if (error) {
        setRegisterError(error)
      } else if (user) {
        notifySuccess('Registration successful', {
          description: 'Please check your email to verify your account.'
        })
        navigate('/')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setRegisterError('An unexpected error occurred during registration.')
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
              <span className="text-xl">📝</span>
            </div>
            <h1 className={`${styles.titleLarge} ${styles.textPrimary}`}>
              Register
            </h1>
            <p className={styles.subtitle}>
              Create a new account
            </p>
          </div>

          <div className={styles.form}>
            {registerError && (
              <div className={styles.errorAlert}>
                {registerError}
              </div>
            )}
            
            <div>
              <label className={styles.label}>Username</label>
              <input
                ref={regUsernameRef}
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    regEmailRef.current?.focus()
                  }
                }}
                placeholder="Choose a username"
                className={styles.input}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className={styles.label}>Email</label>
              <input
                ref={regEmailRef}
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    regPasswordRef.current?.focus()
                  }
                }}
                placeholder="Enter your email"
                className={styles.input}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className={styles.label}>Password</label>
              <input
                ref={regPasswordRef}
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    regConfirmPasswordRef.current?.focus()
                  }
                }}
                placeholder="Choose a password"
                className={styles.input}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className={styles.label}>Confirm Password</label>
              <input
                ref={regConfirmPasswordRef}
                type="password"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleRegister(e)
                  }
                }}
                placeholder="Confirm your password"
                className={styles.input}
                disabled={loading}
              />
            </div>
            
            <button 
              onClick={handleRegister} 
              className={`${styles.btnPrimary} ${styles.colorLightBlue}`}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button 
              onClick={() => navigate('/')} 
              className={`${styles.btnText} ${styles.textSecondaryHover}`}
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
