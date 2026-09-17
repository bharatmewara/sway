import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

// Auth Pages
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import VerifyOTP from '../pages/auth/VerifyOTP'

// Onboarding Pages
import Welcome from '../pages/onboarding/Welcome'
import BasicInfo from '../pages/onboarding/BasicInfo'
import Preferences from '../pages/onboarding/Preferences'
import ProfileSetup from '../pages/onboarding/ProfileSetup'

// App Pages
import Dashboard from '../pages/app/Dashboard'
import Discover from '../pages/app/Discover'
import Matches from '../pages/app/Matches'
import Messages from '../pages/app/Messages'
import Notifications from '../pages/app/Notifications'
import Profile from '../pages/app/Profile'
import Requests from '../pages/Requests'
import Visitors from '../pages/Visitors'
import Search from '../pages/Search'
import Members from '../pages/Members'
import Crush from '../pages/Crush'
import PurchaseConnect from '../pages/PurchaseConnect'

// Settings Pages
import AccountSettings from '../pages/settings/AccountSettings'
import PrivacySettings from '../pages/settings/PrivacySettings'
import NotificationSettings from '../pages/settings/NotificationSettings'
import Subscription from '../pages/settings/Subscription'

// Public Landing & Admin
import Landing from '../pages/Landing'
import ViewProfile from '../pages/ViewProfile'
import AdminApp from '../AdminApp'

function LoadingSpinner() {
  return (
    <div className="spinner-overlay">
      <div className="spinner-border spinner-border-wine" role="status" style={{ width: 48, height: 48 }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner />
  // If not logged in, redirect to login
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  // Password-authenticated users skip OTP verification directly into the app
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  // If already logged in, redirect straight to /home
  if (user) return <Navigate to="/home" replace />
  return children
}

function VerifyRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  // If already logged in with password, skip OTP verification to /home
  if (user) return <Navigate to="/home" replace />
  return <Navigate to="/login" replace />
}

function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <h1 style={{ fontSize: 120, fontWeight: 800, color: '#76000b' }}>404</h1>
      <h3>Page Not Found</h3>
      <a href="/" className="btn btn-wine mt-3">Go Home</a>
    </div>
  )
}

const P = ({ element }) => <ProtectedRoute>{element}</ProtectedRoute>

export default function AppRoutes() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Poppins, sans-serif', fontSize: 14 },
          success: { iconTheme: { primary: '#76000b', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Admin Portal */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Public & Authentication */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify" element={<VerifyRoute />} />

        {/* Onboarding Flow */}
        <Route path="/onboarding/welcome" element={<P element={<Welcome />} />} />
        <Route path="/onboarding/basic-info" element={<P element={<BasicInfo />} />} />
        <Route path="/onboarding/preferences" element={<P element={<Preferences />} />} />
        <Route path="/onboarding/profile-setup" element={<P element={<ProfileSetup />} />} />

        {/* Core Application Feed */}
        <Route path="/home" element={<P element={<Dashboard />} />} />
        <Route path="/dashboard" element={<P element={<Dashboard />} />} />
        <Route path="/discover" element={<P element={<Discover />} />} />
        <Route path="/matches" element={<P element={<Matches />} />} />
        <Route path="/members" element={<P element={<Members />} />} />
        <Route path="/requests" element={<P element={<Requests />} />} />
        <Route path="/visitors" element={<P element={<Visitors />} />} />
        <Route path="/search" element={<P element={<Search />} />} />
        <Route path="/crush" element={<P element={<Crush />} />} />
        <Route path="/purchase" element={<P element={<PurchaseConnect />} />} />
        <Route path="/profile" element={<P element={<Profile />} />} />
        <Route path="/view-profile/:id" element={<P element={<ViewProfile />} />} />

        {/* Messaging & Chat */}
        <Route path="/messages" element={<P element={<Messages />} />} />
        <Route path="/chats" element={<P element={<Messages />} />} />
        <Route path="/chat" element={<P element={<Messages />} />} />
        <Route path="/chat/:userId" element={<P element={<Messages />} />} />
        <Route path="/chats/:userId" element={<P element={<Messages />} />} />

        {/* Notifications */}
        <Route path="/notifications" element={<P element={<Notifications />} />} />

        {/* Settings & Account Management */}
        <Route path="/settings/account" element={<P element={<AccountSettings />} />} />
        <Route path="/settings/privacy" element={<P element={<PrivacySettings />} />} />
        <Route path="/settings/notifications" element={<P element={<NotificationSettings />} />} />
        <Route path="/settings/subscription" element={<P element={<Subscription />} />} />
        <Route path="/subscription" element={<P element={<Subscription />} />} />
        <Route path="/privacy" element={<P element={<PrivacySettings />} />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
