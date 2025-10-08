import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginbg from '../assets/images/loginbg.jpg'

// Style classes
const styles = {
  screen: "w-screen h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center",
  container: "w-full max-w-[26rem] mx-4",
  card: "rounded-xl shadow-2xl p-7",
  modal: "rounded-xl shadow-2xl pt-6 px-6 pb-7 w-full max-w-[25rem] transform scale-100 transition-all duration-300",
  modalCompact: "rounded-xl shadow-2xl pt-5 px-5 pb-6 w-full max-w-[25rem] transform scale-100 transition-all duration-300 max-h-[88vh] overflow-y-auto",
  overlay: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50",
  header: "text-center mb-7",
  headerCompact: "text-center mb-5",
  form: "space-y-5",
  formCompact: "space-y-3.5",
  buttonGroup: "mt-5 space-y-2.5",
  buttonGroupModal: "pt-2",
  titleLarge: "text-2xl font-bold mb-2",
  titleMedium: "text-xl font-bold",
  subtitle: "text-gray-600 text-base",
  subtitleSmall: "text-sm text-gray-600",
  label: "block text-sm font-medium text-gray-700 mb-1.5",
  labelCompact: "block text-sm font-medium text-gray-700 mb-1",
  input: "w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-200",
  inputCompact: "w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-200",
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

            <button onClick={handleLogin} className={`${styles.btnPrimary} ${styles.colorDarkBlue}`}>
              Login
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={() => setShowRegister(true)} className={`${styles.btnSecondary} ${styles.colorLightBlue}`}>
              Register
            </button>
            
            <button onClick={() => setShowForgotPassword(true)} className={`${styles.btnText} ${styles.textLightBlue}`}>
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {showRegister && (
        <div className={styles.overlay} onClick={() => setShowRegister(false)}>
          <div className={`${styles.modalCompact} ${styles.bgWhite}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.headerCompact}>
              <h2 className={`${styles.titleMedium} ${styles.textDarkBlue}`}>Register</h2>
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
                <button onClick={handleRegister} className={`${styles.btnModalPrimary} ${styles.colorLightBlue}`}>
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
          <div className={`${styles.modal} ${styles.bgWhite}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.headerCompact}>
              <h2 className={`${styles.titleMedium} ${styles.textDarkBlue}`}>Forgot Password</h2>
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
                <button onClick={handleForgotPassword} className={`${styles.btnModalPrimary} ${styles.colorDarkBlue}`}>
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