import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import loginbg from '../assets/images/loginbg.jpg'
import { useNotifications } from '../context/NotificationContext'
import { USER_ROLES, USER_ROLE_LABELS } from '../constants/roles'
import { 
  createButton, 
  cn,
  labels,
  typography,
  containers,
  authPages,
  buttons
} from '../styles/shared'

const REGISTRATION_ROLES = [
  USER_ROLES.student,
  USER_ROLES.teacher
]

const styles = {
  screen: authPages.screenWithScroll,
  container: authPages.containerCompact,
  card: cn(containers.card, 'p-6'),
  header: authPages.headerCompact,
  form: authPages.formCompact,
  buttonGroup: authPages.buttonGroupCompact,
  titleLarge: cn(typography.h1, authPages.titleCompact),
  subtitle: cn(typography.body, typography.subtitle, authPages.subtitleCompact),
  label: cn(labels.base, authPages.labelCompact),
  input: authPages.inputCompact,
  btnPrimary: createButton('primary', 'sm', true),
  btnText: createButton('text', 'sm', true),
  icon: authPages.iconCompact,
  iconBg: cn(authPages.iconBg, 'hover:bg-[#d0e8ff]'),
  errorAlert: authPages.errorAlert,
  bgWhite: 'bg-white',
  textPrimary: typography.primary,
  textSecondaryHover: cn(typography.secondary, 'hover:text-[#1f5ca9]'),
  colorLightBlue: buttons.secondary,
}

function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifySuccess } = useNotifications()
  
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.student
  })
  const [loading, setLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  // Refs for registration form
  const regUsernameRef = useRef(null)
  const regEmailRef = useRef(null)
  const regPasswordRef = useRef(null)
  const regConfirmPasswordRef = useRef(null)
  const regRoleRef = useRef(null)

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

    if (!REGISTRATION_ROLES.includes(registerData.role)) {
      setRegisterError('Please choose a valid role.')
      return
    }

    setLoading(true)

    try {
      const { user, error } = await signUp(
        registerData.email,
        registerData.password,
        { username: registerData.username },
        registerData.role
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
                    regRoleRef.current?.focus()
                  }
                }}
                placeholder="Confirm your password"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div>
              <label className={styles.label}>Role</label>
              <select
                ref={regRoleRef}
                name="role"
                value={registerData.role}
                onChange={handleRegisterChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleRegister(e)
                  }
                }}
                className={styles.input}
                disabled={loading}
              >
                {REGISTRATION_ROLES.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {USER_ROLE_LABELS[roleOption]}
                  </option>
                ))}
              </select>
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
