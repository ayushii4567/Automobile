import React, { useState } from 'react';
import { 
  CalendarClock, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Car, 
  User, 
  AlertCircle 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Appointments({ appointments = [], onAddAppointment, onUpdateAppointment, onConvertToService }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    vehicleModel: '',
    vin: '',
    preferredDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 11:30 AM',
    serviceBayNo: 'Bay-1 (Express Maintenance)',
    serviceType: 'First Periodic Service (1,000 KM)',
    notes: '',
    status: 'Booked'
  });

  const handleOpenNew = () => {
    setSelectedAppt(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      vehicleModel: '',
      vin: '',
      preferredDate: new Date().toISOString().split('T')[0],
      timeSlot: '10:00 AM - 11:30 AM',
      serviceBayNo: 'Bay-1 (Express Maintenance)',
      serviceType: 'First Periodic Service (1,000 KM)',
      notes: '',
      status: 'Booked'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedAppt(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAppt) {
      onUpdateAppointment(selectedAppt.id, formData);
    } else {
      onAddAppointment(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = appointments.filter(a => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (a.customerName || '').toLowerCase().includes(s) ||
      (a.customerPhone || '').toLowerCase().includes(s) ||
      (a.vehicleModel || '').toLowerCase().includes(s) ||
      (a.appointmentNo || '').toLowerCase().includes(s) ||
      (a.serviceBayNo || '').toLowerCase().includes(s)
    );
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Appointments</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <CalendarClock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {appointments.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Workshop appointment bookings
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Scheduled & Booked</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', marginTop: '8px' }}>
            {appointments.filter(a => a.status === 'Booked').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Awaiting vehicle arrival
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Completed Servicing</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            {appointments.filter(a => a.status === 'Completed').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Successfully serviced & billed
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card control-bar" style={{ padding: '16px 20px', gap: '14px' }}>
        <div className="control-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px', minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px', minWidth: '160px', flex: '1 1 180px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by customer, phone, bay, or vehicle..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'Booked', 'In Progress', 'Completed', 'Cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`filter-btn ${filterStatus === st ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleOpenNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          <span>Book Service Bay</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Appointment ID</th>
              <th>Customer</th>
              <th>Vehicle Model</th>
              <th>Date & Slot</th>
              <th>Allocated Bay</th>
              <th>Service Package</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No workshop appointments found.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{item.appointmentNo}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.customerName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.customerPhone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.vehicleModel}</div>
                    {item.vin && <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#94a3b8' }}>VIN: {item.vin}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.preferredDate}</div>
                    <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{item.timeSlot}</div>
                  </td>
                  <td>
                    <span className="status-badge status-delivered" style={{ fontSize: '0.72rem' }}>
                      {item.serviceBayNo}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{item.serviceType}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      item.status === 'Completed' ? 'status-delivered' :
                      (item.status === 'Booked' ? 'status-processing' : 'status-pending')
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {item.status === 'Booked' && onConvertToService && (
                        <button 
                          onClick={() => onConvertToService(item)}
                          className="btn btn-primary"
                          style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem', gap: '4px' }}
                          title="Open formal Workshop Job Card"
                        >
                          <Wrench size={12} />
                          <span>Job Card</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="btn btn-secondary" 
                        style={{ height: '32px', padding: '0 12px', fontSize: '0.78rem' }}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAppt ? `Update Appointment — ${selectedAppt.appointmentNo}` : 'Book Service Appointment'}
        subtitle="Schedule customer maintenance and allocate workshop service bay slot"
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Customer Name *</label>
              <input 
                type="text" 
                required 
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>Contact Phone *</label>
              <input 
                type="text" 
                required 
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Vehicle Model *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Mahindra XUV700 (2024)"
                value={formData.vehicleModel}
                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>VIN / Registration (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. MH-02-CB-4910"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Preferred Date *</label>
              <input 
                type="date" 
                required 
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>Time Slot *</label>
              <select 
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="input-field"
              >
                <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM</option>
                <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM</option>
                <option value="02:00 PM - 03:30 PM">02:00 PM - 03:30 PM</option>
                <option value="03:30 PM - 05:00 PM">03:30 PM - 05:00 PM</option>
                <option value="05:00 PM - 06:30 PM">05:00 PM - 06:30 PM</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Allocated Workshop Bay</label>
              <select 
                value={formData.serviceBayNo}
                onChange={(e) => setFormData({ ...formData, serviceBayNo: e.target.value })}
                className="input-field"
              >
                <option value="Bay-1 (Express Maintenance)">Bay-1 (Express Maintenance)</option>
                <option value="Bay-2 (Heavy Mechanical)">Bay-2 (Heavy Mechanical)</option>
                <option value="Bay-3 (Electrical & ADAS)">Bay-3 (Electrical & ADAS)</option>
                <option value="Bay-4 (Wheel Alignment & Suspension)">Bay-4 (Wheel Alignment & Suspension)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Service Type / Package</label>
              <input 
                type="text" 
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Appointment Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="Booked">Booked (Confirmed Slot)</option>
                <option value="In Progress">In Progress (Vehicle In Bay)</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Customer Requests & Instructions</label>
            <textarea 
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. Check slight squeaking in front left brake, pick up by 6:00 PM."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedAppt ? 'Update Appointment' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
