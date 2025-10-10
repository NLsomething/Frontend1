import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, resetPassword } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import loginbg from '../assets/images/loginbg.jpg'
import { useNotifications } from '../context/NotificationContext'
import { USER_ROLES, USER_ROLE_LABELS } from '../constants/roles'

const REGISTRATION_ROLES = [
  USER_ROLES.student,
  USER_ROLES.teacher,
  USER_ROLES.buildingManager
]

// Style classes
const styles = {
  screen: "w-screen h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center",
  container: "w-full max-w-[26rem] mx-4",
  card: "rounded-xl shadow-2xl p-7",
  modal: "rounded-xl shadow-2xl pt-6 px-6 pb-7 w-full max-w-[25rem] transform scale-100 transition-all duration-300",
  modalCompact: "rounded-xl shadow-2xl pt-3.5 px-5 pb-4.5 w-full max-w-[25rem] transform scale-100 transition-all duration-300 max-h-[96vh] overflow-y-auto",
  overlay: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50",
  header: "text-center mb-7",
  headerCompact: "text-center mb-2.5",
  form: "space-y-5",
  formCompact: "space-y-2",
  buttonGroup: "mt-5 space-y-2.5",
  buttonGroupModal: "pt-1",
  titleLarge: "text-2xl font-bold mb-2",
  titleMedium: "text-xl font-bold",
  subtitle: "text-gray-600 text-base",
  subtitleSmall: "text-sm text-gray-600",
  label: "block text-sm font-medium text-gray-700 mb-1.5",
  labelCompact: "block text-sm font-medium text-gray-700 mb-0.5",
  input: "w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-200",
  inputCompact: "w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-200",
  btnPrimary: "w-full text-white font-semibold py-2.5 px-5 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg",
  btnSecondary: "w-full text-white font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200",
  btnText: "w-full font-medium transition-colors duration-200 py-2 text-sm",
  btnModalPrimary: "w-full font-semibold py-2 rounded-lg transition-colors duration-200 mb-2",
  btnModalSecondary: "w-full font-semibold py-2 rounded-lg transition-colors duration-200",
  colorDarkBlue: "bg-[#1f5ca9] hover:bg-[#1a4d8f] text-white focus:ring-[#1f5ca9]",
  colorLightBlue: "bg-[#096ecc] hover:bg-[#0859a8] text-white focus:ring-[#096ecc]",
  colorLighterBlue: "bg-[#e8f4ff] hover:bg-[#d0e8ff] text-[#1f5ca9] focus:ring-[#096ecc]",
  colorGray: "bg-gray-600 hover:bg-gray-700 text-white",
  icon: "mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3",
  bgWhite: "bg-[#ffffff]",
  bgLightGray: "bg-[#f9f9f9]",
  textDarkBlue: "text-[#1f5ca9]",
  textLightBlue: "text-[#096ecc] hover:text-[#1f5ca9]"
}

function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifySuccess } = useNotifications()
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [forgotPasswordError, setForgotPasswordError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.student
  })
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')

  // Refs for login form
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  // Refs for registration form
  const regUsernameRef = useRef(null)
  const regEmailRef = useRef(null)
  const regPasswordRef = useRef(null)
  const regConfirmPasswordRef = useRef(null)
  const regRoleRef = useRef(null)

  // Ref for forgot password form
  const forgotEmailRef = useRef(null)

  // Redirect if already logged in
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

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterData(prev => ({
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

  const handleRegister = async () => {
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
        setShowRegister(false)
  setRegisterData({ username: '', email: '', password: '', confirmPassword: '', role: USER_ROLES.student })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setRegisterError('An unexpected error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
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
        setShowForgotPassword(false)
        setForgotPasswordEmail('')
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
            <div className={`${styles.icon} ${styles.bgLighterBlue}`}>
              <span className="text-xl">🏫</span>
            </div>
            <h1 className={`${styles.titleLarge} ${styles.textDarkBlue}`}>
              Welcome
            </h1>
            <p className={styles.subtitle}>
              Sign in to access ClassroomInsight
            </p>
          </div>

          <div className={styles.form}>
            {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
            <button onClick={() => {
              setRegisterError('')
              setShowRegister(true)
            }} className={`${styles.btnSecondary} ${styles.colorLightBlue}`}>
              Register
            </button>
            
            <button onClick={() => {
              setForgotPasswordError('')
              setShowForgotPassword(true)
            }} className={`${styles.btnText} ${styles.textLightBlue}`}>
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {showRegister && (
        <div className={styles.overlay} onClick={() => {
          setRegisterError('')
          setShowRegister(false)
        }}>
          <div className={`${styles.modalCompact} ${styles.bgWhite}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.headerCompact}>
              <h2 className={`${styles.titleMedium} ${styles.textDarkBlue}`}>Register</h2>
              <p className={styles.subtitleSmall}>Create a new account</p>
            </div>
            
            <div className={styles.formCompact}>
              {registerError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1.5 rounded text-sm mb-1.5">
                  {registerError}
                </div>
              )}
              
              <div>
                <label className={styles.labelCompact}>Username</label>
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
                  className={styles.inputCompact}
                />
              </div>
              
              <div>
                <label className={styles.labelCompact}>Email</label>
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
                  className={styles.inputCompact}
                />
              </div>
              
              <div>
                <label className={styles.labelCompact}>Password</label>
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
                  className={styles.inputCompact}
                />
              </div>
              
              <div>
                <label className={styles.labelCompact}>Confirm Password</label>
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
                  className={styles.inputCompact}
                />
              </div>

              <div>
                <label className={styles.labelCompact}>Role</label>
                <select
                  ref={regRoleRef}
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleRegister()
                    }
                  }}
                  className={styles.inputCompact}
                >
                  {REGISTRATION_ROLES.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {USER_ROLE_LABELS[roleOption]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.buttonGroupModal}>
                <button onClick={handleRegister} className={`${styles.btnModalPrimary} ${styles.colorLightBlue}`}>
                  Register
                </button>
                <button onClick={() => {
                  setRegisterError('')
                  setShowRegister(false)
                }} className={`${styles.btnModalSecondary} ${styles.colorGray}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className={styles.overlay} onClick={() => {
          setForgotPasswordError('')
          setShowForgotPassword(false)
        }}>
          <div className={`${styles.modal} ${styles.bgWhite}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.headerCompact}>
              <h2 className={`${styles.titleMedium} ${styles.textDarkBlue}`}>Forgot Password</h2>
              <p className={styles.subtitleSmall}>Enter your email to reset password</p>
            </div>
            
            <div className="space-y-4">
              {forgotPasswordError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {forgotPasswordError}
                </div>
              )}
              
              <div>
                <label className={styles.labelCompact}>Email Address</label>
                <input
                  ref={forgotEmailRef}
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleForgotPassword()
                    }
                  }}
                  placeholder="Enter your email address"
                  className={styles.inputCompact}
                />
              </div>
              
              <div className={styles.buttonGroupModal}>
                <button onClick={handleForgotPassword} className={`${styles.btnModalPrimary} ${styles.colorDarkBlue}`}>
                  Send Reset Link
                </button>
                <button onClick={() => {
                  setForgotPasswordError('')
                  setShowForgotPassword(false)
                }} className={`${styles.btnModalSecondary} ${styles.colorGray}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage