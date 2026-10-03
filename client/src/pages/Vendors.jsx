import React, { useState } from 'react';
import { 
  Building, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  FileText 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Vendors({ vendors = [], onAddVendor, onUpdateVendor }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    category: 'OEM Manufacturer',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    paymentTerms: 'Net 30',
    status: 'Active'
  });

  const handleOpenNew = () => {
    setSelectedVendor(null);
    setFormData({
      companyName: '',
      category: 'OEM Manufacturer',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
      paymentTerms: 'Net 30',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedVendor(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedVendor) {
      onUpdateVendor(selectedVendor.id, formData);
    } else {
      onAddVendor(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = vendors.filter(v => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (v.companyName || '').toLowerCase().includes(s) ||
      (v.contactPerson || '').toLowerCase().includes(s) ||
      (v.vendorCode || '').toLowerCase().includes(s) ||
      (v.gstNumber || '').toLowerCase().includes(s)
    );
    const matchesCat = filterCategory === 'ALL' || v.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Partner Vendors</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Building size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {vendors.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Approved OEM & distributor network
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>OEM Plants</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <Truck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            {vendors.filter(v => v.category === 'OEM Manufacturer').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Direct factory dispatch centers
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Spare Parts Suppliers</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '8px' }}>
            {vendors.filter(v => v.category === 'Spare Parts Distributor').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Certified parts distribution hubs
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
              placeholder="Search by company, contact person, code, or GSTIN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'OEM Manufacturer', 'Spare Parts Distributor'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleOpenNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          <span>Onboard New Vendor</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor Code</th>
              <th>Company Name</th>
              <th>Category</th>
              <th>Contact Person</th>
              <th>Phone & Email</th>
              <th>GSTIN Number</th>
              <th>Payment Terms</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No vendor partners found.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{item.vendorCode}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.companyName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.address}</div>
                  </td>
                  <td>
                    <span className="status-badge status-delivered" style={{ fontSize: '0.72rem' }}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.contactPerson}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{item.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {item.gstNumber || 'GST-UNREGISTERED'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>{item.paymentTerms}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${item.status === 'Active' ? 'status-delivered' : 'status-pending'}`}>
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
        title={selectedVendor ? `Update Vendor — ${selectedVendor.companyName}` : 'Onboard New Supplier / Vendor'}
        subtitle="Maintain verified distributor contracts, tax IDs, and billing credit terms"
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Company / Supplier Name *</label>
              <input 
                type="text" 
                required 
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>Vendor Category *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                <option value="OEM Manufacturer">OEM Manufacturer</option>
                <option value="Spare Parts Distributor">Spare Parts Distributor</option>
                <option value="Accessory Supplier">Accessory Supplier</option>
                <option value="Tires & Lubricants">Tires & Lubricants</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Key Contact Person *</label>
              <input 
                type="text" 
                required 
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>Official Phone Number *</label>
              <input 
                type="text" 
                required 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>GST Identification Number (GSTIN)</label>
              <input 
                type="text" 
                placeholder="27AAACM1234F1Z1"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Credit & Payment Terms</label>
              <select 
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="input-field"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div className="input-group">
              <label>Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="Active">Active Supplier</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Factory / Plant Address</label>
            <textarea 
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              placeholder="e.g. MIDC Phase II, Chakan Automotive Hub, Pune 410501"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedVendor ? 'Update Vendor' : 'Onboard Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
