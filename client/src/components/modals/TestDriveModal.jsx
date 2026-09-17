import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { CalendarClock, Save, ShieldCheck } from 'lucide-react';

export default function TestDriveModal({ 
  isOpen, 
  onClose, 
  onSave, 
  vehicles = [], 
  initialData 
}) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    vehicleId: '',
    vehicleName: '',
    date: tomorrow,
    timeSlot: '14:00 - 15:00',
    drivingLicense: '',
    assignedStaff: 'Julian Vance',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        customerName: initialData.customerName || prev.customerName,
        customerPhone: initialData.customerPhone || prev.customerPhone,
        vehicleName: initialData.interestedVehicle || initialData.model || prev.vehicleName,
        vehicleId: initialData.id || prev.vehicleId
      }));
    } else if (vehicles.length > 0 && !form.vehicleName) {
      setForm(prev => ({
        ...prev,
        vehicleId: vehicles[0].id,
        vehicleName: `${vehicles[0].brand} ${vehicles[0].model}`
      }));
    }
  }, [initialData, vehicles, isOpen]);

  const handleVehicleChange = (id) => {
    const v = vehicles.find(item => item.id === id);
    if (v) {
      setForm({ ...form, vehicleId: id, vehicleName: `${v.brand} ${v.model}` });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Customer Test Drive"
      subtitle="Schedule a vehicle test drive appointment"
      maxWidth="640px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Client Name</label>
            <input
              type="text"
              placeholder="e.g. David Chen"
              className="form-input"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Client Contact Phone</label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="form-input"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Vehicle for Evaluation</label>
            <select
              className="form-select"
              value={form.vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              required
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.horsepower} HP) - [{v.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Reservation Date</label>
            <input
              type="date"
              className="form-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Time Window</label>
            <select
              className="form-select"
              value={form.timeSlot}
              onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
            >
              <option value="10:00 - 11:00">10:00 AM - 11:00 AM</option>
              <option value="11:30 - 12:30">11:30 AM - 12:30 PM</option>
              <option value="14:00 - 15:00">02:00 PM - 03:00 PM</option>
              <option value="15:30 - 16:30">03:30 PM - 04:30 PM</option>
              <option value="17:00 - 18:00">05:00 PM - 06:00 PM (Sunset Run)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Driving License Number</label>
            <input
              type="text"
              placeholder="e.g. DL-CA-992014-B"
              className="form-input"
              value={form.drivingLicense}
              onChange={(e) => setForm({ ...form, drivingLicense: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Brand Escort</label>
            <select
              className="form-select"
              value={form.assignedStaff}
              onChange={(e) => setForm({ ...form, assignedStaff: e.target.value })}
            >
              <option value="Julian Vance">Julian Vance (Senior Sales Director)</option>
              <option value="Clara Beaumont">Clara Beaumont (VIP Specialist)</option>
              <option value="Marco Rossi">Marco Rossi (Master Tech)</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Drive Preferences / Notes</label>
            <textarea
              rows={2}
              placeholder="Acceleration test, autopilot demo, sound assessment..."
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
            <CalendarClock size={16} />
            <span>Confirm VIP Reservation</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
