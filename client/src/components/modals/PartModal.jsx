import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Package, Save } from 'lucide-react';

export default function PartModal({ isOpen, onClose, onSave, part }) {
  const initialForm = {
    partNo: '',
    name: '',
    category: 'Maintenance',
    compatibleModel: '',
    stock: 10,
    minStock: 3,
    unitCost: '',
    sellingPrice: '',
    supplier: '',
    location: '',
    notes: ''
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (part) {
      setForm(part);
    } else {
      setForm(initialForm);
    }
  }, [part, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      stock: Number(form.stock || 0),
      minStock: Number(form.minStock || 3),
      unitCost: Number(form.unitCost || 0),
      sellingPrice: Number(form.sellingPrice || 0)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={part ? 'Edit Spare Part / Accessory' : 'Add New Spare Part / Accessory'}
      subtitle="Register genuine parts, performance accessories, and maintenance inventory"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Part SKU / Number *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. APX-BRK-911"
              value={form.partNo}
              onChange={(e) => setForm({ ...form, partNo: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select 
              className="form-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="Maintenance">Maintenance & Filters</option>
              <option value="Braking">Braking Systems</option>
              <option value="Exterior & Aero">Exterior & Carbon Aero</option>
              <option value="Exhaust & Engine">Exhaust & Engine</option>
              <option value="Wheels & Tires">Wheels & Tires</option>
              <option value="Electronics">Electronics & Telemetry</option>
              <option value="Interior">Interior Luxury Accessories</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Part Name / Description *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Brembo Ceramic Composite Brake Pad Set"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Compatible Vehicles / Models *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Mahindra XUV700 / Tata Safari"
              value={form.compatibleModel}
              onChange={(e) => setForm({ ...form, compatibleModel: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity in Stock *</label>
            <input 
              type="number" 
              className="form-input" 
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Alert Threshold</label>
            <input 
              type="number" 
              className="form-input" 
              min="1"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit Cost Price (₹ INR)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="1800"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Selling Price (₹ INR) *</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="2800"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">OEM Supplier / Manufacturer</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Brembo Motorsport"
              value={form.supplier || ''}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse / Shelf Location</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Shelf A-12"
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            <span>Save Spare Part</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
