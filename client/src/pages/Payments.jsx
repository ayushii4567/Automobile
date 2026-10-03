import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Printer, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  CreditCard, 
  Building, 
  ShieldCheck,
  AlertCircle,
  FileText
} from 'lucide-react';
import Modal from '../components/Modal';
import ReceiptModal from '../components/ReceiptModal';

export default function Payments({ 
  payments = [], 
  sales = [], 
  onAddPayment, 
  onUpdatePayment, 
  settings = {},
  initialPaymentData,
  onClearInitialPaymentData
}) {
  const [activeSubTab, setActiveSubTab] = useState('payments'); // 'payments' | 'pending-invoices'
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [printReceiptData, setPrintReceiptData] = useState(null);

  const [formData, setFormData] = useState({
    saleId: '',
    invoiceId: '',
    invoiceNo: '',
    customerId: '',
    customerName: '',
    amount: 500000,
    maxAllowedAmount: null,
    paymentMode: 'RTGS / NEFT',
    transactionRef: '',
    paymentType: 'Down Payment',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Cleared',
    notes: ''
  });

  // Handle triggered payment from Sales or Invoices
  useEffect(() => {
    if (initialPaymentData) {
      const { saleId, invoiceId, invoiceNo, customerId, customerName, balanceDue } = initialPaymentData;
      setFormData({
        saleId: saleId || '',
        invoiceId: invoiceId || '',
        invoiceNo: invoiceNo || '',
        customerId: customerId || '',
        customerName: customerName || '',
        amount: balanceDue ? Number(balanceDue) : 500000,
        maxAllowedAmount: balanceDue ? Number(balanceDue) : null,
        paymentMode: 'RTGS / NEFT',
        transactionRef: `UTR-${Date.now().toString().slice(-6)}`,
        paymentType: 'Full Settlement',
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'Cleared',
        notes: `Settlement for Invoice #${invoiceNo || 'INV'}`
      });
      setIsModalOpen(true);
      if (onClearInitialPaymentData) onClearInitialPaymentData();
    }
  }, [initialPaymentData, onClearInitialPaymentData]);

  // Compute pending invoices from sales list
  const pendingInvoices = sales
    .filter(s => {
      const balance = Number(s.balanceDue ?? s.balance_due ?? (Number(s.totalAmount || 0) - Number(s.paidAmount || 0)));
      return balance > 0.01;
    })
    .map(s => ({
      saleId: s.id,
      invoiceId: s.invoiceId || s.invoice_id,
      invoiceNo: s.invoiceNo || s.invoice_number,
      customerName: s.customerName || s.customer_name,
      customerPhone: s.customerPhone || s.customer_phone,
      vehicleName: s.vehicleName || s.vehicle_name,
      totalAmount: Number(s.totalAmount || s.total_amount || 0),
      paidAmount: Number(s.paidAmount || s.paid_amount || 0),
      balanceDue: Number(s.balanceDue ?? s.balance_due ?? (Number(s.totalAmount || 0) - Number(s.paidAmount || 0))),
      status: s.invoiceStatus || 'Issued'
    }));

  const handleSaleSelect = (saleId) => {
    const s = sales.find(item => item.id === saleId);
    if (s) {
      const total = Number(s.totalAmount || s.total_amount || 0);
      const paid = Number(s.paidAmount || s.paid_amount || 0);
      const due = Number(s.balanceDue ?? s.balance_due ?? (total - paid));
      setFormData(prev => ({
        ...prev,
        saleId: s.id,
        invoiceId: s.invoiceId || s.invoice_id || '',
        invoiceNo: s.invoiceNo || s.invoice_number || '',
        customerId: s.customerId || s.customer_id || '',
        customerName: s.customerName || s.customer_name || '',
        amount: due > 0 ? due : total,
        maxAllowedAmount: due > 0 ? due : total
      }));
    }
  };

  const handlePaymentTypeChange = (type) => {
    let newAmount = formData.amount;
    if (type === 'Full Settlement' && formData.maxAllowedAmount) {
      newAmount = formData.maxAllowedAmount;
    } else if (type === 'Booking Advance' && formData.maxAllowedAmount) {
      newAmount = Math.min(formData.maxAllowedAmount, 500000);
    }
    setFormData(prev => ({
      ...prev,
      paymentType: type,
      amount: newAmount
    }));
  };

  const handleOpenNew = () => {
    setSelectedPayment(null);
    setFormData({
      saleId: '',
      invoiceId: '',
      invoiceNo: '',
      customerId: '',
      customerName: '',
      amount: 500000,
      maxAllowedAmount: null,
      paymentMode: 'RTGS / NEFT',
      transactionRef: `UTR-${Date.now().toString().slice(-6)}`,
      paymentType: 'Down Payment',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Cleared',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleCollectPending = (inv) => {
    setSelectedPayment(null);
    setFormData({
      saleId: inv.saleId,
      invoiceId: inv.invoiceId,
      invoiceNo: inv.invoiceNo,
      customerId: '',
      customerName: inv.customerName,
      amount: inv.balanceDue,
      maxAllowedAmount: inv.balanceDue,
      paymentMode: 'RTGS / NEFT',
      transactionRef: `UTR-${Date.now().toString().slice(-6)}`,
      paymentType: 'Full Settlement',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Cleared',
      notes: `Balance settlement for Invoice #${inv.invoiceNo}`
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.maxAllowedAmount && formData.amount > formData.maxAllowedAmount) {
      alert(`Payment amount (₹${formData.amount.toLocaleString('en-IN')}) cannot exceed the outstanding balance due (₹${formData.maxAllowedAmount.toLocaleString('en-IN')}).`);
      return;
    }

    try {
      if (selectedPayment) {
        await onUpdatePayment(selectedPayment.id, formData);
      } else {
        const created = await onAddPayment(formData);
        if (created) {
          // Open the receipt view modal immediately
          setPrintReceiptData(created);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to process payment.');
    }
  };

  const filtered = payments.filter(item => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (item.customerName || item.customer_name || '').toLowerCase().includes(s) ||
      (item.receiptNo || item.receipt_number || '').toLowerCase().includes(s) ||
      (item.invoiceNo || item.invoice_number || '').toLowerCase().includes(s) ||
      (item.transactionRef || item.transaction_id || '').toLowerCase().includes(s) ||
      (item.paymentMode || item.payment_mode || '').toLowerCase().includes(s)
    );
    const mode = item.paymentMode || item.payment_mode;
    const matchesMode = filterMode === 'ALL' || mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const totalCollected = payments
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPendingBalance = pendingInvoices
    .reduce((sum, i) => sum + i.balanceDue, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Receipts Issued</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Receipt size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {payments.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Payment vouchers logged in database
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Cleared Collections</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Realized dealership cash & loan inflow
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Pending Receivables</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: totalPendingBalance > 0 ? '#f97316' : '#22c55e', marginTop: '8px' }}>
            ₹{totalPendingBalance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            {pendingInvoices.length} Invoices with outstanding balance
          </div>
        </div>
      </div>

      {/* Tabs & Control Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveSubTab('payments')}
              className={`filter-btn ${activeSubTab === 'payments' ? 'active' : ''}`}
              style={{ fontSize: '0.88rem', padding: '8px 18px' }}
            >
              Payment History & Receipts ({payments.length})
            </button>
            <button
              onClick={() => setActiveSubTab('pending-invoices')}
              className={`filter-btn ${activeSubTab === 'pending-invoices' ? 'active' : ''}`}
              style={{ fontSize: '0.88rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Pending Receivables</span>
              {pendingInvoices.length > 0 && (
                <span style={{
                  background: '#f97316',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {pendingInvoices.length}
                </span>
              )}
            </button>
          </div>

          <button onClick={handleOpenNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Record Customer Payment</span>
          </button>
        </div>

        {activeSubTab === 'payments' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Search customer, receipt#, invoice, or UTR..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ALL', 'RTGS / NEFT', 'Car Loan / Bank', 'UPI / Card', 'Cheque', 'Cash'].map(m => (
                <button
                  key={m}
                  onClick={() => setFilterMode(m)}
                  className={`filter-btn ${filterMode === m ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SubTab 1: Payments & Receipts History Table */}
      {activeSubTab === 'payments' && (
        <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer</th>
                <th>Invoice Linked</th>
                <th>Payment Type</th>
                <th>Amount Paid</th>
                <th>Instrument & Ref</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No payment vouchers found.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div 
                        onClick={() => setPrintReceiptData(item)}
                        style={{ fontWeight: 800, color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Receipt size={14} />
                        <span>{item.receiptNo || item.receipt_number}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.customerName || item.customer_name}</div>
                      {item.customerPhone && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.customerPhone}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.invoiceNo || item.invoice_number || 'Direct'}</div>
                    </td>
                    <td>
                      <span className="status-badge status-delivered" style={{ fontSize: '0.72rem' }}>
                        {item.paymentType || item.payment_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '0.98rem' }}>
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: '#38bdf8', fontWeight: 600 }}>{item.paymentMode || item.payment_mode}</div>
                      {(item.transactionRef || item.transaction_id) && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          Ref: {item.transactionRef || item.transaction_id}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{item.paymentDate || item.payment_date}</div>
                    </td>
                    <td>
                      <span className="status-badge status-delivered" style={{ fontSize: '0.72rem' }}>
                        {item.status || 'Cleared'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={() => setPrintReceiptData(item)}
                          className="btn-icon"
                          title="Print Formal Payment Receipt"
                          style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SubTab 2: Pending Receivables Table */}
      {activeSubTab === 'pending-invoices' && (
        <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Total On-Road</th>
                <th>Already Paid</th>
                <th>Balance Outstanding</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#22c55e' }}>
                    <CheckCircle2 size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
                    All showroom invoices have been paid in full! No pending receivables.
                  </td>
                </tr>
              ) : (
                pendingInvoices.map(inv => (
                  <tr key={inv.invoiceId || inv.saleId}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#38bdf8' }}>{inv.invoiceNo}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{inv.customerName}</div>
                      {inv.customerPhone && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{inv.customerPhone}</div>}
                    </td>
                    <td>
                      <div style={{ color: '#f8fafc' }}>{inv.vehicleName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                    </td>
                    <td>
                      <div style={{ color: '#22c55e', fontWeight: 600 }}>₹{inv.paidAmount.toLocaleString('en-IN')}</div>
                    </td>
                    <td>
                      <div style={{ color: '#f97316', fontWeight: 800, fontSize: '0.98rem' }}>
                        ₹{inv.balanceDue.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <span className="status-badge status-pending" style={{ fontSize: '0.72rem' }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleCollectPending(inv)}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#16a34a', borderColor: '#16a34a' }}
                      >
                        <CreditCard size={13} />
                        <span>Collect Payment</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment"
        subtitle="Log booking advance, loan disbursals, or full settlement with auto-receipt generation"
        maxWidth="680px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sales.length > 0 && (
            <div className="input-group">
              <label>Link to Sales Order / Invoice *</label>
              <select 
                value={formData.saleId}
                onChange={(e) => handleSaleSelect(e.target.value)}
                className="input-field"
                required
              >
                <option value="">-- Choose Sales Order / Invoice --</option>
                {sales.map(s => {
                  const total = Number(s.totalAmount || s.total_amount || 0);
                  const paid = Number(s.paidAmount || s.paid_amount || 0);
                  const due = Number(s.balanceDue ?? s.balance_due ?? (total - paid));
                  return (
                    <option key={s.id} value={s.id}>
                      {s.invoiceNo || s.invoice_number || 'INV'} — {s.customerName || s.customer_name} ({s.vehicleName || s.vehicle_name}) | Total: ₹{total.toLocaleString('en-IN')} | Due: ₹{due.toLocaleString('en-IN')}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Customer Name *</label>
              <input 
                type="text" 
                required 
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>Amount to Collect (₹ INR) *</label>
              <input 
                type="number" 
                required 
                max={formData.maxAllowedAmount || undefined}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="input-field" 
              />
              {formData.maxAllowedAmount !== null && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                  Max allowed balance due: <strong style={{ color: '#22c55e' }}>₹{formData.maxAllowedAmount.toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Payment Category *</label>
              <select 
                value={formData.paymentType}
                onChange={(e) => handlePaymentTypeChange(e.target.value)}
                className="input-field"
              >
                <option value="Booking Advance">Booking Advance (Advance)</option>
                <option value="Down Payment">Down Payment (Partial)</option>
                <option value="Full Settlement">Full Settlement (Balance Due)</option>
                <option value="Service Bill">Service Bill</option>
                <option value="Exchange Adjustment">Exchange Adjustment</option>
              </select>
            </div>

            <div className="input-group">
              <label>Payment Mode *</label>
              <select 
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="input-field"
              >
                <option value="RTGS / NEFT">RTGS / NEFT Online Transfer</option>
                <option value="Car Loan / Bank">Bank Auto Loan Disbursal</option>
                <option value="UPI / Card">UPI / Debit / Credit Card</option>
                <option value="Cheque">Bank Demand Draft / Cheque</option>
                <option value="Cash">Cash at Dealership Cashier</option>
              </select>
            </div>

            <div className="input-group">
              <label>Payment Date</label>
              <input 
                type="date" 
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Transaction / UTR Reference Number *</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. UTR-HDFC-991204 / CHEQUE-10294"
              value={formData.transactionRef}
              onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
              className="input-field" 
            />
          </div>

          <div className="input-group">
            <label>Payment Remarks / Narration</label>
            <textarea 
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. Cleared via corporate RTGS for vehicle balance settlement."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Receipt size={16} />
              <span>Register Payment & Issue Receipt</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Printable Receipt Modal */}
      {printReceiptData && (
        <ReceiptModal
          isOpen={!!printReceiptData}
          onClose={() => setPrintReceiptData(null)}
          receipt={printReceiptData}
          settings={settings}
        />
      )}
    </div>
  );
}
