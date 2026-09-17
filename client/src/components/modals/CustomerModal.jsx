import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { User, Save } from 'lucide-react';

export default function CustomerModal({ isOpen, onClose, onSave, customer }) {
  const initialForm = {
    name: '',
    email: '',
    phone: '',
    city: '',
    status: 'Active Buyer',
    interestedVehicle: '',
    budget: '',
    notes: ''
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (customer) {
      setForm(customer);
    } else {
      setForm(initialForm);
    }
  }, [customer, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      budget: form.budget ? Number(form.budget) : undefined
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      subtitle="Enter customer contact details and vehicle interest"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Client Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alexander Hayes"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="alex@example.com"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98200 11223"
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Residence / City</label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Maharashtra"
              className="form-input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Client Tier / Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="VIP">VIP Client</option>
              <option value="Active Buyer">Active Buyer</option>
              <option value="Hot Lead">Hot Lead</option>
              <option value="Warm Lead">Warm Lead</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle of Interest</label>
            <input
              type="text"
              placeholder="e.g. Mahindra XUV700 AX7"
              className="form-input"
              value={form.interestedVehicle}
              onChange={(e) => setForm({ ...form, interestedVehicle: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Budget (₹ INR)</label>
            <input
              type="number"
              placeholder="e.g. 2500000"
              className="form-input"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Concierge Notes</label>
            <textarea
              rows={3}
              placeholder="Special requests, track packages, trade-in details..."
              className="form-textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            <span>{customer ? 'Update Client' : 'Enroll Client'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
