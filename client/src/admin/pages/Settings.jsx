import React from 'react';

export default function Settings() {
  return (
    <div>
      <div className="page-header"><h4>Platform Settings</h4></div>
      <div className="card shadow-sm border-0 rounded-4 p-4" style={{maxWidth: '600px'}}>
        <h5 className="mb-4">Credit Costs</h5>
        <div className="mb-3">
          <label>Send Message (Male)</label>
          <input type="number" className="form-control" defaultValue="1" />
        </div>
        <div className="mb-3">
          <label>Send Crush</label>
          <input type="number" className="form-control" defaultValue="5" />
        </div>
        <div className="mb-3">
          <label>Send Connection Request</label>
          <input type="number" className="form-control" defaultValue="5" />
        </div>
        <div className="mb-4">
          <label>View Private Photos</label>
          <input type="number" className="form-control" defaultValue="10" />
        </div>
        <button className="btn btn-danger">Save Settings</button>
      </div>
    </div>
  );
}