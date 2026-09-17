import React, { useState } from 'react';
import Modal from '../Modal';
import { Wrench, Save } from 'lucide-react';

export default function ServiceModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    customerName: '',
    vehicleModel: '',
    vin: '',
    serviceType: 'First 15k Mile Scheduled Service',
    technician: 'Marco Rossi (Master Tech)',
    estimatedCost: 850,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      estimatedCost: Number(form.estimatedCost || 0)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Service Request"
      subtitle="Enter vehicle maintenance and repair details"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Client / Vehicle Owner</label>
            <input
              type="text"
              placeholder="e.g. Robert Sterling"
              className="form-input"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Model & Year</label>
            <input
              type="text"
              placeholder="e.g. Porsche 911 Carrera S"
              className="form-input"
              value={form.vehicleModel}
              onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Chassis VIN</label>
            <input
              type="text"
              placeholder="17-character VIN"
              className="form-input"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Service Cost (₹ INR)</label>
            <input
              type="number"
              placeholder="e.g. 3500"
              className="form-input"
              value={form.estimatedCost}
              onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Service Scope / Maintenance Type</label>
            <input
              type="text"
              placeholder="e.g. Carbon Ceramic Brake Disc Replacement, ECU Tune"
              className="form-input"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Assigned Lead Technician</label>
            <select
              className="form-select"
              value={form.technician}
              onChange={(e) => setForm({ ...form, technician: e.target.value })}
            >
              <option value="Marco Rossi (Master Tech)">Marco Rossi (Master Certified Technician)</option>
              <option value="Hannah Lee (EV Specialist)">Hannah Lee (High Voltage & EV Specialist)</option>
              <option value="Lucas Meyer (Detailing)">Lucas Meyer (Aesthetic Detailing & Ceramic)</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Diagnostic Notes & OEM Parts</label>
            <textarea
              rows={2}
              placeholder="Symptoms, fluids to flush, part numbers required..."
              className="form-textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Wrench size={16} />
            <span>Generate Bay Ticket</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
