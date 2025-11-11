import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePassword } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import { useNotifications } from '../context/NotificationContext'
import '../styles/ResetPasswordPageStyle.css'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { notifySuccess } = useNotifications()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setError('Invalid or expired reset link. Please request a new password reset.')
          setIsValidToken(false)
        } else if (session) {
          setIsValidToken(true)
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.')
          setIsValidToken(false)
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('An error occurred. Please try again.')
        setIsValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await updatePassword(newPassword)
      
      if (updateError) {
        setError(updateError)
      } else {
        notifySuccess('Password updated successfully', {
          description: 'You can now sign in with your new password.'
        })
        
        // Sign out the user after password reset
        await supabase.auth.signOut()
        
        // Redirect to login
        setTimeout(() => {
          navigate('/')
        }, 1000)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="rp-screen">
        <div className="rp-container">
          <div className="rp-card">
            <div className="rp-loading">
              <div className="rp-spinner"></div>
              <p>Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rp-screen">
      <div className="rp-container">
        <div className="rp-card">
          <div className="rp-header">
            <h1 className="rp-title">Reset Password</h1>
            <p className="rp-subtitle">
              {isValidToken ? 'Enter your new password' : 'Invalid reset link'}
            </p>
          </div>

          {isValidToken ? (
            <form onSubmit={handleResetPassword} className="rp-form">
              {error && (
                <div className="rp-error-alert">
                  {error}
                </div>
              )}
              
              <div className="rp-form-group">
                <label className="rp-form-label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="rp-form-input"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="rp-form-group">
                <label className="rp-form-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="rp-form-input"
                  disabled={loading}
                  minLength={6}
                />
              </div>
              
              <button 
                type="submit"
                className="rp-btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="rp-form">
              <div className="rp-error-alert">
                {error}
              </div>
              
              <button 
                onClick={() => navigate('/forgot-password')} 
                className="rp-btn-primary"
              >
                Request New Reset Link
              </button>
            </div>
          )}

          <div className="rp-footer">
            <button 
              onClick={() => navigate('/')} 
              className="rp-link-back"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
