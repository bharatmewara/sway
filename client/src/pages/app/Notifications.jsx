import React, { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import Loader from '../../components/common/Loader'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data?.data?.notifications || [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    } catch {}
  }

  return (
    <MainLayout>
      <div className="container py-4" style={{ maxWidth: '680px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">Notifications</h4>
          {notifications.some((n) => !n.is_read) && (
            <button
              type="button"
              onClick={markAllRead}
              className="btn btn-sm btn-outline-wine rounded-pill"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <Loader text="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <div className="card border-0 rounded-4 shadow-sm p-5 text-center text-secondary">
            <i className="bi bi-bell-slash fs-1 text-wine opacity-50 mb-2" />
            <h5>No Notifications</h5>
            <p className="small">We'll alert you when someone likes or messages you.</p>
          </div>
        ) : (
          <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
            <div className="list-group list-group-flush">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`list-group-item p-3 d-flex align-items-start gap-3 ${
                    !n.is_read ? 'bg-light' : ''
                  }`}
                >
                  <div className="rounded-circle bg-wine text-white p-2 lh-1">
                    <i className="bi bi-bell-fill small" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">{n.title || 'New Activity'}</div>
                    <p className="text-secondary small mb-1">{n.body || n.content}</p>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
