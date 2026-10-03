import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Printer, Car, CreditCard, CheckCircle2, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { api } from '../api';

export default function InvoiceModal({ isOpen, onClose, sale, settings = {}, onRecordPayment }) {
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sale) {
      const invId = sale.invoiceId || sale.invoice_id || sale.id;
      setLoading(true);
      api.getInvoiceById(invId)
        .then(data => setInvoiceDetails(data))
        .catch(() => setInvoiceDetails(null))
        .finally(() => setLoading(false));
    } else {
      setInvoiceDetails(null);
    }
  }, [isOpen, sale]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const showroom = settings.showroom_name || settings.showroomName || invoiceDetails?.settings?.showroom_name || 'Apex Horizon Motors';
  const tagline = settings.tagline || invoiceDetails?.settings?.tagline || 'Authorized Automobile Dealership & Showroom';
  const address = settings.address || invoiceDetails?.settings?.address || 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051';
  const phone = settings.phone || invoiceDetails?.settings?.phone || '+91 98200 12345';
  const email = settings.email || invoiceDetails?.settings?.email || 'accounts@apexhorizonmotors.in';
  const gstin = settings.gstin || invoiceDetails?.settings?.gstin || '27AAACA9928P1Z8';
  const license = settings.dealer_license || settings.dealerLicense || 'DL-MH-02-SHOWROOM-2026';
  const currency = settings.currency_symbol || settings.currencySymbol || '₹';
  const logoUrl = settings.logo_url || settings.logoUrl || invoiceDetails?.settings?.logo_url;
  const signatoryTitle = settings.authorized_signatory || settings.authorizedSignatory || 'Authorized Dealership Signatory';
  const signatoryName = settings.signatory_name || settings.signatoryName || '';
  const invoiceTerms = settings.invoice_terms || settings.invoiceTerms || 'Payment due within 7 days of invoice date. All disputes subject to Mumbai jurisdiction.';
  const invoiceFooter = settings.invoice_footer || settings.invoiceFooter || 'Thank you for your business!';
  const bankName = settings.bank_name || settings.bankName;
  const bankAccount = settings.bank_account_no || settings.bankAccountNo;
  const bankIfsc = settings.bank_ifsc || settings.bankIfsc;
  const bankBranch = settings.bank_branch || settings.bankBranch;

  const basePrice = Number(sale.basePrice || sale.base_price || 0);
  const discount = Number(sale.discount || 0);
  const taxRate = Number(sale.taxRate || sale.tax_rate || 18.0);
  const taxable = Math.max(0, basePrice - discount);
  const taxAmount = Number(sale.taxAmount || sale.tax_amount || ((taxable * taxRate) / 100));
  const cgstAmount = Number(invoiceDetails?.cgst_amount ?? invoiceDetails?.cgstAmount ?? (taxAmount / 2));
  const sgstAmount = Number(invoiceDetails?.sgst_amount ?? invoiceDetails?.sgstAmount ?? (taxAmount / 2));
  const totalAmount = Number(sale.totalAmount || sale.total_amount || (taxable + taxAmount));
  const paidAmount = Number(invoiceDetails?.paid_amount ?? invoiceDetails?.paidAmount ?? sale.paidAmount ?? sale.paid_amount ?? 0);
  const balanceDue = Number(invoiceDetails?.balance_due ?? invoiceDetails?.balanceDue ?? sale.balanceDue ?? (totalAmount - paidAmount));
  const status = invoiceDetails?.status || sale.invoiceStatus || (balanceDue <= 0 ? 'Paid In Full' : paidAmount > 0 ? 'Partially Paid' : 'Issued');

  const payments = invoiceDetails?.payments || [];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Official Bill of Sale & Tax Invoice" 
      subtitle={`Invoice #${sale.invoiceNo || sale.invoice_number || 'INV'}`}
      maxWidth="780px"
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
                  style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '6px',
                  background: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Car size={20} />
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {showroom}
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tagline}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0' }}>{address}</p>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0' }}>Phone: {phone} • Email: {email}</p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0' }}>
              GSTIN: <strong>{gstin}</strong> • Dealer Reg: {license}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: '4px',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              fontWeight: 700,
              fontSize: '0.78rem',
              marginBottom: '6px'
            }}>
              TAX INVOICE
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              {sale.invoiceNo || sale.invoice_number}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Order: {sale.saleOrderNumber || sale.sale_order_number}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Date: {sale.saleDate || sale.booking_date}
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: status === 'Paid In Full' ? '#f0fdf4' : status === 'Partially Paid' ? '#fefce8' : '#f8fafc',
              color: status === 'Paid In Full' ? '#16a34a' : status === 'Partially Paid' ? '#ca8a04' : '#64748b',
              border: `1px solid ${status === 'Paid In Full' ? '#bbf7d0' : status === 'Partially Paid' ? '#fef08a' : '#e2e8f0'}`
            }}>
              {status}
            </div>
          </div>
        </div>

        {/* Client & Sales Advisor */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
          background: '#f8fafc',
          padding: '14px 18px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
              Purchaser / Buyer Details
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {sale.customerName || sale.customer_name}
            </div>
            {sale.customerPhone && (
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Phone: {sale.customerPhone}
              </div>
            )}
            {sale.customerEmail && (
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Email: {sale.customerEmail}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
              Sales Advisor & Delivery
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {sale.salesAgent || 'Julian Vance'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Estimated Delivery: {sale.deliveryDate || sale.expected_delivery_date || 'Prompt'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Payment Mode: <strong>{sale.paymentMethod || sale.payment_method || 'Net Banking / RTGS'}</strong>
            </div>
          </div>
        </div>

        {/* Vehicle Details Table */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Vehicle Specifications
          </div>
          <div className="data-table-wrapper" style={{ overflowX: 'auto', border: 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 12px' }}>Description / Model</th>
                  <th style={{ padding: '8px 12px' }}>VIN Number</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Ex-Showroom Price</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                    {sale.vehicleName || sale.vehicle_name}
                    {sale.color && <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, marginLeft: '6px' }}>({sale.color})</span>}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {sale.vin || sale.vehicle_vin || 'VIN-TBD'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {currency}{basePrice.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Calculation & Settlement Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
              <span>Base Agreed Price:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{currency}{basePrice.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#dc2626' }}>
                <span>Executive Discount:</span>
                <span>-{currency}{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
              <span>Taxable Subtotal:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{currency}{taxable.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
              <span>CGST ({(taxRate / 2).toFixed(1)}%):</span>
              <span style={{ color: '#0f172a' }}>{currency}{cgstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
              <span>SGST ({(taxRate / 2).toFixed(1)}%):</span>
              <span style={{ color: '#0f172a' }}>{currency}{sgstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#0f172a',
              borderTop: '2px solid #e2e8f0',
              paddingTop: '8px',
              marginTop: '4px'
            }}>
              <span>Total On-Road Price:</span>
              <span>{currency}{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#16a34a', fontWeight: 600 }}>
              <span>Amount Paid To Date:</span>
              <span>{currency}{paidAmount.toLocaleString('en-IN')}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1rem',
              fontWeight: 800,
              color: balanceDue <= 0 ? '#16a34a' : '#ea580c',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '6px'
            }}>
              <span>Balance Due:</span>
              <span>{balanceDue <= 0 ? '₹0.00 (CLEARED)' : `${currency}${balanceDue.toLocaleString('en-IN')}`}</span>
            </div>
          </div>
        </div>

        {/* Payment History if exists */}
        {payments.length > 0 && (
          <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Payment Receipts Logged Against This Invoice
            </div>
            <div className="data-table-wrapper" style={{ overflowX: 'auto', border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px' }}>Receipt #</th>
                    <th style={{ padding: '6px' }}>Type</th>
                    <th style={{ padding: '6px' }}>Mode</th>
                    <th style={{ padding: '6px' }}>Date</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px', fontWeight: 600, color: '#2563eb' }}>{p.receiptNo}</td>
                      <td style={{ padding: '6px' }}>{p.paymentType}</td>
                      <td style={{ padding: '6px' }}>{p.paymentMode}</td>
                      <td style={{ padding: '6px' }}>{p.paymentDate}</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {currency}{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bank & Remittance Details if configured */}
        {(bankName || bankAccount) && (
          <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.72rem' }}>
              Bank Wire / NEFT / RTGS Remittance Instructions:
            </div>
            <div>Bank: <strong>{bankName}</strong> {bankBranch ? `(${bankBranch})` : ''} • A/C No: <strong>{bankAccount}</strong> • IFSC: <strong>{bankIfsc}</strong></div>
          </div>
        )}

        {/* Terms & Conditions */}
        <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
          <strong style={{ color: '#334155' }}>Terms & Conditions: </strong>
          {invoiceTerms}
          {invoiceFooter && <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#2563eb' }}>{invoiceFooter}</div>}
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
            <div style={{ borderBottom: '1px solid #94a3b8', height: '32px', marginBottom: '6px' }}></div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{signatoryTitle}</div>
            <div style={{ fontSize: '0.7rem' }}>{signatoryName ? `${signatoryName} • ` : ''}{showroom}</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #94a3b8', height: '32px', marginBottom: '6px' }}></div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>Customer / Purchaser Signature</div>
            <div style={{ fontSize: '0.7rem' }}>I acknowledge receipt and agreement with terms</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }} className="no-print">
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>

        {balanceDue > 0 && onRecordPayment && (
          <button 
            onClick={() => {
              onClose();
              onRecordPayment({
                saleId: sale.id,
                invoiceId: sale.invoiceId || sale.invoice_id || invoiceDetails?.id,
                invoiceNo: sale.invoiceNo || sale.invoice_number,
                customerId: sale.customerId || sale.customer_id,
                customerName: sale.customerName || sale.customer_name,
                balanceDue
              });
            }} 
            className="btn btn-primary"
            style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CreditCard size={15} />
            <span>Record Payment (Due: {currency}{balanceDue.toLocaleString('en-IN')})</span>
          </button>
        )}

        <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Printer size={15} />
          <span>Print / PDF Invoice</span>
        </button>
      </div>
    </Modal>
  );
}
