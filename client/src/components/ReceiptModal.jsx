import React from 'react';
import Modal from './Modal';
import { Printer, Receipt, CheckCircle, Building, ShieldCheck, Car } from 'lucide-react';

function numberToIndianWords(num) {
  num = Math.floor(Math.abs(Number(num) || 0));
  if (num === 0) return 'Zero Rupees Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    return '';
  }

  let str = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore > 0) str += inWords(crore) + ' Crore ';
  if (lakh > 0) str += inWords(lakh) + ' Lakh ';
  if (thousand > 0) str += inWords(thousand) + ' Thousand ';
  if (hundred > 0) str += inWords(hundred) + ' ';

  return str.trim() + ' Rupees Only';
}

export default function ReceiptModal({ isOpen, onClose, receipt, settings = {} }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const showroom = settings.showroom_name || settings.showroomName || 'Apex Horizon Motors';
  const tagline = settings.tagline || 'Authorized Automobile Dealership & Showroom';
  const address = settings.address || 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051';
  const phone = settings.phone || '+91 98200 12345';
  const email = settings.email || 'accounts@apexhorizonmotors.in';
  const gstin = settings.gstin || '27AAACA9928P1Z8';
  const license = settings.dealer_license || settings.dealerLicense || 'DL-MH-02-SHOWROOM-2026';
  const currency = settings.currency_symbol || settings.currencySymbol || '₹';
  const logoUrl = settings.logo_url || settings.logoUrl;
  const signatoryTitle = settings.authorized_signatory || settings.authorizedSignatory || 'Authorized Cashier / Accountant';
  const signatoryName = settings.signatory_name || settings.signatoryName || '';

  const amount = Number(receipt.amount || 0);
  const words = numberToIndianWords(amount);
  const remaining = receipt.remainingBalance !== undefined ? Number(receipt.remainingBalance) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt"
      subtitle={`Receipt #${receipt.receiptNo || receipt.receipt_number || 'RCPT'}`}
      maxWidth="680px"
    >
      <div className="printable-receipt" style={{
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
          paddingBottom: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              {logoUrl ? (
                <img 
                  src={logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`} 
                  alt={showroom} 
                  style={{ maxHeight: '38px', maxWidth: '130px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Receipt size={18} />
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {showroom}
                </h2>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{tagline}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0' }}>{address}</p>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0' }}>Phone: {phone} • Email: {email}</p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0' }}>
              GSTIN: <strong>{gstin}</strong> • Reg: {license}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 8px',
              borderRadius: '4px',
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              fontWeight: 700,
              fontSize: '0.75rem',
              marginBottom: '6px'
            }}>
              OFFICIAL RECEIPT
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {receipt.receiptNo || receipt.receipt_number}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Date: {receipt.receiptDate || receipt.paymentDate || new Date().toISOString().split('T')[0]}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
              Status: Cleared / Verified
            </div>
          </div>
        </div>

        {/* Customer & Transaction Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Received With Thanks From
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {receipt.customerName || 'Valued Customer'}
            </div>
            {receipt.customerPhone && (
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Contact: {receipt.customerPhone}
              </div>
            )}
            {receipt.invoiceNo && (
              <div style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600, marginTop: '4px' }}>
                Against Invoice #{receipt.invoiceNo}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Payment Instrument
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
              {receipt.paymentMode || 'Direct Transfer'}
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', marginTop: '2px' }}>
              Ref/UTR: {receipt.transactionRef || receipt.transaction_id || 'N/A'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>
              Category: <strong>{receipt.paymentType || 'Down Payment'}</strong>
            </div>
          </div>
        </div>

        {/* Particulars Table */}
        <div className="data-table-wrapper" style={{ overflowX: 'auto', marginBottom: '20px', border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Payment Particulars / Purpose</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '14px 12px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    {receipt.paymentType || 'Customer Payment'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    {receipt.notes || 'Full receipt credited against automobile sales delivery agreement.'}
                  </div>
                </td>
                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                    ₹{amount.toLocaleString('en-IN')}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words & Outstanding Balance */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
              Amount In Words
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#166534', marginTop: '2px' }}>
              {words}
            </div>
          </div>

          {remaining !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Invoice Balance Due
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: remaining <= 0 ? '#16a34a' : '#ea580c' }}>
                {remaining <= 0 ? '₹0.00 (PAID IN FULL)' : `₹${remaining.toLocaleString('en-IN')}`}
              </div>
            </div>
          )}
        </div>

        {/* Signatures & Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '24px',
          borderTop: '1px dashed #cbd5e1',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <div>
            <div>* Computer generated official payment acknowledgement.</div>
            <div>Subject to Mumbai jurisdiction only. Non-refundable per dealership policy.</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '36px', borderBottom: '1px solid #94a3b8', width: '160px', marginBottom: '6px' }} />
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{signatoryTitle}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{signatoryName ? `${signatoryName} • ` : ''}{showroom}</div>
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }} className="no-print">
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
        <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={16} />
          <span>Print Official Receipt</span>
        </button>
      </div>
    </Modal>
  );
}
