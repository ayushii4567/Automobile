import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  DollarSign,
  TrendingDown,
  Building2,
  Wrench,
  Zap,
  ShoppingBag,
  X,
  FileSpreadsheet
} from 'lucide-react';
import StatCard from '../components/StatCard';

const EXPENSE_CATEGORIES = [
  'Showroom Rent',
  'Electricity & Utilities',
  'Marketing & Ads',
  'Logistics & Fuel',
  'Workshop Consumables',
  'Office & IT Supplies',
  'Staff Welfare',
  'Miscellaneous'
];

export default function Expenses({
  expenses = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onNavigateToReports
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Showroom Rent',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Bank Transfer',
    vendor_or_payee: '',
    status: 'Approved',
    notes: ''
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch =
        `${e.title || ''} ${e.expense_code || ''} ${e.vendor_or_payee || ''} ${e.notes || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || e.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [expenses, search, categoryFilter, statusFilter]);

  // Financial Metrics
  const totalExpenditure = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const workshopExpenses = filteredExpenses.filter(e => e.category === 'Workshop Consumables').reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const marketingExpenses = filteredExpenses.filter(e => e.category === 'Marketing & Ads').reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const facilityExpenses = filteredExpenses.filter(e => e.category === 'Showroom Rent' || e.category === 'Electricity & Utilities').reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Workshop Consumables',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_mode: 'Bank Transfer',
      vendor_or_payee: '',
      status: 'Approved',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      amount: item.amount,
      expense_date: item.expense_date,
      payment_mode: item.payment_mode || 'Bank Transfer',
      vendor_or_payee: item.vendor_or_payee || '',
      status: item.status || 'Approved',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: Number(formData.amount)
    };

    if (editingItem) {
      await onUpdateExpense(editingItem.id, payload);
    } else {
      await onAddExpense(payload);
    }
    setIsModalOpen(false);
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Showroom Rent': return 'badge badge-reserved';
      case 'Electricity & Utilities': return 'badge badge-blue';
      case 'Marketing & Ads': return 'badge badge-lowstock';
      case 'Workshop Consumables': return 'badge badge-transit';
      case 'Staff Welfare': return 'badge badge-available';
      default: return 'badge';
    }
  };

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
              Operational Expense Management
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
            Track showroom overheads, utility bills, digital ad campaigns, workshop supplies, and audit dealership burn rates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onNavigateToReports && (
            <button
              onClick={onNavigateToReports}
              className="btn btn-secondary"
              style={{ padding: '9px 15px', borderColor: '#cbd5e1', fontSize: '0.82rem' }}
            >
              <FileSpreadsheet size={15} color="#2563eb" />
              <span>Profit & Loss Summary</span>
            </button>
          )}

          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
            <Plus size={16} />
            <span>Log Expense</span>
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
          title="Total Operational Expenses"
          value={`₹${totalExpenditure.toLocaleString('en-IN')}`}
          subtitle={`Across ${filteredExpenses.length} logged expense vouchers`}
          icon={Receipt}
          accent="red"
        />
        <StatCard
          title="Showroom & Facility Rent"
          value={`₹${facilityExpenses.toLocaleString('en-IN')}`}
          subtitle="Prime commercial lease & utilities"
          icon={Building2}
          accent="purple"
        />
        <StatCard
          title="Workshop Consumables"
          value={`₹${workshopExpenses.toLocaleString('en-IN')}`}
          subtitle="Fluids, diagnostics, & tools"
          icon={Wrench}
          accent="amber"
        />
        <StatCard
          title="Marketing & Branding"
          value={`₹${marketingExpenses.toLocaleString('en-IN')}`}
          subtitle="Digital ads & launch galas"
          icon={ShoppingBag}
          accent="blue"
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
                placeholder="Search expense description, code, payee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', height: '38px', fontSize: '0.84rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '160px' }}
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Expense Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Payee / Vendor</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No expense records found matching current criteria. Click "+ Log Expense" to record a new voucher.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isPaid = exp.status === 'Paid';
                  return (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        <code>{exp.expense_code}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{exp.title}</div>
                        {exp.notes && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                            "{exp.notes}"
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={getCategoryBadgeClass(exp.category)}>
                          {exp.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.94rem' }}>
                          ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                        {exp.expense_date}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.84rem', fontWeight: 500, color: '#0f172a' }}>
                          {exp.vendor_or_payee || 'Direct Vendor'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {exp.payment_mode || 'Bank Transfer'}
                      </td>
                      <td>
                        <span className={isPaid ? 'badge badge-available' : exp.status === 'Approved' ? 'badge badge-reserved' : 'badge badge-expired'}>
                          {exp.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {!isPaid && onUpdateExpense && (
                            <button
                              onClick={() => onUpdateExpense(exp.id, { status: 'Paid' })}
                              className="btn btn-secondary btn-sm"
                              title="Mark as Paid"
                              style={{ padding: '4px 8px', fontSize: '0.74rem', color: '#16a34a' }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Pay</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="btn btn-secondary btn-icon"
                            title="Edit Expense Details"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm('Delete this expense voucher?')) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="btn btn-secondary btn-icon"
                            title="Delete Expense"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={13} />
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

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {editingItem ? 'Edit Expense Voucher' : 'Log Dealership Expense'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Record operational costs and synchronize with financial reports
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Expense Title / Description *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Synthetic Engine Oil & Lubricant Drums"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Expense Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                    required
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="form-input"
                    placeholder="50000"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Expense Date *</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="form-select"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="UPI / Debit Card">UPI / Debit Card</option>
                    <option value="Company Cheque">Company Cheque</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Vendor / Payee</label>
                  <input
                    type="text"
                    value={formData.vendor_or_payee}
                    onChange={(e) => setFormData({ ...formData, vendor_or_payee: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Castrol Industrial Direct"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Internal Notes / Memo</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows={2}
                  placeholder="Optional context, invoice receipt reference, or authorization note..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
