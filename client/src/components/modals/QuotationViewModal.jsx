import React from 'react';
import Modal from '../Modal';
import { Printer, Car, CheckCircle, FileText } from 'lucide-react';

export default function QuotationViewModal({ isOpen, onClose, quotation, settings = {}, onConvertToSale }) {
  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const showroom = settings.showroomName || 'AutoCore MotorHub';
  const address = settings.address || 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051';
  const phone = settings.phone || '+91 98200 12345';
  const email = settings.email || 'info@autocore-motors.in';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pro-Forma Quotation Document"
      subtitle={`Quotation Ref: ${quotation.quotationNo}`}
      maxWidth="760px"
    >
      <div className="printable-invoice" style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '28px',
        color: '#0f172a'
      }}>
        {/* Dealership Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #ef4444',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#ef4444',
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
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#fee2e2',
              color: '#b91c1c',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              PRO-FORMA QUOTATION
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              {quotation.quotationNo}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Date Issued: {quotation.createdAt}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
              Valid Until: {quotation.validUntil}
            </div>
          </div>
        </div>

        {/* Client & Vehicle Meta */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          padding: '14px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quotation Prepared For:
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {quotation.customerName}
            </div>
            {quotation.customerPhone && (
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Phone: {quotation.customerPhone}
              </div>
            )}
            {quotation.customerEmail && (
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Email: {quotation.customerEmail}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Proposed Vehicle:
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>
              {quotation.vehicleName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              Status: <span className="badge badge-sent">{quotation.status}</span>
            </div>
          </div>
        </div>

        {/* Itemized Pricing Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', background: '#f1f5f9' }}>
              <th style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Item Description</th>
              <th style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Amount (₹ INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                <strong>Base Ex-Showroom Price</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Manufacturer standard vehicle specification</div>
              </td>
              <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>
                ₹{Number(quotation.exShowroomPrice || 0).toLocaleString('en-IN')}
              </td>
            </tr>

            {Number(quotation.rtoTax) > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                  <strong>RTO & Road Tax</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>State vehicle registration and licensing duties</div>
                </td>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right' }}>
                  ₹{Number(quotation.rtoTax).toLocaleString('en-IN')}
                </td>
              </tr>
            )}

            {Number(quotation.insurance) > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                  <strong>Comprehensive Bumper-to-Bumper Insurance</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Zero depreciation coverage for 1 year</div>
                </td>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right' }}>
                  ₹{Number(quotation.insurance).toLocaleString('en-IN')}
                </td>
              </tr>
            )}

            {Number(quotation.warrantyPack) > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                  <strong>Extended Factory Warranty Pack</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>5 Years / Unlimited track and road coverage</div>
                </td>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right' }}>
                  ₹{Number(quotation.warrantyPack).toLocaleString('en-IN')}
                </td>
              </tr>
            )}

            {Number(quotation.accessories) > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                  <strong>Showroom Accessories & Detailing Pack</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ceramic coating, premium floor mats, trickle charger</div>
                </td>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right' }}>
                  ₹{Number(quotation.accessories).toLocaleString('en-IN')}
                </td>
              </tr>
            )}

            {Number(quotation.discount) > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                  <strong>Special Showroom Privilege Discount</strong>
                </td>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>
                  -₹{Number(quotation.discount).toLocaleString('en-IN')}
                </td>
              </tr>
            )}

            <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
              <td style={{ padding: '12px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Total Estimated On-Road Price
              </td>
              <td style={{ padding: '12px', fontSize: '1.2rem', fontWeight: 800, textAlign: 'right', color: '#15803d' }}>
                ₹{Number(quotation.totalAmount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>

        {quotation.notes && (
          <div style={{
            fontSize: '0.78rem',
            color: '#64748b',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '20px',
            borderLeft: '3px solid #ef4444'
          }}>
            <strong>Remarks / Special Terms:</strong> {quotation.notes}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ borderBottom: '1px solid #cbd5e1', height: '35px' }}></div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Authorized Showroom Representative</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #cbd5e1', height: '35px' }}></div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Client Acceptance Signature</div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px'
      }} className="no-print">
        {onConvertToSale && (
          <button 
            onClick={() => onConvertToSale(quotation)} 
            className="btn btn-primary"
            style={{ background: '#16a34a', borderColor: '#16a34a' }}
          >
            <CheckCircle size={16} />
            <span>Convert to Official Sale Deal</span>
          </button>
        )}
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
