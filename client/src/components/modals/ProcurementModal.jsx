import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Truck, Save } from 'lucide-react';

export default function ProcurementModal({ isOpen, onClose, onSave, order }) {
  const initialForm = {
    supplier: '',
    brand: 'Mahindra',
    model: '',
    year: 2026,
    vin: '',
    exteriorColor: '',
    category: 'Coupe',
    expectedDelivery: '',
    purchaseCost: '',
    suggestedRetailPrice: '',
    status: 'Ordered',
    notes: ''
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (order) {
      setForm(order);
    } else {
      const future = new Date();
      future.setDate(future.getDate() + 20);
      setForm({
        ...initialForm,
        expectedDelivery: future.toISOString().split('T')[0]
      });
    }
  }, [order, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      year: Number(form.year || 2026),
      purchaseCost: Number(form.purchaseCost || 0),
      suggestedRetailPrice: Number(form.suggestedRetailPrice || 0)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order ? 'Edit Factory Purchase Order' : 'Create Vehicle Procurement Order'}
      subtitle="Issue purchase order to manufacturer or factory distribution center"
      maxWidth="660px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Manufacturer / Factory Supplier *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Mahindra & Mahindra Ltd. Chakan Plant"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Brand *</label>
            <select 
              className="form-select"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            >
              <option value="Mahindra">Mahindra</option>
              <option value="Tata Motors">Tata Motors</option>
              <option value="Hyundai">Hyundai</option>
              <option value="Toyota">Toyota</option>
              <option value="Maruti Suzuki">Maruti Suzuki</option>
              <option value="Kia">Kia</option>
              <option value="Honda">Honda</option>
              <option value="MG Motors">MG Motors</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Model & Trim *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. XUV700 AX7 Luxury Pack"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Chassis / VIN Number</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="17-Digit Vehicle VIN"
              value={form.vin || ''}
              onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Model Year</label>
            <input 
              type="number" 
              className="form-input" 
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Exterior Color</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Guards Red / Crayon"
              value={form.exteriorColor || ''}
              onChange={(e) => setForm({ ...form, exteriorColor: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Body Style / Category</label>
            <select 
              className="form-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="Coupe">Coupe</option>
              <option value="Convertible">Convertible / Spyder</option>
              <option value="Supercar">Supercar</option>
              <option value="Hypercar">Hypercar</option>
              <option value="SUV">Luxury SUV</option>
              <option value="Sedan">Sedan</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Wholesale Purchase Cost (₹ INR) *</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="1850000"
              value={form.purchaseCost}
              onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Suggested Retail Price / MSRP (₹ INR) *</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="2150000"
              value={form.suggestedRetailPrice}
              onChange={(e) => setForm({ ...form, suggestedRetailPrice: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Arrival Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={form.expectedDelivery}
              onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Procurement Status</label>
            <select 
              className="form-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Ordered">Ordered at Factory</option>
              <option value="In Transit">In Transit / Shipping</option>
              <option value="Delivered">Delivered & Inspected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Factory Notes & Build Sheet Specs</label>
            <textarea 
              className="form-input" 
              rows="2"
              placeholder="Custom options, container tracking number, bill of lading..."
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            <span>Save Purchase Order</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
