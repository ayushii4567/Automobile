import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  DollarSign, 
  Calculator,
  Percent,
  Calendar
} from 'lucide-react';
import Modal from '../components/Modal';

export default function FinanceApps({ financeApps = [], customers = [], vehicles = [], onAddFinanceApp, onUpdateFinanceApp }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleName: '',
    bankName: 'HDFC Bank Auto Loans',
    loanAmount: 1800000,
    tenureMonths: 60,
    interestRate: 8.85,
    emiAmount: 37250,
    applicationStatus: 'In Review',
    disbursementRef: '',
    notes: ''
  });

  const calculateEmi = (loan, tenure, rate) => {
    const p = Number(loan);
    const n = Number(tenure);
    const r = (Number(rate) / 12) / 100;
    if (!p || !n || !r) return 0;
    return Math.round(p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  };

  const handleLoanChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const emi = calculateEmi(
      field === 'loanAmount' ? val : updated.loanAmount,
      field === 'tenureMonths' ? val : updated.tenureMonths,
      field === 'interestRate' ? val : updated.interestRate
    );
    setFormData({ ...updated, emiAmount: emi });
  };

  const handleCustomerSelect = (id) => {
    const c = customers.find(item => item.id === id);
    if (c) {
      setFormData(prev => ({ ...prev, customerId: c.id, customerName: c.name }));
    }
  };

  const handleVehicleSelect = (id) => {
    const v = vehicles.find(item => item.id === id);
    if (v) {
      const defaultLoan = Math.round(Number(v.price) * 0.85);
      const emi = calculateEmi(defaultLoan, formData.tenureMonths, formData.interestRate);
      setFormData(prev => ({
        ...prev,
        vehicleId: v.id,
        vehicleName: `${v.brand} ${v.model}`,
        loanAmount: defaultLoan,
        emiAmount: emi
      }));
    }
  };

  const handleOpenNew = () => {
    setSelectedApp(null);
    setFormData({
      customerId: '',
      customerName: '',
      vehicleId: '',
      vehicleName: '',
      bankName: 'HDFC Bank Auto Loans',
      loanAmount: 1800000,
      tenureMonths: 60,
      interestRate: 8.85,
      emiAmount: 37250,
      applicationStatus: 'In Review',
      disbursementRef: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedApp(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedApp) {
      onUpdateFinanceApp(selectedApp.id, formData);
    } else {
      onAddFinanceApp(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = financeApps.filter(item => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (item.customerName || '').toLowerCase().includes(s) ||
      (item.vehicleName || '').toLowerCase().includes(s) ||
      (item.bankName || '').toLowerCase().includes(s) ||
      (item.applicationNo || '').toLowerCase().includes(s)
    );
    const matchesStatus = filterStatus === 'ALL' || item.applicationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalDisbursed = financeApps
    .filter(a => a.applicationStatus === 'Disbursed')
    .reduce((sum, a) => sum + Number(a.loanAmount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Loan Applications</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {financeApps.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Bank Financing Pipeline
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Capital Disbursed</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Disbursed directly to dealership
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>In Underwriting / Review</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', marginTop: '8px' }}>
            {financeApps.filter(a => a.applicationStatus === 'In Review' || a.applicationStatus === 'Applied').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Awaiting bank credit sanction
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
              placeholder="Search by customer, vehicle, or bank..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'In Review', 'Approved', 'Disbursed', 'Rejected'].map(st => (
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
          <span>New Loan File</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Application No</th>
              <th>Customer</th>
              <th>Vehicle Model</th>
              <th>Partner Bank</th>
              <th>Loan Amount</th>
              <th>Tenure & Rate</th>
              <th>Monthly EMI</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No financing applications found.
                </td>
              </tr>
            ) : (
              filtered.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{app.applicationNo}</div>
                    {app.disbursementRef && (
                      <div style={{ fontSize: '0.72rem', color: '#22c55e', fontFamily: 'monospace' }}>Ref: {app.disbursementRef}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{app.customerName}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{app.vehicleName}</div>
                  </td>
                  <td>
                    <div style={{ color: '#38bdf8', fontWeight: 600 }}>{app.bankName}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>₹{Number(app.loanAmount).toLocaleString('en-IN')}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{app.tenureMonths} Mos @ {app.interestRate}%</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#38bdf8' }}>₹{Number(app.emiAmount).toLocaleString('en-IN')}/mo</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      app.applicationStatus === 'Disbursed' ? 'status-delivered' :
                      (app.applicationStatus === 'Approved' ? 'status-processing' : 
                      (app.applicationStatus === 'Rejected' ? 'status-pending' : 'status-pending'))
                    }`}>
                      {app.applicationStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleOpenEdit(app)}
                      className="btn btn-secondary" 
                      style={{ height: '32px', padding: '0 12px', fontSize: '0.78rem' }}
                    >
                      Update
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
        title={selectedApp ? `Update Loan Application — ${selectedApp.applicationNo}` : 'Submit New Bank Loan Application'}
        subtitle="Manage dealership auto-financing, partner bank sanctions, and loan disbursements"
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
                  <option value="">-- Choose Existing Customer --</option>
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
              <label>Select Vehicle Model *</label>
              {vehicles.length > 0 ? (
                <select 
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} (₹{Number(v.price).toLocaleString('en-IN')})</option>
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
              <label>Financing Partner Bank *</label>
              <select 
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="input-field"
              >
                <option value="HDFC Bank Auto Loans">HDFC Bank Auto Loans</option>
                <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                <option value="ICICI Bank Car Finance">ICICI Bank Car Finance</option>
                <option value="Kotak Mahindra Prime">Kotak Mahindra Prime</option>
                <option value="Axis Bank Auto Loan">Axis Bank Auto Loan</option>
              </select>
            </div>

            <div className="input-group">
              <label>Sanctioned Loan Amount (₹ INR) *</label>
              <input 
                type="number" 
                required 
                value={formData.loanAmount}
                onChange={(e) => handleLoanChange('loanAmount', Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Tenure (Months)</label>
              <select 
                value={formData.tenureMonths}
                onChange={(e) => handleLoanChange('tenureMonths', Number(e.target.value))}
                className="input-field"
              >
                <option value="24">24 Months (2 Yrs)</option>
                <option value="36">36 Months (3 Yrs)</option>
                <option value="48">48 Months (4 Yrs)</option>
                <option value="60">60 Months (5 Yrs)</option>
                <option value="84">84 Months (7 Yrs)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Interest Rate (% p.a.)</label>
              <input 
                type="number" 
                step="0.05" 
                value={formData.interestRate}
                onChange={(e) => handleLoanChange('interestRate', Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label>Estimated EMI (₹/Mo)</label>
              <input 
                type="number" 
                readOnly 
                value={formData.emiAmount}
                className="input-field"
                style={{ background: 'rgba(30, 41, 59, 0.7)', color: '#38bdf8', fontWeight: 800 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Application Status</label>
              <select 
                value={formData.applicationStatus}
                onChange={(e) => setFormData({ ...formData, applicationStatus: e.target.value })}
                className="input-field"
              >
                <option value="Applied">Applied (Documents Uploaded)</option>
                <option value="In Review">In Underwriting Review</option>
                <option value="Approved">Approved / Sanction Issued</option>
                <option value="Disbursed">Disbursed to Showroom</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="input-group">
              <label>Bank Disbursement UTR / Ref</label>
              <input 
                type="text" 
                placeholder="e.g. UTR-HDFC-991204"
                value={formData.disbursementRef}
                onChange={(e) => setFormData({ ...formData, disbursementRef: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Credit & Underwriting Remarks</label>
            <textarea 
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. CIBIL score 785, income verified via 3-month salary slips."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedApp ? 'Update Application' : 'Submit Loan File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
