import { useState } from 'react'
import { login as employeeLogin, signup as employeeSignup, googleLogin } from '../../api'
import { GoogleLogin } from '@react-oauth/google'
import './Login.css'

function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('employee') // 'employee' | 'Admin' | 'applicant'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [cnic, setCnic] = useState('')
  const [mobile, setMobile] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setMode('login')
    setError('')
  }

  const handleSubmit = async (e) => {
    console.log("SUBMIT CLICKED")
    e.preventDefault()
    setError('')
    console.log("BEFORE API CALL")

    // 🔹 ALL ROLES (Admin, Employee, Applicant)
    try {
      setLoading(true)

      // 🔹 SIGNUP (only for employee)
      if (selectedRole === 'employee' && mode === 'signup') {
        if (!cnic || cnic.length !== 13 || !/^\d+$/.test(cnic)) {
          setError('CNIC must be exactly 13 digits')
          setLoading(false)
          return
        }

        const signupPayload = {
          full_name: fullName,
          email,
          password,
          employee_code: employeeCode,
          cnic: cnic,
          role: 'Employee',
          salary: 0,
          mobile: mobile || null
        }
        await employeeSignup(signupPayload)
      }

      // 🔹 LOGIN (ALL ROLES)
      const res = await employeeLogin({ email, password })
      const data = res.data
      console.log("LOGIN RESPONSE:", data)

      // 🔹 Normalize backend role for comparison
      let backendRole = data.user_role.toLowerCase()
      let portalRole = selectedRole.toLowerCase()

      // Normalize 'admin' vs 'administrator'
      if (backendRole === 'admin') backendRole = 'administrator'
      if (portalRole === 'admin') portalRole = 'administrator'

      // 🔴 PORTAL CHECK: Ensure user is on the right tab
      if (backendRole !== portalRole) {
        setError(`Access Denied: This account is registered as ${data.user_role}. Please use the correct portal tab.`)
        setLoading(false)
        return
      }

      // 🔹 Save token
      if (data?.access_token) {
        localStorage.setItem('token', data.access_token)
      }

      // 🔹 FINAL LOGIN CALLBACK
      onLogin(selectedRole, {
        token: data.access_token,
        role: data.user_role,
        name: data.user_name,
        email,
        employeeId: data.employee_id,
        employeeCode: data.employee_code,
        salary: data.salary
      })

    } catch (err) {
      console.error('Auth error', err)
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      setError('')

      const res = await googleLogin(credentialResponse.credential)
      const data = res.data

      // Save token
      if (data?.access_token) {
        localStorage.setItem('token', data.access_token)
      }

      // Final login callback
      onLogin('applicant', {
        token: data.access_token,
        role: data.user_role,
        name: data.user_name,
        email: data.email,
        employeeId: data.employee_id,
        onboarding_completed: data.onboarding_completed
      })

    } catch (err) {
      console.error('Google login error', err)
      setError('Google login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo-container">
          <div className="login-logo-placeholder">
            <svg className="logo-svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="logo-text">Enterprise Portal</span>
          </div>
        </div>

        <div className="login-header">
          <h1 className="login-logo">Welcome back</h1>
          <p className="login-subtitle">Sign in to your HR account</p>
        </div>

        <div className="role-tabs" role="tablist" aria-label="Login user type">
          <button
            type="button"
            className={`role-tab ${selectedRole === 'employee' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('employee')}
          >
            Employee
          </button>
          <button
            type="button"
            className={`role-tab ${selectedRole === 'Admin' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('Admin')}
          >
            Administrator
          </button>
          <button
            type="button"
            className={`role-tab ${selectedRole === 'applicant' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('applicant')}
          >
            Applicant
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <p className="tab-description">
            {selectedRole === 'employee'
              ? 'Use your employee credentials.'
              : selectedRole === 'Admin'
                ? 'Administrator access portal.'
                : 'Sign in to explore and track openings.'}
          </p>
          {selectedRole === 'employee' && mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="employeeCode">Employee Code</label>
                <input
                  type="text"
                  id="employeeCode"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="EMP001"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cnic">CNIC Number</label>
                <input
                  type="text"
                  id="cnic"
                  value={cnic}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '') // Only digits
                    if (value.length <= 13) {
                      setCnic(value)
                    }
                  }}
                  placeholder="1234567890123"
                  maxLength={13}
                  required
                />
                <small className="helper-text">13 digits only</small>
              </div>
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number (Optional)</label>
                <input
                  type="text"
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+92 300 1234567"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              <div className="error-message">{error}</div>
              {(error.includes('CNIC') || error.includes('Email') || error.includes('already') || error.includes('not enrolled')) && (
                <button
                  type="button"
                  className="try-again-button"
                  onClick={() => {
                    setError('')
                    if (mode === 'signup' && selectedRole === 'employee') {
                      setCnic('')
                      setEmail('')
                      setFullName('')
                      setEmployeeCode('')
                      setMobile('')
                    }
                  }}
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'signup' && selectedRole === 'employee'
                ? 'Sign Up & Login'
                : 'Login'}
          </button>

          {selectedRole === 'employee' && (
            <div className="auth-toggle">
              {mode === 'login' ? (
                <span>
                  New employee?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setMode('signup')}
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setMode('login')}
                  >
                    Login
                  </button>
                </span>
              )}
            </div>
          )}
          {selectedRole === 'applicant' && (
            <div className="google-login-section">
              <div className="divider"><span>OR</span></div>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                useOneTap
                theme="filled_black"
                shape="pill"
                width="350"
              />
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login

