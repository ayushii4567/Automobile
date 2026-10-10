import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// The 5 Master Business Sections
import SalesManagement from './pages/SalesManagement';
import ServiceManagement from './pages/ServiceManagement';
import ExchangeManagement from './pages/ExchangeManagement';
import AccountsManagement from './pages/AccountsManagement';
import ReportsManagement from './pages/ReportsManagement';

// Supporting Dealership Infrastructure (Admin only)
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import Login from './pages/Login';

import InvoiceModal from './components/InvoiceModal';
import VehicleModal from './components/modals/VehicleModal';
import CustomerModal from './components/modals/CustomerModal';
import SaleModal from './components/modals/SaleModal';
import TestDriveModal from './components/modals/TestDriveModal';
import EstimateModal from './components/modals/EstimateModal';
import EstimateViewModal from './components/modals/EstimateViewModal';
import ServiceModal from './components/modals/ServiceModal';
import StaffModal from './components/modals/StaffModal';
import EnquiryModal from './components/modals/EnquiryModal';
import QuotationModal from './components/modals/QuotationModal';
import QuotationViewModal from './components/modals/QuotationViewModal';
import PartModal from './components/modals/PartModal';
import ProcurementModal from './components/modals/ProcurementModal';
import ReceiptModal from './components/ReceiptModal';

import { api } from './api';
import { CheckCircle2, AlertCircle, Settings as SettingsIcon, DatabaseBackup } from 'lucide-react';

export default function App() {
  // Authentication state (ADMIN or SALES_EXECUTIVE)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('sales_management');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState('settings');
  const [activeSubTab, setActiveSubTab] = useState(null);

  // Existing Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [testdrives, setTestdrives] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [settings, setSettings] = useState({});
  const [enquiries, setEnquiries] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [parts, setParts] = useState([]);
  const [procurement, setProcurement] = useState([]);

  // 9 New Module Data states
  const [pdiList, setPdiList] = useState([]);
  const [tradeIns, setTradeIns] = useState([]);
  const [financeApps, setFinanceApps] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [remindersCount, setRemindersCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);

  const [loading, setLoading] = useState(true);

  // Modals state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState(null);
  const [initialPaymentData, setInitialPaymentData] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [preselectedVehicleForSale, setPreselectedVehicleForSale] = useState(null);

  const [isTestDriveModalOpen, setIsTestDriveModalOpen] = useState(false);
  const [testDriveInitialData, setTestDriveInitialData] = useState(null);

  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [estimateInitialData, setEstimateInitialData] = useState(null);
  const [isEstimateViewOpen, setIsEstimateViewOpen] = useState(false);
  const [selectedEstimateForView, setSelectedEstimateForView] = useState(null);

  const [financeInitialData, setFinanceInitialData] = useState(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);

  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [isQuotationViewOpen, setIsQuotationViewOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);

  const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState(null);

  // Verify session persistence on mount
  useEffect(() => {
    async function verifySession() {
      const token = localStorage.getItem('apex_token');
      if (token) {
        try {
          const user = await api.getMe();
          if (user) {
            setCurrentUser(user);
            localStorage.setItem('apex_user', JSON.stringify(user));
          }
        } catch {
          setCurrentUser(null);
          localStorage.removeItem('apex_user');
          localStorage.removeItem('apex_token');
        }
      }
    }
    verifySession();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const userRole = (currentUser?.role || 'ADMIN').toUpperCase();
  const isAdmin = userRole === 'ADMIN';

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('apex_user', JSON.stringify(user));
    } catch {}
    setActiveTab('sales_management');
    const role = (user.role || '').toUpperCase();
    showToast(`Signed in as ${user.name} (${role === 'ADMIN' ? 'Administrator' : 'Sales Floor Executive'})`);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentUser(null);
    try {
      localStorage.removeItem('apex_user');
      localStorage.removeItem('apex_token');
    } catch {}
    setActiveTab('sales_management');
    showToast('Logged out of dealership session.');
  };

  // Fetch module datasets based on RBAC permissions
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const isRoleAdmin = (currentUser?.role || '').toUpperCase() === 'ADMIN';

      const commonRequests = [
        api.getDashboard().catch(() => null),
        api.getVehicles().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getSales().catch(() => []),
        api.getTestDrives().catch(() => []),
        api.getEnquiries().catch(() => []),
        api.getEstimates().catch(() => []),
        api.getQuotations().catch(() => []),
        api.getPDI().catch(() => []),
        api.getTradeIns().catch(() => []),
        api.getFinanceApps().catch(() => []),
        api.getInsurance().catch(() => []),
        api.getWarranties().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getPayments().catch(() => []),
        api.getFeedback().catch(() => []),
        api.getDealershipProfile().catch(() => ({})),
        api.getAutomatedReminders().catch(() => null),
        api.getCampaigns().catch(() => [])
      ];

      const adminRequests = isRoleAdmin ? [
        api.getServices().catch(() => []),
        api.getStaff().catch(() => []),
        api.getSettings().catch(() => ({})),
        api.getParts().catch(() => []),
        api.getProcurement().catch(() => []),
        api.getVendors().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getPayroll().catch(() => []),
        api.getExpenses().catch(() => [])
      ] : [
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve({}),
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve([])
      ];

      const [
        dash, vehs, custs, sls, tds, enqs, ests, quots,
        pdis, trades, finApps, ins, wars, apts, pays, fbs, prof, rems, camps,
        srvs, stf, stgs, prts, procs, vends, logs, payr, exps
      ] = await Promise.all([...commonRequests, ...adminRequests]);

      if (dash) setDashboardData(dash);
      setVehicles(vehs || []);
      setCustomers(custs || []);
      setSales(sls || []);
      setTestdrives(tds || []);
      setEnquiries(enqs || []);
      setEstimates(ests || []);
      setQuotations(quots || []);
      setPdiList(pdis || []);
      setTradeIns(trades || []);
      setFinanceApps(finApps || []);
      setInsurance(ins || []);
      setWarranties(wars || []);
      setAppointments(apts || []);
      setPayments(pays || []);
      setFeedback(fbs || []);
      if (rems?.totalReminders !== undefined) setRemindersCount(rems.totalReminders);
      if (Array.isArray(camps)) setCampaignsCount(camps.length);
      setServices(srvs || []);
      setStaff(stf || []);
      setSettings({ ...(prof || {}), ...(stgs || {}) });
      setParts(prts || []);
      setProcurement(procs || []);
      setVendors(vends || []);
      setAuditLogs(logs || []);
      setPayroll(payr || []);
      setExpenses(exps || []);
    } catch (err) {
      console.error('Failed to load showroom datasets:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleTriggerPayment = (data) => {
    setInitialPaymentData(data);
    setActiveTab('payments');
  };

  // ================= CRUD HANDLERS =================

  // Vehicles
  const handleSaveVehicle = async (data) => {
    try {
      if (editingVehicle) {
        const updated = await api.updateVehicle(editingVehicle.id, data);
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? updated : v));
        showToast(`Vehicle ${data.brand} ${data.model} updated successfully.`);
      } else {
        const created = await api.createVehicle(data);
        setVehicles(prev => [created, ...prev]);
        showToast(`New vehicle ${data.brand} ${data.model} added to stock.`);
      }
      setIsVehicleModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to save vehicle.', 'error');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from inventory?')) return;
    try {
      await api.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      showToast('Vehicle removed from inventory.');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete vehicle.', 'error');
    }
  };

  // Customers
  const handleSaveCustomer = async (data) => {
    try {
      if (editingCustomer) {
        const updated = await api.updateCustomer(editingCustomer.id, data);
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));
        showToast(`Customer ${data.name} updated.`);
      } else {
        const created = await api.createCustomer(data);
        setCustomers(prev => [created, ...prev]);
        showToast(`Customer ${data.name} registered.`);
      }
      setIsCustomerModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to save customer.', 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    try {
      await api.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Customer record deleted.');
      loadAllData();
    } catch {
      showToast('Failed to delete customer.', 'error');
    }
  };

  // Sales (Connected Workflow)
  const handleSaveSale = async (data) => {
    try {
      const created = await api.createSale(data);
      setSales(prev => [created, ...prev]);
      showToast(`Sale Order #${created.saleOrderNumber || created.invoiceNo} executed! Vehicle marked SOLD.`);
      setIsSaleModalOpen(false);
      await loadAllData();
      setSelectedInvoiceSale(created);
      setIsInvoiceOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to process sale order.', 'error');
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm('Delete this sales invoice record?')) return;
    try {
      await api.deleteSale(id);
      setSales(prev => prev.filter(s => s.id !== id));
      showToast('Sale record deleted.');
      loadAllData();
    } catch {
      showToast('Failed to delete sale record.', 'error');
    }
  };

  // Enquiries
  const handleSaveEnquiry = async (data) => {
    try {
      if (editingEnquiry) {
        const updated = await api.updateEnquiry(editingEnquiry.id, data);
        setEnquiries(prev => prev.map(e => e.id === editingEnquiry.id ? updated : e));
        showToast('Enquiry updated.');
      } else {
        const created = await api.createEnquiry(data);
        setEnquiries(prev => [created, ...prev]);
        showToast('New lead added to sales pipeline.');
      }
      setIsEnquiryModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to save enquiry.', 'error');
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Delete this enquiry lead?')) return;
    try {
      await api.deleteEnquiry(id);
      setEnquiries(prev => prev.filter(e => e.id !== id));
      showToast('Enquiry lead deleted.');
      loadAllData();
    } catch {
      showToast('Failed to delete enquiry.', 'error');
    }
  };

  // Workflow Conversion: Lead -> Customer
  const handleConvertLeadToCustomer = async (lead) => {
    try {
      await api.convertLeadToCustomer(lead.id);
      showToast(`Lead ${lead.contact_name || lead.customerName} successfully converted to registered customer!`);
      await loadAllData();
      setActiveTab('customers');
    } catch (err) {
      showToast(err.message || 'Failed to convert lead to customer.', 'error');
    }
  };

  // Estimates (Workflow Step: Test Drive -> Estimate -> Quotation)
  const handleSaveEstimate = async (data) => {
    try {
      if (editingEstimate) {
        const updated = await api.updateEstimate(editingEstimate.id, data);
        setEstimates(prev => prev.map(e => e.id === editingEstimate.id ? updated : e));
        showToast(`Estimate #${updated.estimateNo || updated.estimate_number || updated.id} updated.`);
      } else {
        const created = await api.createEstimate(data);
        setEstimates(prev => [created, ...prev]);
        showToast(`Estimate #${created.estimateNo || created.estimate_number || created.id} generated!`);
      }
      setIsEstimateModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to save vehicle estimate.', 'error');
    }
  };

  const handleDeleteEstimate = async (id) => {
    if (!window.confirm('Delete this price estimate?')) return;
    try {
      await api.deleteEstimate(id);
      setEstimates(prev => prev.filter(e => e.id !== id));
      showToast('Estimate record removed.');
      loadAllData();
    } catch {
      showToast('Failed to delete estimate.', 'error');
    }
  };

  const handleConvertEstimateToQuotation = async (est) => {
    try {
      const res = await api.convertEstimateToQuotation(est.id);
      showToast(`Estimate converted into official Quotation #${res.quotation?.quotation_number || 'New'}!`);
      await loadAllData();
      setActiveTab('quotations');
    } catch (err) {
      showToast(err.message || 'Failed to convert estimate to quotation.', 'error');
    }
  };

  // Workflow Conversion: Quotation -> EMI / Finance
  const handleApplyFinanceFromQuotation = (quot) => {
    const matchedVehicle = vehicles.find(v => v.id === (quot.vehicleId || quot.vehicle_id));
    const price = Number(quot.totalAmount || quot.total || quot.exShowroomPrice || 1500000);
    setFinanceInitialData({
      quotationNo: quot.quotationNo || quot.quotation_number,
      vehicleId: quot.vehicleId || quot.vehicle_id || matchedVehicle?.id,
      vehicleName: quot.vehicleName || quot.vehicle_name,
      customerId: quot.customerId || quot.customer_id,
      customerName: quot.customerName || quot.customer_name,
      totalAmount: price,
      vehiclePrice: price
    });
    setActiveTab('finance');
    showToast(`Transferred Quotation #${quot.quotationNo || quot.quotation_number} to EMI & Loan Calculator.`);
  };

  const handleApplyLoanFromCalculator = async (loanData) => {
    try {
      await handleAddFinanceApp(loanData);
      setActiveTab('finance-apps');
    } catch {
      showToast('Failed to submit loan application.', 'error');
    }
  };

  // Quotations
  const handleSaveQuotation = async (data) => {
    try {
      if (editingQuotation) {
        const updated = await api.updateQuotation(editingQuotation.id, data);
        setQuotations(prev => prev.map(q => q.id === editingQuotation.id ? updated : q));
        showToast('Quotation updated.');
      } else {
        const created = await api.createQuotation(data);
        setQuotations(prev => [created, ...prev]);
        showToast(`Quotation #${created.quotationNo} generated.`);
      }
      setIsQuotationModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to save quotation.', 'error');
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      await api.deleteQuotation(id);
      setQuotations(prev => prev.filter(q => q.id !== id));
      showToast('Quotation deleted.');
      loadAllData();
    } catch {
      showToast('Failed to delete quotation.', 'error');
    }
  };

  const handleConvertToSale = (quot) => {
    setIsQuotationViewOpen(false);
    const matchedVehicle = vehicles.find(v => v.id === (quot.vehicleId || quot.vehicle_id));
    setPreselectedVehicleForSale({
      quotationId: quot.id,
      id: quot.vehicleId || quot.vehicle_id || matchedVehicle?.id,
      brand: quot.vehicleName ? quot.vehicleName.split(' ')[0] : (matchedVehicle?.brand || 'Vehicle'),
      model: quot.vehicleName ? quot.vehicleName.slice(quot.vehicleName.indexOf(' ') + 1) : (matchedVehicle?.model || ''),
      price: quot.exShowroomPrice || quot.ex_showroom_price || matchedVehicle?.price,
      customerName: quot.customerName || quot.customer_name,
      customerId: quot.customerId || quot.customer_id
    });
    setIsSaleModalOpen(true);
    showToast(`Quotation #${quot.quotationNo || quot.quotation_number} ready for vehicle sale agreement.`);
  };

  // Test Drives
  const handleSaveTestDrive = async (data) => {
    try {
      const created = await api.createTestDrive(data);
      setTestdrives(prev => [created, ...prev]);
      showToast(`Test drive confirmed for ${created.customerName}.`);
      setIsTestDriveModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to schedule test drive.', 'error');
    }
  };

  const handleUpdateTestDriveStatus = async (id, status) => {
    try {
      const updated = await api.updateTestDrive(id, { status });
      setTestdrives(prev => prev.map(td => td.id === id ? updated : td));
      showToast(`Test drive status updated to ${status}.`);
      loadAllData();
    } catch {
      showToast('Failed to update test drive.', 'error');
    }
  };

  const handleDeleteTestDrive = async (id) => {
    if (!window.confirm('Delete this test drive booking?')) return;
    try {
      await api.deleteTestDrive(id);
      setTestdrives(prev => prev.filter(t => t.id !== id));
      showToast('Test drive record removed.');
      loadAllData();
    } catch {
      showToast('Failed to delete test drive.', 'error');
    }
  };

  // PDI Handover (NEW)
  const handleAddPDI = async (data) => {
    try {
      const created = await api.createPDI(data);
      setPdiList(prev => [created, ...prev]);
      showToast(`PDI Inspection ${created.pdiNo} recorded.`);
      loadAllData();
    } catch {
      showToast('Failed to create PDI inspection.', 'error');
    }
  };

  const handleUpdatePDI = async (id, data) => {
    try {
      const updated = await api.updatePDI(id, data);
      setPdiList(prev => prev.map(p => p.id === id ? updated : p));
      showToast(`PDI Certificate ${updated.pdiNo} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update PDI inspection.', 'error');
    }
  };

  // Trade-Ins (NEW)
  const handleAddTradeIn = async (data) => {
    try {
      const created = await api.createTradeIn(data);
      setTradeIns(prev => [created, ...prev]);
      showToast(`Exchange Assessment ${created.exchangeNo} logged.`);
      loadAllData();
    } catch {
      showToast('Failed to record trade-in.', 'error');
    }
  };

  const handleUpdateTradeIn = async (id, data) => {
    try {
      const updated = await api.updateTradeIn(id, data);
      setTradeIns(prev => prev.map(t => t.id === id ? updated : t));
      showToast(`Exchange Assessment ${updated.exchangeNo} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update trade-in.', 'error');
    }
  };

  // Finance Applications (NEW)
  const handleAddFinanceApp = async (data) => {
    try {
      const created = await api.createFinanceApp(data);
      setFinanceApps(prev => [created, ...prev]);
      showToast(`Bank loan application ${created.applicationNo} submitted.`);
      loadAllData();
    } catch {
      showToast('Failed to submit finance application.', 'error');
    }
  };

  const handleUpdateFinanceApp = async (id, data) => {
    try {
      const updated = await api.updateFinanceApp(id, data);
      setFinanceApps(prev => prev.map(f => f.id === id ? updated : f));
      showToast(`Loan application ${updated.applicationNo} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update finance file.', 'error');
    }
  };

  // Insurance (NEW)
  const handleAddInsurance = async (data) => {
    try {
      const created = await api.createInsurance(data);
      setInsurance(prev => [created, ...prev]);
      showToast(`Insurance policy ${created.policyNo} registered.`);
      loadAllData();
    } catch {
      showToast('Failed to register insurance policy.', 'error');
    }
  };

  const handleUpdateInsurance = async (id, data) => {
    try {
      const updated = await api.updateInsurance(id, data);
      setInsurance(prev => prev.map(i => i.id === id ? updated : i));
      showToast(`Insurance policy ${updated.policyNo} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update insurance policy.', 'error');
    }
  };

  // Warranties (NEW)
  const handleAddWarranty = async (data) => {
    try {
      const created = await api.createWarranty(data);
      setWarranties(prev => [created, ...prev]);
      showToast(`Warranty plan ${created.warrantyNo} enrolled.`);
      loadAllData();
    } catch {
      showToast('Failed to enroll warranty.', 'error');
    }
  };

  const handleUpdateWarranty = async (id, data) => {
    try {
      const updated = await api.updateWarranty(id, data);
      setWarranties(prev => prev.map(w => w.id === id ? updated : w));
      showToast(`Warranty plan ${updated.warrantyNo} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update warranty plan.', 'error');
    }
  };

  // Service Bay Appointments (NEW)
  const handleAddAppointment = async (data) => {
    try {
      const created = await api.createAppointment(data);
      setAppointments(prev => [created, ...prev]);
      showToast(`Workshop appointment ${created.appointmentNo} booked.`);
      loadAllData();
    } catch {
      showToast('Failed to book appointment.', 'error');
    }
  };

  const handleUpdateAppointment = async (id, data) => {
    try {
      const updated = await api.updateAppointment(id, data);
      setAppointments(prev => prev.map(a => a.id === id ? updated : a));
      showToast(`Appointment ${updated.appointmentNo} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update appointment.', 'error');
    }
  };

  const handleConvertToService = (appt) => {
    setIsServiceModalOpen(true);
  };

  // Service Job Cards
  const handleSaveService = async (data) => {
    try {
      const created = await api.createService(data);
      setServices(prev => [created, ...prev]);
      showToast(`Job Card #${created.ticketNo} generated.`);
      setIsServiceModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to open job card.', 'error');
    }
  };

  const handleUpdateServiceStatus = async (id, status) => {
    try {
      const updated = await api.updateService(id, { status });
      setServices(prev => prev.map(s => s.id === id ? updated : s));
      showToast(`Service ticket status updated to ${status}.`);
      loadAllData();
    } catch {
      showToast('Failed to update service ticket.', 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service job card?')) return;
    try {
      await api.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      showToast('Service ticket deleted.');
      loadAllData();
    } catch {
      showToast('Failed to delete service ticket.', 'error');
    }
  };

  const handleAllocateServiceParts = async (jobCardId, partsList) => {
    try {
      const res = await api.allocateJobCardParts(jobCardId, partsList);
      showToast(res.message || `Allocated genuine components to Job Card ${res.jobCardNumber || ''}. Stock deducted!`);
      await loadAllData();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to allocate spare parts.', 'error');
      throw err;
    }
  };

  // Spare Parts
  const handleSavePart = async (data) => {
    try {
      if (editingPart) {
        const updated = await api.updatePart(editingPart.id, data);
        setParts(prev => prev.map(p => p.id === editingPart.id ? updated : p));
        showToast(`Spare part ${data.name} updated.`);
      } else {
        const created = await api.createPart(data);
        setParts(prev => [created, ...prev]);
        showToast(`Spare part ${data.name} added to stock.`);
      }
      setIsPartModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to save part.', 'error');
    }
  };

  const handleUpdatePartStock = async (id, newStock) => {
    try {
      const updated = await api.updatePart(id, { stock: newStock });
      setParts(prev => prev.map(p => p.id === id ? updated : p));
      showToast('Part stock quantity updated.');
      loadAllData();
    } catch {
      showToast('Failed to update stock.', 'error');
    }
  };

  const handleDeletePart = async (id) => {
    if (!window.confirm('Delete this spare part entry?')) return;
    try {
      await api.deletePart(id);
      setParts(prev => prev.filter(p => p.id !== id));
      showToast('Spare part deleted.');
      loadAllData();
    } catch {
      showToast('Failed to delete part.', 'error');
    }
  };

  // Procurement (Connected Workflow)
  const handleSaveProcurement = async (data) => {
    try {
      if (editingProcurement) {
        const updated = await api.updateProcurement(editingProcurement.id, data);
        setProcurement(prev => prev.map(p => p.id === editingProcurement.id ? updated : p));
        showToast('Factory order updated.');
      } else {
        const created = await api.createProcurement(data);
        setProcurement(prev => [created, ...prev]);
        showToast(`Factory Purchase Order #${created.poNumber} placed.`);
      }
      setIsProcurementModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to save procurement order.', 'error');
    }
  };

  const handleUpdateProcurementStatus = async (id, status) => {
    try {
      const updated = await api.updateProcurement(id, { status });
      setProcurement(prev => prev.map(p => p.id === id ? updated : p));
      showToast(`Order status updated to ${status}. Auto-inventory synchronized.`);
      loadAllData();
    } catch {
      showToast('Failed to update PO status.', 'error');
    }
  };

  const handleProcurementAddToInventory = async (order) => {
    try {
      const res = await api.receiveProcurementOrder(order.id, {
        suggestedRetailPrice: order.suggestedRetailPrice || order.suggested_retail_price
      });
      showToast(res.message || `Vehicle ${order.brand} ${order.model} intake complete! Added to live inventory.`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to receive vehicle into inventory.', 'error');
    }
  };

  const handleDeleteProcurement = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await api.deleteProcurement(id);
      setProcurement(prev => prev.filter(p => p.id !== id));
      showToast('Order record deleted.');
      loadAllData();
    } catch {
      showToast('Failed to delete procurement order.', 'error');
    }
  };

  // Vendors (NEW)
  const handleAddVendor = async (data) => {
    try {
      const created = await api.createVendor(data);
      setVendors(prev => [created, ...prev]);
      showToast(`Vendor ${created.companyName} onboarded.`);
      loadAllData();
    } catch {
      showToast('Failed to onboard vendor.', 'error');
    }
  };

  const handleUpdateVendor = async (id, data) => {
    try {
      const updated = await api.updateVendor(id, data);
      setVendors(prev => prev.map(v => v.id === id ? updated : v));
      showToast(`Vendor ${updated.companyName} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update vendor.', 'error');
    }
  };

  // Payments (NEW)
  const handleAddPayment = async (data) => {
    try {
      const created = await api.createPayment(data);
      setPayments(prev => [created, ...prev]);
      showToast(`Payment receipt ${created.receiptNo || created.receipt_number} of ₹${Number(created.amount).toLocaleString('en-IN')} issued!`);
      await loadAllData();
      return created;
    } catch (err) {
      showToast(err.message || 'Failed to issue payment receipt.', 'error');
      throw err;
    }
  };

  const handleUpdatePayment = async (id, data) => {
    try {
      const updated = await api.updatePayment(id, data);
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
      showToast(`Payment receipt ${updated.receiptNo} updated.`);
      loadAllData();
    } catch {
      showToast('Failed to update payment record.', 'error');
    }
  };

  // Feedback (NEW)
  const handleAddFeedback = async (data) => {
    try {
      const created = await api.createFeedback(data);
      setFeedback(prev => [created, ...prev]);
      showToast(`Customer review (${created.ratingScore} Stars) recorded.`);
      loadAllData();
    } catch {
      showToast('Failed to record feedback.', 'error');
    }
  };

  const handleUpdateFeedback = async (id, data) => {
    try {
      const updated = await api.updateFeedback(id, data);
      setFeedback(prev => prev.map(f => f.id === id ? updated : f));
      showToast('Feedback survey updated.');
      loadAllData();
    } catch {
      showToast('Failed to update feedback.', 'error');
    }
  };

  // Staff
  const handleSaveStaff = async (data) => {
    try {
      if (editingStaff) {
        const updated = await api.updateStaff(editingStaff.id, data);
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? updated : s));
        showToast(`Staff member ${data.name} updated.`);
      } else {
        const created = await api.createStaff(data);
        setStaff(prev => [created, ...prev]);
        showToast(`Staff member ${data.name} added.`);
      }
      setIsStaffModalOpen(false);
      loadAllData();
    } catch {
      showToast('Failed to save staff.', 'error');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await api.deleteStaff(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      showToast('Staff member removed.');
      loadAllData();
    } catch {
      showToast('Failed to delete staff member.', 'error');
    }
  };

  // Payroll (Admin Only)
  const handleAddPayroll = async (data) => {
    try {
      const created = await api.createPayroll(data);
      setPayroll(prev => [created, ...prev]);
      showToast(`Processed payroll for ${created.staff_name || 'staff'} (Net: ₹${Number(created.net_salary).toLocaleString('en-IN')})`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to create payroll record.', 'error');
    }
  };

  const handleUpdatePayroll = async (id, data) => {
    try {
      const updated = await api.updatePayroll(id, data);
      setPayroll(prev => prev.map(p => p.id === id ? updated : p));
      showToast(`Payroll record ${updated.payroll_period} updated.`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update payroll.', 'error');
    }
  };

  const handleDeletePayroll = async (id) => {
    try {
      await api.deletePayroll(id);
      setPayroll(prev => prev.filter(p => p.id !== id));
      showToast('Payroll record deleted.');
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete payroll record.', 'error');
    }
  };

  const handleGenerateBatchPayroll = async (data) => {
    try {
      const res = await api.generateBatchPayroll(data);
      showToast(res.message || `Generated ${res.count || 0} batch payroll records.`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to generate batch payroll.', 'error');
    }
  };

  // Expenses (Admin Only)
  const handleAddExpense = async (data) => {
    try {
      const created = await api.createExpense(data);
      setExpenses(prev => [created, ...prev]);
      showToast(`Expense voucher ${created.expense_code} recorded (₹${Number(created.amount).toLocaleString('en-IN')})`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to record expense.', 'error');
    }
  };

  const handleUpdateExpense = async (id, data) => {
    try {
      const updated = await api.updateExpense(id, data);
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
      showToast(`Expense voucher ${updated.expense_code} updated.`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update expense.', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast('Expense voucher deleted.');
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense.', 'error');
    }
  };

  // Settings
  const handleSaveSettings = async (data) => {
    try {
      const updated = await api.updateSettings(data);
      setSettings(updated);
      showToast('Showroom settings updated successfully.');
      loadAllData();
    } catch {
      showToast('Failed to save settings.', 'error');
    }
  };

  // Sidebar Counts
  const counts = useMemo(() => ({
    vehicles: vehicles.length,
    customers: customers.length,
    sales: sales.length,
    testdrives: testdrives.length,
    services: services.length,
    staff: staff.length,
    enquiries: enquiries.length,
    estimates: estimates.length,
    quotations: quotations.length,
    parts: parts.length,
    procurement: procurement.length,
    pdi: pdiList.length,
    tradeins: tradeIns.length,
    financeApps: financeApps.length,
    insurance: insurance.length,
    warranties: warranties.length,
    appointments: appointments.length,
    vendors: vendors.length,
    payments: payments.length,
    feedback: feedback.length,
    reminders: remindersCount,
    communications: campaignsCount || 2
  }), [vehicles, customers, sales, testdrives, services, staff, enquiries, estimates, quotations, parts, procurement, pdiList, tradeIns, financeApps, insurance, warranties, appointments, vendors, payments, feedback, remindersCount, campaignsCount]);

  // If not logged in, show Login page
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const handleSubTabChange = (secOrSub, maybeSub) => {
    if (maybeSub) {
      setActiveSubTab(maybeSub);
    } else {
      setActiveSubTab(secOrSub);
    }
  };

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type} animate-slide-down`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar with 5 Core Business Sections & Collapsible Submenus */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveSubTab(null);
        }}
        activeSubTab={activeSubTab}
        onSelectSubTab={(secId, subId) => {
          setActiveTab(secId);
          setActiveSubTab(subId);
        }}
        counts={counts}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSystemSettingsOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="app-main-wrapper">
        <Header 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setActiveSubTab(null);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          lowStockCount={vehicles.filter(v => Number(v.stock) <= 1 && v.status === 'Available').length}
          pendingTestDrivesCount={testdrives.filter(t => t.status === 'Scheduled').length}
          openTicketsCount={services.filter(s => s.status !== 'Completed').length}
        />

        <main className="app-main">
          {loading && !dashboardData && vehicles.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '14px' }}>
              <div className="spinner" />
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Connecting to Dealership SQLite Engine...</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: Sales Management */}
              {(activeTab === 'sales_management' || ['dashboard', 'inventory', 'customers', 'sales', 'enquiries', 'quotations', 'estimates', 'testdrives', 'pdi', 'documents'].includes(activeTab)) && (
                <SalesManagement 
                  currentUser={currentUser}
                  subTab={activeTab === 'sales_management' ? activeSubTab : null}
                  onSubTabChange={handleSubTabChange}
                  vehicles={vehicles}
                  customers={customers}
                  sales={sales}
                  enquiries={enquiries}
                  quotations={quotations}
                  estimates={estimates}
                  onOpenAddEnquiry={() => { setEditingEnquiry(null); setIsEnquiryModalOpen(true); }}
                  onOpenAddQuotation={() => { setEditingQuotation(null); setIsQuotationModalOpen(true); }}
                  onOpenAddSale={() => { setPreselectedVehicleForSale(null); setIsSaleModalOpen(true); }}
                  onViewInvoice={(sale) => { setSelectedInvoiceSale(sale); setIsInvoiceOpen(true); }}
                  onRecordPayment={handleTriggerPayment}
                />
              )}

              {/* SECTION 2: Service Management */}
              {(activeTab === 'service_management' || ['service', 'appointments', 'parts'].includes(activeTab)) && (
                <ServiceManagement 
                  currentUser={currentUser}
                  subTab={activeTab === 'service_management' ? activeSubTab : null}
                  onSubTabChange={handleSubTabChange}
                  services={services}
                  parts={parts}
                  customers={customers}
                  vehicles={vehicles}
                  onAddService={() => setIsServiceModalOpen(true)}
                />
              )}

              {/* SECTION 3: Exchange Management */}
              {(activeTab === 'exchange_management' || activeTab === 'tradeins') && (
                <ExchangeManagement 
                  currentUser={currentUser}
                  subTab={activeTab === 'exchange_management' ? activeSubTab : null}
                  onSubTabChange={handleSubTabChange}
                  onRecordPayment={handleTriggerPayment}
                />
              )}

              {/* SECTION 4: Accounts Management */}
              {(activeTab === 'accounts_management' || ['payments', 'expenses', 'payroll', 'finance', 'finance-apps', 'insurance', 'warranties', 'vendors', 'procurement'].includes(activeTab)) && (
                <AccountsManagement 
                  currentUser={currentUser}
                  subTab={activeTab === 'accounts_management' ? activeSubTab : null}
                  onSubTabChange={handleSubTabChange}
                  settings={settings}
                />
              )}

              {/* SECTION 5: Reports Management */}
              {(activeTab === 'reports_management' || ['reports', 'auditlogs'].includes(activeTab)) && (
                <ReportsManagement 
                  currentUser={currentUser}
                  subTab={activeTab === 'reports_management' ? activeSubTab : null}
                  onSubTabChange={handleSubTabChange}
                  settings={settings}
                />
              )}
            </>
          )}

          {/* Dealership Application Responsive Footer */}
          <footer className="app-footer">
            <div className="footer-content">
              <div className="footer-left">
                <span className="footer-brand">{settings.showroom_name || settings.showroomName || 'APEX HORIZON MOTORS'}</span>
                <span className="footer-separator">•</span>
                <span className="footer-status"><span className="status-dot active"></span> SQLite Enterprise Engine Live</span>
              </div>
              <div className="footer-right">
                <span>AutoCore Dealership OS v2.4</span>
                <span className="footer-separator">•</span>
                <span>GST: {settings.gstin || '27AAACA9928P1Z8'}</span>
                <span className="footer-separator">•</span>
                <span>© {new Date().getFullYear()} All Rights Reserved</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* ================= MODALS ================= */}
      {/* Dealership System Configuration & DB Maintenance Modal */}
      {isSystemSettingsOpen && isAdmin && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsSystemSettingsOpen(false)}
        >
          <div 
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                  <SettingsIcon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Dealership System Configuration</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Dealership profile, taxation, business parameters & database backup</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSystemSettingsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs inside modal */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setSettingsSubTab('settings')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: settingsSubTab === 'settings' ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Dealership Settings
              </button>
              <button
                type="button"
                onClick={() => setSettingsSubTab('backup')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: settingsSubTab === 'backup' ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <DatabaseBackup size={14} /> Database Backup & Maintenance
              </button>
            </div>

            {settingsSubTab === 'settings' ? (
              <Settings settings={settings} onSaveSettings={handleSaveSettings} />
            ) : (
              <Backup />
            )}
          </div>
        </div>
      )}
      <InvoiceModal 
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={selectedInvoiceSale}
        settings={settings}
        onRecordPayment={handleTriggerPayment}
      />

      {selectedReceipt && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => { setIsReceiptModalOpen(false); setSelectedReceipt(null); }}
          receipt={selectedReceipt}
          settings={settings}
        />
      )}

      <VehicleModal 
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
      />

      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
      />

      <SaleModal 
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSave={handleSaveSale}
        vehicles={vehicles}
        customers={customers}
        settings={settings}
        preselectedVehicle={preselectedVehicleForSale}
      />

      <TestDriveModal 
        isOpen={isTestDriveModalOpen}
        onClose={() => setIsTestDriveModalOpen(false)}
        onSave={handleSaveTestDrive}
        vehicles={vehicles}
        initialData={testDriveInitialData}
      />

      <EstimateModal 
        isOpen={isEstimateModalOpen}
        onClose={() => setIsEstimateModalOpen(false)}
        onSave={handleSaveEstimate}
        estimate={editingEstimate}
        vehicles={vehicles}
        customers={customers}
        initialData={estimateInitialData}
      />

      <EstimateViewModal
        isOpen={isEstimateViewOpen}
        onClose={() => { setIsEstimateViewOpen(false); setSelectedEstimateForView(null); }}
        estimate={selectedEstimateForView}
        settings={settings}
        onConvertToQuotation={handleConvertEstimateToQuotation}
      />

      <ServiceModal 
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
      />

      <StaffModal 
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSave={handleSaveStaff}
        staffMember={editingStaff}
      />

      <EnquiryModal 
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        onSave={handleSaveEnquiry}
        enquiry={editingEnquiry}
        vehicles={vehicles}
      />

      <QuotationModal 
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onSave={handleSaveQuotation}
        quotation={editingQuotation}
        vehicles={vehicles}
        customers={customers}
      />

      <QuotationViewModal 
        isOpen={isQuotationViewOpen}
        onClose={() => setIsQuotationViewOpen(false)}
        quotation={selectedQuotation}
        settings={settings}
      />

      <PartModal 
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        onSave={handleSavePart}
        part={editingPart}
      />

      <ProcurementModal 
        isOpen={isProcurementModalOpen}
        onClose={() => setIsProcurementModalOpen(false)}
        onSave={handleSaveProcurement}
        order={editingProcurement}
      />
    </div>
  );
}
