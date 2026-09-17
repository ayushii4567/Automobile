import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { DollarSign, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react';

export default function SaleModal({ 
  isOpen, 
  onClose, 
  onSave, 
  vehicles = [], 
  customers = [], 
  settings = {},
  preselectedVehicle 
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate || 18.0);
  const [paymentMethod, setPaymentMethod] = useState('Bank NEFT / RTGS');
  const [salesAgent, setSalesAgent] = useState('Rajesh Sharma');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (preselectedVehicle) {
      setSelectedVehicleId(preselectedVehicle.id);
      setBasePrice(Number(preselectedVehicle.price || 0));
    } else if (vehicles.length > 0 && !selectedVehicleId) {
      const avail = vehicles.find(v => v.status === 'Available') || vehicles[0];
      setSelectedVehicleId(avail.id);
      setBasePrice(Number(avail.price || 0));
    }
  }, [preselectedVehicle, vehicles, isOpen]);

  const handleVehicleChange = (id) => {
    setSelectedVehicleId(id);
    const v = vehicles.find(item => item.id === id);
    if (v) {
      setBasePrice(Number(v.price || 0));
    }
  };

  const handleCustomerChange = (val) => {
    setCustomerName(val);
  };

  // Calculations
  const taxableAmount = Math.max(0, basePrice - Number(discount || 0));
  const taxAmount = +(taxableAmount * (Number(taxRate || 8.5) / 100)).toFixed(2);
  const totalAmount = +(taxableAmount + taxAmount).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    
    const salePayload = {
      vehicleId: selectedVehicleId,
      vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : 'Exotic Vehicle',
      vin: vehicle ? vehicle.vin : 'VIN-PENDING',
      customerName: customerName || 'VIP Client',
      basePrice,
      discount: Number(discount || 0),
      taxRate: Number(taxRate),
      taxAmount,
      totalAmount,
      paymentMethod,
      salesAgent,
      deliveryDate
    };

    onSave(salePayload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Execute Vehicle Deal & Bill of Sale"
      subtitle="Finalize acquisition contract, calculate taxation, and register ownership"
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Vehicle Selector */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Select Vehicle from Inventory</label>
            <select
              className="form-select"
              value={selectedVehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              required
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.year}) - ₹{Number(v.price).toLocaleString('en-IN')} [{v.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Customer Input */}
          <div className="form-group">
            <label className="form-label">Purchaser / VIP Client</label>
            <input
              type="text"
              list="customer-list"
              placeholder="Select or type client name"
              className="form-input"
              value={customerName}
              onChange={(e) => handleCustomerChange(e.target.value)}
              required
            />
            <datalist id="customer-list">
              {customers.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Sales Advisor */}
          <div className="form-group">
            <label className="form-label">Assigned Sales Director</label>
            <select
              className="form-select"
              value={salesAgent}
              onChange={(e) => setSalesAgent(e.target.value)}
            >
              <option value="Rajesh Sharma">Rajesh Sharma (Senior Sales Manager)</option>
              <option value="Priya Patel">Priya Patel (Key Account Executive)</option>
            </select>
          </div>

          {/* Base Price */}
          <div className="form-group">
            <label className="form-label">Base Agreed Price (₹ INR)</label>
            <input
              type="number"
              className="form-input"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              required
            />
          </div>

          {/* Executive Incentive / Discount */}
          <div className="form-group">
            <label className="form-label">Executive Discount / Incentive (₹)</label>
            <input
              type="number"
              className="form-input"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          {/* Payment Instrument */}
          <div className="form-group">
            <label className="form-label">Payment Instrument</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Bank NEFT / RTGS">Bank NEFT / RTGS</option>
              <option value="Vehicle Loan / EMI">Vehicle Loan / EMI Financing</option>
              <option value="Demand Draft">Demand Draft (Bank DD)</option>
              <option value="UPI / Net Banking">UPI / Corporate Net Banking</option>
              <option value="Cheque">Payee Account Cheque</option>
            </select>
          </div>

          {/* Delivery Date */}
          <div className="form-group">
            <label className="form-label">Handover / Delivery Date</label>
            <input
              type="date"
              className="form-input"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Live Settlement Breakdown Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
            <span>Vehicle Base Price:</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{basePrice.toLocaleString('en-IN')}</span>
          </div>
          {Number(discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#dc2626' }}>
              <span>Showroom Incentive:</span>
              <span>-₹{Number(discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
            <span>Sales Tax ({taxRate}% GST):</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{taxAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#16a34a',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '8px',
            marginTop: '4px'
          }}>
            <span>Final Settlement:</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <DollarSign size={16} />
            <span>Generate Official Bill & Invoice</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
