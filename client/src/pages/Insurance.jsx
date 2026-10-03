import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Calendar, 
  Car 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Insurance({ insurance = [], vehicles = [], customers = [], onAddInsurance, onUpdateInsurance }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleName: '',
    vin: '',
    provider: 'ICICI Lombard General Insurance',
    policyType: 'Comprehensive + Zero Dep',
    premiumAmount: 58500,
    idvAmount: 2050000,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '2027-09-30',
    status: 'Active',
    notes: ''
  });

  const handleVehicleSelect = (id) => {
    const v = vehicles.find(item => item.id === id);
    if (v) {
      setFormData(prev => ({
        ...prev,
        vehicleId: v.id,
        vehicleName: `${v.brand} ${v.model}`,
        vin: v.vin || 'VIN-TBD',
        idvAmount: Math.round(Number(v.price) * 0.95),
        premiumAmount: Math.round(Number(v.price) * 0.028)
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
    setSelectedPolicy(null);
    setFormData({
      customerId: '',
      customerName: '',
      vehicleId: '',
      vehicleName: '',
      vin: '',
      provider: 'ICICI Lombard General Insurance',
      policyType: 'Comprehensive + Zero Dep',
      premiumAmount: 58500,
      idvAmount: 2050000,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '2027-09-30',
      status: 'Active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedPolicy(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPolicy) {
      onUpdateInsurance(selectedPolicy.id, formData);
    } else {
      onAddInsurance(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = insurance.filter(item => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (item.customerName || '').toLowerCase().includes(s) ||
      (item.vehicleName || '').toLowerCase().includes(s) ||
      (item.policyNo || '').toLowerCase().includes(s) ||
      (item.provider || '').toLowerCase().includes(s) ||
      (item.vin || '').toLowerCase().includes(s)
    );
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPremium = insurance.reduce((sum, item) => sum + Number(item.premiumAmount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Active Policies</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {insurance.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Motor Insurance Registry
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Gross Premium Underwritten</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            ₹{totalPremium.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Dealership insurance volume
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Comprehensive Zero-Dep</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '8px' }}>
            {insurance.filter(i => (i.policyType || '').includes('Zero Dep')).length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Max coverage bumper-to-bumper
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
              placeholder="Search by customer, vehicle, VIN, or policy number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'Active', 'Expiring Soon', 'Expired'].map(st => (
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
          <span>Issue Insurance Policy</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Policy Number</th>
              <th>Customer</th>
              <th>Vehicle & VIN</th>
              <th>Insurance Provider</th>
              <th>Policy Tier</th>
              <th>IDV Cover</th>
              <th>Premium (₹)</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No insurance policy records match your search.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{item.policyNo}</div>
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
                    <div style={{ color: '#38bdf8', fontWeight: 600 }}>{item.provider}</div>
                  </td>
                  <td>
                    <span className="status-badge status-delivered" style={{ fontSize: '0.72rem' }}>
                      {item.policyType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>₹{Number(item.idvAmount).toLocaleString('en-IN')}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#22c55e' }}>₹{Number(item.premiumAmount).toLocaleString('en-IN')}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{item.expiryDate}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      item.status === 'Active' ? 'status-delivered' :
                      (item.status === 'Expiring Soon' ? 'status-processing' : 'status-pending')
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
        title={selectedPolicy ? `Update Policy — ${selectedPolicy.policyNo}` : 'Issue New Insurance Policy'}
        subtitle="Record comprehensive vehicle coverage, IDV valuation, and annual renewal period"
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
              <label>Insurance Provider *</label>
              <select 
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="input-field"
              >
                <option value="ICICI Lombard General Insurance">ICICI Lombard General Insurance</option>
                <option value="HDFC ERGO General Insurance">HDFC ERGO General Insurance</option>
                <option value="Tata AIG General Insurance">Tata AIG General Insurance</option>
                <option value="Bajaj Allianz General Insurance">Bajaj Allianz General Insurance</option>
                <option value="New India Assurance">New India Assurance</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Policy Coverage Tier</label>
              <select 
                value={formData.policyType}
                onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                className="input-field"
              >
                <option value="Comprehensive + Zero Dep">Comprehensive + Zero Dep</option>
                <option value="Standard Comprehensive">Standard Comprehensive</option>
                <option value="Third Party Only">Third Party Only</option>
                <option value="Return to Invoice (RTI) Pack">Return to Invoice (RTI) Pack</option>
              </select>
            </div>

            <div className="input-group">
              <label>IDV Value (₹ INR) *</label>
              <input 
                type="number" 
                required 
                value={formData.idvAmount}
                onChange={(e) => setFormData({ ...formData, idvAmount: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>Annual Premium (₹ INR) *</label>
              <input 
                type="number" 
                required 
                value={formData.premiumAmount}
                onChange={(e) => setFormData({ ...formData, premiumAmount: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Policy Start Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>Policy Expiry Date</label>
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
                <option value="Expiring Soon">Expiring Soon (Under 30 Days)</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Policy Riders & Notes</label>
            <textarea 
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. Includes Engine Protect Plus, Tyre Secure, and 24/7 Roadside Assistance."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedPolicy ? 'Update Policy' : 'Save Policy Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
