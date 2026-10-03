import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Car, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Gauge, 
  Calendar 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function TradeIns({ tradeIns = [], sales = [], onAddTradeIn, onUpdateTradeIn }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    oldBrand: '',
    oldModel: '',
    oldYear: 2019,
    registrationNo: '',
    odometerKm: 45000,
    conditionRating: 'Good',
    estimatedValuation: 650000,
    approvedAdjustmentAmount: 650000,
    adjustedAgainstSaleId: '',
    status: 'Evaluated',
    notes: ''
  });

  const handleOpenNew = () => {
    setSelectedTrade(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      oldBrand: '',
      oldModel: '',
      oldYear: 2019,
      registrationNo: '',
      odometerKm: 45000,
      conditionRating: 'Good',
      estimatedValuation: 650000,
      approvedAdjustmentAmount: 650000,
      adjustedAgainstSaleId: '',
      status: 'Evaluated',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedTrade(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTrade) {
      onUpdateTradeIn(selectedTrade.id, formData);
    } else {
      onAddTradeIn(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = tradeIns.filter(t => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (t.customerName || '').toLowerCase().includes(s) ||
      (t.oldBrand || '').toLowerCase().includes(s) ||
      (t.oldModel || '').toLowerCase().includes(s) ||
      (t.registrationNo || '').toLowerCase().includes(s) ||
      (t.exchangeNo || '').toLowerCase().includes(s)
    );
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalAdjusted = tradeIns
    .filter(t => t.status === 'Adjusted')
    .reduce((sum, t) => sum + Number(t.approvedAdjustmentAmount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Evaluations</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <ArrowLeftRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {tradeIns.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Used Car Exchange Pipeline
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Value Adjusted</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            ₹{totalAdjusted.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Credited towards new car purchases
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Approved / Pending Adjustment</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', marginTop: '8px' }}>
            {tradeIns.filter(t => t.status === 'Approved' || t.status === 'Evaluated').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Awaiting invoice finalization
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="glass-card control-bar" style={{ padding: '16px 20px', gap: '14px' }}>
        <div className="control-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px', minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px', minWidth: '160px', flex: '1 1 180px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by customer, reg no, brand, or model..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'Evaluated', 'Approved', 'Adjusted', 'Rejected'].map(st => (
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
          <span>New Exchange Assessment</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Exchange ID</th>
              <th>Customer</th>
              <th>Old Vehicle Specs</th>
              <th>Condition</th>
              <th>Valuation Offer</th>
              <th>Approved Adjustment</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No vehicle exchange records found.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{item.exchangeNo}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.adjustedAgainstSaleId ? `Linked Sale: ${item.adjustedAgainstSaleId}` : 'Stand-alone'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.customerName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.customerPhone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.oldBrand} {item.oldModel} ({item.oldYear})</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {item.registrationNo} • {Number(item.odometerKm).toLocaleString()} KM
                    </div>
                  </td>
                  <td>
                    <span className="status-badge status-delivered" style={{ fontSize: '0.75rem' }}>
                      {item.conditionRating}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#94a3b8' }}>₹{Number(item.estimatedValuation).toLocaleString('en-IN')}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#22c55e' }}>₹{Number(item.approvedAdjustmentAmount).toLocaleString('en-IN')}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      item.status === 'Adjusted' ? 'status-delivered' : 
                      (item.status === 'Approved' ? 'status-processing' : 
                      (item.status === 'Rejected' ? 'status-pending' : 'status-pending'))
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
        title={selectedTrade ? `Update Exchange — ${selectedTrade.exchangeNo}` : 'New Vehicle Trade-In / Valuation'}
        subtitle="Evaluate client's current vehicle and compute adjustment against new car purchase"
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
              <label>Customer Phone *</label>
              <input 
                type="text" 
                required 
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Old Vehicle Brand *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Hyundai" 
                value={formData.oldBrand}
                onChange={(e) => setFormData({ ...formData, oldBrand: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Model & Variant *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Creta SX" 
                value={formData.oldModel}
                onChange={(e) => setFormData({ ...formData, oldModel: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Manufacturing Year</label>
              <input 
                type="number" 
                min="2000" 
                max="2026" 
                value={formData.oldYear}
                onChange={(e) => setFormData({ ...formData, oldYear: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Registration Number *</label>
              <input 
                type="text" 
                required 
                placeholder="MH-02-AB-1234" 
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Odometer Reading (KM)</label>
              <input 
                type="number" 
                value={formData.odometerKm}
                onChange={(e) => setFormData({ ...formData, odometerKm: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Condition Rating</label>
              <select 
                value={formData.conditionRating}
                onChange={(e) => setFormData({ ...formData, conditionRating: e.target.value })}
                className="input-field"
              >
                <option value="Excellent">Excellent (Like New)</option>
                <option value="Good">Good (Minor wear, full service)</option>
                <option value="Fair">Fair (Needs cosmetic work)</option>
                <option value="Poor">Poor (Accidental / Mechanical issues)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Technical Valuation Offer (₹ INR) *</label>
              <input 
                type="number" 
                required 
                value={formData.estimatedValuation}
                onChange={(e) => setFormData({ ...formData, estimatedValuation: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Approved Adjustment Amount (₹ INR) *</label>
              <input 
                type="number" 
                required 
                value={formData.approvedAdjustmentAmount}
                onChange={(e) => setFormData({ ...formData, approvedAdjustmentAmount: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Adjustment Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="Evaluated">Evaluated (Awaiting Client Approval)</option>
                <option value="Approved">Approved (Ready to Credit)</option>
                <option value="Adjusted">Adjusted into New Car Deal</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="input-group">
              <label>Link to Sale Invoice (Optional)</label>
              <select 
                value={formData.adjustedAgainstSaleId}
                onChange={(e) => setFormData({ ...formData, adjustedAgainstSaleId: e.target.value })}
                className="input-field"
              >
                <option value="">-- Standalone Evaluation --</option>
                {sales.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.invoiceNo} — {s.customerName} ({s.vehicleName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Inspection Notes & Vehicle History</label>
            <textarea 
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. Clean insurance claim history, single owner, all original glass."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedTrade ? 'Update Exchange' : 'Save Valuation Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
