import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal';
import { Calculator, Save, AlertCircle, Sparkles } from 'lucide-react';

export default function EstimateModal({
  isOpen,
  onClose,
  onSave,
  estimate,
  vehicles = [],
  customers = [],
  initialData = null
}) {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    vehicleId: '',
    vehicleName: '',
    exShowroomPrice: 2000000,
    rtoCharges: 180000,
    insuranceAmount: 85000,
    accessoriesCost: 25000,
    warrantyCost: 35000,
    discountAmount: 15000,
    validUntil: '',
    status: 'Active',
    notes: ''
  });

  const [validationError, setValidationError] = useState('');

  // Default valid until: 30 days from today
  const defaultValidDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (estimate) {
      setFormData({
        customerId: estimate.customer_id || estimate.customerId || '',
        customerName: estimate.customer_name || estimate.customerName || '',
        customerPhone: estimate.customer_phone || estimate.customerPhone || '',
        vehicleId: estimate.vehicle_id || estimate.vehicleId || '',
        vehicleName: estimate.vehicle_name || estimate.vehicleName || '',
        exShowroomPrice: Number(estimate.ex_showroom_price ?? estimate.exShowroomPrice ?? 2000000),
        rtoCharges: Number(estimate.rto_charges ?? estimate.rtoCharges ?? 180000),
        insuranceAmount: Number(estimate.insurance_amount ?? estimate.insuranceAmount ?? 85000),
        accessoriesCost: Number(estimate.accessories_cost ?? estimate.accessoriesCost ?? 0),
        warrantyCost: Number(estimate.warranty_cost ?? estimate.warrantyCost ?? 0),
        discountAmount: Number(estimate.discount_amount ?? estimate.discountAmount ?? 0),
        validUntil: estimate.valid_until || estimate.validUntil || defaultValidDate,
        status: estimate.status || 'Active',
        notes: estimate.notes || ''
      });
      setValidationError('');
    } else if (initialData) {
      // Pre-filled from Lead, Customer, or Test Drive
      let matchedVehicle = null;
      if (initialData.vehicleId) {
        matchedVehicle = vehicles.find(v => v.id === initialData.vehicleId);
      } else if (initialData.vehicleName || initialData.vehicleInterest) {
        const vName = (initialData.vehicleName || initialData.vehicleInterest).toLowerCase();
        matchedVehicle = vehicles.find(v => `${v.brand} ${v.model}`.toLowerCase().includes(vName));
      }

      const exPrice = matchedVehicle ? Number(matchedVehicle.price || 2000000) : 2000000;
      setFormData({
        customerId: initialData.customerId || initialData.id || '',
        customerName: initialData.customerName || initialData.name || '',
        customerPhone: initialData.customerPhone || initialData.phone || '',
        vehicleId: matchedVehicle ? matchedVehicle.id : '',
        vehicleName: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : (initialData.vehicleName || initialData.vehicleInterest || ''),
        exShowroomPrice: exPrice,
        rtoCharges: Math.round(exPrice * 0.09),
        insuranceAmount: Math.round(exPrice * 0.04),
        accessoriesCost: 25000,
        warrantyCost: 35000,
        discountAmount: 10000,
        validUntil: defaultValidDate,
        status: 'Active',
        notes: initialData.notes || ''
      });
      setValidationError('');
    } else {
      const defaultVehicle = vehicles[0];
      const exPrice = defaultVehicle ? Number(defaultVehicle.price || 2000000) : 2000000;
      setFormData({
        customerId: customers[0]?.id || '',
        customerName: customers[0]?.name || '',
        customerPhone: customers[0]?.phone || '',
        vehicleId: defaultVehicle?.id || '',
        vehicleName: defaultVehicle ? `${defaultVehicle.brand} ${defaultVehicle.model}` : '',
        exShowroomPrice: exPrice,
        rtoCharges: Math.round(exPrice * 0.09),
        insuranceAmount: Math.round(exPrice * 0.04),
        accessoriesCost: 20000,
        warrantyCost: 30000,
        discountAmount: 10000,
        validUntil: defaultValidDate,
        status: 'Active',
        notes: ''
      });
      setValidationError('');
    }
  }, [estimate, initialData, isOpen, defaultValidDate, vehicles, customers]);

  // Handle vehicle selection
  const handleVehicleChange = (vId) => {
    const v = vehicles.find(item => item.id === vId);
    if (v) {
      const exPrice = Number(v.price || 2000000);
      setFormData(prev => ({
        ...prev,
        vehicleId: v.id,
        vehicleName: `${v.brand} ${v.model}`,
        exShowroomPrice: exPrice,
        rtoCharges: Math.round(exPrice * 0.09),
        insuranceAmount: Math.round(exPrice * 0.04)
      }));
    }
  };

  // Handle customer selection
  const handleCustomerChange = (cId) => {
    if (cId === 'NEW_PROSPECT') {
      setFormData(prev => ({ ...prev, customerId: '', customerName: '', customerPhone: '' }));
      return;
    }
    const c = customers.find(item => item.id === cId);
    if (c) {
      setFormData(prev => ({
        ...prev,
        customerId: c.id,
        customerName: c.name,
        customerPhone: c.phone || ''
      }));
    }
  };

  // Live computed total
  const computedTotal = useMemo(() => {
    const ex = Number(formData.exShowroomPrice || 0);
    const rto = Number(formData.rtoCharges || 0);
    const ins = Number(formData.insuranceAmount || 0);
    const acc = Number(formData.accessoriesCost || 0);
    const war = Number(formData.warrantyCost || 0);
    const disc = Number(formData.discountAmount || 0);
    return Math.max(0, ex + rto + ins + acc + war - disc);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      setValidationError('Customer / Prospect name is required.');
      return;
    }
    if (!formData.vehicleName.trim()) {
      setValidationError('Please select or specify a vehicle.');
      return;
    }
    if (Number(formData.exShowroomPrice) <= 0) {
      setValidationError('Ex-Showroom price must be greater than zero.');
      return;
    }

    onSave({
      ...formData,
      exShowroomPrice: Number(formData.exShowroomPrice),
      rtoCharges: Number(formData.rtoCharges),
      insuranceAmount: Number(formData.insuranceAmount),
      accessoriesCost: Number(formData.accessoriesCost),
      warrantyCost: Number(formData.warrantyCost),
      discountAmount: Number(formData.discountAmount),
      totalEstimatedAmount: computedTotal,
      total: computedTotal
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={estimate ? 'Edit On-Road Price Estimate' : 'Generate New Vehicle Estimate'}
      subtitle="Prepare transparent price breakdowns with taxes, insurance & customized packages"
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {validationError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Customer & Vehicle Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Customer / Prospect</label>
            <select
              className="form-select"
              value={formData.customerId || (formData.customerName ? 'NEW_PROSPECT' : '')}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">Select Existing Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || c.city || 'Verified'})
                </option>
              ))}
              <option value="NEW_PROSPECT">+ Enter Custom Prospect Name</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Customer / Contact Name *</label>
            <input
              type="text"
              placeholder="e.g. Vikram Malhotra"
              className="form-input"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Customer Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              className="form-input"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle from Showroom Stock</label>
            <select
              className="form-select"
              value={formData.vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
            >
              <option value="">Choose Showroom Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.variant || v.fuel}) — ₹{Number(v.price).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Vehicle Name & Variant Description *</label>
          <input
            type="text"
            placeholder="e.g. Mahindra XUV700 AX7 Luxury Diesel AT"
            className="form-input"
            value={formData.vehicleName}
            onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
            required
          />
        </div>

        {/* Pricing Breakdown Grid */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cost Breakdown & Customizations (₹ INR)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Ex-Showroom Price (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.exShowroomPrice}
                onChange={(e) => setFormData({ ...formData, exShowroomPrice: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">RTO Registration & Road Tax (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.rtoCharges}
                onChange={(e) => setFormData({ ...formData, rtoCharges: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Comprehensive Motor Insurance (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.insuranceAmount}
                onChange={(e) => setFormData({ ...formData, insuranceAmount: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Genuine Accessories Pack (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.accessoriesCost}
                onChange={(e) => setFormData({ ...formData, accessoriesCost: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Extended Warranty & Shield (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.warrantyCost}
                onChange={(e) => setFormData({ ...formData, warrantyCost: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Promotional Dealer Discount (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Total Calculation Display */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
              Estimated On-Road Price
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e3a8a' }}>
              ₹{computedTotal.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>
            Includes RTO + Insurance + Packs - Discount
          </div>
        </div>

        {/* Validity & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Valid Until</label>
            <input
              type="date"
              className="form-input"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estimate Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '8px',
          paddingTop: '14px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', gap: '8px' }}>
            <Save size={16} />
            <span>{estimate ? 'Save Changes' : 'Generate Estimate'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
