import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { FileText, Save, Calculator } from 'lucide-react';

export default function QuotationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  quotation, 
  vehicles = [], 
  customers = [] 
}) {
  const initialForm = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleId: '',
    vehicleName: '',
    exShowroomPrice: '',
    rtoTax: '',
    insurance: '',
    warrantyPack: '',
    accessories: '',
    discount: '',
    validUntil: '',
    status: 'Sent',
    notes: ''
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (quotation) {
      setForm(quotation);
    } else {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      setForm({
        ...initialForm,
        validUntil: futureDate.toISOString().split('T')[0]
      });
    }
  }, [quotation, isOpen]);

  // When vehicle selected, populate base price & tax estimates
  const handleVehicleChange = (vehId) => {
    const selected = vehicles.find(v => v.id === vehId);
    if (selected) {
      const price = Number(selected.price || 0);
      const rto = Math.round(price * 0.12);
      const ins = Math.round(price * 0.035);
      setForm(prev => ({
        ...prev,
        vehicleId: selected.id,
        vehicleName: `${selected.brand} ${selected.model} (${selected.year})`,
        exShowroomPrice: price,
        rtoTax: rto,
        insurance: ins,
        warrantyPack: 28000,
        accessories: 15000,
        discount: 0
      }));
    } else {
      setForm(prev => ({ ...prev, vehicleId: '', vehicleName: '' }));
    }
  };

  // When customer selected, populate contact details
  const handleCustomerChange = (custId) => {
    const selected = customers.find(c => c.id === custId);
    if (selected) {
      setForm(prev => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.name,
        customerPhone: selected.phone || '',
        customerEmail: selected.email || ''
      }));
    }
  };

  // Live total calculation
  const totalAmount = (
    Number(form.exShowroomPrice || 0) +
    Number(form.rtoTax || 0) +
    Number(form.insurance || 0) +
    Number(form.warrantyPack || 0) +
    Number(form.accessories || 0) -
    Number(form.discount || 0)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      exShowroomPrice: Number(form.exShowroomPrice || 0),
      rtoTax: Number(form.rtoTax || 0),
      insurance: Number(form.insurance || 0),
      warrantyPack: Number(form.warrantyPack || 0),
      accessories: Number(form.accessories || 0),
      discount: Number(form.discount || 0),
      totalAmount
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quotation ? 'Edit Pro-Forma Quotation' : 'Generate New Pro-Forma Quotation'}
      subtitle="Complete breakdown of on-road vehicle pricing, taxes, and warranty options"
      maxWidth="700px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Customer Section */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
            1. Client Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Existing Client (Optional)</label>
              <select 
                className="form-select"
                onChange={(e) => handleCustomerChange(e.target.value)}
                defaultValue=""
              >
                <option value="">Select registered customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Client Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Rahul Sharma"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="+91 98200 11223"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="client@example.com"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
            2. Vehicle & Base Ex-Showroom
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Select Showroom Car</label>
              <select 
                className="form-select"
                value={form.vehicleId || ''}
                onChange={(e) => handleVehicleChange(e.target.value)}
              >
                <option value="">Choose vehicle or enter manually below...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.year}) — ₹{Number(v.price).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Name / Model *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Mahindra XUV700 AX7 Luxury"
                value={form.vehicleName}
                onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
            3. Pricing & On-Road Breakdown (₹ INR)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Ex-Showroom Price *</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.exShowroomPrice}
                onChange={(e) => setForm({ ...form, exShowroomPrice: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">RTO Registration / Tax</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.rtoTax}
                onChange={(e) => setForm({ ...form, rtoTax: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Comprehensive Insurance</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.insurance}
                onChange={(e) => setForm({ ...form, insurance: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Extended Warranty</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.warrantyPack}
                onChange={(e) => setForm({ ...form, warrantyPack: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Accessories & Care Pack</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.accessories}
                onChange={(e) => setForm({ ...form, accessories: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#ef4444' }}>Special Discount (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </div>
          </div>

          {/* Computed On-Road Price Highlight */}
          <div style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            borderRadius: '10px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} color="#ef4444" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Total On-Road Quotation:</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Validity & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Quotation Valid Until</label>
            <input 
              type="date" 
              className="form-input"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quotation Status</label>
            <select 
              className="form-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent to Client</option>
              <option value="Accepted">Accepted / Ready to Close</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes & Specifications</label>
          <textarea 
            className="form-input"
            rows="2"
            placeholder="Special delivery notes, custom aero packages, payment term options..."
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            <span>Save Quotation</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
