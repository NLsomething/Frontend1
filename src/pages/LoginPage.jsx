import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginbg from '../assets/images/loginbg.jpg'

// Style classes
const styles = {
  screen: "w-screen h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center",
  container: "w-full max-w-md mx-4",
  card: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8",
  modal: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-[26rem] transform scale-100 transition-all duration-300",
  modalCompact: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-[26rem] transform scale-100 transition-all duration-300 max-h-[88vh] overflow-y-auto",
  overlay: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50",
  header: "text-center mb-8",
  headerCompact: "text-center mb-4",
  form: "space-y-6",
  formCompact: "space-y-3",
  buttonGroup: "mt-6 space-y-3",
  buttonGroupModal: "pt-2",
  titleLarge: "text-3xl font-bold text-gray-900 dark:text-white mb-2",
  titleMedium: "text-xl font-bold text-gray-900 dark:text-white",
  subtitle: "text-gray-600 dark:text-gray-400",
  subtitleSmall: "text-sm text-gray-600 dark:text-gray-400",
  label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
  labelCompact: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  input: "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
  inputCompact: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
  btnPrimary: "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg text-lg",
  btnSecondary: "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200",
  btnText: "w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200 py-2",
  btnModalPrimary: "w-full font-semibold py-2 rounded-lg transition-colors duration-200 mb-2",
  btnModalSecondary: "w-full font-semibold py-2 rounded-lg transition-colors duration-200",
  colorGreen: "bg-green-600 hover:bg-green-700 text-white",
  colorBlue: "bg-blue-600 hover:bg-blue-700 text-white",
  colorGray: "bg-gray-600 hover:bg-gray-700 text-white",
  icon: "mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4"
}

function LoginPage() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  const [showRegister, setShowRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')

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

  const handleLogin = () => {
    if (formData.usernameOrEmail && formData.password) {
      alert(`Welcome! Redirecting to classroom booking...`)
      navigate('/home')
    } else {
      alert('Please enter both username/email and password.')
    }
  }

  const handleRegister = () => {
    if (registerData.username && registerData.email && registerData.password && registerData.confirmPassword) {
      if (registerData.password !== registerData.confirmPassword) {
        alert('Passwords do not match!')
        return
      }
      alert('Registration successful! Please login with your credentials.')
      setShowRegister(false)
      setRegisterData({ username: '', email: '', password: '', confirmPassword: '' })
    } else {
      alert('Please fill in all fields.')
    }
  }

  const handleForgotPassword = () => {
    if (forgotPasswordEmail) {
      alert('Password reset instructions have been sent to your email.')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
    } else {
      alert('Please enter your email address.')
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
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <span className="text-2xl">🏫</span>
            </div>
            <h1 className={styles.titleLarge}>
              Welcome
            </h1>
            <p className={styles.subtitle}>
              Sign in to access classroom booking
            </p>
          </div>

          <div className={styles.form}>
            <div>
              <label className={styles.label}>
                Username or Email
              </label>
              <input
                type="text"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleInputChange}
                placeholder="Enter username or email"
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className={styles.input}
              />
            </div>

            <button onClick={handleLogin} className={styles.btnPrimary}>
              Login
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={() => setShowRegister(true)} className={styles.btnSecondary}>
              Register
            </button>
            
            <button onClick={() => setShowForgotPassword(true)} className={styles.btnText}>
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {showRegister && (
        <div className={styles.overlay} onClick={() => setShowRegister(false)}>
          <div className={styles.modalCompact} onClick={(e) => e.stopPropagation()}>
            <div className={styles.headerCompact}>
              <h2 className={styles.titleMedium}>Register</h2>
              <p className={styles.subtitleSmall}>Create a new account</p>
            </div>
            
            <div className={styles.formCompact}>
              <div>
                <label className={styles.labelCompact}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  placeholder="Choose a username"
                  className={styles.inputCompact}
                />
              </div>
              
              <div>
                <label className={styles.labelCompact}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="Enter your email"
                  className={styles.inputCompact}
                />
              </div>
              
              <div>
                <label className={styles.labelCompact}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Choose a password"
                  className={styles.inputCompact}
                />
              </div>
              
              <div>
                <label className={styles.labelCompact}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Confirm your password"
                  className={styles.inputCompact}
                />
              </div>
              
              <div className={styles.buttonGroupModal}>
                <button onClick={handleRegister} className={`${styles.btnModalPrimary} ${styles.colorGreen}`}>
                  Register
                </button>
                <button onClick={() => setShowRegister(false)} className={`${styles.btnModalSecondary} ${styles.colorGray}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className={styles.overlay} onClick={() => setShowForgotPassword(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.headerCompact}>
              <h2 className={styles.titleMedium}>Forgot Password</h2>
              <p className={styles.subtitleSmall}>Enter your email to reset password</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={styles.labelCompact}>Email Address</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={styles.inputCompact}
                />
              </div>
              
              <div className={styles.buttonGroupModal}>
                <button onClick={handleForgotPassword} className={`${styles.btnModalPrimary} ${styles.colorBlue}`}>
                  Send Reset Link
                </button>
                <button onClick={() => setShowForgotPassword(false)} className={`${styles.btnModalSecondary} ${styles.colorGray}`}>
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