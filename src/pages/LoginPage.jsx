import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services/authService'
import { checkEmailExists } from '../services/authExtensions'
import { useAuth } from '../context/AuthContext'
import { getRandomQuote } from '../constants/quotes'
import '../styles/LoginPageStyle.css'

function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quote, setQuote] = useState('')
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  useEffect(() => {
    setQuote(getRandomQuote())
  }, [])

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
      // First, check if the email exists
      const { exists } = await checkEmailExists(formData.usernameOrEmail)
      
      if (!exists) {
        setLoginError('No account found with this email address. Please check your email or sign up.')
        setLoading(false)
        return
      }

      // Email exists, proceed with login
      const { user, session, error } = await signIn(formData.usernameOrEmail, formData.password)
      
      if (error) {
        // If we get here, email exists but password is wrong
        if (error.includes('Invalid login credentials')) {
          setLoginError('Incorrect password. Please try again or reset your password.')
        } else {
          setLoginError(error)
        }
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
    <div className="lp-screen">
      {/* Left side - Branding/Info */}
      <div className="lp-sidebar">
        <div className="lp-sidebar-content">
          <div className="lp-logo-section">
            <div className="lp-logo-container">
              <svg
                className="lp-search-logo-icon"
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
              <h1 className="lp-logo-title">Classroom<br />Insight</h1>
            </div>
          </div>
          <div className="lp-quote">
            <p className="lp-quote-text">
              "{quote}"
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="lp-form-container">
        <div className="lp-form-card">
          <div className="lp-form-header">
            <h2 className="lp-form-title">Welcome</h2>
            <p className="lp-form-subtitle">Sign in to access ClassroomInsight</p>
          </div>

          <form className="lp-form" onSubmit={handleLogin}>
            {loginError && (
              <div className="lp-error-alert">
                {loginError}
              </div>
            )}
            
            <div className="lp-form-group">
              <label className="lp-form-label">Email</label>
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
                placeholder="you@example.com"
                className="lp-form-input"
                disabled={loading}
              />
            </div>

            <div className="lp-form-group">
              <div className="lp-password-header">
                <label className="lp-form-label">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="lp-forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>
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
                className="lp-form-input"
                disabled={loading}
              />
            </div>

            <button 
              type="submit"
              className="lp-btn-signin"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="lp-signup-section">
            <p className="lp-signup-text">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="lp-signup-link"
              >
                Sign Up Now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage