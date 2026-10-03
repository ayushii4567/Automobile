import React from 'react';
import Modal from '../Modal';
import { Printer, Car, Calculator, ArrowRight } from 'lucide-react';

export default function EstimateViewModal({ isOpen, onClose, estimate, settings = {}, onConvertToQuotation }) {
  if (!estimate) return null;

  const handlePrint = () => {
    window.print();
  };

  const showroom = settings.showroom_name || settings.showroomName || 'Apex Horizon Motors';
  const tagline = settings.tagline || 'Authorized Automobile Dealership & Showroom';
  const address = settings.address || 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051';
  const phone = settings.phone || '+91 98200 12345';
  const email = settings.email || 'info@apexhorizonmotors.in';
  const gstin = settings.gstin || '27AAACA9928P1Z8';
  const currency = settings.currency_symbol || settings.currencySymbol || '₹';
  const logoUrl = settings.logo_url || settings.logoUrl;
  const signatoryTitle = settings.authorized_signatory || settings.authorizedSignatory || 'Dealership Sales Consultant';
  const signatoryName = settings.signatory_name || settings.signatoryName || '';
  const estimatePrefix = settings.estimate_prefix || settings.estimatePrefix || 'EST';

  const estNumber = estimate.estimate_number || estimate.estimateNo || `${estimatePrefix}-${estimate.id}`;
  const exPrice = Number(estimate.ex_showroom_price ?? estimate.exShowroomPrice ?? 0);
  const rto = Number(estimate.rto_charges ?? estimate.rtoCharges ?? 0);
  const insurance = Number(estimate.insurance_amount ?? estimate.insuranceAmount ?? 0);
  const accessories = Number(estimate.accessories_cost ?? estimate.accessoriesCost ?? 0);
  const warranty = Number(estimate.warranty_cost ?? estimate.warrantyCost ?? 0);
  const discount = Number(estimate.discount_amount ?? estimate.discountAmount ?? 0);
  const total = Number(estimate.total_estimated_amount ?? estimate.total ?? (exPrice + rto + insurance + accessories + warranty - discount));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle On-Road Cost Estimate"
      subtitle={`Estimate Ref: ${estNumber}`}
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
          borderBottom: '2px solid #2563eb',
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
                  style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
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
                  <Calculator size={18} />
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
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0' }}>GSTIN: <strong>{gstin}</strong></p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              PRICE ESTIMATE
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              {estNumber}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Date: {estimate.created_at ? new Date(estimate.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
            </div>
            {estimate.valid_until && (
              <div style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>
                Valid Until: {estimate.valid_until}
              </div>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Info */}
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
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Estimate Prepared For:
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {estimate.customer_name || estimate.customerName}
            </div>
            {(estimate.customer_phone || estimate.customerPhone) && (
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Phone: {estimate.customer_phone || estimate.customerPhone}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Vehicle Model:
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
              {estimate.vehicle_name || estimate.vehicleName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              Status: <span style={{ fontWeight: 600, color: '#16a34a' }}>{estimate.status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Itemized Estimate Cost Table */}
        <div className="data-table-wrapper" style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Component</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px' }}>Ex-Showroom Base Price</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{currency}{exPrice.toLocaleString('en-IN')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px' }}>RTO Registration, Road Tax & Smart Card</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{currency}{rto.toLocaleString('en-IN')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px' }}>Comprehensive Insurance Package (1 Yr OD + 3 Yr TP)</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{currency}{insurance.toLocaleString('en-IN')}</td>
              </tr>
              {accessories > 0 && (
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}>Essential Accessories Pack & Fastag</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{currency}{accessories.toLocaleString('en-IN')}</td>
                </tr>
              )}
              {warranty > 0 && (
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}>Extended Warranty & RSA Protection</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{currency}{warranty.toLocaleString('en-IN')}</td>
                </tr>
              )}
              {discount > 0 && (
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>
                  <td style={{ padding: '10px 12px' }}>Special Showroom Promotional Discount</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>-{currency}{discount.toLocaleString('en-IN')}</td>
                </tr>
              )}
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
                <td style={{ padding: '12px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Estimated Total On-Road Price
                </td>
                <td style={{ padding: '12px', fontSize: '1.2rem', fontWeight: 800, textAlign: 'right', color: '#16a34a' }}>
                  {currency}{total.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes / Disclaimer */}
        <div style={{
          fontSize: '0.75rem',
          color: '#64748b',
          background: '#f8fafc',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '20px',
          borderLeft: '3px solid #2563eb',
          lineHeight: 1.5
        }}>
          <strong>Note: </strong> This is an indicative cost estimate for budget planning only and does not constitute a formal binding purchase contract. On-road costs are calculated subject to current state RTO regulations and prevailing insurance underwriting rates.
          {estimate.notes && <div style={{ marginTop: '4px' }}><strong>Advisor Notes:</strong> {estimate.notes}</div>}
        </div>

        {/* Signatures */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ borderBottom: '1px solid #cbd5e1', height: '35px' }}></div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', marginTop: '6px' }}>{signatoryTitle}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{signatoryName ? `${signatoryName} • ` : ''}{showroom}</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #cbd5e1', height: '35px' }}></div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', marginTop: '6px' }}>Customer Acknowledgment</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Reviewed and discussed with sales team</div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '16px'
      }} className="no-print">
        {onConvertToQuotation && (
          <button 
            onClick={() => onConvertToQuotation(estimate)} 
            className="btn btn-primary"
            style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowRight size={16} />
            <span>Convert to Official Quotation</span>
          </button>
        )}
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
