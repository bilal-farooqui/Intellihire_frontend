import { useEffect, useState } from 'react'
import { Analytics } from "@vercel/analytics/react"
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login/Login'
import Sidebar from './components/Sidebar/Sidebar'
import EmployeeSidebar from './components/EmployeeSidebar/EmployeeSidebar'
import ApplicantSidebar from './components/ApplicantSidebar/ApplicantSidebar'
import Employee from './pages/Employee/Employee'
import Hiring from './pages/Hiring/Hiring'
import EmployeeDashboard from './pages/EmployeeDashboard/EmployeeDashboard'
import ApplicantOpenings from './pages/ApplicantOpenings/ApplicantOpenings'
import ApplicantApplications from './pages/ApplicantApplications/ApplicantApplications'
import ApplicantProfile from './pages/ApplicantProfile/ApplicantProfile'
import AdminOpenings from './pages/AdminOpenings/AdminOpenings'
import AdminLeaves from './pages/AdminLeaves/AdminLeaves'
import AdminAttendance from './pages/AdminAttendance/AdminAttendance'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import AdminSalary from './pages/AdminSalary/AdminSalary'
import AdminInterviews from './pages/AdminInterviews/AdminInterviews'
import Onboarding from './pages/Onboarding/Onboarding'
import AdminRoles from './pages/AdminRoles/AdminRoles'
import { getAllApplications } from './api'
import './App.css'
import './pages/adminShell/AdminLegacyTheme.css'


// Helper component to guard routes based on authentication and roles
function RoleGuard({ allowedRoles, isLoggedIn, userRole, isOnboardingCompleted }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  const currentRole = (userRole === 'administrator' || userRole === 'admin' || userRole === 'Admin') ? 'Admin' : userRole
  
  if (!allowedRoles.includes(currentRole)) {
    if (currentRole === 'employee') return <Navigate to="/employee/dashboard" replace />
    if (currentRole === 'applicant') {
      return isOnboardingCompleted 
        ? <Navigate to="/applicant/profile" replace /> 
        : <Navigate to="/applicant/onboarding" replace />
    }
    if (currentRole === 'Admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const stored = localStorage.getItem('auth')
    return !!stored
  })
  const [userRole, setUserRole] = useState(() => {
    const stored = localStorage.getItem('auth')
    if (!stored) return null
    try {
      const parsed = JSON.parse(stored)
      // Normalize legacy role names to standardized 'Admin'
      if (parsed.role === 'administrator' || parsed.role === 'admin') {
        return 'Admin'
      }
      return parsed.role
    } catch {
      return null
    }
  }) // 'employee' | 'Admin' | 'applicant'
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(() => {
    const stored = localStorage.getItem('auth')
    if (!stored) return false
    try {
      return JSON.parse(stored).onboardingCompleted || false
    } catch {
      return false
    }
  })
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem('auth')
    if (!stored) return null
    try {
      return JSON.parse(stored).userInfo
    } catch {
      return null
    }
  })
  const [activeMenu, setActiveMenuState] = useState(() => {
    return localStorage.getItem('activeMenu') || 'Dashboard'
  })
  const [showSubmenu, setShowSubmenu] = useState(false)
  const [unviewedCVsCount, setUnviewedCVsCount] = useState(0)

  const handleApplicantApply = (application) => {
    // Application is now handled in ApplicantApplications component via database
    // This function can be kept for future use if needed
  }

  const setActiveMenu = (menu) => {
    setActiveMenuState(menu)
    localStorage.setItem('activeMenu', menu)
    
    const normalizedRole = (userRole === 'administrator' || userRole === 'admin' || userRole === 'Admin') ? 'Admin' : userRole

    if (normalizedRole === 'Admin') {
      switch (menu) {
        case 'Dashboard': navigate('/admin/dashboard'); break;
        case 'Employee': navigate('/admin/employee'); break;
        case 'Hiring': navigate('/admin/hiring'); break;
        case 'Admin Openings': navigate('/admin/openings'); break;
        case 'Leaves': navigate('/admin/leaves'); break;
        case 'Attendance': navigate('/admin/attendance'); break;
        case 'Salary': navigate('/admin/salary'); break;
        case 'Interviews': navigate('/admin/interviews'); break;
        case 'Roles': navigate('/admin/roles'); break;
      }
    } else if (normalizedRole === 'employee') {
      if (menu === 'Dashboard') {
        navigate('/employee/dashboard')
      }
    }
  }




  const handleLogin = (role, authData) => {
  console.log("Login attempt:", role, authData)

  setIsLoggedIn(true)
  setUserRole(role)
  setUserInfo(authData || null)

  let defaultMenu = "Dashboard"

  if (role === "employee") {
    defaultMenu = "Dashboard"
    navigate("/employee/dashboard")
  } else if (role === "administrator") {
    defaultMenu = "Employee"
    navigate("/admin/employee")
  } else if (role === "applicant") {
    defaultMenu = "Openings"
    navigate("/applicant/openings")
  }

  setActiveMenu(defaultMenu)

  localStorage.setItem(
    "auth",
    JSON.stringify({
      role,
      userInfo: authData || null,
      onboardingCompleted: authData?.onboarding_completed || false
    })
  )

  if (role === 'applicant') {
    const completed = authData?.onboarding_completed || false
    setIsOnboardingCompleted(completed)
    if (!completed) {
      navigate('/applicant/onboarding')
    } else {
      navigate('/applicant/profile')
    }
  }

  localStorage.setItem("activeMenu", defaultMenu)
}


  

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserRole(null)
    setActiveMenu('Dashboard')
    localStorage.removeItem('auth')
    localStorage.removeItem('activeMenu')
    navigate('/login', { replace: true })
  }

  // Fetch unviewed CVs count for admin
  useEffect(() => {
    const loadUnviewedCount = async () => {
      if (userRole === 'Admin') {
        try {
          const res = await getAllApplications()
          const apps = res.data || []
          // Count applications with status 'Unviewed' or no status
          const unviewed = apps.filter(app => 
            !app.status || app.status === 'Unviewed' || app.status === 'Pending'
          ).length
          setUnviewedCVsCount(unviewed)
        } catch (err) {
          console.error('Error loading unviewed CVs count', err)
        }
      }
    }

    if (isLoggedIn) {
      loadUnviewedCount()
      // Refresh count every 30 seconds
      const interval = setInterval(loadUnviewedCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn, userRole])

  // Ensure URL matches auth state on first load
  useEffect(() => {
    if (!isLoggedIn) {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
      return
    }

    // Logged in: redirect base paths to role-specific default if needed
    const validRoles = ['employee', 'applicant', 'Admin']
    const currentRole = (userRole === 'administrator' || userRole === 'admin') ? 'Admin' : userRole
    const isRoleValid = validRoles.includes(currentRole)

    if (!isRoleValid) {
      console.warn('Invalid role detected, logging out to clear state:', userRole)
      handleLogout()
      return
    }

    const dPath =
      currentRole === 'employee'
        ? '/employee/dashboard'
        : currentRole === 'applicant'
        ? (isOnboardingCompleted ? '/applicant/profile' : '/applicant/onboarding')
        : '/admin/dashboard'

    // Logged-in users who land on /login should go to their home, except applicants
    // who still need onboarding—they stay on /login until they choose "Continue onboarding".
    if (location.pathname === '/login' && dPath !== '/login') {
      navigate(dPath, { replace: true })
    }
  }, [isLoggedIn, userRole, isOnboardingCompleted, location.pathname, navigate])




  // Update activeMenu based on URL for sidebar highlight
  useEffect(() => {
    const path = location.pathname
    
    // Admin path matching
    if (path.startsWith('/admin')) {
      if (path.includes('/dashboard')) setActiveMenuState('Dashboard')
      else if (path.includes('/employee')) setActiveMenuState('Employee')
      else if (path.includes('/hiring')) setActiveMenuState('Hiring')
      else if (path.includes('/openings')) setActiveMenuState('Admin Openings')
      else if (path.includes('/leaves')) setActiveMenuState('Leaves')
      else if (path.includes('/attendance')) setActiveMenuState('Attendance')
      else if (path.includes('/salary')) setActiveMenuState('Salary')
      else if (path.includes('/interviews')) setActiveMenuState('Interviews')
      else if (path.includes('/roles')) setActiveMenuState('Roles')
    }
    // Applicant path matching
    else if (path.startsWith('/applicant')) {
      if (path.includes('/profile')) setActiveMenuState('Profile')
      else if (path.includes('/applications')) setActiveMenuState('Applications')
      else if (path.includes('/openings')) setActiveMenuState('Openings')
    }
    // Employee path matching
    else if (path.startsWith('/employee')) {
      if (path.includes('/dashboard')) setActiveMenuState('Dashboard')
    }
  }, [location.pathname])

  const dPath =
    userRole === 'employee'
      ? '/employee/dashboard'
      : userRole === 'applicant'
      ? (isOnboardingCompleted ? '/applicant/profile' : '/login')
      : '/admin/dashboard'

  return (
    <>
    <Routes>
      <Route path="/" element={
        isLoggedIn ? (
          <Navigate to={
            userRole === 'employee' 
              ? '/employee/dashboard' 
              : (userRole === 'applicant' 
                  ? (isOnboardingCompleted ? '/applicant/profile' : '/applicant/onboarding') 
                  : '/admin/dashboard')
          } replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      {/* Login */}
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to={
              userRole === 'employee' 
                ? '/employee/dashboard' 
                : (userRole === 'applicant' 
                    ? (isOnboardingCompleted ? '/applicant/profile' : '/applicant/onboarding') 
                    : '/admin/dashboard')
            } replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* Employee Routes Protected */}
      <Route element={<RoleGuard allowedRoles={['employee']} isLoggedIn={isLoggedIn} userRole={userRole} isOnboardingCompleted={isOnboardingCompleted} />}>
        <Route path="/employee" element={
          <div className="hr-app hr-app-employee">
            <EmployeeSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            <main className="main-content">
              <div className="content-wrapper">
                <div className="header-actions">
                  <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
                <Outlet />
              </div>
            </main>
          </div>
        }>
          <Route path="dashboard" element={<EmployeeDashboard user={userInfo} />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      {/* Applicant Routes Protected */}
      <Route element={<RoleGuard allowedRoles={['applicant']} isLoggedIn={isLoggedIn} userRole={userRole} isOnboardingCompleted={isOnboardingCompleted} />}>
        {/* Onboarding - Standalone Full Page */}
        <Route
          path="/applicant/onboarding"
          element={
            <Onboarding onComplete={(distData, cvUrl) => {
              const stored = JSON.parse(localStorage.getItem('auth') || '{}')
              stored.onboardingCompleted = true
              if (stored.userInfo) {
                stored.userInfo.onboarding_completed = true
                stored.userInfo.cv_url = cvUrl
              }
              localStorage.setItem('auth', JSON.stringify(stored))
              setIsOnboardingCompleted(true)
              navigate('/applicant/openings')
            }} />
          }
        />

        {/* Applicant Main Layout (Sidebar + Content) */}
        <Route
          path="/applicant"
          element={
            !isOnboardingCompleted ? (
              <Navigate to="/applicant/onboarding" replace />
            ) : (
              <div className="hr-app hr-app-applicant">
                <ApplicantSidebar activeMenu={activeMenu} />
                <main className="main-content">
                  <div className="content-wrapper">
                    <div className="header-actions">
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                    <Outlet />
                  </div>
                </main>
              </div>
            )
          }
        >
          <Route path="openings" element={<ApplicantOpenings onApply={handleApplicantApply} userInfo={userInfo} />} />
          <Route path="applications" element={<ApplicantApplications userInfo={userInfo} />} />
          <Route path="profile" element={<ApplicantProfile />} />
          <Route index element={<Navigate to="profile" replace />} />
        </Route>
      </Route>

      {/* Admin Routes Protected */}
      <Route element={<RoleGuard allowedRoles={['Admin']} isLoggedIn={isLoggedIn} userRole={userRole} isOnboardingCompleted={isOnboardingCompleted} />}>
        <Route path="/admin" element={
          <div className="hr-app hr-app-admin">
            <Sidebar
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              showSubmenu={showSubmenu}
              setShowSubmenu={setShowSubmenu}
              unviewedCVsCount={unviewedCVsCount}
            />
            <main className="main-content">
              <div className="content-wrapper">
                <div className="header-actions">
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
                <Outlet />
              </div>
            </main>
          </div>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="employee" element={<Employee />} />
          <Route path="hiring" element={<Hiring />} />
          <Route path="openings" element={<AdminOpenings />} />
          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="salary" element={<AdminSalary />} />
          <Route path="interviews" element={<AdminInterviews />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          isLoggedIn ? (
            <Navigate to={
              userRole === 'employee' 
                ? '/employee/dashboard' 
                : (userRole === 'applicant' 
                    ? (isOnboardingCompleted ? '/applicant/profile' : '/applicant/onboarding') 
                    : '/admin/dashboard')
            } replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
    <Analytics />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'linear-gradient(170deg, rgba(18, 24, 34, 0.95) 0%, rgba(10, 13, 20, 0.96) 100%)',
          color: '#ecf2ff',
          border: '1px solid rgba(67, 244, 177, 0.24)',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          fontWeight: 600,
        },
        success: {
          iconTheme: {
            primary: '#43f4b1',
            secondary: '#07130e',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff9b9b',
            secondary: '#2a0b0b',
          },
        },
      }}
    />
    </>
  )
}
export default App

