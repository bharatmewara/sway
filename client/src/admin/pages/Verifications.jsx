import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Verifications() {
  const [reqs, setReqs] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/verification/admin/list');
      setReqs(res.data.requests || []);
    } catch(e) {
      console.error(e);
      setReqs([]);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      if(status === 'approved') {
        await api.put(`/verification/admin/${id}/approve`);
      } else {
        await api.put(`/verification/admin/${id}/reject`, { reason: 'Rejected by admin' });
      }
      toast.success(`Verification ${status}`);
      load();
    } catch(e) { toast.error('Failed to update'); }
  };

  return (
    <div>
      <div className="page-header">
        <h4>Verification Queue</h4>
      </div>
      <div className="row">
        {reqs.map(r => (
          <div className="col-md-6 mb-4" key={r.id}>
            <div className="card shadow-sm border-0 rounded-4 p-3">
              <div className="d-flex justify-content-between mb-3">
                <h5 className="mb-0">User: {r.username} ({r.verification_type})</h5>
                <span className="badge bg-warning text-dark">{r.status}</span>
              </div>
              <div className="row">
                <div className="col-6">
                  <p className="mb-1 text-muted small">Selfie</p>
                  <img src={r.selfie_url ? `http://localhost:5000${r.selfie_url}` : ''} className="w-100 rounded" alt="selfie" style={{height:'150px', objectFit:'cover'}} />
                </div>
                {r.document_url && (
                  <div className="col-6">
                    <p className="mb-1 text-muted small">Document</p>
                    <img src={`http://localhost:5000${r.document_url}`} className="w-100 rounded" alt="document" style={{height:'150px', objectFit:'cover'}} />
                  </div>
                )}
              </div>
              <div className="mt-3 p-2 bg-light rounded">
                <small className="d-block">AI Gender: {r.ai_detected_gender}</small>
                <small className="d-block">Confidence: {r.ai_confidence}</small>
                <small className="d-block">Liveness: {r.ai_is_live}</small>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button className="btn btn-success flex-grow-1" onClick={()=>updateStatus(r.id, 'approved')}>Approve</button>
                <button className="btn btn-danger flex-grow-1" onClick={()=>updateStatus(r.id, 'rejected')}>Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}