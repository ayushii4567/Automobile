import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Receipt, 
  FileText, 
  Package, 
  Clock, 
  BookOpen, 
  BarChart3, 
  Plus, 
  Printer, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  User, 
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  ArrowRight,
  DollarSign,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { api } from '../api';

export default function ServiceManagement({
  currentUser,
  subTab,
  onSubTabChange,
  services = [],
  parts = [],
  customers = [],
  vehicles = [],
  onAddService
}) {
  const [activeSubTab, setActiveSubTab] = useState(subTab || 'job_card');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (subTab) {
      setActiveSubTab(subTab);
    }
  }, [subTab]);

  const handleTabClick = (tabId) => {
    setActiveSubTab(tabId);
    if (onSubTabChange) {
      onSubTabChange(tabId);
    }
  };

  // Live Data states from SQLite Backend
  const [jobEstimates, setJobEstimates] = useState([]);
  const [serviceInvoices, setServiceInvoices] = useState([]);
  const [spareInvoices, setSpareInvoices] = useState([]);
  const [partsLedger, setPartsLedger] = useState([]);
  const [spareSales, setSpareSales] = useState({ summary: {}, records: [] });
  const [serviceReports, setServiceReports] = useState({ mechanicWise: [], dailyService: [] });
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [vinSearch, setVinSearch] = useState('');
  const [vinHistory, setVinHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals & Selection states
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [isServiceInvoiceModalOpen, setIsServiceInvoiceModalOpen] = useState(false);
  const [isSpareInvoiceModalOpen, setIsSpareInvoiceModalOpen] = useState(false);
  const [invoiceTypeSelect, setInvoiceTypeSelect] = useState('Spare'); // 'Spare' or 'Accessories'
  const [isAllocatePartsModalOpen, setIsAllocatePartsModalOpen] = useState(false);
  const [selectedJobCardForAllocation, setSelectedJobCardForAllocation] = useState(null);
  const [selectedPrintSpareInv, setSelectedPrintSpareInv] = useState(null);
  const [selectedPrintServiceInv, setSelectedPrintServiceInv] = useState(null);

  // Form Data States
  const [estimateFormData, setEstimateFormData] = useState({
    customer_name: '',
    customer_phone: '',
    vehicle_model: 'Mahindra 575 DI XP Plus',
    vin: '',
    estimated_labor: 3500,
    estimated_parts: 4200,
    complaints: 'Periodic maintenance, oil filter replacement & clutch adjustment'
  });

  const [serviceInvoiceFormData, setServiceInvoiceFormData] = useState({
    customer_name: '',
    customer_phone: '',
    vehicle_model: 'Mahindra 575 DI XP Plus',
    vin: '',
    technician_name: 'Suresh Patil (Master Tech)',
    labor_charges: 4500,
    parts_charges: 6800,
    payment_mode: 'Cash'
  });

  const [spareInvoiceFormData, setSpareInvoiceFormData] = useState({
    customer_name: '',
    customer_phone: '',
    vehicle_number: '',
    part_id: '',
    part_name: 'Ceramic Heavy Brake Pads',
    part_code: 'SP-BRK-001',
    qty: 1,
    price: 8500,
    payment_mode: 'Cash'
  });

  const [allocateFormData, setAllocateFormData] = useState({
    part_id: '',
    quantity: 1
  });

  const showFeedback = (msg, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(''), 4500);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const loadServiceData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (dateRange.startDate) queryParams.set('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.set('endDate', dateRange.endDate);

      const [jEsts, sInvs, spInvs, pLedger, spSales, sReps] = await Promise.all([
        api.getJobEstimates().catch(() => []),
        api.getServiceInvoices().catch(() => []),
        api.getSpareInvoices().catch(() => []),
        api.getPartsLedger().catch(() => []),
        api.getSpareSales().catch(() => ({ summary: {}, records: [] })),
        api.getServiceReportsSummary(queryParams.toString()).catch(() => ({ mechanicWise: [], dailyService: [] }))
      ]);

      setJobEstimates(jEsts || []);
      setServiceInvoices(sInvs || []);
      setSpareInvoices(spInvs || []);
      setPartsLedger(pLedger || []);
      setSpareSales(spSales || { summary: {}, records: [] });
      setServiceReports(sReps || { mechanicWise: [], dailyService: [] });
    } catch (err) {
      console.error('Failed to load service management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceData();
  }, []);

  // Filter service reports by date
  const handleApplyDateFilter = async (e) => {
    e?.preventDefault();
    loadServiceData();
  };

  const handleResetDateFilter = async () => {
    setDateRange({ startDate: '', endDate: '' });
    try {
      const sReps = await api.getServiceReportsSummary('');
      setServiceReports(sReps || { mechanicWise: [], dailyService: [] });
    } catch {}
  };

  // Search VIN Service History
  const handleSearchVinHistory = async (vinToSearch) => {
    const term = vinToSearch || vinSearch;
    if (!term) return;
    try {
      const res = await api.getServiceHistoryByVin(term);
      setVinHistory(res || []);
    } catch {
      setVinHistory([]);
    }
  };

  // Convert Job Estimate to Job Card (Workflow 1)
  const handleConvertEstimateToJobCard = async (estimate) => {
    if (!window.confirm(`Convert Job Estimate ${estimate.estimate_number} into an active Job Card?`)) return;
    try {
      const res = await api.convertJobEstimateToJobCard(estimate.id, {
        technician_name: 'Suresh Patil (Master Tech)'
      });
      showFeedback(`Successfully converted to Job Card ${res.jcNo || ''} and Service Ticket ${res.ticketNo || ''}!`);
      loadServiceData();
      setActiveSubTab('job_card');
    } catch (err) {
      showFeedback(err.message || 'Failed to convert estimate to job card.', true);
    }
  };

  // Allocate Parts to Job Card (Workflow 2)
  const handleAllocatePartsToJobCard = async (e) => {
    e.preventDefault();
    if (!selectedJobCardForAllocation || !allocateFormData.part_id) {
      showFeedback('Please select a spare part to allocate.', true);
      return;
    }
    try {
      await api.allocatePartsToJobCard(selectedJobCardForAllocation.id, allocateFormData);
      showFeedback(`Allocated parts successfully! Stock deducted and recorded in Parts Ledger.`);
      setIsAllocatePartsModalOpen(false);
      setSelectedJobCardForAllocation(null);
      setAllocateFormData({ part_id: '', quantity: 1 });
      loadServiceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to allocate parts.', true);
    }
  };

  // Generate Service Invoice from Job Card (Workflow 3)
  const handleGenerateInvoiceFromJobCard = async (jobCard) => {
    if (!window.confirm(`Generate official Service Tax Invoice for Job Card ${jobCard.ticketNumber || jobCard.job_card_number || jobCard.id}?`)) return;
    try {
      const res = await api.generateServiceInvoiceFromJobCard(jobCard.id);
      showFeedback(`Service Tax Invoice ${res.invoice_number || ''} generated successfully!`);
      loadServiceData();
      setActiveSubTab('service_invoice');
    } catch (err) {
      showFeedback(err.message || 'Failed to generate service invoice.', true);
    }
  };

  // Create Job Estimate
  const handleSaveJobEstimate = async (e) => {
    e.preventDefault();
    try {
      if (editingEstimate) {
        await api.updateJobEstimate(editingEstimate.id, estimateFormData);
        showFeedback(`Job estimate updated successfully.`);
      } else {
        await api.createJobEstimate(estimateFormData);
        showFeedback(`New Job estimate created successfully.`);
      }
      setIsEstimateModalOpen(false);
      setEditingEstimate(null);
      loadServiceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to save job estimate.', true);
    }
  };

  // Delete Job Estimate
  const handleDeleteJobEstimate = async (id) => {
    if (!window.confirm('Delete this job estimate record?')) return;
    try {
      await api.deleteJobEstimate(id);
      showFeedback('Job estimate record deleted.');
      loadServiceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to delete estimate.', true);
    }
  };

  // Create Service Invoice directly
  const handleCreateServiceInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.createServiceInvoice(serviceInvoiceFormData);
      showFeedback('Service Invoice issued successfully!');
      setIsServiceInvoiceModalOpen(false);
      loadServiceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to issue service invoice.', true);
    }
  };

  // Delete Service Invoice
  const handleDeleteServiceInvoice = async (id) => {
    if (!window.confirm('Void and delete this service invoice?')) return;
    try {
      await api.deleteServiceInvoice(id);
      showFeedback('Service invoice deleted.');
      loadServiceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to delete service invoice.', true);
    }
  };

  // Create Spare / Accessories Invoice
  const handleCreateSpareInvoice = async (e) => {
    e.preventDefault();
    try {
      const lineItem = {
        part_id: spareInvoiceFormData.part_id,
        code: spareInvoiceFormData.part_code,
        name: spareInvoiceFormData.part_name,
        qty: Number(spareInvoiceFormData.qty || 1),
        price: Number(spareInvoiceFormData.price || 0)
      };
      const subtotal = lineItem.qty * lineItem.price;

      await api.createSpareInvoice({
        customer_name: spareInvoiceFormData.customer_name,
        customer_phone: spareInvoiceFormData.customer_phone,
        vehicle_number: spareInvoiceFormData.vehicle_number,
        payment_mode: spareInvoiceFormData.payment_mode,
        invoice_type: invoiceTypeSelect,
        items: [lineItem],
        subtotal
      });

      showFeedback(`${invoiceTypeSelect} Invoice generated and parts inventory depleted!`);
      setIsSpareInvoiceModalOpen(false);
      loadServiceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to issue invoice.', true);
    }
  };

  // Delete / Void Spare Invoice (with inventory reversal)
  const handleDeleteSpareInvoice = async (id, invNumber) => {
    if (!window.confirm(`Void ${invNumber}? This will reverse parts stock back to inventory and log an adjustment.`)) return;
    try {
      await api.deleteSpareInvoice(id);
      showFeedback(`Invoice ${invNumber} voided and stock restored!`);
      loadServiceData();
    } catch (err) {
      showFeedback(err.message || 'Failed to void invoice.', true);
    }
  };

  // 10 Exact Approved Submodules
  const subTabs = [
    { id: 'spare_invoice', label: '1. Spare Invoice', count: spareInvoices.filter(i => i.invoice_type === 'Spare').length, icon: Receipt },
    { id: 'job_card', label: '2. Job Card', count: services.length, icon: Wrench },
    { id: 'job_estimate', label: '3. Job Estimate', count: jobEstimates.length, icon: FileText },
    { id: 'service_invoice', label: '4. Service Invoice', count: serviceInvoices.length, icon: DollarSign },
    { id: 'accessories_invoice', label: '5. Accessories Invoice', count: spareInvoices.filter(i => i.invoice_type === 'Accessories').length, icon: Sparkles },
    { id: 'spare_stock', label: '6. Spare Stock', count: parts.length, icon: Package },
    { id: 'service_history', label: '7. Service History', icon: Clock },
    { id: 'parts_ledger', label: '8. Parts Ledger', count: partsLedger.length, icon: BookOpen },
    { id: 'spare_sales', label: '9. Spare Sales', icon: TrendingUp },
    { id: 'reports', label: '10. Service Reports', icon: BarChart3 }
  ];

  return (
    <div className="module-container" style={{ padding: '24px' }}>
      {/* Top Banner & Header */}
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
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
          }}>
            <Wrench size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Service Management
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: '2px 0 0' }}>
              Workshop Job Cards, Invoicing, Parts Ledger, Inventory & Demographic Service Intelligence
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeSubTab === 'job_card' && onAddService && (
            <button onClick={onAddService} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Open Job Card
            </button>
          )}

          {activeSubTab === 'job_estimate' && (
            <button 
              onClick={() => {
                setEditingEstimate(null);
                setEstimateFormData({
                  customer_name: '',
                  customer_phone: '',
                  vehicle_model: 'Mahindra 575 DI XP Plus',
                  vin: '',
                  estimated_labor: 3500,
                  estimated_parts: 4200,
                  complaints: 'Periodic maintenance, oil filter replacement & clutch adjustment'
                });
                setIsEstimateModalOpen(true);
              }}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> New Job Estimate
            </button>
          )}

          {activeSubTab === 'service_invoice' && (
            <button 
              onClick={() => setIsServiceInvoiceModalOpen(true)}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Issue Service Invoice
            </button>
          )}

          {(activeSubTab === 'spare_invoice' || activeSubTab === 'accessories_invoice') && (
            <button 
              onClick={() => {
                const isAcc = activeSubTab === 'accessories_invoice';
                setInvoiceTypeSelect(isAcc ? 'Accessories' : 'Spare');
                setIsSpareInvoiceModalOpen(true);
              }} 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Quick Counter Billing
            </button>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {actionSuccess && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs (Strictly 10 Approved Names) */}
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
                background: isActive ? '#0284c7' : '#ffffff',
                border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                color: isActive ? '#ffffff' : '#334155',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
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

      {/* Universal Search Filter Box */}
      {['spare_invoice', 'job_card', 'job_estimate', 'service_invoice', 'accessories_invoice', 'spare_stock', 'parts_ledger'].includes(activeSubTab) && (
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
          SUBMODULE 1: SPARE INVOICE
          ===================================================================== */}
      {activeSubTab === 'spare_invoice' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Over-the-Counter Spare Invoices
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Direct spare part sales with 18% GST billing and automatic bin-card stock depletion
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Vehicle Number</th>
                  <th>Subtotal</th>
                  <th>GST (18%)</th>
                  <th>Total Billed</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {spareInvoices.filter(si => si.invoice_type === 'Spare' && (
                  !searchQuery ||
                  (si.invoice_number && si.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (si.customer_name && si.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (si.vehicle_number && si.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(si => (
                  <tr key={si.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{si.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{si.customer_name}</td>
                    <td>{si.vehicle_number || 'Counter Sale'}</td>
                    <td>₹{Number(si.subtotal || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(si.tax_amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(si.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-info">{si.payment_mode}</span></td>
                    <td>{si.invoice_date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setSelectedPrintSpareInv(si)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Print Invoice"
                        >
                          <Printer size={13} /> Bill
                        </button>
                        <button 
                          onClick={() => handleDeleteSpareInvoice(si.id, si.invoice_number)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Void & Reverse Stock"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {spareInvoices.filter(si => si.invoice_type === 'Spare').length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No spare invoices issued yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 2: JOB CARD (WORKSHOP TICKETS & ALLOCATION)
          ===================================================================== */}
      {activeSubTab === 'job_card' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Workshop Job Cards & Service Tickets
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Technician scheduling, customer complaints, live parts allocation and bill generation
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Job Card / Ticket</th>
                  <th>Customer</th>
                  <th>Vehicle Model</th>
                  <th>Technician</th>
                  <th>Labor Cost</th>
                  <th>Parts Fitted</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.filter(s => (
                  !searchQuery ||
                  (s.ticketNumber && s.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (s.vehicleModel && s.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>
                      {s.ticketNumber || s.ticket_number}
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.customerName || s.customer_name}</td>
                    <td>{s.vehicleModel || s.vehicle_model}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{s.technicianName || s.technician_name || 'Master Tech'}</td>
                    <td>₹{Number(s.laborCharges || 4500).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#38bdf8', fontWeight: 600 }}>₹{Number(s.partsTotalCost || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      ₹{Number((Number(s.laborCharges || 4500)) + Number(s.partsTotalCost || 0)).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'Completed' || s.status === 'Invoiced' ? 'badge-success' : 'badge-warning'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {s.status !== 'Invoiced' && (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedJobCardForAllocation(s);
                                setIsAllocatePartsModalOpen(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Allocate Spare Parts from stock"
                            >
                              <Package size={13} /> Fit Parts
                            </button>
                            <button 
                              onClick={() => handleGenerateInvoiceFromJobCard(s)}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Convert Job Card to Official Tax Invoice"
                            >
                              <Receipt size={13} /> Bill
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No service tickets open.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 3: JOB ESTIMATE
          ===================================================================== */}
      {activeSubTab === 'job_estimate' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Service Job Cost Estimates
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Pre-repair cost approximations with one-click conversion into active workshop Job Cards
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Estimate #</th>
                  <th>Customer</th>
                  <th>Vehicle Model</th>
                  <th>Labor Estimate</th>
                  <th>Parts Estimate</th>
                  <th>GST (18%)</th>
                  <th>Total Estimate</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobEstimates.filter(je => (
                  !searchQuery ||
                  (je.estimate_number && je.estimate_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (je.customer_name && je.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (je.vehicle_model && je.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(je => (
                  <tr key={je.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{je.estimate_number}</td>
                    <td style={{ fontWeight: 600 }}>{je.customer_name}</td>
                    <td>{je.vehicle_model}</td>
                    <td>₹{Number(je.estimated_labor || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(je.estimated_parts || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(je.tax_amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(je.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${je.status === 'Converted' ? 'badge-success' : 'badge-warning'}`}>
                        {je.status}
                      </span>
                    </td>
                    <td>{je.estimate_date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {je.status !== 'Converted' && (
                          <button 
                            onClick={() => handleConvertEstimateToJobCard(je)}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Convert into workshop Job Card"
                          >
                            <ArrowRight size={13} /> Open Job Card
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingEstimate(je);
                            setEstimateFormData({
                              customer_name: je.customer_name,
                              customer_phone: je.customer_phone || '',
                              vehicle_model: je.vehicle_model,
                              vin: je.vin || '',
                              estimated_labor: je.estimated_labor,
                              estimated_parts: je.estimated_parts,
                              complaints: je.complaints || ''
                            });
                            setIsEstimateModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Edit Estimate"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteJobEstimate(je.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Delete Estimate"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {jobEstimates.length === 0 && (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>No repair job estimates recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 4: SERVICE INVOICE
          ===================================================================== */}
      {activeSubTab === 'service_invoice' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Comprehensive Service Tax Invoices (Labor + Parts)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Completed service job cards invoiced with GST compliance and technician breakdown
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Vehicle Model</th>
                  <th>Technician</th>
                  <th>Labor Billed</th>
                  <th>Parts Billed</th>
                  <th>Total Billed</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceInvoices.filter(si => (
                  !searchQuery ||
                  (si.invoice_number && si.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (si.customer_name && si.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (si.vehicle_model && si.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(si => (
                  <tr key={si.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{si.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{si.customer_name}</td>
                    <td>{si.vehicle_model}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{si.technician_name}</td>
                    <td>₹{Number(si.labor_charges || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(si.parts_charges || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(si.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-success">{si.status}</span></td>
                    <td>{si.invoice_date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setSelectedPrintServiceInv(si)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Print Bill"
                        >
                          <Printer size={13} /> Bill
                        </button>
                        <button 
                          onClick={() => handleDeleteServiceInvoice(si.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Delete Bill"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {serviceInvoices.length === 0 && (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>No service invoices recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 5: ACCESSORIES INVOICE
          ===================================================================== */}
      {activeSubTab === 'accessories_invoice' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Accessories Tax Invoices
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Vehicle accessories, bumper guards, seat covers, canopy and tractor add-ons billing
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Vehicle Number</th>
                  <th>Subtotal</th>
                  <th>GST (18%)</th>
                  <th>Total Amount</th>
                  <th>Payment Mode</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {spareInvoices.filter(si => si.invoice_type === 'Accessories' && (
                  !searchQuery ||
                  (si.invoice_number && si.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (si.customer_name && si.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(si => (
                  <tr key={si.id}>
                    <td style={{ fontWeight: 700, color: '#a855f7' }}>{si.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{si.customer_name}</td>
                    <td>{si.vehicle_number || 'Walk-in'}</td>
                    <td>₹{Number(si.subtotal || 0).toLocaleString('en-IN')}</td>
                    <td>₹{Number(si.tax_amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(si.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-info">{si.payment_mode}</span></td>
                    <td>{si.invoice_date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setSelectedPrintSpareInv(si)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Printer size={13} /> Bill
                        </button>
                        <button 
                          onClick={() => handleDeleteSpareInvoice(si.id, si.invoice_number)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {spareInvoices.filter(si => si.invoice_type === 'Accessories').length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No accessories invoices recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 6: SPARE STOCK
          ===================================================================== */}
      {activeSubTab === 'spare_stock' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Spare Parts & Consumables Catalog
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Stock in hand, shelf locations, unit purchase cost, and re-order thresholds
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Part Name</th>
                  <th>Category</th>
                  <th>Stock In Hand</th>
                  <th>Unit Cost</th>
                  <th>Selling Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {parts.filter(p => (
                  !searchQuery ||
                  (p.partNumber && p.partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (p.part_number && p.part_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(p => {
                  const qty = p.stockQuantity !== undefined ? p.stockQuantity : (p.stock_quantity !== undefined ? p.stock_quantity : 0);
                  const isLow = qty <= 3;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{p.partNumber || p.part_number}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td style={{ fontWeight: 700, color: isLow ? '#ef4444' : '#10b981' }}>
                        {qty} units
                      </td>
                      <td>₹{Number(p.unitCost || p.unit_cost || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(p.sellingPrice || p.selling_price || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 7: SERVICE HISTORY (VIN LOOKUP)
          ===================================================================== */}
      {activeSubTab === 'service_history' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
            Chassis / VIN Service History Search
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '0 0 14px' }}>
            Inspect complete maintenance history, repairs, odometers and technician logs for any vehicle
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleSearchVinHistory(vinSearch); }} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Enter Vehicle VIN / Chassis No (e.g. MAT622019P1049281)..." 
              className="form-input" 
              value={vinSearch}
              onChange={e => setVinSearch(e.target.value)}
              style={{ maxWidth: '420px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={16} /> Look Up History
            </button>
          </form>

          {/* Quick Click VIN Samples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sample VINs:</span>
            {vehicles.slice(0, 4).map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVinSearch(v.vin);
                  handleSearchVinHistory(v.vin);
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#38bdf8',
                  cursor: 'pointer'
                }}
              >
                {v.vin} ({v.model})
              </button>
            ))}
          </div>

          {vinHistory.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Date</th>
                    <th>Odometer (KM)</th>
                    <th>Service Type</th>
                    <th>Technician</th>
                    <th>Cost</th>
                    <th>Complaints & Work Done</th>
                  </tr>
                </thead>
                <tbody>
                  {vinHistory.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#0284c7' }}>{h.ticket_number}</td>
                      <td>{h.entry_date}</td>
                      <td>{h.odometer_reading || 15000} km</td>
                      <td>{h.service_type}</td>
                      <td>{h.technician_name}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(h.total_service_cost || 0).toLocaleString('en-IN')}</td>
                      <td>{h.customer_complaints || 'Periodic Maintenance Done'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Enter a VIN or select a chassis number above to view historical service records.</p>
          )}
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 8: PARTS LEDGER
          ===================================================================== */}
      {activeSubTab === 'parts_ledger' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
            Spare Parts Movement Ledger (Bin-Card Journal)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 14px' }}>
            Dual-entry inventory audit tracking procurement inflows, counter sales, job card allocations and void adjustments
          </p>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Part Description</th>
                  <th>Movement Type</th>
                  <th>Reference #</th>
                  <th>Quantity</th>
                  <th>Unit Rate</th>
                  <th>Stock Balance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {partsLedger.filter(pl => (
                  !searchQuery ||
                  (pl.part_number && pl.part_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (pl.part_name && pl.part_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (pl.reference_no && pl.reference_no.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(pl => (
                  <tr key={pl.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{pl.part_number}</td>
                    <td style={{ fontWeight: 600 }}>{pl.part_name}</td>
                    <td>
                      <span className={`badge ${pl.transaction_type.includes('INWARD') || pl.transaction_type === 'ADJUSTMENT' ? 'badge-success' : 'badge-warning'}`}>
                        {pl.transaction_type}
                      </span>
                    </td>
                    <td>{pl.reference_no}</td>
                    <td style={{ fontWeight: 700, color: pl.quantity > 0 ? '#10b981' : '#ef4444' }}>
                      {pl.quantity > 0 ? `+${pl.quantity}` : pl.quantity}
                    </td>
                    <td>₹{Number(pl.unit_price).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>{pl.balance_stock} units</td>
                    <td>{pl.transaction_date}</td>
                  </tr>
                ))}
                {partsLedger.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No inventory movements logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 9: SPARE SALES (PARTS PERFORMANCE & VOLUME)
          ===================================================================== */}
      {activeSubTab === 'spare_sales' && (
        <div>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Parts Sold</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {spareSales.summary?.totalUnits || 0} Units
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Spare Revenue</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                ₹{Number(spareSales.summary?.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Gross Margin Profit</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ₹{Number(spareSales.summary?.totalProfit || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
              Item-wise Spare Parts Sales Volume & Profitability
            </h3>
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Current Stock</th>
                    <th>Revenue Realized</th>
                    <th>Gross Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {spareSales.records?.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{r.part_number}</td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.category}</td>
                      <td style={{ fontWeight: 700 }}>{r.units_sold} units</td>
                      <td>{r.stock_quantity} in stock</td>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>₹{Number(r.total_revenue || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(r.gross_profit || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {(!spareSales.records || spareSales.records.length === 0) && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No sales records available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 10: DAILY SERVICE, DATE-RANGE & MECHANIC-WISE REPORTS
          ===================================================================== */}
      {activeSubTab === 'reports' && (
        <div>
          {/* Date Range Filter Bar */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <form onSubmit={handleApplyDateFilter} style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#0284c7" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Date-Range Filter:</span>
              </div>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '160px' }} 
                value={dateRange.startDate} 
                onChange={e => setDateRange({...dateRange, startDate: e.target.value})} 
              />
              <span style={{ color: '#94a3b8' }}>to</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '160px' }} 
                value={dateRange.endDate} 
                onChange={e => setDateRange({...dateRange, endDate: e.target.value})} 
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} /> Apply Filter
              </button>
              {(dateRange.startDate || dateRange.endDate) && (
                <button type="button" onClick={handleResetDateFilter} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Mechanic-wise Report */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 14px' }}>
                Mechanic-wise Performance & Labor Billed
              </h3>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>Jobs Done</th>
                    <th>Labor Billed</th>
                    <th>Parts Fitted</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceReports.mechanicWise.map((mw, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#fbbf24' }}>{mw.mechanic}</td>
                      <td>{mw.job_cards_handled} jobs</td>
                      <td style={{ color: '#38bdf8', fontWeight: 700 }}>₹{Number(mw.total_labor_billed || 0).toLocaleString('en-IN')}</td>
                      <td>₹{Number(mw.total_parts_fitted || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>₹{Number(mw.total_revenue_generated || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {serviceReports.mechanicWise.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No technician data for selected date range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Daily Service Center Inflow Report */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 14px' }}>
                Daily Service Center Inflow & Billing
              </h3>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Service Date</th>
                    <th>Vehicles In</th>
                    <th>Completed</th>
                    <th>Total Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceReports.dailyService.map((ds, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{ds.service_date}</td>
                      <td>{ds.vehicles_received} units</td>
                      <td>{ds.vehicles_completed} units</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(ds.total_billed || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {serviceReports.dailyService.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>No daily service data for selected date range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ALLOCATE SPARE PARTS TO JOB CARD
          ===================================================================== */}
      {isAllocatePartsModalOpen && selectedJobCardForAllocation && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Allocate Spare Parts to Job Card</h2>
              <button onClick={() => setIsAllocatePartsModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleAllocatePartsToJobCard} style={{ padding: '20px' }}>
              <div style={{ padding: '12px', background: '#1e293b', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                  {selectedJobCardForAllocation.ticketNumber || selectedJobCardForAllocation.job_card_number}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Client: {selectedJobCardForAllocation.customerName || selectedJobCardForAllocation.customer_name} • 
                  Vehicle: {selectedJobCardForAllocation.vehicleModel || selectedJobCardForAllocation.vehicle_model}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Select Spare Part *</label>
                  <select 
                    required
                    className="form-select"
                    value={allocateFormData.part_id}
                    onChange={e => setAllocateFormData({...allocateFormData, part_id: e.target.value})}
                  >
                    <option value="">-- Choose Part from Warehouse --</option>
                    {parts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.partNumber || p.part_number} - {p.name} (₹{p.sellingPrice || p.selling_price} | In Stock: {p.stockQuantity || p.stock_quantity || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Quantity to Allocate *</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    className="form-input" 
                    value={allocateFormData.quantity}
                    onChange={e => setAllocateFormData({...allocateFormData, quantity: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsAllocatePartsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Allocate & Deduct Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW / EDIT JOB ESTIMATE
          ===================================================================== */}
      {isEstimateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h2>{editingEstimate ? 'Edit Job Estimate' : 'Create Job Cost Estimate'}</h2>
              <button onClick={() => setIsEstimateModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSaveJobEstimate} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={estimateFormData.customer_name} 
                    onChange={e => setEstimateFormData({...estimateFormData, customer_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={estimateFormData.customer_phone} 
                    onChange={e => setEstimateFormData({...estimateFormData, customer_phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Vehicle Model *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={estimateFormData.vehicle_model} 
                    onChange={e => setEstimateFormData({...estimateFormData, vehicle_model: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">VIN / Registration No</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={estimateFormData.vin} 
                    onChange={e => setEstimateFormData({...estimateFormData, vin: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Estimated Labor Charges (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={estimateFormData.estimated_labor} 
                    onChange={e => setEstimateFormData({...estimateFormData, estimated_labor: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Estimated Parts Cost (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={estimateFormData.estimated_parts} 
                    onChange={e => setEstimateFormData({...estimateFormData, estimated_parts: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label className="form-label">Complaints / Job Scope</label>
                <textarea 
                  rows="3" 
                  className="form-input" 
                  value={estimateFormData.complaints} 
                  onChange={e => setEstimateFormData({...estimateFormData, complaints: e.target.value})} 
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsEstimateModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingEstimate ? 'Update Estimate' : 'Save Job Estimate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DIRECT SERVICE INVOICE
          ===================================================================== */}
      {isServiceInvoiceModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h2>Issue Service Tax Invoice</h2>
              <button onClick={() => setIsServiceInvoiceModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateServiceInvoice} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={serviceInvoiceFormData.customer_name} 
                    onChange={e => setServiceInvoiceFormData({...serviceInvoiceFormData, customer_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={serviceInvoiceFormData.customer_phone} 
                    onChange={e => setServiceInvoiceFormData({...serviceInvoiceFormData, customer_phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Vehicle Model *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={serviceInvoiceFormData.vehicle_model} 
                    onChange={e => setServiceInvoiceFormData({...serviceInvoiceFormData, vehicle_model: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Technician</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={serviceInvoiceFormData.technician_name} 
                    onChange={e => setServiceInvoiceFormData({...serviceInvoiceFormData, technician_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Labor Charges (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={serviceInvoiceFormData.labor_charges} 
                    onChange={e => setServiceInvoiceFormData({...serviceInvoiceFormData, labor_charges: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Parts Charges (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={serviceInvoiceFormData.parts_charges} 
                    onChange={e => setServiceInvoiceFormData({...serviceInvoiceFormData, parts_charges: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-select"
                    value={serviceInvoiceFormData.payment_mode}
                    onChange={e => setServiceInvoiceFormData({...serviceInvoiceFormData, payment_mode: e.target.value})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / Card">UPI / Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsServiceInvoiceModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Service Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: QUICK COUNTER BILLING (SPARE / ACCESSORIES)
          ===================================================================== */}
      {isSpareInvoiceModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h2>Issue {invoiceTypeSelect} Counter Invoice</h2>
              <button onClick={() => setIsSpareInvoiceModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleCreateSpareInvoice} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={spareInvoiceFormData.customer_name} 
                    onChange={e => setSpareInvoiceFormData({...spareInvoiceFormData, customer_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={spareInvoiceFormData.customer_phone} 
                    onChange={e => setSpareInvoiceFormData({...spareInvoiceFormData, customer_phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Vehicle Registration No</label>
                  <input 
                    type="text" 
                    placeholder="MH-12-XX-0000" 
                    className="form-input" 
                    value={spareInvoiceFormData.vehicle_number} 
                    onChange={e => setSpareInvoiceFormData({...spareInvoiceFormData, vehicle_number: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-select"
                    value={spareInvoiceFormData.payment_mode}
                    onChange={e => setSpareInvoiceFormData({...spareInvoiceFormData, payment_mode: e.target.value})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / Card">UPI / Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Part selector */}
              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Pick Item from Warehouse Catalog</label>
                <select 
                  className="form-select"
                  value={spareInvoiceFormData.part_id}
                  onChange={e => {
                    const sel = parts.find(p => p.id === e.target.value);
                    if (sel) {
                      setSpareInvoiceFormData({
                        ...spareInvoiceFormData,
                        part_id: sel.id,
                        part_name: sel.name,
                        part_code: sel.partNumber || sel.part_number,
                        price: sel.sellingPrice || sel.selling_price || 0
                      });
                    }
                  }}
                >
                  <option value="">-- Or type custom part details below --</option>
                  {parts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.partNumber || p.part_number} - {p.name} (₹{p.sellingPrice || p.selling_price})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginTop: '12px' }}>
                <div>
                  <label className="form-label">Item / Part Description</label>
                  <input 
                    type="text" 
                    required
                    className="form-input" 
                    value={spareInvoiceFormData.part_name}
                    onChange={e => setSpareInvoiceFormData({...spareInvoiceFormData, part_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    className="form-input" 
                    value={spareInvoiceFormData.qty}
                    onChange={e => setSpareInvoiceFormData({...spareInvoiceFormData, qty: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="form-label">Unit Rate (₹)</label>
                  <input 
                    type="number" 
                    required
                    className="form-input" 
                    value={spareInvoiceFormData.price}
                    onChange={e => setSpareInvoiceFormData({...spareInvoiceFormData, price: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px', textAlign: 'right', fontSize: '0.92rem', color: '#38bdf8' }}>
                Estimated Total: ₹{((spareInvoiceFormData.qty * spareInvoiceFormData.price) * 1.18).toFixed(0)} (with 18% GST)
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsSpareInvoiceModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Tax Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRINT MODAL: SPARE INVOICE
          ===================================================================== */}
      {selectedPrintSpareInv && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px', background: '#ffffff', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0369a1', fontWeight: 800 }}>APEX HORIZON MOTORS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Spare Parts Division • GSTIN: 27AAACA9928P1Z8</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>TAX INVOICE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>{selectedPrintSpareInv.invoice_number}</div>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.88rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '14px' }}>
                <div>
                  <strong>Customer:</strong> {selectedPrintSpareInv.customer_name}<br />
                  Phone: {selectedPrintSpareInv.customer_phone}
                </div>
                <div>
                  <strong>Vehicle:</strong> {selectedPrintSpareInv.vehicle_number || 'Walk-in'}<br />
                  Date: {selectedPrintSpareInv.invoice_date}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Item Description</th>
                    <th style={{ textAlign: 'center', padding: '6px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px' }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '6px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPrintSpareInv.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px' }}>{it.name || it.code}</td>
                      <td style={{ textAlign: 'center', padding: '6px' }}>{it.qty || 1}</td>
                      <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(it.price || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number((it.qty || 1) * (it.price || 0)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', padding: '6px' }}><strong>Subtotal:</strong></td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintSpareInv.subtotal || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', padding: '6px' }}><strong>GST (18%):</strong></td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintSpareInv.tax_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>
                    <td colSpan="3" style={{ textAlign: 'right', padding: '6px' }}>Total Amount:</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintSpareInv.total_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedPrintSpareInv(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRINT MODAL: SERVICE INVOICE
          ===================================================================== */}
      {selectedPrintServiceInv && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '620px', background: '#ffffff', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0369a1', fontWeight: 800 }}>APEX HORIZON MOTORS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Workshop & Authorized Service Center • GSTIN: 27AAACA9928P1Z8</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>SERVICE TAX INVOICE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>{selectedPrintServiceInv.invoice_number}</div>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.88rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '14px' }}>
                <div>
                  <strong>Customer:</strong> {selectedPrintServiceInv.customer_name}<br />
                  Phone: {selectedPrintServiceInv.customer_phone}
                </div>
                <div>
                  <strong>Vehicle:</strong> {selectedPrintServiceInv.vehicle_model}<br />
                  Technician: {selectedPrintServiceInv.technician_name}<br />
                  Date: {selectedPrintServiceInv.invoice_date}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Charge Breakdown</th>
                    <th style={{ textAlign: 'right', padding: '6px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px' }}>Labor & Technical Charges</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintServiceInv.labor_charges || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px' }}>Spare Parts Consumed</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintServiceInv.parts_charges || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'right', padding: '6px' }}><strong>Subtotal:</strong></td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintServiceInv.subtotal || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'right', padding: '6px' }}><strong>GST (18%):</strong></td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintServiceInv.tax_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>
                    <td style={{ textAlign: 'right', padding: '6px' }}>Total Amount Billed:</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintServiceInv.total_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedPrintServiceInv(null)} className="btn btn-secondary">Close</button>
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
