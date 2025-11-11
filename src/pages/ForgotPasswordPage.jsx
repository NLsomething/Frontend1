import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import '../styles/ForgotPasswordPageStyle.css'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifySuccess } = useNotifications()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user, navigate])

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)

    try {
      const { error: resetError } = await resetPassword(email)
      
      if (resetError) {
        setError(resetError)
      } else {
        notifySuccess('Password reset email sent', {
          description: 'Check your inbox for further instructions.'
        })
        navigate('/')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fp-screen">
      <div className="fp-container">
        <div className="fp-card">
          <div className="fp-header">
            <h1 className="fp-title">Forgot your password?</h1>
            <p className="fp-subtitle">
              Enter your email and we'll send you a code to reset the password
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="fp-form">
            {error && (
              <div className="fp-error-alert">
                {error}
              </div>
            )}
            
            <div className="fp-form-group">
              <label className="fp-form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="fp-form-input"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit"
              className="fp-btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>

          <div className="fp-footer">
            <button 
              onClick={() => navigate('/')} 
              className="fp-link-back"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
