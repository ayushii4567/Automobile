import React, { useState, useEffect } from 'react';
import { 
  Car, 
  MessageSquare, 
  FileText, 
  Truck, 
  Receipt, 
  FileCheck, 
  Package, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Filter, 
  ChevronRight,
  Download,
  Users,
  MapPin,
  Cpu,
  Trash2,
  ArrowRight,
  Edit2
} from 'lucide-react';
import { api } from '../api';

export default function SalesManagement({ 
  currentUser,
  subTab,
  onSubTabChange,
  vehicles = [],
  customers = [],
  sales = [],
  enquiries = [],
  quotations = [],
  estimates = [],
  onOpenAddEnquiry,
  onOpenAddQuotation,
  onOpenAddSale,
  onViewInvoice,
  onRecordPayment
}) {
  const [activeSubTab, setActiveSubTab] = useState(subTab || 'enquiry');

  useEffect(() => {
    if (subTab) {
      setActiveSubTab(subTab);
    }
  }, [subTab]);

  // Data states
  const [deliveryChallans, setDeliveryChallans] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [implementsList, setImplementsList] = useState([]);
  const [implementPurchases, setImplementPurchases] = useState([]);
  const [implementSales, setImplementSales] = useState([]);
  const [vehicleProfitData, setVehicleProfitData] = useState({ summary: {}, records: [] });
  const [demographicsData, setDemographicsData] = useState({ salesmanWise: [], villageWise: [], tehsilWise: [], modelWise: [], hpWise: [] });
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeDemoReport, setActiveDemoReport] = useState('salesman'); // salesman, village, tehsil, model, hp

  // Modals & Action States
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [challanFormData, setChallanFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_village: 'Baramati',
    customer_tehsil: 'Baramati',
    vehicle_name: '',
    chassis_number: '',
    color: 'Standard',
    key_number: 'KEY-01 & KEY-02',
    battery_make: 'Exide OEM Matrix',
    toolkit_included: true,
    handover_date: new Date().toISOString().split('T')[0],
    notes: '',
    sale_id: null,
    invoice_number: ''
  });

  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [agreementFormData, setAgreementFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_village: 'Baramati',
    vehicle_name: '',
    chassis_number: '',
    deal_value: 0,
    hypothecation_bank: 'State Bank of India (Agri Division)',
    agreement_date: new Date().toISOString().split('T')[0],
    sale_id: null,
    invoice_number: '',
    status: 'Executed'
  });

  const [isImpSaleModalOpen, setIsImpSaleModalOpen] = useState(false);
  const [impSaleFormData, setImpSaleFormData] = useState({
    customer_name: '',
    customer_phone: '',
    village: 'Baramati',
    tehsil: 'Baramati',
    implement_id: '',
    implement_name: '',
    quantity: 1,
    sale_price: 135000,
    discount: 0,
    payment_mode: 'Cash'
  });

  const [isImpPurchaseModalOpen, setIsImpPurchaseModalOpen] = useState(false);
  const [impPurchaseFormData, setImpPurchaseFormData] = useState({
    supplier_name: 'Shaktiman Agro Equipment Ltd',
    implement_id: '',
    implement_name: 'Rotavator 7 Feet (Multi-Speed HD)',
    quantity: 2,
    unit_cost: 115000,
    purchase_date: new Date().toISOString().split('T')[0]
  });

  const [selectedPrintChallan, setSelectedPrintChallan] = useState(null);
  const [selectedPrintAgreement, setSelectedPrintAgreement] = useState(null);
  const [selectedPrintImpSale, setSelectedPrintImpSale] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const showAlert = (text, type = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Load section datasets from API
  const loadSalesData = async () => {
    try {
      setLoading(true);
      const [dcs, agrs, imps, imppurch, impsls, vprof, demog] = await Promise.all([
        api.getDeliveryChallans().catch(() => []),
        api.getAgreements().catch(() => []),
        api.getImplements().catch(() => []),
        api.getImplementPurchases().catch(() => []),
        api.getImplementSales().catch(() => []),
        api.getVehicleProfit().catch(() => ({ summary: {}, records: [] })),
        api.getSalesDemographics().catch(() => ({ salesmanWise: [], villageWise: [], tehsilWise: [], modelWise: [], hpWise: [] }))
      ]);

      setDeliveryChallans(dcs || []);
      setAgreements(agrs || []);
      setImplementsList(imps || []);
      setImplementPurchases(imppurch || []);
      setImplementSales(impsls || []);
      setVehicleProfitData(vprof || { summary: {}, records: [] });
      setDemographicsData(demog || { salesmanWise: [], villageWise: [], tehsilWise: [], modelWise: [], hpWise: [] });
    } catch (err) {
      console.error('Failed to load sales management datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  // Workflow Action 1: Enquiry -> Quotation
  const handleConvertEnquiryToQuotation = (enquiry) => {
    if (onOpenAddQuotation) {
      onOpenAddQuotation();
    } else {
      setActiveSubTab('quotation');
      showAlert(`Initiate quotation for ${enquiry.customerName || enquiry.contact_name}`, 'info');
    }
  };

  // Workflow Action 2: Quotation -> Sale Order & Tax Invoice
  const handleConvertQuotationToSale = async (quote) => {
    if (!window.confirm(`Convert quotation ${quote.quotationNumber || quote.quotation_number} into a confirmed Sale Order and Tax Invoice? This will automatically mark the vehicle as Sold in inventory.`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.convertQuotationToSale({ quotation_id: quote.id });
      showAlert(`Quotation ${quote.quotationNumber || quote.quotation_number} successfully converted! Sale Order: ${res.saleOrderNo}, Invoice: ${res.invNumber}`, 'success');
      loadSalesData();
      if (typeof window !== 'undefined' && window.location) {
        // Optional sync trigger
      }
    } catch (err) {
      showAlert(err.message || 'Failed to convert quotation to sale.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Workflow Action 3: Sale -> Issue Delivery Challan
  const handleOpenChallanForSale = (sale) => {
    setChallanFormData({
      customer_name: sale.customerName || sale.customer_name || '',
      customer_phone: sale.customerPhone || sale.customer_phone || '',
      customer_village: sale.village || sale.customer_village || 'Baramati',
      customer_tehsil: sale.tehsil || sale.customer_tehsil || 'Baramati',
      vehicle_name: sale.vehicleName || sale.vehicle_name || 'Vehicle',
      chassis_number: sale.vin || sale.chassis_number || 'CHAS-' + Date.now().toString().slice(-8),
      color: sale.color || 'Standard Metallic',
      key_number: 'KEY-01 & KEY-02',
      battery_make: 'Exide OEM Matrix',
      toolkit_included: true,
      handover_date: new Date().toISOString().split('T')[0],
      notes: `Generated from Sale Order ${sale.saleOrderNumber || sale.sale_order_number}`,
      sale_id: sale.id,
      invoice_number: sale.invoiceNo || sale.invoice_number || ''
    });
    setIsChallanModalOpen(true);
  };

  // Workflow Action 4: Sale -> Generate Sale Agreement
  const handleOpenAgreementForSale = (sale) => {
    setAgreementFormData({
      customer_name: sale.customerName || sale.customer_name || '',
      customer_phone: sale.customerPhone || sale.customer_phone || '',
      customer_village: sale.village || sale.customer_village || 'Baramati',
      vehicle_name: sale.vehicleName || sale.vehicle_name || 'Vehicle',
      chassis_number: sale.vin || sale.chassis_number || 'CHAS-' + Date.now().toString().slice(-8),
      deal_value: Number(sale.totalAmount || sale.total_amount || 0),
      hypothecation_bank: 'State Bank of India (Agri Division)',
      agreement_date: new Date().toISOString().split('T')[0],
      sale_id: sale.id,
      invoice_number: sale.invoiceNo || sale.invoice_number || '',
      status: 'Executed'
    });
    setIsAgreementModalOpen(true);
  };

  // Delivery Challan Handlers
  const handleCreateChallan = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createDeliveryChallan(challanFormData);
      setIsChallanModalOpen(false);
      showAlert('Vehicle Delivery Challan successfully issued!', 'success');
      loadSalesData();
    } catch {
      showAlert('Failed to generate delivery challan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallan = async (id, challanNumber) => {
    if (!window.confirm(`Are you sure you want to delete Delivery Challan ${challanNumber}?`)) return;
    try {
      await api.deleteDeliveryChallan(id);
      showAlert(`Delivery Challan ${challanNumber} deleted.`, 'info');
      loadSalesData();
    } catch (err) {
      showAlert(err.message || 'Failed to delete delivery challan.', 'error');
    }
  };

  // Agreement Handlers
  const handleCreateAgreement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createAgreement(agreementFormData);
      setIsAgreementModalOpen(false);
      showAlert('Vehicle Sale Agreement recorded successfully!', 'success');
      loadSalesData();
    } catch {
      showAlert('Failed to save sale agreement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgreement = async (id, agreementNumber) => {
    if (!window.confirm(`Delete Sale Agreement ${agreementNumber}?`)) return;
    try {
      await api.deleteAgreement(id);
      showAlert(`Sale Agreement ${agreementNumber} deleted.`, 'info');
      loadSalesData();
    } catch (err) {
      showAlert(err.message || 'Failed to delete sale agreement.', 'error');
    }
  };

  // Implement Sales Handlers
  const handleCreateImpSale = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createImplementSale(impSaleFormData);
      setIsImpSaleModalOpen(false);
      showAlert('Implement sale invoiced successfully! Inventory stock decremented.', 'success');
      loadSalesData();
    } catch {
      showAlert('Failed to invoice implement sale.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImpSale = async (id, invNo) => {
    if (!window.confirm(`Void Implement Sale ${invNo}? This will restore equipment stock in inventory.`)) return;
    try {
      await api.deleteImplementSale(id);
      showAlert(`Implement sale ${invNo} voided and stock restored.`, 'info');
      loadSalesData();
    } catch (err) {
      showAlert(err.message || 'Failed to void implement sale.', 'error');
    }
  };

  // Implement Purchase Handlers
  const handleCreateImpPurchase = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createImplementPurchase(impPurchaseFormData);
      setIsImpPurchaseModalOpen(false);
      showAlert('Implement consignment PO recorded! Stock updated.', 'success');
      loadSalesData();
    } catch {
      showAlert('Failed to record implement purchase.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImpPurchase = async (id, poNo) => {
    if (!window.confirm(`Cancel Implement PO ${poNo}? This will rollback stock from inventory.`)) return;
    try {
      await api.deleteImplementPurchase(id);
      showAlert(`Implement PO ${poNo} cancelled and stock updated.`, 'info');
      loadSalesData();
    } catch (err) {
      showAlert(err.message || 'Failed to cancel implement purchase.', 'error');
    }
  };

  // Sub-tabs list preserving exact approved names
  const subTabs = [
    { id: 'enquiry', label: 'Enquiry', count: enquiries.length, icon: MessageSquare },
    { id: 'quotation', label: 'Quotation', count: quotations.length, icon: FileText },
    { id: 'challan', label: 'Delivery Challan', count: deliveryChallans.length, icon: Truck },
    { id: 'invoice', label: 'Tax Invoice', count: sales.length, icon: Receipt },
    { id: 'agreement', label: 'Agreement', count: agreements.length, icon: FileCheck },
    { id: 'imp_purchase', label: 'Implement Purchase', count: implementPurchases.length, icon: Package },
    { id: 'imp_sales', label: 'Implement Sales', count: implementSales.length, icon: Package },
    { id: 'profit', label: 'Vehicle Profit', count: vehicleProfitData.records?.length || 0, icon: TrendingUp },
    { id: 'reports', label: 'Sales Demographics', icon: BarChart3 }
  ];

  // Universal Filter Helper
  const filterList = (items, fields) => {
    if (!searchFilter.trim()) return items;
    const term = searchFilter.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(term);
      })
    );
  };

  return (
    <div className="module-container" style={{ padding: '24px' }}>
      {/* Alert Banner */}
      {alertMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: alertMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: alertMsg.type === 'error' ? '1px solid #ef4444' : '1px solid #10b981',
          color: alertMsg.type === 'error' ? '#fca5a5' : '#6ee7b7'
        }}>
          {alertMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{alertMsg.text}</span>
        </div>
      )}

      {/* Module Title Header */}
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
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
          }}>
            <Car size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Sales Management
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: '2px 0 0' }}>
              Enquiry, Quotation, Delivery Challan, Tax Invoice, Agreement, Implements & Demographics
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeSubTab === 'enquiry' && onOpenAddEnquiry && (
            <button onClick={onOpenAddEnquiry} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> New Enquiry
            </button>
          )}
          {activeSubTab === 'quotation' && onOpenAddQuotation && (
            <button onClick={onOpenAddQuotation} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> New Quotation
            </button>
          )}
          {activeSubTab === 'challan' && (
            <button onClick={() => {
              setChallanFormData({
                customer_name: '', customer_phone: '', customer_village: 'Baramati', customer_tehsil: 'Baramati',
                vehicle_name: '', chassis_number: '', color: 'Standard', key_number: 'KEY-01 & KEY-02',
                battery_make: 'Exide OEM Matrix', toolkit_included: true, handover_date: new Date().toISOString().split('T')[0], notes: ''
              });
              setIsChallanModalOpen(true);
            }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Issue Delivery Challan
            </button>
          )}
          {activeSubTab === 'invoice' && onOpenAddSale && (
            <button onClick={onOpenAddSale} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Create Sale & Invoice
            </button>
          )}
          {activeSubTab === 'agreement' && (
            <button onClick={() => {
              setAgreementFormData({
                customer_name: '', customer_phone: '', customer_village: 'Baramati', vehicle_name: '', chassis_number: '',
                deal_value: 0, hypothecation_bank: 'State Bank of India', agreement_date: new Date().toISOString().split('T')[0], status: 'Executed'
              });
              setIsAgreementModalOpen(true);
            }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> New Agreement
            </button>
          )}
          {activeSubTab === 'imp_purchase' && (
            <button onClick={() => setIsImpPurchaseModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Inward Implement PO
            </button>
          )}
          {activeSubTab === 'imp_sales' && (
            <button onClick={() => setIsImpSaleModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Invoice Implement Sale
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {subTabs.map(tab => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                if (onSubTabChange) onSubTabChange('sales_management', tab.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                background: isActive ? '#ef4444' : '#ffffff',
                border: isActive ? '1px solid #ef4444' : '1px solid #cbd5e1',
                color: isActive ? '#ffffff' : '#334155',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
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

      {/* Search & Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '18px',
        background: '#ffffff',
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px' }}>
          <Search size={16} style={{ color: '#64748b' }} />
          <input 
            type="text"
            placeholder={`Filter ${activeSubTab}... (name, phone, village, ref #)`}
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#0f172a',
              fontSize: '0.86rem',
              width: '100%'
            }}
          />
          {searchFilter && (
            <button onClick={() => setSearchFilter('')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          )}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> Live Database Connected
        </div>
      </div>

      {/* =====================================================================
          TAB 1: ENQUIRY
          ===================================================================== */}
      {activeSubTab === 'enquiry' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Prospect Enquiries & Leads Pipeline
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Showing {filterList(enquiries, ['customerName', 'contact_name', 'phone', 'village', 'tehsil', 'vehicleInterest']).length} Enquiries
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact</th>
                  <th>Village / Tehsil</th>
                  <th>Vehicle Interest</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Workflow Action</th>
                </tr>
              </thead>
              <tbody>
                {filterList(enquiries, ['customerName', 'contact_name', 'phone', 'village', 'tehsil', 'vehicleInterest']).length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No enquiries matching filter.</td></tr>
                ) : (
                  filterList(enquiries, ['customerName', 'contact_name', 'phone', 'village', 'tehsil', 'vehicleInterest']).map((enq, i) => (
                    <tr key={enq.id || i}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{enq.customerName || enq.contact_name}</td>
                      <td style={{ color: '#334155', fontWeight: 500 }}>{enq.phone}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                          <MapPin size={12} /> {enq.village || 'Baramati'} ({enq.tehsil || 'Haveli'})
                        </span>
                      </td>
                      <td style={{ color: '#b45309', fontWeight: 600 }}>{enq.vehicleInterest || enq.vehicle_interest_text || 'Tractor / Vehicle'}</td>
                      <td style={{ color: '#0f172a', fontWeight: 700 }}>₹{Number(enq.budget_max || enq.budgetMax || 1500000).toLocaleString('en-IN')}</td>
                      <td>
                        <span className="badge badge-success">{enq.status || 'Active'}</span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleConvertEnquiryToQuotation(enq)}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ArrowRight size={13} /> Convert to Quotation
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: QUOTATION
          ===================================================================== */}
      {activeSubTab === 'quotation' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Formal Pro-Forma Quotations
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {filterList(quotations, ['quotationNumber', 'quotation_number', 'customerName', 'customer_name', 'vehicleName']).length} Active Quotations
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Base Price</th>
                  <th>Total On-Road</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Workflow Action</th>
                </tr>
              </thead>
              <tbody>
                {filterList(quotations, ['quotationNumber', 'quotation_number', 'customerName', 'customer_name', 'vehicleName']).length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No quotations matching filter.</td></tr>
                ) : (
                  filterList(quotations, ['quotationNumber', 'quotation_number', 'customerName', 'customer_name', 'vehicleName']).map(q => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>{q.quotationNumber || q.quotation_number}</td>
                      <td style={{ fontWeight: 600 }}>{q.customerName || q.customer_name}</td>
                      <td>{q.vehicleName || q.vehicle_name}</td>
                      <td>₹{Number(q.exShowroomPrice || q.ex_showroom_price || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(q.totalAmount || q.total_amount || 0).toLocaleString('en-IN')}</td>
                      <td>{q.validUntil || q.valid_until || '2026-10-31'}</td>
                      <td><span className="badge badge-info">{q.status}</span></td>
                      <td>
                        <button 
                          onClick={() => handleConvertQuotationToSale(q)}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Generate confirmed Sale Order and Tax Invoice automatically"
                        >
                          <CheckCircle2 size={13} /> Convert to Sale & Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: DELIVERY CHALLAN
          ===================================================================== */}
      {activeSubTab === 'challan' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Vehicle Delivery Challans & Handover Notes
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Legal vehicle gate pass with battery make, chassis, toolkit & handover verification
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Recipient / Farmer</th>
                  <th>Village / Tehsil</th>
                  <th>Vehicle Delivered</th>
                  <th>Chassis / VIN</th>
                  <th>Handover Date</th>
                  <th>Delivered By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterList(deliveryChallans, ['challan_number', 'customer_name', 'customer_village', 'vehicle_name', 'chassis_number']).length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No delivery challans recorded yet.</td></tr>
                ) : (
                  filterList(deliveryChallans, ['challan_number', 'customer_name', 'customer_village', 'vehicle_name', 'chassis_number']).map(dc => (
                    <tr key={dc.id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{dc.challan_number}</td>
                      <td style={{ fontWeight: 600 }}>{dc.customer_name}</td>
                      <td>{dc.customer_village} ({dc.customer_tehsil})</td>
                      <td style={{ color: '#fbbf24', fontWeight: 600 }}>{dc.vehicle_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{dc.chassis_number}</td>
                      <td>{dc.handover_date}</td>
                      <td>{dc.delivered_by || 'Alex Rivera'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => setSelectedPrintChallan(dc)}
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Print legal delivery gate pass"
                          >
                            <Printer size={13} /> Print
                          </button>
                          <button 
                            onClick={() => handleDeleteChallan(dc.id, dc.challan_number)}
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center' }}
                            title="Delete challan record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: TAX INVOICE
          ===================================================================== */}
      {activeSubTab === 'invoice' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                GST Tax Invoices & Sales Orders
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Vehicle billing with 18% GST (CGST: 9%, SGST: 9%), balance due tracking and linked delivery documentation
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Sale Order #</th>
                  <th>Invoice #</th>
                  <th>Customer Name</th>
                  <th>Vehicle</th>
                  <th>Total Invoiced</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Connected Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterList(sales, ['saleOrderNumber', 'sale_order_number', 'invoiceNo', 'invoice_number', 'customerName', 'customer_name', 'vehicleName']).length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No sales orders matching filter.</td></tr>
                ) : (
                  filterList(sales, ['saleOrderNumber', 'sale_order_number', 'invoiceNo', 'invoice_number', 'customerName', 'customer_name', 'vehicleName']).map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>{s.saleOrderNumber || s.sale_order_number}</td>
                      <td style={{ fontWeight: 600 }}>{s.invoiceNo || s.invoice_number || 'INV-2026-001'}</td>
                      <td>{s.customerName || s.customer_name}</td>
                      <td>{s.vehicleName || s.vehicle_name}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(s.totalAmount || s.total_amount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>₹{Number(s.paidAmount || s.paid_amount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: (s.balanceDue || s.balance_due) > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                        ₹{Number(s.balanceDue || s.balance_due || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => onViewInvoice && onViewInvoice(s)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="View official GST Tax Invoice"
                          >
                            <FileText size={13} /> View Invoice
                          </button>
                          <button 
                            onClick={() => handleOpenChallanForSale(s)}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Issue legal vehicle delivery challan"
                          >
                            <Truck size={13} /> Issue Challan
                          </button>
                          <button 
                            onClick={() => handleOpenAgreementForSale(s)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                            title="Generate vehicle sale agreement"
                          >
                            <FileCheck size={13} /> Agreement
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: AGREEMENT
          ===================================================================== */}
      {activeSubTab === 'agreement' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Vehicle Sale Agreements & Hypothecation Deeds
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Legal sale contract between dealership and customer with financier hypothecation clause
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Agreement #</th>
                  <th>Customer Name</th>
                  <th>Vehicle</th>
                  <th>Deal Value</th>
                  <th>Hypothecation Financier</th>
                  <th>Agreement Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterList(agreements, ['agreement_number', 'customer_name', 'vehicle_name', 'hypothecation_bank']).length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No sale agreements matching filter.</td></tr>
                ) : (
                  filterList(agreements, ['agreement_number', 'customer_name', 'vehicle_name', 'hypothecation_bank']).map(agr => (
                    <tr key={agr.id}>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>{agr.agreement_number}</td>
                      <td style={{ fontWeight: 600 }}>{agr.customer_name}</td>
                      <td style={{ color: '#fbbf24', fontWeight: 600 }}>{agr.vehicle_name}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(agr.deal_value || 0).toLocaleString('en-IN')}</td>
                      <td>{agr.hypothecation_bank}</td>
                      <td>{agr.agreement_date}</td>
                      <td><span className="badge badge-success">{agr.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => setSelectedPrintAgreement(agr)}
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={13} /> View
                          </button>
                          <button 
                            onClick={() => handleDeleteAgreement(agr.id, agr.agreement_number)}
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: IMPLEMENT PURCHASE
          ===================================================================== */}
      {activeSubTab === 'imp_purchase' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Implement Purchase & OEM Factory Consignments
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Rotavator, trolley, cultivator, and equipment inward purchase register
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Manufacturer / Supplier</th>
                  <th>Equipment Inward</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filterList(implementPurchases, ['po_number', 'supplier_name', 'implement_name']).length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No implement purchases matching filter.</td></tr>
                ) : (
                  filterList(implementPurchases, ['po_number', 'supplier_name', 'implement_name']).map(ip => (
                    <tr key={ip.id}>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>{ip.po_number}</td>
                      <td style={{ fontWeight: 600 }}>{ip.supplier_name}</td>
                      <td style={{ color: '#fbbf24', fontWeight: 600 }}>{ip.implement_name}</td>
                      <td>{ip.quantity} units</td>
                      <td>₹{Number(ip.unit_cost || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(ip.total_cost || 0).toLocaleString('en-IN')}</td>
                      <td>{ip.purchase_date}</td>
                      <td><span className="badge badge-success">{ip.status}</span></td>
                      <td>
                        <button 
                          onClick={() => handleDeleteImpPurchase(ip.id, ip.po_number)}
                          className="btn btn-danger" 
                          style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Cancel PO and revert stock"
                        >
                          <Trash2 size={13} /> Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: IMPLEMENT SALES
          ===================================================================== */}
      {activeSubTab === 'imp_sales' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Implement Sales & Farm Equipment Invoices
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Customer billing for rotavators, trailers, loaders and tillage equipment
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Farmer / Customer</th>
                  <th>Village / Tehsil</th>
                  <th>Implement Sold</th>
                  <th>Rate</th>
                  <th>Tax (12% GST)</th>
                  <th>Total Invoice</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterList(implementSales, ['invoice_number', 'customer_name', 'village', 'implement_name']).length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No implement sales matching filter.</td></tr>
                ) : (
                  filterList(implementSales, ['invoice_number', 'customer_name', 'village', 'implement_name']).map(isale => (
                    <tr key={isale.id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{isale.invoice_number}</td>
                      <td style={{ fontWeight: 600 }}>{isale.customer_name}</td>
                      <td>{isale.village} ({isale.tehsil})</td>
                      <td style={{ color: '#fbbf24', fontWeight: 600 }}>{isale.implement_name}</td>
                      <td>₹{Number(isale.sale_price || 0).toLocaleString('en-IN')}</td>
                      <td>₹{Number(isale.tax_amount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(isale.total_amount || 0).toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-info">{isale.payment_mode}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => setSelectedPrintImpSale(isale)}
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={13} /> Print
                          </button>
                          <button 
                            onClick={() => handleDeleteImpSale(isale.id, isale.invoice_number)}
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center' }}
                            title="Void sale and restore stock"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8: VEHICLE PROFIT
          ===================================================================== */}
      {activeSubTab === 'profit' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Vehicles Sold</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {vehicleProfitData.summary?.totalUnitsSold || 0} Units
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Sales Realized</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                ₹{Number(vehicleProfitData.summary?.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Procurement Cost</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8', marginTop: '4px' }}>
                ₹{Number(vehicleProfitData.summary?.totalCost || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Gross Dealer Profit</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ₹{Number(vehicleProfitData.summary?.totalProfit || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px' }}>
                Avg Dealership Margin: {vehicleProfitData.summary?.avgMargin || 0}%
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
              Unit-by-Unit Vehicle Profitability Ledger
            </h3>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Sale Order</th>
                    <th>Customer & Region</th>
                    <th>Model & HP</th>
                    <th>Selling Price</th>
                    <th>Cost Price</th>
                    <th>Gross Profit</th>
                    <th>Margin %</th>
                    <th>Salesman</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(vehicleProfitData.records || [], ['sale_order_number', 'customer_name', 'brand', 'model', 'sales_agent_name']).length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No profit records found.</td></tr>
                  ) : (
                    filterList(vehicleProfitData.records || [], ['sale_order_number', 'customer_name', 'brand', 'model', 'sales_agent_name']).map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: '#ef4444' }}>{r.sale_order_number}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.customer_village} ({r.customer_tehsil})</div>
                        </td>
                        <td>
                          <div style={{ color: '#fbbf24', fontWeight: 600 }}>{r.brand} {r.model}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.horsepower} HP • {r.variant}</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{Number(r.net_realized_price || 0).toLocaleString('en-IN')}</td>
                        <td>₹{Number(r.cost_price || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(r.gross_profit || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontWeight: 700
                          }}>
                            {r.profit_margin_pct}%
                          </span>
                        </td>
                        <td>{r.sales_agent_name || 'Alex Rivera'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 9: VEHICLE SALES REPORTS (DEMOGRAPHICS)
          ===================================================================== */}
      {activeSubTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Demographic View Switcher */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'salesman', label: 'Salesman-wise', icon: Users },
              { id: 'village', label: 'Village-wise', icon: MapPin },
              { id: 'tehsil', label: 'Tehsil-wise', icon: MapPin },
              { id: 'model', label: 'Model-wise', icon: Car },
              { id: 'hp', label: 'HP-wise (Horsepower)', icon: Cpu }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setActiveDemoReport(v.id)}
                className="btn"
                style={{
                  background: activeDemoReport === v.id ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: activeDemoReport === v.id ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <v.icon size={14} />
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {/* Active Demographic Report Display */}
          {activeDemoReport === 'salesman' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Users size={18} style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Salesman-wise Performance & Profitability
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Sales Consultant</th>
                    <th>Units Sold</th>
                    <th>Total Sales Turnover</th>
                    <th>Gross Profit Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {demographicsData.salesmanWise.map((sw, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{sw.salesman}</td>
                      <td>{sw.units_sold} units</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(sw.total_sales_value || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>₹{Number(sw.total_profit || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeDemoReport === 'village' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MapPin size={18} style={{ color: '#10b981' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Village-wise Vehicle Penetration
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Village</th>
                    <th>Tehsil</th>
                    <th>Units Sold</th>
                    <th>Total Turnover</th>
                  </tr>
                </thead>
                <tbody>
                  {demographicsData.villageWise.map((vw, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{vw.village}</td>
                      <td>{vw.tehsil}</td>
                      <td>{vw.units_sold} units</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(vw.total_sales_value || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeDemoReport === 'tehsil' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MapPin size={18} style={{ color: '#fbbf24' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Tehsil-wise Sales Performance
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Tehsil</th>
                    <th>District</th>
                    <th>Units Sold</th>
                    <th>Total Turnover</th>
                  </tr>
                </thead>
                <tbody>
                  {demographicsData.tehsilWise.map((tw, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{tw.tehsil}</td>
                      <td>{tw.district}</td>
                      <td>{tw.units_sold} units</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(tw.total_sales_value || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeDemoReport === 'model' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Car size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Model-wise Sales Breakdown
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Total Turnover</th>
                  </tr>
                </thead>
                <tbody>
                  {demographicsData.modelWise.map((mw, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{mw.model_name}</td>
                      <td>{mw.category}</td>
                      <td>{mw.units_sold} units</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(mw.total_sales_value || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeDemoReport === 'hp' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Cpu size={18} style={{ color: '#a855f7' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Horsepower (HP-wise) Tractor & Vehicle Sales
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Horsepower Range</th>
                    <th>Units Sold</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {demographicsData.hpWise.map((hw, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#a855f7' }}>{hw.hp_range}</td>
                      <td>{hw.units_sold} units</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(hw.total_sales_value || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: ISSUE DELIVERY CHALLAN
          ===================================================================== */}
      {isChallanModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>Issue Vehicle Delivery Challan</h2>
              <button onClick={() => setIsChallanModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateChallan} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Customer / Recipient Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={challanFormData.customer_name} 
                    onChange={e => setChallanFormData({...challanFormData, customer_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Contact Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={challanFormData.customer_phone} 
                    onChange={e => setChallanFormData({...challanFormData, customer_phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Village</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={challanFormData.customer_village} 
                    onChange={e => setChallanFormData({...challanFormData, customer_village: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Tehsil</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={challanFormData.customer_tehsil} 
                    onChange={e => setChallanFormData({...challanFormData, customer_tehsil: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Vehicle Model Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={challanFormData.vehicle_name} 
                    onChange={e => setChallanFormData({...challanFormData, vehicle_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Chassis / VIN Number *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={challanFormData.chassis_number} 
                    onChange={e => setChallanFormData({...challanFormData, chassis_number: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Battery Make</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={challanFormData.battery_make} 
                    onChange={e => setChallanFormData({...challanFormData, battery_make: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Handover Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={challanFormData.handover_date} 
                    onChange={e => setChallanFormData({...challanFormData, handover_date: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="toolkitCheck"
                  checked={challanFormData.toolkit_included} 
                  onChange={e => setChallanFormData({...challanFormData, toolkit_included: e.target.checked})} 
                />
                <label htmlFor="toolkitCheck" style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                  Standard Toolkit, First Aid Kit & 2 Keys Verified and Included in Delivery
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsChallanModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Delivery Challan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: NEW SALE AGREEMENT
          ===================================================================== */}
      {isAgreementModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Record Vehicle Sale Agreement</h2>
              <button onClick={() => setIsAgreementModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateAgreement} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={agreementFormData.customer_name} 
                    onChange={e => setAgreementFormData({...agreementFormData, customer_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={agreementFormData.customer_phone} 
                    onChange={e => setAgreementFormData({...agreementFormData, customer_phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Vehicle Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={agreementFormData.vehicle_name} 
                    onChange={e => setAgreementFormData({...agreementFormData, vehicle_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Chassis / VIN *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={agreementFormData.chassis_number} 
                    onChange={e => setAgreementFormData({...agreementFormData, chassis_number: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Deal Value (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={agreementFormData.deal_value} 
                    onChange={e => setAgreementFormData({...agreementFormData, deal_value: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Agreement Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={agreementFormData.agreement_date} 
                    onChange={e => setAgreementFormData({...agreementFormData, agreement_date: e.target.value})} 
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Hypothecation Bank / Financier</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={agreementFormData.hypothecation_bank} 
                    onChange={e => setAgreementFormData({...agreementFormData, hypothecation_bank: e.target.value})} 
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsAgreementModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Agreement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: INVOICE IMPLEMENT SALE
          ===================================================================== */}
      {isImpSaleModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Invoice Implement / Equipment Sale</h2>
              <button onClick={() => setIsImpSaleModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateImpSale} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Farmer / Customer Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={impSaleFormData.customer_name} 
                    onChange={e => setImpSaleFormData({...impSaleFormData, customer_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={impSaleFormData.customer_phone} 
                    onChange={e => setImpSaleFormData({...impSaleFormData, customer_phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Village</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={impSaleFormData.village} 
                    onChange={e => setImpSaleFormData({...impSaleFormData, village: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Tehsil</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={impSaleFormData.tehsil} 
                    onChange={e => setImpSaleFormData({...impSaleFormData, tehsil: e.target.value})} 
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Select Implement / Equipment *</label>
                  <select 
                    className="form-select"
                    value={impSaleFormData.implement_id}
                    onChange={e => {
                      const sel = implementsList.find(im => im.id === e.target.value);
                      setImpSaleFormData({
                        ...impSaleFormData,
                        implement_id: e.target.value,
                        implement_name: sel ? sel.name : '',
                        sale_price: sel ? sel.selling_price : 135000
                      });
                    }}
                  >
                    <option value="">-- Choose Equipment --</option>
                    {implementsList.map(im => (
                      <option key={im.id} value={im.id}>
                        {im.name} ({im.category}) — ₹{Number(im.selling_price).toLocaleString('en-IN')} [Stock: {im.stock_quantity}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sale Price (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={impSaleFormData.sale_price} 
                    onChange={e => setImpSaleFormData({...impSaleFormData, sale_price: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-select"
                    value={impSaleFormData.payment_mode}
                    onChange={e => setImpSaleFormData({...impSaleFormData, payment_mode: e.target.value})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="RTGS / NEFT">RTGS / NEFT</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsImpSaleModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Issue Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: INWARD IMPLEMENT PO
          ===================================================================== */}
      {isImpPurchaseModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Record Inward Implement Purchase</h2>
              <button onClick={() => setIsImpPurchaseModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateImpPurchase} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Manufacturer / Supplier *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={impPurchaseFormData.supplier_name} 
                    onChange={e => setImpPurchaseFormData({...impPurchaseFormData, supplier_name: e.target.value})} 
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Select Equipment Model *</label>
                  <select 
                    className="form-select"
                    value={impPurchaseFormData.implement_id}
                    onChange={e => {
                      const sel = implementsList.find(im => im.id === e.target.value);
                      setImpPurchaseFormData({
                        ...impPurchaseFormData,
                        implement_id: e.target.value,
                        implement_name: sel ? sel.name : '',
                        unit_cost: sel ? sel.purchase_cost : 115000
                      });
                    }}
                  >
                    <option value="">-- Choose Equipment --</option>
                    {implementsList.map(im => (
                      <option key={im.id} value={im.id}>
                        {im.name} ({im.category}) — Current Stock: {im.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Quantity *</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="form-input" 
                    value={impPurchaseFormData.quantity} 
                    onChange={e => setImpPurchaseFormData({...impPurchaseFormData, quantity: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Unit Cost (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={impPurchaseFormData.unit_cost} 
                    onChange={e => setImpPurchaseFormData({...impPurchaseFormData, unit_cost: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Purchase Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={impPurchaseFormData.purchase_date} 
                    onChange={e => setImpPurchaseFormData({...impPurchaseFormData, purchase_date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Total Outlay</label>
                  <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontWeight: 700, color: '#38bdf8' }}>
                    ₹{Number(impPurchaseFormData.quantity * impPurchaseFormData.unit_cost).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsImpPurchaseModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Inward Consignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRINT MODAL: DELIVERY CHALLAN
          ===================================================================== */}
      {selectedPrintChallan && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '650px', background: '#ffffff', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ef4444', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#b91c1c', fontWeight: 800 }}>APEX HORIZON MOTORS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Plot 42, Bandra-Kurla Complex, Mumbai • GSTIN: 27AAACA9928P1Z8</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>DELIVERY CHALLAN</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>{selectedPrintChallan.challan_number}</div>
              </div>
            </div>

            <div style={{ padding: '20px 0', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <strong>Customer / Consignee:</strong><br />
                  {selectedPrintChallan.customer_name}<br />
                  Village: {selectedPrintChallan.customer_village}, Tehsil: {selectedPrintChallan.customer_tehsil}<br />
                  Phone: {selectedPrintChallan.customer_phone}
                </div>
                <div>
                  <strong>Delivery Details:</strong><br />
                  Handover Date: {selectedPrintChallan.handover_date}<br />
                  Delivered By: {selectedPrintChallan.delivered_by}<br />
                  Invoice Ref: {selectedPrintChallan.invoice_number || 'INV-2026-001'}
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc', marginBottom: '16px' }}>
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr><td><strong>Vehicle Model:</strong></td><td>{selectedPrintChallan.vehicle_name}</td></tr>
                    <tr><td><strong>Chassis / VIN:</strong></td><td>{selectedPrintChallan.chassis_number}</td></tr>
                    <tr><td><strong>Color:</strong></td><td>{selectedPrintChallan.color}</td></tr>
                    <tr><td><strong>Key Numbers:</strong></td><td>{selectedPrintChallan.key_number}</td></tr>
                    <tr><td><strong>Battery Make:</strong></td><td>{selectedPrintChallan.battery_make}</td></tr>
                    <tr><td><strong>Toolkit & Jack:</strong></td><td>Included (Verified)</td></tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ textAlign: 'center' }}>
                  ________________________<br />
                  <strong>Customer's Signature</strong><br />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Received vehicle in perfect order</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  ________________________<br />
                  <strong>For Apex Horizon Motors</strong><br />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Authorized Signatory</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setSelectedPrintChallan(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRINT MODAL: SALE AGREEMENT
          ===================================================================== */}
      {selectedPrintAgreement && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '650px', background: '#ffffff', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#047857', fontWeight: 800 }}>APEX HORIZON MOTORS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Authorized Automobile & Tractor Dealership</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>VEHICLE SALE AGREEMENT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>{selectedPrintAgreement.agreement_number}</div>
              </div>
            </div>

            <div style={{ padding: '20px 0', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <p>
                This Vehicle Purchase & Sale Agreement is entered into on <strong>{selectedPrintAgreement.agreement_date}</strong> between <strong>Apex Horizon Motors</strong> (The Dealer) and <strong>{selectedPrintAgreement.customer_name}</strong> (The Purchaser).
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', margin: '14px 0' }}>
                <div><strong>Vehicle Description:</strong> {selectedPrintAgreement.vehicle_name}</div>
                <div><strong>Chassis / VIN:</strong> {selectedPrintAgreement.chassis_number}</div>
                <div><strong>Total Agreed Deal Value:</strong> ₹{Number(selectedPrintAgreement.deal_value || 0).toLocaleString('en-IN')}</div>
                <div><strong>Financier Hypothecation:</strong> {selectedPrintAgreement.hypothecation_bank}</div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                1. The purchaser confirms inspection and accepts the vehicle in sound operational condition.<br />
                2. Registration of hypothecation with RTO shall remain in favor of the aforementioned financier until final loan clearance.
              </p>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ textAlign: 'center' }}>
                  ________________________<br />
                  <strong>Purchaser's Signature</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  ________________________<br />
                  <strong>Dealership Authorized Officer</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setSelectedPrintAgreement(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRINT MODAL: IMPLEMENT SALE INVOICE
          ===================================================================== */}
      {selectedPrintImpSale && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px', background: '#ffffff', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #38bdf8', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0284c7', fontWeight: 800 }}>APEX HORIZON MOTORS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Agricultural Implements & Farm Equipment Division</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>TAX INVOICE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>{selectedPrintImpSale.invoice_number}</div>
              </div>
            </div>

            <div style={{ padding: '20px 0', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <strong>Billed To:</strong><br />
                  {selectedPrintImpSale.customer_name}<br />
                  Village: {selectedPrintImpSale.village}, Tehsil: {selectedPrintImpSale.tehsil}<br />
                  Phone: {selectedPrintImpSale.customer_phone}
                </div>
                <div>
                  <strong>Invoice Details:</strong><br />
                  Date: {selectedPrintImpSale.sale_date}<br />
                  Payment Mode: {selectedPrintImpSale.payment_mode}<br />
                  Status: {selectedPrintImpSale.status}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item Description</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>{selectedPrintImpSale.implement_name}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{selectedPrintImpSale.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{Number(selectedPrintImpSale.sale_price).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{Number(selectedPrintImpSale.sale_price * selectedPrintImpSale.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>GST (12%):</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{Number(selectedPrintImpSale.tax_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ fontWeight: 800, fontSize: '1rem', borderTop: '2px solid #0f172a' }}>
                    <td colSpan="3" style={{ padding: '8px', textAlign: 'right' }}>Grand Total:</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#0284c7' }}>₹{Number(selectedPrintImpSale.total_amount).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setSelectedPrintImpSale(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
