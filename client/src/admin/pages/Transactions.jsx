import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  useEffect(() => {
    api.get('/admin/transactions').then(res => setTxs(res.data.transactions || [])).catch(e=>{});
  }, []);

  return (
    <div>
      <div className="page-header"><h4>Transactions</h4></div>
      <div className="table-card table-responsive">
        <table className="table mb-0 text-nowrap">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Pack</th>
              <th>Amount (₹)</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {txs.map(t => (
              <tr key={t.id}>
                <td>#{t.id}</td>
                <td>{t.username || 'Deleted User'}</td>
                <td>{t.pack_name}</td>
                <td>{t.amount_inr}</td>
                <td><span className={`badge bg-${t.status==='success'?'success':(t.status==='pending'?'warning':'danger')}`}>{t.status}</span></td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}