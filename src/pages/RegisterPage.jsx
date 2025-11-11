import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { getRandomQuote } from '../constants/quotes'
import { useNotifications } from '../context/NotificationContext'
import '../styles/RegisterPageStyle.css'

function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifySuccess } = useNotifications()
  const [quote, setQuote] = useState('')
  
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
    // Set random quote on mount
    setQuote(getRandomQuote())
  }, [])

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
    <div className="reg-screen">
      {/* Left side - Branding/Info */}
      <div className="reg-sidebar">
        <div className="reg-sidebar-content">
          <div className="reg-logo-section">
            <div className="reg-logo-container">
              <svg
                className="reg-search-logo-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h1 className="reg-logo-title">Classroom<br />Insight</h1>
            </div>
          </div>
          <div className="reg-quote">
            <p className="reg-quote-text">
              "{quote}"
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="reg-form-container">
        <div className="reg-form-card">
          <div className="reg-form-header">
            <h2 className="reg-form-title">Create Account</h2>
            <p className="reg-form-subtitle">Join ClassroomInsight today</p>
          </div>

          <form className="reg-form" onSubmit={handleRegister}>
            {registerError && (
              <div className="reg-error-alert">
                {registerError}
              </div>
            )}
            
            <div className="reg-form-group">
              <label className="reg-form-label">Username</label>
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
                className="reg-form-input"
                disabled={loading}
              />
            </div>
            
            <div className="reg-form-group">
              <label className="reg-form-label">Email</label>
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
                placeholder="you@example.com"
                className="reg-form-input"
                disabled={loading}
              />
            </div>
            
            <div className="reg-form-group">
              <label className="reg-form-label">Password</label>
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
                placeholder="Create a password"
                className="reg-form-input"
                disabled={loading}
              />
            </div>
            
            <div className="reg-form-group">
              <label className="reg-form-label">Confirm Password</label>
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
                className="reg-form-input"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit"
              className="reg-btn-register"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="reg-signin-section">
            <p className="reg-signin-text">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="reg-signin-link"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
