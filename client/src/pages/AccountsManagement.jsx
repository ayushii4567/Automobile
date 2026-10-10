import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Receipt, 
  FileText, 
  CreditCard, 
  Building2, 
  ShieldAlert, 
  Users, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Printer, 
  Search, 
  Calendar, 
  Filter, 
  TrendingDown, 
  TrendingUp, 
  BookOpen,
  Landmark,
  Trash2,
  Edit3,
  Download,
  RotateCcw,
  Percent
} from 'lucide-react';
import { api } from '../api';

export default function AccountsManagement({ 
  currentUser, 
  subTab,
  onSubTabChange,
  settings = {} 
}) {
  const [activeSubTab, setActiveSubTab] = useState(subTab || 'payment_voucher');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (subTab) {
      // Map legacy or shorthand subtab IDs
      if (subTab === 'vouchers') setActiveSubTab('payment_voucher');
      else if (subTab === 'payouts') setActiveSubTab('finance_payout');
      else setActiveSubTab(subTab);
    }
  }, [subTab]);

  const handleTabClick = (tabId) => {
    setActiveSubTab(tabId);
    if (onSubTabChange) {
      onSubTabChange(tabId);
    }
  };

  // Live Database States
  const [vouchers, setVouchers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customerLedger, setCustomerLedger] = useState({ party: null, partyList: [], transactions: [], summary: {} });
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [supplierLedger, setSupplierLedger] = useState({ party: null, partyList: [], transactions: [], summary: {} });
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [employeeLedger, setEmployeeLedger] = useState([]);
  const [cashBook, setCashBook] = useState({ summary: {}, cashReceipts: [], cashPayments: [] });
  const [bankBook, setBankBook] = useState({ summary: {}, records: [] });
  const [financeSummary, setFinanceSummary] = useState({ records: [], bankWise: [] });
  const [rtoSummary, setRtoSummary] = useState({ summary: {}, records: [] });
  const [insuranceSummary, setInsuranceSummary] = useState({ records: [], providerWise: [] });
  const [customerDue, setCustomerDue] = useState({ summary: {}, records: [] });
  const [marginMoneyReceipts, setMarginMoneyReceipts] = useState([]);
  const [financePayouts, setFinancePayouts] = useState([]);
  const [insurancePayouts, setInsurancePayouts] = useState([]);
  
  // Date Filtering
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', isError: false });

  // Modals & Selections
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherTypeModal, setVoucherTypeModal] = useState('PAYMENT'); // 'PAYMENT' or 'RECEIPT'
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [selectedPrintVoucher, setSelectedPrintVoucher] = useState(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFinancePayoutModalOpen, setIsFinancePayoutModalOpen] = useState(false);
  const [isInsurancePayoutModalOpen, setIsInsurancePayoutModalOpen] = useState(false);

  // Form States
  const [voucherFormData, setVoucherFormData] = useState({
    voucher_type: 'PAYMENT',
    category: 'Supplier Payout',
    party_type: 'vendor',
    party_name: '',
    amount: 15000,
    payment_mode: 'Bank Transfer',
    bank_name: 'HDFC Bank',
    cheque_or_ref_no: '',
    voucher_date: new Date().toISOString().split('T')[0],
    narration: ''
  });

  const [expenseFormData, setExpenseFormData] = useState({
    category: 'Electricity & Utilities',
    amount: 12500,
    payment_mode: 'Bank Transfer',
    vendor_or_payee: 'Tata Power / MSEDCL',
    receipt_bill_no: 'BILL-' + Date.now().toString().slice(-6),
    expense_date: new Date().toISOString().split('T')[0],
    notes: 'Showroom commercial utility bill'
  });

  const [financePayoutFormData, setFinancePayoutFormData] = useState({
    bank_name: 'HDFC Bank Auto Finance',
    customer_name: '',
    loan_amount: 1500000,
    commission_rate_pct: 2.0,
    payout_amount: 30000,
    payout_date: new Date().toISOString().split('T')[0],
    notes: 'Direct loan subvention payout'
  });

  const [insurancePayoutFormData, setInsurancePayoutFormData] = useState({
    insurer_name: 'HDFC ERGO General Insurance',
    policy_number: 'POL-' + Date.now().toString().slice(-6),
    customer_name: '',
    premium_amount: 45000,
    commission_rate_pct: 15.0,
    payout_amount: 6750,
    payout_date: new Date().toISOString().split('T')[0],
    notes: 'Comprehensive insurance brokerage payout'
  });

  const showToast = (msg, isErr = false) => {
    setFeedback({ message: msg, isError: isErr });
    setTimeout(() => setFeedback({ message: '', isError: false }), 4500);
  };

  const loadAccountsData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (dateFilter.startDate) queryParams.set('startDate', dateFilter.startDate);
      if (dateFilter.endDate) queryParams.set('endDate', dateFilter.endDate);
      const pStr = queryParams.toString();

      const [vchs, exps, cLedger, sLedger, empLedger, cBook, bBook, fSummary, rSummary, insSummary, cDue, mmRecs, fPayouts, iPayouts] = await Promise.all([
        api.getVouchers().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getPartyLedger({ partyType: 'customer', partyId: selectedCustomerId }).catch(() => ({ party: null, partyList: [], transactions: [], summary: {} })),
        api.getPartyLedger({ partyType: 'vendor', partyId: selectedSupplierId }).catch(() => ({ party: null, partyList: [], transactions: [], summary: {} })),
        api.getEmployeeLedger().catch(() => []),
        api.getCashBook(pStr).catch(() => ({ summary: {}, cashReceipts: [], cashPayments: [] })),
        api.getBankBook(pStr).catch(() => ({ summary: {}, records: [] })),
        api.getFinanceSummary().catch(() => ({ records: [], bankWise: [] })),
        api.getRtoSummary().catch(() => ({ summary: {}, records: [] })),
        api.getInsuranceSummary().catch(() => ({ records: [], providerWise: [] })),
        api.getCustomerDue().catch(() => ({ summary: {}, records: [] })),
        api.getMarginMoneyReceipts().catch(() => []),
        api.getFinancePayouts().catch(() => []),
        api.getInsurancePayouts().catch(() => [])
      ]);

      setVouchers(vchs || []);
      setExpenses(exps || []);
      setCustomerLedger(cLedger || { party: null, partyList: [], transactions: [], summary: {} });
      setSupplierLedger(sLedger || { party: null, partyList: [], transactions: [], summary: {} });
      setEmployeeLedger(empLedger || []);
      setCashBook(cBook || { summary: {}, cashReceipts: [], cashPayments: [] });
      setBankBook(bBook || { summary: {}, records: [] });
      setFinanceSummary(fSummary || { records: [], bankWise: [] });
      setRtoSummary(rSummary || { summary: {}, records: [] });
      setInsuranceSummary(insSummary || { records: [], providerWise: [] });
      setCustomerDue(cDue || { summary: {}, records: [] });
      setMarginMoneyReceipts(mmRecs || []);
      setFinancePayouts(fPayouts || []);
      setInsurancePayouts(iPayouts || []);
    } catch (err) {
      console.error('Failed to load accounts datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountsData();
  }, [selectedCustomerId, selectedSupplierId]);

  // Handle Date Filter Apply & Reset
  const handleApplyDateFilter = (e) => {
    e?.preventDefault();
    loadAccountsData();
  };

  const handleResetDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setTimeout(() => loadAccountsData(), 50);
  };

  // Create or Update Voucher
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    try {
      if (editingVoucher) {
        await api.updateVoucher(editingVoucher.id, voucherFormData);
        showToast(`Voucher ${editingVoucher.voucher_number} updated.`);
      } else {
        await api.createVoucher({
          ...voucherFormData,
          voucher_type: voucherTypeModal
        });
        showToast(`${voucherTypeModal} Voucher recorded and reconciled in books.`);
      }
      setIsVoucherModalOpen(false);
      setEditingVoucher(null);
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to save voucher.', true);
    }
  };

  // Delete / Void Voucher
  const handleDeleteVoucher = async (id, vNum) => {
    if (!window.confirm(`Void voucher ${vNum}? This will remove it from Cash/Bank books.`)) return;
    try {
      await api.deleteVoucher(id);
      showToast(`Voucher ${vNum} voided.`);
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to void voucher.', true);
    }
  };

  // Create Expense Voucher
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.createExpense(expenseFormData);
      showToast('Showroom expense voucher recorded successfully.');
      setIsExpenseModalOpen(false);
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to record expense.', true);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense voucher?')) return;
    try {
      await api.deleteExpense(id);
      showToast('Expense voucher deleted.');
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense.', true);
    }
  };

  // Create Finance Payout
  const handleCreateFinancePayout = async (e) => {
    e.preventDefault();
    try {
      await api.createFinancePayout(financePayoutFormData);
      showToast('Finance commission payout recorded.');
      setIsFinancePayoutModalOpen(false);
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to log finance payout.', true);
    }
  };

  // Delete Finance Payout
  const handleDeleteFinancePayout = async (id) => {
    if (!window.confirm('Delete this finance payout entry?')) return;
    try {
      await api.deleteFinancePayout(id);
      showToast('Finance payout entry deleted.');
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to delete finance payout.', true);
    }
  };

  // Create Insurance Payout
  const handleCreateInsurancePayout = async (e) => {
    e.preventDefault();
    try {
      await api.createInsurancePayout(insurancePayoutFormData);
      showToast('Insurance broker payout recorded.');
      setIsInsurancePayoutModalOpen(false);
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to log insurance payout.', true);
    }
  };

  // Delete Insurance Payout
  const handleDeleteInsurancePayout = async (id) => {
    if (!window.confirm('Delete this insurance payout entry?')) return;
    try {
      await api.deleteInsurancePayout(id);
      showToast('Insurance payout entry deleted.');
      loadAccountsData();
    } catch (err) {
      showToast(err.message || 'Failed to delete insurance payout.', true);
    }
  };

  // CSV Export utility
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 15 Exact Approved Submodules
  const subTabs = [
    { id: 'payment_voucher', label: '1. Payment Voucher', count: vouchers.filter(v => v.voucher_type === 'PAYMENT').length, icon: Receipt },
    { id: 'receipt_voucher', label: '2. Receipt Voucher', count: vouchers.filter(v => v.voucher_type === 'RECEIPT').length, icon: Receipt },
    { id: 'expenses', label: '3. Expenses', count: expenses.length, icon: TrendingDown },
    { id: 'customer_ledger', label: '4. Customer Ledger', icon: Users },
    { id: 'supplier_ledger', label: '5. Supplier Ledger', icon: Building2 },
    { id: 'employee_ledger', label: '6. Employee Ledger', count: employeeLedger.length, icon: Users },
    { id: 'cash_book', label: '7. Cash Book', icon: Landmark },
    { id: 'bank_book', label: '8. Bank Book', count: bankBook.records?.length || 0, icon: Landmark },
    { id: 'finance_summary', label: '9. Finance Summary', count: financeSummary.records?.length || 0, icon: CreditCard },
    { id: 'rto_summary', label: '10. RTO Summary', count: rtoSummary.records?.length || 0, icon: FileText },
    { id: 'insurance_summary', label: '11. Insurance Summary', count: insuranceSummary.records?.length || 0, icon: ShieldAlert },
    { id: 'customer_due', label: '12. Customer Due', count: customerDue.records?.length || 0, icon: AlertCircle },
    { id: 'margin_money', label: '13. Margin Money Receipt', count: marginMoneyReceipts.length, icon: Receipt },
    { id: 'finance_payout', label: '14. Finance Payout', count: financePayouts.length, icon: TrendingUp },
    { id: 'insurance_payout', label: '15. Insurance Payout', count: insurancePayouts.length, icon: TrendingUp }
  ];

  return (
    <div className="module-container" style={{ padding: '24px' }}>
      {/* Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}>
            <Wallet size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Accounts Management
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: '2px 0 0' }}>
              Financial Vouchers, Multi-Party Ledgers, Reconciled Cash & Bank Books, Dues and Institutional Payouts
            </p>
          </div>
        </div>

        {/* Action Buttons based on active tab */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeSubTab === 'payment_voucher' && (
            <button 
              onClick={() => {
                setEditingVoucher(null);
                setVoucherTypeModal('PAYMENT');
                setVoucherFormData({
                  voucher_type: 'PAYMENT',
                  category: 'Supplier Payout',
                  party_type: 'vendor',
                  party_name: '',
                  amount: 15000,
                  payment_mode: 'Bank Transfer',
                  bank_name: 'HDFC Bank',
                  cheque_or_ref_no: '',
                  voucher_date: new Date().toISOString().split('T')[0],
                  narration: ''
                });
                setIsVoucherModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> New Payment Voucher
            </button>
          )}

          {activeSubTab === 'receipt_voucher' && (
            <button 
              onClick={() => {
                setEditingVoucher(null);
                setVoucherTypeModal('RECEIPT');
                setVoucherFormData({
                  voucher_type: 'RECEIPT',
                  category: 'Customer Advance',
                  party_type: 'customer',
                  party_name: '',
                  amount: 25000,
                  payment_mode: 'Cash',
                  bank_name: 'Cash Box',
                  cheque_or_ref_no: '',
                  voucher_date: new Date().toISOString().split('T')[0],
                  narration: 'Booking advance cash receipt'
                });
                setIsVoucherModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> New Receipt Voucher
            </button>
          )}

          {activeSubTab === 'expenses' && (
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Record Expense
            </button>
          )}

          {activeSubTab === 'margin_money' && (
            <button 
              onClick={() => {
                setEditingVoucher(null);
                setVoucherTypeModal('RECEIPT');
                setVoucherFormData({
                  voucher_type: 'RECEIPT',
                  category: 'Margin Money',
                  party_type: 'customer',
                  party_name: '',
                  amount: 150000,
                  payment_mode: 'Bank Transfer',
                  bank_name: 'HDFC Bank',
                  cheque_or_ref_no: '',
                  voucher_date: new Date().toISOString().split('T')[0],
                  narration: 'Down payment margin money for bank loan'
                });
                setIsVoucherModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Issue Margin Money Receipt
            </button>
          )}

          {activeSubTab === 'finance_payout' && (
            <button 
              onClick={() => setIsFinancePayoutModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Log Finance Payout
            </button>
          )}

          {activeSubTab === 'insurance_payout' && (
            <button 
              onClick={() => setIsInsurancePayoutModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Log Insurance Payout
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {feedback.message && (
        <div style={{
          padding: '12px 16px',
          background: feedback.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${feedback.isError ? '#ef4444' : '#10b981'}`,
          borderRadius: '8px',
          color: feedback.isError ? '#f87171' : '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '0.88rem'
        }}>
          {feedback.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {subTabs.map(tab => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                background: isActive ? '#10b981' : '#ffffff',
                border: isActive ? '1px solid #10b981' : '1px solid #cbd5e1',
                color: isActive ? '#ffffff' : '#334155',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(0, 0, 0, 0.25)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#475569',
                  border: isActive ? 'none' : '1px solid #e2e8f0'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Filter Header */}
      {['payment_voucher', 'receipt_voucher', 'expenses', 'employee_ledger', 'customer_due', 'finance_payout', 'insurance_payout'].includes(activeSubTab) && (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '380px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder={`Search in ${activeSubTab.replace('_', ' ')}...`}
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', height: '36px' }}
            />
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 1 & 2: PAYMENT VOUCHER & RECEIPT VOUCHER
          ===================================================================== */}
      {(activeSubTab === 'payment_voucher' || activeSubTab === 'receipt_voucher') && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {activeSubTab === 'payment_voucher' ? 'Outward Payment Vouchers' : 'Inward Receipt Vouchers'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Double-entry voucher transactions reconciling with cash and bank operating accounts
              </p>
            </div>
            <button 
              onClick={() => exportToCSV(
                vouchers.filter(v => activeSubTab === 'payment_voucher' ? v.voucher_type === 'PAYMENT' : v.voucher_type === 'RECEIPT'),
                activeSubTab
              )}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Category</th>
                  <th>Beneficiary / Party</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Bank / Ref #</th>
                  <th>Date</th>
                  <th>Narration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.filter(v => {
                  const isMatchingType = activeSubTab === 'payment_voucher' ? v.voucher_type === 'PAYMENT' : v.voucher_type === 'RECEIPT';
                  const matchesSearch = !searchQuery || 
                    (v.voucher_number && v.voucher_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (v.party_name && v.party_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));
                  return isMatchingType && matchesSearch;
                }).map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700, color: activeSubTab === 'payment_voucher' ? '#f59e0b' : '#10b981' }}>
                      {v.voucher_number}
                    </td>
                    <td><span className="badge badge-info">{v.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{v.party_name}</td>
                    <td style={{ fontWeight: 700, color: activeSubTab === 'payment_voucher' ? '#ef4444' : '#10b981' }}>
                      ₹{Number(v.amount).toLocaleString('en-IN')}
                    </td>
                    <td>{v.payment_mode}</td>
                    <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      {v.bank_name ? `${v.bank_name} • ` : ''}{v.cheque_or_ref_no || '-'}
                    </td>
                    <td>{v.voucher_date}</td>
                    <td style={{ fontSize: '0.82rem', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {v.narration || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setSelectedPrintVoucher(v)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Print Voucher"
                        >
                          <Printer size={13} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingVoucher(v);
                            setVoucherTypeModal(v.voucher_type);
                            setVoucherFormData({
                              voucher_type: v.voucher_type,
                              category: v.category,
                              party_type: v.party_type,
                              party_name: v.party_name,
                              amount: v.amount,
                              payment_mode: v.payment_mode,
                              bank_name: v.bank_name || '',
                              cheque_or_ref_no: v.cheque_or_ref_no || '',
                              voucher_date: v.voucher_date,
                              narration: v.narration || ''
                            });
                            setIsVoucherModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Edit Voucher"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteVoucher(v.id, v.voucher_number)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Void Voucher"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 3: EXPENSES
          ===================================================================== */}
      {activeSubTab === 'expenses' && (
        <div>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Expense Vouchers</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {expenses.length} Records
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Disbursed Expense</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                ₹{expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Showroom & Dealership Overhead Expenses
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Electricity, showroom rent, marketing, tools, staff welfare and maintenance
                </p>
              </div>
              <button 
                onClick={() => exportToCSV(expenses, 'expenses_ledger')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Expense Code</th>
                    <th>Category</th>
                    <th>Vendor / Payee</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Bill / Receipt #</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.filter(e => (
                    !searchQuery ||
                    (e.expense_code && e.expense_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (e.vendor_or_payee && e.vendor_or_payee.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  )).map(e => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{e.expense_code}</td>
                      <td><span className="badge badge-warning">{e.category}</span></td>
                      <td style={{ fontWeight: 600 }}>{e.vendor_or_payee}</td>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                      <td>{e.payment_mode}</td>
                      <td style={{ fontFamily: 'monospace' }}>{e.receipt_bill_no || '-'}</td>
                      <td>{e.expense_date}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteExpense(e.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Delete Expense"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 4: CUSTOMER LEDGER
          ===================================================================== */}
      {activeSubTab === 'customer_ledger' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Customer Account Ledger (Debit & Credit Statement)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Invoice debits, payment credits, margin money deposits and running balance
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                className="form-select" 
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                <option value="">-- All Customers --</option>
                {customerLedger.partyList?.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || c.city || 'Client'})</option>
                ))}
              </select>
              <button 
                onClick={() => exportToCSV(customerLedger.transactions, 'customer_ledger')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Statement Balance Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Billed (Debit)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>
                ₹{Number(customerLedger.summary?.totalDebit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Received (Credit)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                ₹{Number(customerLedger.summary?.totalCredit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Net Balance Outstanding</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                ₹{Number(customerLedger.summary?.closingBalance || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference #</th>
                  <th>Transaction Description</th>
                  <th>Debit (Billed)</th>
                  <th>Credit (Paid)</th>
                  <th>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {customerLedger.transactions?.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.date}</td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{t.reference}</td>
                    <td>{t.description}</td>
                    <td style={{ color: t.debit > 0 ? '#ef4444' : '#94a3b8', fontWeight: t.debit > 0 ? 700 : 400 }}>
                      {t.debit > 0 ? `₹${Number(t.debit).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ color: t.credit > 0 ? '#10b981' : '#94a3b8', fontWeight: t.credit > 0 ? 700 : 400 }}>
                      {t.credit > 0 ? `₹${Number(t.credit).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ fontWeight: 700, color: t.balance > 0 ? '#f59e0b' : '#10b981' }}>
                      ₹{Number(t.balance).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 5: SUPPLIER LEDGER
          ===================================================================== */}
      {activeSubTab === 'supplier_ledger' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Supplier / Vendor Account Ledger
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Procurement consignments, payments disbursed, and net balance with OEM factories
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                className="form-select" 
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                <option value="">-- All OEM Suppliers --</option>
                {supplierLedger.partyList?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button 
                onClick={() => exportToCSV(supplierLedger.transactions, 'supplier_ledger')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Statement Balance Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Disbursed (Debit)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                ₹{Number(supplierLedger.summary?.totalDebit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Procured (Credit)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>
                ₹{Number(supplierLedger.summary?.totalCredit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Net Dealer Balance</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                ₹{Number(supplierLedger.summary?.closingBalance || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference #</th>
                  <th>Particulars</th>
                  <th>Debit (Paid to Supplier)</th>
                  <th>Credit (Supplied Cost)</th>
                  <th>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {supplierLedger.transactions?.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.date}</td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{t.reference}</td>
                    <td>{t.description}</td>
                    <td style={{ color: t.debit > 0 ? '#10b981' : '#94a3b8', fontWeight: t.debit > 0 ? 700 : 400 }}>
                      {t.debit > 0 ? `₹${Number(t.debit).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ color: t.credit > 0 ? '#ef4444' : '#94a3b8', fontWeight: t.credit > 0 ? 700 : 400 }}>
                      {t.credit > 0 ? `₹${Number(t.credit).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      ₹{Number(t.balance).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 6: EMPLOYEE LEDGER
          ===================================================================== */}
      {activeSubTab === 'employee_ledger' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Employee Payroll & Compensation Ledger
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Monthly base salaries, sales commission incentives, allowances and disbursement dates
              </p>
            </div>
            <button 
              onClick={() => exportToCSV(employeeLedger, 'employee_payroll_ledger')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Employee Name</th>
                  <th>Role & Dept</th>
                  <th>Base Salary</th>
                  <th>Sales Incentive</th>
                  <th>Net Disbursed</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {employeeLedger.filter(emp => (
                  !searchQuery ||
                  (emp.name && emp.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (emp.employee_code && emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (emp.role_title && emp.role_title.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map((emp, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{emp.employee_code}</td>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td>{emp.role_title} ({emp.department})</td>
                    <td>₹{Number(emp.base_salary || 35000).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>₹{Number(emp.sales_incentive || 12000).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>
                      ₹{Number((emp.base_salary || 35000) + (emp.sales_incentive || 12000)).toLocaleString('en-IN')}
                    </td>
                    <td><span className="badge badge-info">{emp.payroll_period || 'Sep 2026'}</span></td>
                    <td><span className="badge badge-success">{emp.payment_status || 'Paid'}</span></td>
                    <td>{emp.payment_date || '2026-09-30'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 7: CASH BOOK
          ===================================================================== */}
      {activeSubTab === 'cash_book' && (
        <div>
          {/* Date Filter Bar */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <form onSubmit={handleApplyDateFilter} style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#10b981" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Cash Book Date Filter:</span>
              </div>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '160px' }} 
                value={dateFilter.startDate} 
                onChange={e => setDateFilter({...dateFilter, startDate: e.target.value})} 
              />
              <span style={{ color: '#94a3b8' }}>to</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '160px' }} 
                value={dateFilter.endDate} 
                onChange={e => setDateFilter({...dateFilter, endDate: e.target.value})} 
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} /> Filter
              </button>
              {(dateFilter.startDate || dateFilter.endDate) && (
                <button type="button" onClick={handleResetDateFilter} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </form>
          </div>

          {/* KPI Balance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Cash Inflows (Receipts)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ₹{Number(cashBook.summary?.totalCashIn || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Cash Outflows (Disbursements)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                ₹{Number(cashBook.summary?.totalCashOut || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Closing Cash in Hand</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                ₹{Number(cashBook.summary?.closingBalance || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Cash Inflows */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', margin: '0 0 14px' }}>
                Debit: Cash Receipts (Inflows)
              </h3>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Date</th><th>Ref #</th><th>Particulars</th><th>Category</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {cashBook.cashReceipts?.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date}</td>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{r.ref_no}</td>
                      <td style={{ fontWeight: 600 }}>{r.particulars}</td>
                      <td><span className="badge badge-info">{r.category}</span></td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {(!cashBook.cashReceipts || cashBook.cashReceipts.length === 0) && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No cash receipts in selected range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Cash Outflows */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ef4444', margin: '0 0 14px' }}>
                Credit: Cash Payments (Outflows)
              </h3>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Date</th><th>Ref #</th><th>Payee</th><th>Category</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {cashBook.cashPayments?.map((p, i) => (
                    <tr key={i}>
                      <td>{p.date}</td>
                      <td style={{ fontWeight: 700, color: '#f59e0b' }}>{p.ref_no}</td>
                      <td style={{ fontWeight: 600 }}>{p.particulars}</td>
                      <td><span className="badge badge-warning">{p.category}</span></td>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {(!cashBook.cashPayments || cashBook.cashPayments.length === 0) && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No cash payments in selected range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 8: BANK BOOK
          ===================================================================== */}
      {activeSubTab === 'bank_book' && (
        <div>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Bank Inflows (Deposits)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ₹{Number(bankBook.summary?.totalDebit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Bank Withdrawals / RTGS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                ₹{Number(bankBook.summary?.totalCredit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Net Operating Bank Balance</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                ₹{Number(bankBook.summary?.bankBalance || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Bank Operating Accounts Ledger (HDFC, SBI, ICICI)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Electronic fund transfers, NEFT, RTGS, client card settlements and vendor cheques
                </p>
              </div>
              <button 
                onClick={() => exportToCSV(bankBook.records, 'bank_book_statement')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher / Ref #</th>
                    <th>Bank Operating Account</th>
                    <th>UTR / Cheque #</th>
                    <th>Particulars</th>
                    <th>Mode</th>
                    <th>Inflow Debit (₹)</th>
                    <th>Outflow Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {bankBook.records?.map((b, i) => (
                    <tr key={i}>
                      <td>{b.date}</td>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{b.ref_no}</td>
                      <td style={{ fontWeight: 600 }}>{b.bank_name || 'HDFC Operating'}</td>
                      <td style={{ fontFamily: 'monospace' }}>{b.utr_no || '-'}</td>
                      <td>{b.particulars}</td>
                      <td><span className="badge badge-info">{b.payment_mode}</span></td>
                      <td style={{ color: b.debit_inflow > 0 ? '#10b981' : '#94a3b8', fontWeight: b.debit_inflow > 0 ? 700 : 400 }}>
                        {b.debit_inflow > 0 ? `+₹${Number(b.debit_inflow).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ color: b.credit_outflow > 0 ? '#ef4444' : '#94a3b8', fontWeight: b.credit_outflow > 0 ? 700 : 400 }}>
                        {b.credit_outflow > 0 ? `-₹${Number(b.credit_outflow).toLocaleString('en-IN')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 9: FINANCE SUMMARY
          ===================================================================== */}
      {activeSubTab === 'finance_summary' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Vehicle Loan Files & Bank Finance Summary
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Customer auto-loan applications, disbursed funds, interest tenures and approval pipeline
              </p>
            </div>
            <button 
              onClick={() => exportToCSV(financeSummary.records, 'finance_loan_summary')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>File / App Ref</th>
                  <th>Customer Name</th>
                  <th>Vehicle Model</th>
                  <th>Financier Bank</th>
                  <th>Loan Amount</th>
                  <th>Tenure</th>
                  <th>EMI</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {financeSummary.records?.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{f.id}</td>
                    <td style={{ fontWeight: 600 }}>{f.customer_name}</td>
                    <td>{f.vehicle_name}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{f.bank_name}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(f.loan_amount).toLocaleString('en-IN')}</td>
                    <td>{f.tenure_months || 48} Months</td>
                    <td>₹{Number(f.emi_amount || Math.round(f.loan_amount / 40)).toLocaleString('en-IN')}/mo</td>
                    <td><span className={`badge ${f.status === 'Disbursed' ? 'badge-success' : 'badge-warning'}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 10: RTO SUMMARY
          ===================================================================== */}
      {activeSubTab === 'rto_summary' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total RTO Cases</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {rtoSummary.summary?.totalCases || 0} Files
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Road Tax Collected from Clients</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ₹{Number(rtoSummary.summary?.totalCollected || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Government Tax Paid to RTO</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                ₹{Number(rtoSummary.summary?.totalPaid || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tax Balance with Dealership</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                ₹{Number(rtoSummary.summary?.balanceWithDealer || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
              RTO Road Tax, Passing & Registration Records
            </h3>
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>RTO File #</th>
                    <th>Customer</th>
                    <th>Vehicle Model</th>
                    <th>RTO Jurisdiction</th>
                    <th>Tax Collected</th>
                    <th>Govt Tax Paid</th>
                    <th>Registration No</th>
                    <th>RC Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rtoSummary.records?.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{r.rto_file_no}</td>
                      <td style={{ fontWeight: 600 }}>{r.customer_name}</td>
                      <td>{r.vehicle_name}</td>
                      <td>{r.rto_office}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(r.tax_collected).toLocaleString('en-IN')}</td>
                      <td>₹{Number(r.govt_tax_paid).toLocaleString('en-IN')}</td>
                      <td style={{ fontFamily: 'monospace' }}>{r.registration_no || 'In Process'}</td>
                      <td><span className="badge badge-success">{r.rc_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 11: INSURANCE SUMMARY
          ===================================================================== */}
      {activeSubTab === 'insurance_summary' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Vehicle Insurance Policies & Coverage Register
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Zero-Dep, comprehensive, third-party policies, IDV valuations and renewal dates
              </p>
            </div>
            <button 
              onClick={() => exportToCSV(insuranceSummary.records, 'insurance_policies')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Policy Number</th>
                  <th>Insurance Company</th>
                  <th>Policy Type</th>
                  <th>Customer ID</th>
                  <th>IDV Amount</th>
                  <th>Premium Paid</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {insuranceSummary.records?.map(ins => (
                  <tr key={ins.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{ins.policy_number}</td>
                    <td style={{ fontWeight: 600 }}>{ins.provider}</td>
                    <td>{ins.policy_type}</td>
                    <td style={{ fontFamily: 'monospace' }}>{ins.customer_id}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(ins.idv_amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(ins.premium_amount || 0).toLocaleString('en-IN')}</td>
                    <td>{ins.start_date}</td>
                    <td>{ins.expiry_date}</td>
                    <td><span className="badge badge-success">{ins.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 12: CUSTOMER DUE
          ===================================================================== */}
      {activeSubTab === 'customer_due' && (
        <div>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Overdue Accounts</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {customerDue.summary?.totalOverdueAccounts || 0} Clients
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Outstanding Receivables</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                ₹{Number(customerDue.summary?.totalOutstandingReceivable || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Customer Receivables & Balance Due Register
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Unsettled vehicle tax invoices with due dates, mobile contact numbers and region
                </p>
              </div>
              <button 
                onClick={() => exportToCSV(customerDue.records, 'customer_dues_list')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Village & Tehsil</th>
                    <th>Vehicle Model</th>
                    <th>Invoice Total</th>
                    <th>Paid Amount</th>
                    <th>Balance Due</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customerDue.records?.filter(c => (
                    !searchQuery ||
                    (c.customer_name && c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (c.invoice_number && c.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (c.customer_village && c.customer_village.toLowerCase().includes(searchQuery.toLowerCase()))
                  )).map(c => (
                    <tr key={c.invoice_id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{c.invoice_number}</td>
                      <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                      <td>{c.customer_phone || '-'}</td>
                      <td>{c.customer_village} ({c.customer_tehsil})</td>
                      <td>{c.vehicle_name}</td>
                      <td>₹{Number(c.total_amount).toLocaleString('en-IN')}</td>
                      <td style={{ color: '#10b981' }}>₹{Number(c.paid_amount).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>₹{Number(c.balance_due).toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-warning">{c.due_date}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 13: MARGIN MONEY RECEIPT
          ===================================================================== */}
      {activeSubTab === 'margin_money' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Margin Money Down Payment Receipts
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Client equity contributions required prior to bank loan file sanction and delivery
              </p>
            </div>
            <button 
              onClick={() => exportToCSV(marginMoneyReceipts, 'margin_money_receipts')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Customer Name</th>
                  <th>Amount Deposited</th>
                  <th>Mode of Payment</th>
                  <th>Bank Account</th>
                  <th>UTR / Cheque Ref</th>
                  <th>Date</th>
                  <th>Narration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {marginMoneyReceipts.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{m.voucher_number}</td>
                    <td style={{ fontWeight: 600 }}>{m.party_name}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(m.amount).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-info">{m.payment_mode}</span></td>
                    <td>{m.bank_name || 'Operating Account'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{m.cheque_or_ref_no || '-'}</td>
                    <td>{m.voucher_date}</td>
                    <td>{m.narration || '-'}</td>
                    <td>
                      <button 
                        onClick={() => setSelectedPrintVoucher(m)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      >
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {marginMoneyReceipts.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No margin money receipts recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 14: FINANCE PAYOUT
          ===================================================================== */}
      {activeSubTab === 'finance_payout' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Dealership DSA Finance Payouts
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Bank subvention and loan commission payouts received from lending partners
              </p>
            </div>
            <button 
              onClick={() => exportToCSV(financePayouts, 'finance_payouts')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Payout Ref</th>
                  <th>Bank Institution</th>
                  <th>Customer File</th>
                  <th>Disbursed Loan Amount</th>
                  <th>Subvention Rate</th>
                  <th>Payout Realized</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {financePayouts.filter(fp => (
                  !searchQuery ||
                  (fp.payout_ref && fp.payout_ref.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (fp.bank_name && fp.bank_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (fp.customer_name && fp.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(fp => (
                  <tr key={fp.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{fp.payout_ref}</td>
                    <td style={{ fontWeight: 600 }}>{fp.bank_name}</td>
                    <td>{fp.customer_name}</td>
                    <td>₹{Number(fp.loan_amount).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-info">{fp.commission_rate_pct}%</span></td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(fp.payout_amount).toLocaleString('en-IN')}</td>
                    <td>{fp.payout_date}</td>
                    <td><span className="badge badge-success">{fp.status}</span></td>
                    <td>
                      <button 
                        onClick={() => handleDeleteFinancePayout(fp.id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 15: INSURANCE PAYOUT
          ===================================================================== */}
      {activeSubTab === 'insurance_payout' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Dealership Insurance Agency Payouts
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Brokerage commission received from general insurance providers on policy issuances
              </p>
            </div>
            <button 
              onClick={() => exportToCSV(insurancePayouts, 'insurance_payouts')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Payout Ref</th>
                  <th>Insurer Company</th>
                  <th>Policy #</th>
                  <th>Customer Name</th>
                  <th>Premium Collected</th>
                  <th>Commission Rate</th>
                  <th>Payout Realized</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {insurancePayouts.filter(ip => (
                  !searchQuery ||
                  (ip.payout_ref && ip.payout_ref.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (ip.insurer_name && ip.insurer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (ip.customer_name && ip.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(ip => (
                  <tr key={ip.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{ip.payout_ref}</td>
                    <td style={{ fontWeight: 600 }}>{ip.insurer_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{ip.policy_number}</td>
                    <td>{ip.customer_name}</td>
                    <td>₹{Number(ip.premium_amount).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-info">{ip.commission_rate_pct}%</span></td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(ip.payout_amount).toLocaleString('en-IN')}</td>
                    <td>{ip.payout_date}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteInsurancePayout(ip.id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW / EDIT VOUCHER
          ===================================================================== */}
      {isVoucherModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h2>{editingVoucher ? 'Edit Voucher' : `Record ${voucherTypeModal} Voucher`}</h2>
              <button onClick={() => setIsVoucherModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSaveVoucher} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Voucher Category *</label>
                  <select 
                    className="form-select"
                    value={voucherFormData.category}
                    onChange={e => setVoucherFormData({...voucherFormData, category: e.target.value})}
                  >
                    {voucherTypeModal === 'PAYMENT' ? (
                      <>
                        <option value="Supplier Payout">Supplier Payout</option>
                        <option value="Showroom Expense">Showroom Expense</option>
                        <option value="Salary">Salary & Staff Wages</option>
                        <option value="RTO Charges">RTO Road Tax Payment</option>
                        <option value="Electricity & Utilities">Electricity & Utilities</option>
                        <option value="Fuel & Logistics">Fuel & Logistics</option>
                        <option value="Maintenance">Maintenance & Repairs</option>
                        <option value="Other Payment">Other Outward Payment</option>
                      </>
                    ) : (
                      <>
                        <option value="Customer Advance">Customer Advance</option>
                        <option value="Margin Money">Margin Money Down Payment</option>
                        <option value="Customer Inflow">Customer Vehicle Settlement</option>
                        <option value="Finance Payout">Finance DSA Commission</option>
                        <option value="Insurance Payout">Insurance Agency Payout</option>
                        <option value="Scrap Sale">Scrap / Old Parts Sale</option>
                        <option value="Other Receipt">Other Inward Receipt</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="form-label">Beneficiary / Party Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={voucherFormData.party_name} 
                    onChange={e => setVoucherFormData({...voucherFormData, party_name: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="form-input" 
                    value={voucherFormData.amount} 
                    onChange={e => setVoucherFormData({...voucherFormData, amount: Number(e.target.value)})} 
                  />
                </div>

                <div>
                  <label className="form-label">Payment Mode *</label>
                  <select 
                    className="form-select"
                    value={voucherFormData.payment_mode}
                    onChange={e => setVoucherFormData({...voucherFormData, payment_mode: e.target.value})}
                  >
                    <option value="Cash">Cash (Showroom Cash Box)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                    <option value="RTGS / NEFT">RTGS</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="UPI">UPI Digital Payment</option>
                  </select>
                </div>

                {voucherFormData.payment_mode !== 'Cash' && (
                  <>
                    <div>
                      <label className="form-label">Bank Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={voucherFormData.bank_name} 
                        onChange={e => setVoucherFormData({...voucherFormData, bank_name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="form-label">Cheque / UTR / Reference No</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={voucherFormData.cheque_or_ref_no} 
                        onChange={e => setVoucherFormData({...voucherFormData, cheque_or_ref_no: e.target.value})} 
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="form-label">Voucher Date *</label>
                  <input 
                    type="date" 
                    required 
                    className="form-input" 
                    value={voucherFormData.voucher_date} 
                    onChange={e => setVoucherFormData({...voucherFormData, voucher_date: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label className="form-label">Narration / Remarks</label>
                <textarea 
                  rows="2" 
                  className="form-input" 
                  value={voucherFormData.narration} 
                  onChange={e => setVoucherFormData({...voucherFormData, narration: e.target.value})} 
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingVoucher ? 'Update Voucher' : 'Post Voucher to Books'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: RECORD EXPENSE
          ===================================================================== */}
      {isExpenseModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>Record Showroom Expense</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateExpense} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Expense Category *</label>
                  <select 
                    className="form-select"
                    value={expenseFormData.category}
                    onChange={e => setExpenseFormData({...expenseFormData, category: e.target.value})}
                  >
                    <option value="Electricity & Utilities">Electricity & Utilities</option>
                    <option value="Rent & Property Tax">Rent & Property Tax</option>
                    <option value="Staff Welfare & Tea">Staff Welfare & Hospitality</option>
                    <option value="Marketing & Print Ads">Marketing & Advertisements</option>
                    <option value="Workshop Tools">Workshop Tools & Maintenance</option>
                    <option value="Fuel & Petrol">Fuel & Logistics</option>
                    <option value="Office Stationery">Office Stationery & Printing</option>
                    <option value="Audit & Legal">Audit & Legal Fees</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Vendor / Payee *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={expenseFormData.vendor_or_payee} 
                    onChange={e => setExpenseFormData({...expenseFormData, vendor_or_payee: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    className="form-input" 
                    value={expenseFormData.amount} 
                    onChange={e => setExpenseFormData({...expenseFormData, amount: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-select"
                    value={expenseFormData.payment_mode}
                    onChange={e => setExpenseFormData({...expenseFormData, payment_mode: e.target.value})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Bill / Receipt #</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={expenseFormData.receipt_bill_no} 
                    onChange={e => setExpenseFormData({...expenseFormData, receipt_bill_no: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Expense Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={expenseFormData.expense_date} 
                    onChange={e => setExpenseFormData({...expenseFormData, expense_date: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label className="form-label">Description / Notes</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={expenseFormData.notes} 
                  onChange={e => setExpenseFormData({...expenseFormData, notes: e.target.value})} 
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: FINANCE PAYOUT
          ===================================================================== */}
      {isFinancePayoutModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Log Finance DSA Commission Payout</h2>
              <button onClick={() => setIsFinancePayoutModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateFinancePayout} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Lending Bank / Institution *</label>
                  <input type="text" required className="form-input" value={financePayoutFormData.bank_name} onChange={e => setFinancePayoutFormData({...financePayoutFormData, bank_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input type="text" required className="form-input" value={financePayoutFormData.customer_name} onChange={e => setFinancePayoutFormData({...financePayoutFormData, customer_name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Disbursed Loan (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      className="form-input" 
                      value={financePayoutFormData.loan_amount} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFinancePayoutFormData({
                          ...financePayoutFormData,
                          loan_amount: val,
                          payout_amount: Math.round(val * (financePayoutFormData.commission_rate_pct / 100))
                        });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="form-label">Commission Rate (%) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      className="form-input" 
                      value={financePayoutFormData.commission_rate_pct} 
                      onChange={e => {
                        const rate = Number(e.target.value);
                        setFinancePayoutFormData({
                          ...financePayoutFormData,
                          commission_rate_pct: rate,
                          payout_amount: Math.round(financePayoutFormData.loan_amount * (rate / 100))
                        });
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Net Payout Amount (₹) *</label>
                  <input type="number" required className="form-input" value={financePayoutFormData.payout_amount} onChange={e => setFinancePayoutFormData({...financePayoutFormData, payout_amount: Number(e.target.value)})} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsFinancePayoutModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Finance Payout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: INSURANCE PAYOUT
          ===================================================================== */}
      {isInsurancePayoutModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Log Insurance Agency Payout</h2>
              <button onClick={() => setIsInsurancePayoutModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateInsurancePayout} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Insurance Company *</label>
                  <input type="text" required className="form-input" value={insurancePayoutFormData.insurer_name} onChange={e => setInsurancePayoutFormData({...insurancePayoutFormData, insurer_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Policy Number *</label>
                  <input type="text" required className="form-input" value={insurancePayoutFormData.policy_number} onChange={e => setInsurancePayoutFormData({...insurancePayoutFormData, policy_number: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input type="text" required className="form-input" value={insurancePayoutFormData.customer_name} onChange={e => setInsurancePayoutFormData({...insurancePayoutFormData, customer_name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Premium Collected (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      className="form-input" 
                      value={insurancePayoutFormData.premium_amount} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setInsurancePayoutFormData({
                          ...insurancePayoutFormData,
                          premium_amount: val,
                          payout_amount: Math.round(val * (insurancePayoutFormData.commission_rate_pct / 100))
                        });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="form-label">Brokerage Rate (%) *</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      required 
                      className="form-input" 
                      value={insurancePayoutFormData.commission_rate_pct} 
                      onChange={e => {
                        const rate = Number(e.target.value);
                        setInsurancePayoutFormData({
                          ...insurancePayoutFormData,
                          commission_rate_pct: rate,
                          payout_amount: Math.round(insurancePayoutFormData.premium_amount * (rate / 100))
                        });
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Payout Realized (₹) *</label>
                  <input type="number" required className="form-input" value={insurancePayoutFormData.payout_amount} onChange={e => setInsurancePayoutFormData({...insurancePayoutFormData, payout_amount: Number(e.target.value)})} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsInsurancePayoutModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Insurance Payout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRINT MODAL: OFFICIAL VOUCHER SLIP
          ===================================================================== */}
      {selectedPrintVoucher && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '580px', background: '#ffffff', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#047857', fontWeight: 800 }}>APEX HORIZON MOTORS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Accounts & Finance Division • GSTIN: 27AAACA9928P1Z8</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedPrintVoucher.voucher_type} VOUCHER</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>{selectedPrintVoucher.voucher_number}</div>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.88rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '14px' }}>
                <div>
                  <strong>Party / Beneficiary:</strong> {selectedPrintVoucher.party_name}<br />
                  Category: {selectedPrintVoucher.category}
                </div>
                <div>
                  <strong>Payment Mode:</strong> {selectedPrintVoucher.payment_mode}<br />
                  Date: {selectedPrintVoucher.voucher_date}<br />
                  {selectedPrintVoucher.bank_name ? `Bank: ${selectedPrintVoucher.bank_name}` : ''}
                </div>
              </div>

              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  <span>Amount Paid / Received:</span>
                  <span style={{ color: selectedPrintVoucher.voucher_type === 'PAYMENT' ? '#dc2626' : '#16a34a' }}>
                    ₹{Number(selectedPrintVoucher.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                  Narration: {selectedPrintVoucher.narration || 'Authorized accounting transaction entry'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '36px', textAlign: 'center', fontSize: '0.82rem' }}>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', margin: '0 20px' }}>
                  Accountant Signature
                </div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', margin: '0 20px' }}>
                  Authorized Signatory
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedPrintVoucher(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
