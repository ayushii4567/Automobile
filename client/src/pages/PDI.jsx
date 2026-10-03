import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Plus, 
  Printer, 
  ShieldCheck, 
  Car, 
  User, 
  Key, 
  Wrench,
  X
} from 'lucide-react';
import Modal from '../components/Modal';

export default function PDI({ pdiList = [], sales = [], onAddPDI, onUpdatePDI }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPdi, setSelectedPdi] = useState(null);
  const [viewCertificateModal, setViewCertificateModal] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    saleId: '',
    invoiceNo: '',
    vehicleName: '',
    vin: '',
    customerName: '',
    inspectorName: 'Vikram Malhotra',
    inspectionDate: new Date().toISOString().split('T')[0],
    exteriorStatus: 'Passed',
    interiorStatus: 'Passed',
    engineFluidsStatus: 'Passed',
    electricalsStatus: 'Passed',
    toolkitProvided: true,
    keysProvided: 2,
    status: 'Passed',
    notes: ''
  });

  const handleSaleSelect = (saleId) => {
    const s = sales.find(item => item.id === saleId);
    if (s) {
      setFormData(prev => ({
        ...prev,
        saleId: s.id,
        invoiceNo: s.invoiceNo,
        vehicleName: s.vehicleName,
        vin: s.vin || 'VIN-TBD',
        customerName: s.customerName
      }));
    }
  };

  const handleOpenNew = () => {
    setSelectedPdi(null);
    setFormData({
      saleId: '',
      invoiceNo: '',
      vehicleName: '',
      vin: '',
      customerName: '',
      inspectorName: 'Vikram Malhotra',
      inspectionDate: new Date().toISOString().split('T')[0],
      exteriorStatus: 'Passed',
      interiorStatus: 'Passed',
      engineFluidsStatus: 'Passed',
      electricalsStatus: 'Passed',
      toolkitProvided: true,
      keysProvided: 2,
      status: 'Passed',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedPdi(item);
    setFormData({
      ...item,
      toolkitProvided: item.toolkitProvided === 1 || item.toolkitProvided === true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPdi) {
      onUpdatePDI(selectedPdi.id, formData);
    } else {
      onAddPDI(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = pdiList.filter(item => {
    const matchesSearch = (
      (item.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.vehicleName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.pdiNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.vin || '').toLowerCase().includes(search.toLowerCase())
    );
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const passedCount = pdiList.filter(p => p.status === 'Passed').length;
  const pendingCount = pdiList.filter(p => p.status === 'Pending').length;
  const attentionCount = pdiList.filter(p => p.status === 'Needs Attention').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total PDI Handover Files</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <ClipboardCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {pdiList.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Pre-Delivery Inspection Registry
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Delivery Cleared (Passed)</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            {passedCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Ready for customer key handover
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Pending Inspection</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', marginTop: '8px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Awaiting final workshop checklist
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Action Required</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '8px' }}>
            {attentionCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Minor rectification before delivery
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
              placeholder="Search by customer, vehicle, PDI No, or VIN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'Passed', 'Pending', 'Needs Attention'].map(st => (
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
          <span>New PDI Inspection</span>
        </button>
      </div>

      {/* PDI Records Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>PDI Number</th>
              <th>Customer</th>
              <th>Vehicle & VIN</th>
              <th>Inspection Date</th>
              <th>Checklist Items</th>
              <th>Inspector</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No PDI inspection files match your search criteria.
                </td>
              </tr>
            ) : (
              filtered.map(pdi => (
                <tr key={pdi.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{pdi.pdiNo}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pdi.invoiceNo ? `Invoice: ${pdi.invoiceNo}` : 'Manual PDI'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{pdi.customerName}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{pdi.vehicleName}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>VIN: {pdi.vin}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{pdi.inspectionDate}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${pdi.exteriorStatus === 'Passed' ? 'status-delivered' : 'status-pending'}`} style={{ fontSize: '0.7rem' }}>
                        Body: {pdi.exteriorStatus}
                      </span>
                      <span className={`status-badge ${pdi.electricalsStatus === 'Passed' ? 'status-delivered' : 'status-pending'}`} style={{ fontSize: '0.7rem' }}>
                        Elec: {pdi.electricalsStatus}
                      </span>
                      <span className={`status-badge ${pdi.toolkitProvided ? 'status-delivered' : 'status-pending'}`} style={{ fontSize: '0.7rem' }}>
                        Toolkit ({pdi.keysProvided || 2} Keys)
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{pdi.inspectorName}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      pdi.status === 'Passed' ? 'status-delivered' : (pdi.status === 'Pending' ? 'status-processing' : 'status-pending')
                    }`}>
                      {pdi.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => setViewCertificateModal(pdi)}
                        className="btn-icon"
                        title="Print Handover Certificate"
                        style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}
                      >
                        <Printer size={15} />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(pdi)}
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

      {/* Edit / New Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPdi ? `Update PDI Inspection — ${selectedPdi.pdiNo}` : 'New Pre-Delivery Inspection (PDI)'}
        subtitle="Ensure 100% mechanical, electrical, and cosmetic readiness before key handover"
        maxWidth="680px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!selectedPdi && sales.length > 0 && (
            <div className="input-group">
              <label>Select Confirmed Sale to Pre-Fill Details</label>
              <select 
                value={formData.saleId}
                onChange={(e) => handleSaleSelect(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose from Recent Sales Orders --</option>
                {sales.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.invoiceNo} — {s.customerName} ({s.vehicleName})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              <label>Vehicle Name *</label>
              <input 
                type="text" 
                required 
                value={formData.vehicleName}
                onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                className="input-field"
              />
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
              <label>PDI Inspector *</label>
              <input 
                type="text" 
                required 
                value={formData.inspectorName}
                onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
              Detailed Inspection Points
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label>Exterior Paint & Body</label>
                <select 
                  value={formData.exteriorStatus} 
                  onChange={(e) => setFormData({ ...formData, exteriorStatus: e.target.value })}
                  className="input-field"
                >
                  <option value="Passed">Passed (No Scratches / Dents)</option>
                  <option value="Needs Polish">Needs Polish / Touch-up</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="input-group">
                <label>Interior & Upholstery</label>
                <select 
                  value={formData.interiorStatus} 
                  onChange={(e) => setFormData({ ...formData, interiorStatus: e.target.value })}
                  className="input-field"
                >
                  <option value="Passed">Passed (Spotless & Sanitized)</option>
                  <option value="Cleaning Needed">Cleaning Needed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="input-group">
                <label>Engine & Fluid Levels</label>
                <select 
                  value={formData.engineFluidsStatus} 
                  onChange={(e) => setFormData({ ...formData, engineFluidsStatus: e.target.value })}
                  className="input-field"
                >
                  <option value="Passed">Passed (Oil, Coolant, Brake Fluid Full)</option>
                  <option value="Top-up Required">Top-up Required</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="input-group">
                <label>Electricals & Infotainment</label>
                <select 
                  value={formData.electricalsStatus} 
                  onChange={(e) => setFormData({ ...formData, electricalsStatus: e.target.value })}
                  className="input-field"
                >
                  <option value="Passed">Passed (Lights, Screens, Audio OK)</option>
                  <option value="Adjustment Needed">Adjustment Needed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '14px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={formData.toolkitProvided}
                  onChange={(e) => setFormData({ ...formData, toolkitProvided: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                Jack, Toolkit & Spare Tire Verified
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Keys Count:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="4" 
                  value={formData.keysProvided}
                  onChange={(e) => setFormData({ ...formData, keysProvided: Number(e.target.value) })}
                  className="input-field" 
                  style={{ width: '70px', padding: '6px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Overall PDI Status</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="Passed">Passed — Cleared for Handover</option>
                <option value="Pending">Pending Completion</option>
                <option value="Needs Attention">Needs Attention</option>
              </select>
            </div>
            <div className="input-group">
              <label>Inspection Date</label>
              <input 
                type="date" 
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Inspector Notes & Remarks</label>
            <textarea 
              rows="2" 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. Paint protection seal applied, tire pressure calibrated to 33 PSI, full tank fuel voucher given."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedPdi ? 'Update PDI Record' : 'Save & Issue PDI'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Certificate Modal */}
      {viewCertificateModal && (
        <Modal
          isOpen={!!viewCertificateModal}
          onClose={() => setViewCertificateModal(null)}
          title="Vehicle Handover & PDI Certificate"
          subtitle={`Certificate #${viewCertificateModal.pdiNo}`}
          maxWidth="700px"
        >
          <div className="printable-invoice" style={{ background: '#fff', color: '#0f172a', padding: '28px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={28} color="#2563eb" />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>APEX HORIZON MOTORS</h2>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Authorized Pre-Delivery Inspection & Handover Certificate</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.1rem' }}>{viewCertificateModal.pdiNo}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {viewCertificateModal.inspectionDate}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Customer Details</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginTop: '4px' }}>{viewCertificateModal.customerName}</div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>Invoice Ref: {viewCertificateModal.invoiceNo || 'N/A'}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vehicle Information</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginTop: '4px' }}>{viewCertificateModal.vehicleName}</div>
                <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#475569' }}>VIN: {viewCertificateModal.vin}</div>
              </div>
            </div>

            <div className="data-table-wrapper" style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>System / Parameter</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Standard Check</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Exterior Paint & Chassis</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>Factory paint depth, zero swirl marks/scratches</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{viewCertificateModal.exteriorStatus}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Cabin & Upholstery</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>Leather conditioning, panoramic roof seals clean</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{viewCertificateModal.interiorStatus}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Engine & Mechanical Fluids</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>Synthetic oil, radiator coolant, brake master cylinder</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{viewCertificateModal.engineFluidsStatus}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Electricals & Telematics</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>ADAS camera calibration, heads-up display, battery health</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{viewCertificateModal.electricalsStatus}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Accessories & Keys Delivery</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>Factory smart keys & emergency metal insert</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{viewCertificateModal.keysProvided || 2} Keys Handed Over</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {viewCertificateModal.notes && (
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', color: '#475569', marginBottom: '24px' }}>
                <strong>Remarks:</strong> {viewCertificateModal.notes}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #94a3b8', marginBottom: '6px' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Authorized PDI Inspector</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{viewCertificateModal.inspectorName}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #94a3b8', marginBottom: '6px' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Customer Acceptance & Signature</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{viewCertificateModal.customerName}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }} className="no-print">
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={16} />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
