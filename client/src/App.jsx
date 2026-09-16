import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Verify from './pages/Verify'

// App Pages
import Home from './pages/Home'
import Profile from './pages/Profile'
import Members from './pages/Members'
import Search from './pages/Search'
import PrivateChats from './pages/PrivateChats'
import MessageDetails from './pages/MessageDetails'
import Notifications from './pages/Notifications'
import Requests from './pages/Requests'
import Visitors from './pages/Visitors'
import Crush from './pages/Crush'
import ViewProfile from './pages/ViewProfile'
import PurchaseConnect from './pages/PurchaseConnect'

// New Feature Pages v2
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Stories from './pages/Stories'
import GiftStore from './pages/GiftStore'
import Boost from './pages/Boost'
import Premium from './pages/Premium'
import Privacy from './pages/Privacy'
import Security from './pages/Security'
import Events from './pages/Events'

// Admin Panel
import AdminApp from './AdminApp'

function LoadingSpinner() {
  return (
    <div className="spinner-overlay">
      <div
        className="spinner-border spinner-border-wine"
        role="status"
        style={{ width: 48, height: 48 }}
      >
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
  if (user.verification_status !== 'verified') return <Navigate to="/verify" replace />

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (user && user.verification_status === 'verified') return <Navigate to="/home" replace />
  return children
}

function VerifyRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.verification_status === 'verified') return <Navigate to="/home" replace />
  return <Verify />
}

function NotFound() {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <h1 style={{ fontSize: 120, fontWeight: 800, color: '#76000b' }}>404</h1>
      <h3>Page Not Found</h3>
      <a href="/" className="btn btn-wine mt-3">
        Go Home
      </a>
    </div>
  )
}

// Helper to create protected routes more cleanly
const P = ({ element }) => <ProtectedRoute>{element}</ProtectedRoute>

function AppRoutes() {
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
        {/* Admin Panel (Must be above catch-all routes if any) */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Public */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Verification */}
        <Route path="/verify" element={<VerifyRoute />} />

        {/* Core App Routes */}
        <Route path="/home"              element={<P element={<Home />} />} />
        <Route path="/profile"           element={<P element={<Profile />} />} />
        <Route path="/discover"          element={<P element={<Discover />} />} />
        <Route path="/matches"           element={<P element={<Matches />} />} />
        <Route path="/members"           element={<P element={<Members />} />} />
        <Route path="/search"            element={<P element={<Search />} />} />
        <Route path="/view-profile/:id"  element={<P element={<ViewProfile />} />} />

        {/* Social */}
        <Route path="/stories"           element={<P element={<Stories />} />} />
        <Route path="/crush"             element={<P element={<Crush />} />} />
        <Route path="/visitors"          element={<P element={<Visitors />} />} />
        <Route path="/requests"          element={<P element={<Requests />} />} />
        <Route path="/notifications"     element={<P element={<Notifications />} />} />

        {/* Messaging */}
        <Route path="/chats"             element={<P element={<PrivateChats />} />} />
        <Route path="/chat"              element={<P element={<PrivateChats />} />} />
        <Route path="/chats/:userId"     element={<P element={<MessageDetails />} />} />
        <Route path="/chat/:userId"      element={<P element={<MessageDetails />} />} />

        {/* Events */}
        <Route path="/events"            element={<P element={<Events />} />} />

        {/* Monetization */}
        <Route path="/gifts"             element={<P element={<GiftStore />} />} />
        <Route path="/boost"             element={<P element={<Boost />} />} />
        <Route path="/premium"           element={<P element={<Premium />} />} />
        <Route path="/purchase"          element={<P element={<PurchaseConnect />} />} />

        {/* Account */}
        <Route path="/privacy"           element={<P element={<Privacy />} />} />
        <Route path="/security"          element={<P element={<Security />} />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
