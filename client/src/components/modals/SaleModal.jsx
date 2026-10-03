import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { DollarSign, CheckCircle2, ShieldCheck, AlertCircle, FileCheck } from 'lucide-react';

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
  const [taxRate, setTaxRate] = useState(Number(settings.tax_rate || settings.defaultTaxRate || 18.0));
  const [paymentMethod, setPaymentMethod] = useState('Net Banking / RTGS');
  const [salesAgent, setSalesAgent] = useState('Julian Vance');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (preselectedVehicle) {
      setSelectedVehicleId(preselectedVehicle.id || preselectedVehicle.vehicleId);
      setBasePrice(Number(preselectedVehicle.price || preselectedVehicle.ex_showroom_price || preselectedVehicle.exShowroomPrice || 0));
      if (preselectedVehicle.customerName || preselectedVehicle.customer_name) {
        setCustomerName(preselectedVehicle.customerName || preselectedVehicle.customer_name);
      }
    } else if (vehicles.length > 0) {
      const avail = vehicles.find(v => v.status === 'Available') || vehicles[0];
      setSelectedVehicleId(avail.id);
      setBasePrice(Number(avail.price || avail.ex_showroom_price || 0));
    }
    if (settings.tax_rate || settings.defaultTaxRate) {
      setTaxRate(Number(settings.tax_rate || settings.defaultTaxRate));
    }
  }, [preselectedVehicle, vehicles, settings, isOpen]);

  const selectedVehicle = vehicles.find(item => item.id === selectedVehicleId);
  const isVehicleSold = selectedVehicle?.status === 'Sold';
  const isVehicleUnavailable = selectedVehicle && selectedVehicle.status !== 'Available';

  const handleVehicleChange = (id) => {
    setSelectedVehicleId(id);
    const v = vehicles.find(item => item.id === id);
    if (v) {
      setBasePrice(Number(v.price || v.ex_showroom_price || 0));
    }
  };

  // Calculations
  const taxableAmount = Math.max(0, basePrice - Number(discount || 0));
  const taxAmount = +(taxableAmount * (Number(taxRate || 18) / 100)).toFixed(2);
  const cgstAmount = +(taxAmount / 2).toFixed(2);
  const sgstAmount = +(taxAmount / 2).toFixed(2);
  const totalAmount = +(taxableAmount + taxAmount).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isVehicleSold || isVehicleUnavailable) {
      alert(`Cannot sell vehicle: Current status is '${selectedVehicle?.status}'. Only Available vehicles can be sold.`);
      return;
    }

    const matchedCustomer = customers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase());

    const salePayload = {
      quotation_id: preselectedVehicle?.quotationId || preselectedVehicle?.quotation_id || null,
      vehicle_id: selectedVehicleId,
      vehicleId: selectedVehicleId,
      vehicleName: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.year})` : 'Vehicle',
      vin: selectedVehicle ? selectedVehicle.vin : 'VIN-TBD',
      customer_id: matchedCustomer ? matchedCustomer.id : null,
      customerId: matchedCustomer ? matchedCustomer.id : null,
      customer_name: customerName,
      customerName: customerName,
      base_price: basePrice,
      basePrice,
      discount: Number(discount || 0),
      tax_rate: Number(taxRate),
      taxRate: Number(taxRate),
      taxAmount,
      total_amount: totalAmount,
      totalAmount,
      payment_method: paymentMethod,
      paymentMethod,
      salesAgent,
      booking_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: deliveryDate,
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
      subtitle="Issue binding sales order, calculate GST, and automatically generate linked invoice"
      maxWidth="700px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {isVehicleSold && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '12px 16px',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} />
            <div>
              <strong>Vehicle is already SOLD!</strong> This vehicle has already been purchased and cannot be resold.
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Vehicle Selector */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Select Vehicle from Inventory *</label>
            <select
              className="form-select"
              value={selectedVehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              required
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id} disabled={v.status === 'Sold'}>
                  {v.brand} {v.model} ({v.year}) - ₹{Number(v.price || v.ex_showroom_price).toLocaleString('en-IN')} [{v.status}] {v.status === 'Sold' ? '— UNAVAILABLE' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Input */}
          <div className="form-group">
            <label className="form-label">Purchaser / Customer Name *</label>
            <input
              type="text"
              list="customer-datalist"
              placeholder="Select or enter customer name"
              className="form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <datalist id="customer-datalist">
              {customers.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Sales Advisor */}
          <div className="form-group">
            <label className="form-label">Assigned Sales Executive</label>
            <select
              className="form-select"
              value={salesAgent}
              onChange={(e) => setSalesAgent(e.target.value)}
            >
              <option value="Julian Vance">Julian Vance (Senior Client Advisor)</option>
              <option value="Alex Rivera">Alex Rivera (Key Account Executive)</option>
              <option value="Marcus Vance">Marcus Vance (Showroom Director)</option>
            </select>
          </div>

          {/* Base Price */}
          <div className="form-group">
            <label className="form-label">Base Agreed Price (₹ INR) *</label>
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
            <label className="form-label">Showroom Discount / Incentive (₹)</label>
            <input
              type="number"
              className="form-input"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Primary Payment Method</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Net Banking / RTGS">Net Banking / RTGS Online Transfer</option>
              <option value="Car Loan / Bank">Bank Auto Loan Disbursal</option>
              <option value="UPI / Card">UPI / Corporate Credit Card</option>
              <option value="Cheque">Bank Demand Draft / Cheque</option>
              <option value="Cash">Cash at Dealership Cashier</option>
            </select>
          </div>

          {/* Delivery Date */}
          <div className="form-group">
            <label className="form-label">Expected Handover / Delivery Date</label>
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
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
            <span>Vehicle Base Price:</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>₹{basePrice.toLocaleString('en-IN')}</span>
          </div>
          {Number(discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#dc2626' }}>
              <span>Showroom Incentive:</span>
              <span>-₹{Number(discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
            <span>Taxable Amount:</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>₹{taxableAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
            <span>CGST ({(taxRate / 2).toFixed(1)}%):</span>
            <span style={{ color: '#0f172a' }}>₹{cgstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
            <span>SGST ({(taxRate / 2).toFixed(1)}%):</span>
            <span style={{ color: '#0f172a' }}>₹{sgstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#16a34a',
            borderTop: '2px solid #e2e8f0',
            paddingTop: '8px',
            marginTop: '4px'
          }}>
            <span>Total On-Road Value:</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isVehicleSold || isVehicleUnavailable}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <DollarSign size={16} />
            <span>Generate Official Bill & Invoice</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
