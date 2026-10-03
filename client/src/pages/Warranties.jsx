import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Car, 
  Calendar, 
  Gauge 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Warranties({ warranties = [], vehicles = [], customers = [], onAddWarranty, onUpdateWarranty }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleName: '',
    vin: '',
    warrantyType: 'Extended 2-Year Shield',
    coverageKm: 150000,
    coverageYears: 5,
    provider: 'Manufacturer Extended Warranty',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '2031-09-30',
    terms: 'Covers powertrain, ECU, suspension struts, and electricals with 24/7 RSA.'
  });

  const handleVehicleSelect = (id) => {
    const v = vehicles.find(item => item.id === id);
    if (v) {
      setFormData(prev => ({
        ...prev,
        vehicleId: v.id,
        vehicleName: `${v.brand} ${v.model}`,
        vin: v.vin || 'VIN-TBD',
        provider: `${v.brand} Shield Program`
      }));
    }
  };

  const handleCustomerSelect = (id) => {
    const c = customers.find(item => item.id === id);
    if (c) {
      setFormData(prev => ({ ...prev, customerId: c.id, customerName: c.name }));
    }
  };

  const handleOpenNew = () => {
    setSelectedWarranty(null);
    setFormData({
      customerId: '',
      customerName: '',
      vehicleId: '',
      vehicleName: '',
      vin: '',
      warrantyType: 'Extended 2-Year Shield',
      coverageKm: 150000,
      coverageYears: 5,
      provider: 'Manufacturer Extended Warranty',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '2031-09-30',
      terms: 'Covers powertrain, ECU, suspension struts, and electricals with 24/7 RSA.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedWarranty(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedWarranty) {
      onUpdateWarranty(selectedWarranty.id, formData);
    } else {
      onAddWarranty(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = warranties.filter(item => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (item.customerName || '').toLowerCase().includes(s) ||
      (item.vehicleName || '').toLowerCase().includes(s) ||
      (item.warrantyNo || '').toLowerCase().includes(s) ||
      (item.vin || '').toLowerCase().includes(s)
    );
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Enrolled Warranties</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Award size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {warranties.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Active protection plans
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Extended 5-Year Covers</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            {warranties.filter(w => (w.warrantyType || '').includes('Extended')).length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Comprehensive peace-of-mind tier
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Max Coverage Distance</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Gauge size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '8px' }}>
            150,000 KM
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Unlimited claims up to vehicle IDV
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
              placeholder="Search by customer, vehicle, VIN, or warranty no..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'Active', 'Expired', 'Claimed'].map(st => (
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
          <span>Register Warranty Contract</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Warranty Certificate</th>
              <th>Customer</th>
              <th>Vehicle & VIN</th>
              <th>Package Tier</th>
              <th>Coverage Scope</th>
              <th>Program Provider</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No warranty contracts found.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{item.warrantyNo}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Start: {item.startDate}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.customerName}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.vehicleName}</div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#94a3b8' }}>VIN: {item.vin}</div>
                  </td>
                  <td>
                    <span className="status-badge status-delivered" style={{ fontSize: '0.72rem' }}>
                      {item.warrantyType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      {Number(item.coverageKm).toLocaleString()} KM / {item.coverageYears} Yrs
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>{item.provider}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{item.expiryDate}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      item.status === 'Active' ? 'status-delivered' : 'status-pending'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="btn btn-secondary" 
                      style={{ height: '32px', padding: '0 12px', fontSize: '0.78rem' }}
                    >
                      Edit
                    </button>
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
        title={selectedWarranty ? `Update Warranty — ${selectedWarranty.warrantyNo}` : 'Register Warranty Package'}
        subtitle="Enroll vehicle into manufacturer standard or extended warranty program"
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Select Customer *</label>
              {customers.length > 0 ? (
                <select 
                  value={formData.customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  required 
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="input-field" 
                />
              )}
            </div>

            <div className="input-group">
              <label>Select Vehicle *</label>
              {vehicles.length > 0 ? (
                <select 
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.vin})</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  required 
                  value={formData.vehicleName}
                  onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                  className="input-field" 
                />
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>VIN / Chassis Number *</label>
              <input 
                type="text" 
                required 
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>Warranty Program Provider *</label>
              <input 
                type="text" 
                required 
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Warranty Tier</label>
              <select 
                value={formData.warrantyType}
                onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value })}
                className="input-field"
              >
                <option value="Extended 2-Year Shield">Extended 2-Year Shield</option>
                <option value="Standard OEM 3-Year">Standard OEM 3-Year</option>
                <option value="5-Year Bumper to Bumper">5-Year Bumper to Bumper</option>
                <option value="EV Battery 8-Year Pack">EV Battery 8-Year Pack</option>
              </select>
            </div>

            <div className="input-group">
              <label>Coverage Distance (KM)</label>
              <input 
                type="number" 
                value={formData.coverageKm}
                onChange={(e) => setFormData({ ...formData, coverageKm: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>Coverage Period (Years)</label>
              <input 
                type="number" 
                value={formData.coverageYears}
                onChange={(e) => setFormData({ ...formData, coverageYears: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Valid Until Date</label>
              <input 
                type="date" 
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Claimed">Claimed / Replacement Given</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Coverage Inclusions & RSA Terms</label>
            <textarea 
              rows="2"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedWarranty ? 'Update Warranty' : 'Enroll Package'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
