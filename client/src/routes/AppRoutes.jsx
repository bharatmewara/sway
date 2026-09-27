import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

// Auth Pages
import Login from '../pages/auth/Login/Login'
import Register from '../pages/auth/Register/Register'
import ForgotPassword from '../pages/auth/ForgotPassword/ForgotPassword'
import Verify from '../pages/auth/Verify/Verify'
import VerifyOTP from '../pages/auth/VerifyOTP/VerifyOTP'

// Onboarding Pages
import Welcome from '../pages/onboarding/Welcome/Welcome'
import BasicInfo from '../pages/onboarding/BasicInfo/BasicInfo'
import Preferences from '../pages/onboarding/Preferences/Preferences'
import ProfileSetup from '../pages/onboarding/ProfileSetup/ProfileSetup'

// App Pages
import Dashboard from '../pages/app/Dashboard/Dashboard'
import Discover from '../pages/app/Discover/Discover'
import Matches from '../pages/app/Matches/Matches'
import Messages from '../pages/app/Messages/Messages'
import PrivateChats from '../pages/app/PrivateChats/PrivateChats'
import MessageDetails from '../pages/app/MessageDetails/MessageDetails'
import Notifications from '../pages/app/Notifications/Notifications'
import Profile from '../pages/app/Profile/Profile'
import Requests from '../pages/app/Requests/Requests'
import Visitors from '../pages/app/Visitors/Visitors'
import Search from '../pages/app/Search/Search'
import Members from '../pages/app/Members/Members'
import Crush from '../pages/app/Crush/Crush'
import PurchaseConnect from '../pages/app/PurchaseConnect/PurchaseConnect'
import ViewProfile from '../pages/app/ViewProfile/ViewProfile'

// Settings Pages
import AccountSettings from '../pages/settings/AccountSettings/AccountSettings'
import PrivacySettings from '../pages/settings/PrivacySettings/PrivacySettings'
import NotificationSettings from '../pages/settings/NotificationSettings/NotificationSettings'
import Subscription from '../pages/settings/Subscription/Subscription'

// Public Landing & Admin
import Landing from '../pages/public/Landing/Landing'
import AdminApp from '../AdminApp'

const isUserVerified = (u) =>
  ['verified', 'VERIFIED'].includes(u?.verification_status) &&
  (!u?.gender_match_status || u.gender_match_status === 'MATCH')

const isProfileCompleted = (u) =>
  !!u?.profile_completed ||
  u?.profile_status === 'COMPLETED' ||
  u?.onboarding_status === 'PROFILE_COMPLETED'


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
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isUserVerified(user)) return <Navigate to="/verify" replace />
  if (!isProfileCompleted(user)) return <Navigate to="/profile" replace />
  return children
}

function ProfileRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isUserVerified(user)) return <Navigate to="/verify" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (user) {
    if (!isUserVerified(user)) return <Navigate to="/verify" replace />
    if (!isProfileCompleted(user)) return <Navigate to="/profile" replace />
    return <Navigate to="/home" replace />
  }
  return children
}

function VerifyRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/register" replace />
  if (isUserVerified(user)) {
    return <Navigate to={isProfileCompleted(user) ? '/home' : '/profile'} replace />
  }
  return <Verify />
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
        <Route path="/purchase-connect" element={<P element={<PurchaseConnect />} />} />
        <Route path="/purchse-connect" element={<P element={<PurchaseConnect />} />} />
        <Route path="/profile" element={<ProfileRoute><Profile /></ProfileRoute>} />
        <Route path="/view-profile/:id" element={<P element={<ViewProfile />} />} />

        {/* Messaging & Chat */}
        <Route path="/private-chats" element={<P element={<PrivateChats />} />} />
        <Route path="/chats" element={<P element={<PrivateChats />} />} />
        <Route path="/messages" element={<P element={<PrivateChats />} />} />
        <Route path="/chat" element={<P element={<PrivateChats />} />} />
        <Route path="/message-details/:userId" element={<P element={<MessageDetails />} />} />
        <Route path="/chats/:userId" element={<P element={<MessageDetails />} />} />
        <Route path="/chat/:userId" element={<P element={<MessageDetails />} />} />
        <Route path="/messages/:userId" element={<P element={<MessageDetails />} />} />

        {/* Notifications */}
        <Route path="/notifications" element={<P element={<Notifications />} />} />

        {/* Settings & Account Management */}
        <Route path="/settings" element={<P element={<AccountSettings />} />} />
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
