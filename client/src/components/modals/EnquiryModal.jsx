import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STATUSES = ['New', 'Follow-up', 'Converted', 'Cold'];
const SOURCES = ['Walk-in', 'Phone Call', 'Website', 'Referral', 'Social Media'];

const empty = {
  customerName: '', phone: '', email: '', vehicleInterest: '',
  source: 'Walk-in', status: 'New', notes: '', followUpDate: '',
};

export default function EnquiryModal({ isOpen, onClose, onSave, enquiry }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(enquiry ? { ...empty, ...enquiry } : { ...empty });
  }, [isOpen, enquiry]);

  if (!isOpen) return null;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phone.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{enquiry ? 'Edit Enquiry' : 'New Enquiry / Lead'}</h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Record a new customer enquiry or walk-in lead</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input className="form-input" required value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Mobile number" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle of Interest</label>
              <input className="form-input" value={form.vehicleInterest} onChange={e => set('vehicleInterest', e.target.value)} placeholder="e.g. Hyundai Creta 2026" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Enquiry Source</label>
                <select className="form-select" value={form.source} onChange={e => set('source', e.target.value)}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input className="form-input" type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Budget, preferences, requirements..." />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : enquiry ? 'Update Enquiry' : 'Add Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
