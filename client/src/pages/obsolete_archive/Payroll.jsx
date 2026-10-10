import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Calendar,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Payroll({
  payroll = [],
  staff = [],
  settings = {},
  onAddPayroll,
  onUpdatePayroll,
  onDeletePayroll,
  onGenerateBatch
}) {
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    staff_id: '',
    payroll_period: '2026-10',
    base_salary: 45000,
    sales_incentive: 0,
    allowances: 3500,
    deductions: 2250,
    payment_mode: 'Direct Bank Transfer',
    status: 'Paid',
    payment_date: new Date().toISOString().split('T')[0]
  });

  const periods = useMemo(() => {
    const set = new Set(payroll.map(p => p.payroll_period).filter(Boolean));
    set.add('2026-10');
    set.add('2026-09');
    return ['All', ...Array.from(set).sort().reverse()];
  }, [payroll]);

  const filteredPayroll = useMemo(() => {
    return payroll.filter(p => {
      const matchSearch =
        `${p.staff_name || ''} ${p.employee_code || ''} ${p.department || ''} ${p.role_title || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchPeriod = periodFilter === 'All' || p.payroll_period === periodFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchPeriod && matchStatus;
    });
  }, [payroll, search, periodFilter, statusFilter]);

  // Analytics Metrics
  const totalSpend = filteredPayroll.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
  const paidCount = filteredPayroll.filter(p => p.status === 'Paid').length;
  const pendingCount = filteredPayroll.filter(p => p.status !== 'Paid').length;
  const avgNet = filteredPayroll.length > 0 ? Math.round(totalSpend / filteredPayroll.length) : 0;

  const handleOpenAdd = () => {
    const firstStaff = staff[0];
    setEditingItem(null);
    setFormData({
      staff_id: firstStaff ? firstStaff.id : '',
      payroll_period: periodFilter !== 'All' ? periodFilter : '2026-10',
      base_salary: firstStaff ? Number(firstStaff.base_salary || firstStaff.baseSalary || 45000) : 45000,
      sales_incentive: firstStaff ? (Number(firstStaff.sales_closed_count || firstStaff.salesClosed || 0) * 5000) : 0,
      allowances: 3500,
      deductions: firstStaff ? Math.round(Number(firstStaff.base_salary || 45000) * 0.05) : 2250,
      payment_mode: 'Direct Bank Transfer',
      status: 'Approved',
      payment_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleStaffChange = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    if (member) {
      const base = Number(member.base_salary || member.baseSalary || 45000);
      const deals = Number(member.sales_closed_count || member.salesClosed || 0);
      const inc = deals * 5000;
      const ded = Math.round(base * 0.05);
      setFormData(prev => ({
        ...prev,
        staff_id: staffId,
        base_salary: base,
        sales_incentive: inc,
        deductions: ded
      }));
    } else {
      setFormData(prev => ({ ...prev, staff_id: staffId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const net = Number(formData.base_salary) + Number(formData.sales_incentive) + Number(formData.allowances) - Number(formData.deductions);
    const payload = {
      ...formData,
      base_salary: Number(formData.base_salary),
      sales_incentive: Number(formData.sales_incentive),
      allowances: Number(formData.allowances),
      deductions: Number(formData.deductions),
      net_salary: net
    };

    if (editingItem) {
      await onUpdatePayroll(editingItem.id, payload);
    } else {
      await onAddPayroll(payload);
    }
    setIsModalOpen(false);
  };

  const handleRunBatch = async () => {
    const targetPeriod = periodFilter !== 'All' ? periodFilter : '2026-10';
    if (!window.confirm(`Generate automated batch payroll for period "${targetPeriod}" across all active showroom personnel?`)) return;
    try {
      setBatchLoading(true);
      await onGenerateBatch({ payroll_period: targetPeriod });
    } finally {
      setBatchLoading(false);
    }
  };

  const netCalculated = Number(formData.base_salary || 0) + Number(formData.sales_incentive || 0) + Number(formData.allowances || 0) - Number(formData.deductions || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      {/* Top Banner */}
      <div className="glass-card hover-elevate glow-accent" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Confidential
            </span>
            <h2 style={{ fontSize: '1.28rem', fontWeight: 700, color: '#0f172a' }}>
              Staff Payroll & Compensation Ledger
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
            Manage staff base pay, performance sales incentives, allowances, statutory deductions, and automated monthly bank disbursements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleRunBatch}
            disabled={batchLoading}
            className="btn btn-secondary"
            style={{ padding: '9px 15px', borderColor: '#cbd5e1', fontSize: '0.82rem' }}
            title="Auto-calculate incentives & generate period payroll"
          >
            <Sparkles size={15} color="#eab308" />
            <span>{batchLoading ? 'Processing...' : 'Auto-Generate Batch'}</span>
          </button>

          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
            <Plus size={16} />
            <span>Process Salary</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Total Net Payroll"
          value={`₹${totalSpend.toLocaleString('en-IN')}`}
          subtitle={`Across ${filteredPayroll.length} recorded staff slips`}
          icon={Banknote}
          accent="emerald"
        />
        <StatCard
          title="Disbursed & Paid"
          value={paidCount}
          subtitle="Processed to employee bank accounts"
          icon={CheckCircle2}
          accent="blue"
        />
        <StatCard
          title="Pending / Draft"
          value={pendingCount}
          subtitle="Awaiting final executive approval"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Average Net Compensation"
          value={`₹${avgNet.toLocaleString('en-IN')}`}
          subtitle="Monthly take-home per staff"
          icon={TrendingUp}
          accent="purple"
        />
      </div>

      {/* Main Table Card */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {/* Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px', minWidth: '200px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search staff name, EMP code, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', height: '38px', fontSize: '0.84rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Period Selector */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="form-select"
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '130px' }}
            >
              {periods.map(per => (
                <option key={per} value={per}>
                  {per === 'All' ? 'All Months' : `Period ${per}`}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '120px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Approved">Approved</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Base Pay</th>
                <th>Sales Incentives</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No payroll records found for this period. Click "+ Process Salary" or "Auto-Generate Batch" to create payslips.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => {
                  const isPaid = p.status === 'Paid';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        <code>{p.payroll_period}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.staff_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.employee_code} • {p.role_title}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '3px 7px', borderRadius: '4px', color: '#475569', fontWeight: 500 }}>
                          {p.department}
                        </span>
                      </td>
                      <td>₹{Number(p.base_salary || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ color: Number(p.sales_incentive) > 0 ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                          +{Number(p.sales_incentive || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ color: '#0284c7' }}>
                        +{Number(p.allowances || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ color: '#dc2626' }}>
                        -{Number(p.deductions || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                          ₹{Number(p.net_salary || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span className={isPaid ? 'badge badge-available' : p.status === 'Approved' ? 'badge badge-reserved' : 'badge badge-transit'}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {!isPaid && onUpdatePayroll && (
                            <button
                              onClick={() => onUpdatePayroll(p.id, { status: 'Paid', payment_date: new Date().toISOString().split('T')[0] })}
                              className="btn btn-secondary btn-sm"
                              title="Mark as Paid & Disbursed"
                              style={{ padding: '4px 8px', fontSize: '0.74rem', color: '#16a34a' }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Disburse</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedPayslip(p)}
                            className="btn btn-secondary btn-icon"
                            title="View & Print Official Payslip"
                          >
                            <FileText size={14} color="#2563eb" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm('Delete this payroll record?')) {
                                onDeletePayroll(p.id);
                              }
                            }}
                            className="btn btn-secondary btn-icon"
                            title="Delete Record"
                            style={{ color: '#ef4444' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Salary Modal */}
      {isModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {editingItem ? 'Edit Compensation Slip' : 'Process Staff Salary'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Auto-computes incentives, allowances, and statutory withholdings
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Staff Member *</label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => handleStaffChange(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select Employee...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employee_code || s.employeeCode}) — {s.department}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Payroll Period *</label>
                  <input
                    type="text"
                    value={formData.payroll_period}
                    onChange={(e) => setFormData({ ...formData, payroll_period: e.target.value })}
                    className="form-input"
                    placeholder="2026-10"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Base Salary (₹) *</label>
                  <input
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Sales Performance Incentive (₹)</label>
                  <input
                    type="number"
                    value={formData.sales_incentive}
                    onChange={(e) => setFormData({ ...formData, sales_incentive: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Allowances (Travel / Fuel) (₹)</label>
                  <input
                    type="number"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Deductions (TDS / PF) (₹)</label>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Calculated Net Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Calculated Take-Home Net Salary
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Base + Incentive + Allowances - Deductions
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                  ₹{netCalculated.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="form-select"
                  >
                    <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Company Cheque">Company Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Compensation Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payslip View / Print Modal */}
      {selectedPayslip && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-content glass-card" style={{ maxWidth: '640px', width: '95%', padding: '28px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Official Salary Payslip</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                  <Printer size={14} />
                  <span>Print / PDF</span>
                </button>
                <button onClick={() => setSelectedPayslip(null)} className="btn btn-secondary btn-icon">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    {settings.showroom_name || settings.showroomName || 'APEX HORIZON MOTORS'}
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {settings.address || 'Signature Towers, Bandra Kurla Complex, Mumbai'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    GSTIN: {settings.gstin || '27AAACA9928P1Z8'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
                    Private & Confidential
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    PAYSLIP {selectedPayslip.payroll_period}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Disbursed: {selectedPayslip.payment_date || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Employee Name:</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{selectedPayslip.staff_name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Code: {selectedPayslip.employee_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Department & Role:</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{selectedPayslip.role_title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedPayslip.department}</div>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                    Earnings
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: '#475569' }}>Basic Salary</span>
                    <span style={{ fontWeight: 600 }}>₹{Number(selectedPayslip.base_salary || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: '#475569' }}>Sales Incentives</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>+₹{Number(selectedPayslip.sales_incentive || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#475569' }}>Special Allowances</span>
                    <span style={{ fontWeight: 600 }}>+₹{Number(selectedPayslip.allowances || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                    Deductions
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: '#475569' }}>Provident Fund (PF)</span>
                    <span style={{ fontWeight: 600, color: '#dc2626' }}>-₹{Math.round(Number(selectedPayslip.deductions || 0) * 0.6).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#475569' }}>Professional Tax (PT)</span>
                    <span style={{ fontWeight: 600, color: '#dc2626' }}>-₹{Math.round(Number(selectedPayslip.deductions || 0) * 0.4).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Summary */}
              <div style={{ background: '#0f172a', color: '#fff', padding: '14px 18px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Net Take-Home Salary
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                    Transferred via {selectedPayslip.payment_mode || 'Direct Bank Transfer'}
                  </div>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4ade80' }}>
                  ₹{Number(selectedPayslip.net_salary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', fontSize: '0.75rem', color: '#64748b' }}>
                <div>
                  <div style={{ height: '30px' }}></div>
                  <strong>Authorized Executive Signature</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: '30px' }}></div>
                  <strong>Employee Signature</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
