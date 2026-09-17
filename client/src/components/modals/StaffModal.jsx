import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { UserCheck, Save } from 'lucide-react';

export default function StaffModal({ isOpen, onClose, onSave, staffMember }) {
  const initialForm = {
    name: '',
    role: '',
    department: 'Sales & Client Advisory',
    email: '',
    phone: '',
    salesClosed: 0,
    revenueGenerated: 0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (staffMember) {
      setForm(staffMember);
    } else {
      setForm(initialForm);
    }
  }, [staffMember, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      salesClosed: Number(form.salesClosed || 0),
      revenueGenerated: Number(form.revenueGenerated || 0)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staffMember ? 'Edit Staff Member' : 'Add Staff Member'}
      subtitle="Enter staff member profile and role details"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Julian Vance"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Title / Role</label>
            <input
              type="text"
              placeholder="e.g. Senior Sales Director"
              className="form-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="Sales & Client Advisory">Sales & Client Advisory</option>
              <option value="Performance Engineering & Service">Performance Engineering & Service</option>
              <option value="Finance & Insurance">Finance & Insurance</option>
              <option value="Executive Management">Executive Management</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="name@apexhorizon.com"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Direct Phone</label>
            <input
              type="tel"
              placeholder="+1 (555) 700-1100"
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contracts Closed (YTD)</label>
            <input
              type="number"
              className="form-input"
              value={form.salesClosed}
              onChange={(e) => setForm({ ...form, salesClosed: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Revenue Generated (₹ INR)</label>
            <input
              type="number"
              className="form-input"
              value={form.revenueGenerated}
              onChange={(e) => setForm({ ...form, revenueGenerated: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Profile Avatar Image URL</label>
            <input
              type="url"
              className="form-input"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <UserCheck size={16} />
            <span>{staffMember ? 'Update Talent Profile' : 'Confirm Induction'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
