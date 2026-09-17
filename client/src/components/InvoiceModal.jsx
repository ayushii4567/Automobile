import React from 'react';
import Modal from './Modal';
import { Printer, Car } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, sale, settings = {} }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const showroom = settings.showroomName || 'AutoCore MotorHub';
  const address = settings.address || 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051';
  const phone = settings.phone || '+91 98200 12345';
  const email = settings.email || 'info@autocore-motors.in';
  const license = settings.dealerLicense || 'DL-MH-02-SHOWROOM-2024';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Bill of Sale & Invoice`} 
      subtitle={`Invoice #${sale.invoiceNo}`}
      maxWidth="740px"
    >
      <div className="printable-invoice" style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '28px',
        color: '#0f172a'
      }}>
        {/* Dealership Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Car size={18} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {showroom}
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{address}</p>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Phone: {phone} • Email: {email}</p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Dealer Reg: {license}</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 8px',
              borderRadius: '4px',
              background: '#eff6ff',
              color: '#2563eb',
              fontWeight: 600,
              fontSize: '0.75rem',
              marginBottom: '6px'
            }}>
              SALES INVOICE
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              {sale.invoiceNo}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Date: {sale.saleDate}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
              Status: {sale.status || 'Confirmed'}
            </div>
          </div>
        </div>

        {/* Client & Sales Advisor */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
          background: '#f8fafc',
          padding: '14px 16px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Purchaser / Buyer
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
              {sale.customerName}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Verified Showroom Customer
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Sales Advisor
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
              {sale.salesAgent || 'Julian Vance'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Delivery Date: {sale.deliveryDate || 'Upon Settlement'}
            </div>
          </div>
        </div>

        {/* Vehicle Table */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Vehicle Details
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px' }}>Description / Model</th>
                <th style={{ padding: '8px 12px' }}>VIN</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                  {sale.vehicleName}
                </td>
                <td style={{ padding: '12px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {sale.vin || 'N/A'}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  ₹{Number(sale.basePrice || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
              <span>Base Price:</span>
              <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{Number(sale.basePrice || 0).toLocaleString('en-IN')}</span>
            </div>
            {Number(sale.discount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#dc2626' }}>
                <span>Discount:</span>
                <span>-₹{Number(sale.discount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
              <span>Sales Tax ({sale.taxRate || 18}% GST):</span>
              <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{Number(sale.taxAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#16a34a',
              borderTop: '2px solid #e2e8f0',
              paddingTop: '8px',
              marginTop: '4px'
            }}>
              <span>Total Amount:</span>
              <span>₹{Number(sale.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right', marginTop: '2px' }}>
              Payment Method: <strong>{sale.paymentMethod || 'Bank NEFT / RTGS'}</strong>
            </div>
          </div>
        </div>

        {/* Signature lines */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          paddingTop: '16px',
          borderTop: '1px dashed #cbd5e1',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <div>
            <div style={{ borderBottom: '1px solid #94a3b8', height: '28px', marginBottom: '6px' }}></div>
            <div>Authorized Dealer Representative</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #94a3b8', height: '28px', marginBottom: '6px' }}></div>
            <div>Purchaser Signature</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={15} />
          <span>Print Invoice</span>
        </button>
      </div>
    </Modal>
  );
}
