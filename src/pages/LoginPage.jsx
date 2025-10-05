import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Style classes - MOVED TO TOP
const styles = {
  input: "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
  label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
  primaryButton: "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg text-lg",
  secondaryButton: "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200",
  textButton: "w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200 py-2",
  modalOverlay: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50",
  modalContent: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full transform scale-100 transition-all duration-300",
  modalButton: "flex-1 font-semibold py-3 rounded-lg transition-colors duration-200",
  modalButtonPrimary: "bg-green-600 hover:bg-green-700 text-white",
  modalButtonSecondary: "bg-gray-600 hover:bg-gray-700 text-white",
  modalButtonBlue: "bg-blue-600 hover:bg-blue-700 text-white"
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
    <div className="w-screen h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🏫</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to access classroom booking
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Username/Email */}
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

            {/* Password */}
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

            {/* Login Button */}
            <button onClick={handleLogin} className={styles.primaryButton}>
              Login
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button onClick={() => setShowRegister(true)} className={styles.secondaryButton}>
              Register
            </button>
            
            <button onClick={() => setShowForgotPassword(true)} className={styles.textButton}>
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className={styles.modalOverlay} onClick={() => setShowRegister(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-7 w-full max-w-[26rem] transform scale-100 transition-all duration-300 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Register</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create a new account</p>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  placeholder="Choose a username"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="Enter your email"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Choose a password"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Confirm your password"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-2.5 pt-3.5">
                <button onClick={handleRegister} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200">
                  Register
                </button>
                <button onClick={() => setShowRegister(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className={styles.modalOverlay} onClick={() => setShowForgotPassword(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-[26rem] transform scale-100 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enter your email to reset password</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-2.5 pt-2">
                <button onClick={handleForgotPassword} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200">
                  Send Reset Link
                </button>
                <button onClick={() => setShowForgotPassword(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200">
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