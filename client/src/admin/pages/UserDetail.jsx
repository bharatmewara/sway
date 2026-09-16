import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get(`/admin/users/${id}`).then(res => setUser(res.data.user)).catch(e=>{});
  }, [id]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header"><h4>User Details: {user.username}</h4></div>
      <div className="row">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 text-center">
            <img src={user.profile_photo ? `/uploads/profiles/${user.profile_photo}` : '/img/profile.jpg'} className="rounded-circle mx-auto mb-3" width="120" height="120" />
            <h4 className="mb-1">{user.username}</h4>
            <p className="text-muted">{user.email}</p>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <span className="badge bg-primary">{user.gender}</span>
              <span className="badge bg-success">{user.verification_status}</span>
            </div>
            <h5 className="text-warning mb-0">{user.credits ?? user.connect_credits ?? 0} Credits</h5>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h5 className="mb-3">Profile Info</h5>
            <div className="row">
              <div className="col-6 mb-3"><small className="text-muted">City</small><br/><strong>{user.city}</strong></div>
              <div className="col-6 mb-3"><small className="text-muted">Age</small><br/><strong>{user.age}</strong></div>
              <div className="col-6 mb-3"><small className="text-muted">Joined</small><br/><strong>{new Date(user.created_at).toLocaleDateString()}</strong></div>
              <div className="col-6 mb-3"><small className="text-muted">Status</small><br/><strong>{user.is_banned ? 'Banned' : 'Active'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
