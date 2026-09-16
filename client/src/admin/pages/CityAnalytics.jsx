import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function CityAnalytics() {
  const [cities, setCities] = useState([]);
  useEffect(() => {
    api.get('/admin/dashboard').then(res => setCities(res.data.stats?.cityWiseUsers || [])).catch(e=>{});
  }, []);

  return (
    <div>
      <div className="page-header"><h4>City Analytics</h4></div>
      <div className="row">
        {cities.map((c, i) => (
          <div className="col-md-4 mb-3" key={i}>
            <div className="card shadow-sm border-0 rounded-4 p-3">
              <h5 className="text-dark">{c.city || 'Unknown'}</h5>
              <h2 className="text-wine">{c.count} Users</h2>
              <div className="progress mt-2" style={{height:'6px'}}>
                <div className="progress-bar bg-danger" style={{width: `${Math.min(c.count*5, 100)}%`}}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}