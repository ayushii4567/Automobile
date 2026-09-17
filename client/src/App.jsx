import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import TestDrives from './pages/TestDrives';
import Service from './pages/Service';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import Enquiries from './pages/Enquiries';
import Quotations from './pages/Quotations';
import Parts from './pages/Parts';
import Procurement from './pages/Procurement';
import Login from './pages/Login';

import InvoiceModal from './components/InvoiceModal';
import VehicleModal from './components/modals/VehicleModal';
import CustomerModal from './components/modals/CustomerModal';
import SaleModal from './components/modals/SaleModal';
import TestDriveModal from './components/modals/TestDriveModal';
import ServiceModal from './components/modals/ServiceModal';
import StaffModal from './components/modals/StaffModal';
import EnquiryModal from './components/modals/EnquiryModal';
import QuotationModal from './components/modals/QuotationModal';
import QuotationViewModal from './components/modals/QuotationViewModal';
import PartModal from './components/modals/PartModal';
import ProcurementModal from './components/modals/ProcurementModal';

import { api } from './api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication state (Admin or Sales Executive)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [testdrives, setTestdrives] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [settings, setSettings] = useState({});
  const [enquiries, setEnquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [parts, setParts] = useState([]);
  const [procurement, setProcurement] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [preselectedVehicleForSale, setPreselectedVehicleForSale] = useState(null);

  const [isTestDriveModalOpen, setIsTestDriveModalOpen] = useState(false);
  const [testDriveInitialData, setTestDriveInitialData] = useState(null);

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('apex_user', JSON.stringify(user));
    } catch {}
    if (user.role === 'sales' && ['staff', 'settings', 'reports', 'parts', 'procurement', 'service'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
    showToast(`Signed in as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Sales Executive'})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('apex_user');
    } catch {}
    setActiveTab('dashboard');
    showToast('Logged out of session.');
  };

  // Fetch all data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [dash, vehs, custs, sls, tds, srvs, stf, stgs, enqs, quots, prts, procs] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getVehicles().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getSales().catch(() => []),
        api.getTestDrives().catch(() => []),
        api.getServices().catch(() => []),
        api.getStaff().catch(() => []),
        api.getSettings().catch(() => ({})),
        api.getEnquiries().catch(() => []),
        api.getQuotations().catch(() => []),
        api.getParts().catch(() => []),
        api.getProcurement().catch(() => [])
      ]);

      setDashboardData(dash);
      setVehicles(vehs);
      setCustomers(custs);
      setSales(sls);
      setTestdrives(tds);
      setServices(srvs);
      setStaff(stf);
      setSettings(stgs);
      setEnquiries(enqs);
      setQuotations(quots);
      setParts(prts);
      setProcurement(procs);
    } catch (err) {
      console.error('Data load error:', err);
      showToast('Error syncing with backend', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh dashboard metrics
  const refreshDashboard = async () => {
    try {
      const dash = await api.getDashboard();
      setDashboardData(dash);
    } catch (e) {}
  };

  // ================= VEHICLE HANDLERS =================
  const handleSaveVehicle = async (vehicleData) => {
    try {
      if (editingVehicle) {
        const updated = await api.updateVehicle(editingVehicle.id, vehicleData);
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? updated : v));
        showToast(`Vehicle "${updated.brand} ${updated.model}" updated.`);
      } else {
        const created = await api.createVehicle(vehicleData);
        setVehicles(prev => [created, ...prev]);
        showToast(`Supercar "${created.brand} ${created.model}" added to showroom.`);
      }
      refreshDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to save vehicle', 'error');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Remove this vehicle from showroom inventory?')) return;
    try {
      await api.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      showToast('Vehicle removed from catalog.');
      refreshDashboard();
    } catch (err) {
      showToast('Failed to delete vehicle', 'error');
    }
  };

  // ================= CUSTOMER HANDLERS =================
  const handleSaveCustomer = async (custData) => {
    try {
      if (editingCustomer) {
        const updated = await api.updateCustomer(editingCustomer.id, custData);
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));
        showToast(`Client dossier "${updated.name}" updated.`);
      } else {
        const created = await api.createCustomer(custData);
        setCustomers(prev => [created, ...prev]);
        showToast(`Client "${created.name}" registered.`);
      }
      refreshDashboard();
    } catch (err) {
      showToast('Failed to save client', 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Archive this client profile?')) return;
    try {
      await api.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Client profile removed.');
      refreshDashboard();
    } catch (err) {
      showToast('Failed to delete client', 'error');
    }
  };

  // ================= SALES HANDLERS =================
  const handleSaveSale = async (saleData) => {
    try {
      const created = await api.createSale(saleData);
      setSales(prev => [created, ...prev]);
      showToast(`Sale finalized! Invoice ${created.invoiceNo} issued.`);
      
      if (saleData.vehicleId) {
        const updatedVehs = await api.getVehicles();
        setVehicles(updatedVehs);
      }

      refreshDashboard();
      setSelectedInvoiceSale(created);
      setIsInvoiceOpen(true);
    } catch (err) {
      showToast('Failed to record sale deal', 'error');
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm('Void and delete this contract record?')) return;
    try {
      await api.deleteSale(id);
      setSales(prev => prev.filter(s => s.id !== id));
      showToast('Contract record deleted.');
      refreshDashboard();
    } catch (err) {
      showToast('Failed to delete sale', 'error');
    }
  };

  // ================= TEST DRIVE HANDLERS =================
  const handleSaveTestDrive = async (tdData) => {
    try {
      const created = await api.createTestDrive(tdData);
      setTestdrives(prev => [created, ...prev]);
      showToast(`Test Drive scheduled for ${created.customerName}.`);
      refreshDashboard();
    } catch (err) {
      showToast('Failed to book test drive', 'error');
    }
  };

  const handleUpdateTestDriveStatus = async (id, status) => {
    try {
      const updated = await api.updateTestDrive(id, { status });
      setTestdrives(prev => prev.map(t => t.id === id ? updated : t));
      showToast(`Drive status set to "${status}".`);
      refreshDashboard();
    } catch (err) {
      showToast('Failed to update drive status', 'error');
    }
  };

  const handleDeleteTestDrive = async (id) => {
    try {
      await api.deleteTestDrive(id);
      setTestdrives(prev => prev.filter(t => t.id !== id));
      showToast('Test drive cancelled.');
      refreshDashboard();
    } catch (err) {
      showToast('Failed to delete drive', 'error');
    }
  };

  // ================= SERVICE HANDLERS =================
  const handleSaveService = async (srvData) => {
    try {
      const created = await api.createService(srvData);
      setServices(prev => [created, ...prev]);
      showToast(`Workshop ticket ${created.ticketNo} generated.`);
      refreshDashboard();
    } catch (err) {
      showToast('Failed to open workshop ticket', 'error');
    }
  };

  const handleUpdateServiceStatus = async (id, status) => {
    try {
      const updated = await api.updateService(id, { status });
      setServices(prev => prev.map(s => s.id === id ? updated : s));
      showToast(`Service ticket status updated to "${status}".`);
      refreshDashboard();
    } catch (err) {
      showToast('Failed to update service ticket', 'error');
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await api.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      showToast('Service ticket removed.');
      refreshDashboard();
    } catch (err) {
      showToast('Failed to delete service ticket', 'error');
    }
  };

  // ================= STAFF HANDLERS =================
  const handleSaveStaff = async (staffData) => {
    try {
      if (editingStaff) {
        const updated = await api.updateStaff(editingStaff.id, staffData);
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? updated : s));
        showToast(`Staff member "${updated.name}" updated.`);
      } else {
        const created = await api.createStaff(staffData);
        setStaff(prev => [created, ...prev]);
        showToast(`Team member "${created.name}" registered.`);
      }
    } catch (err) {
      showToast('Failed to save staff member', 'error');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Remove staff credential?')) return;
    try {
      await api.deleteStaff(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      showToast('Staff member removed.');
    } catch (err) {
      showToast('Failed to delete staff member', 'error');
    }
  };

  // ================= SETTINGS HANDLERS =================
  const handleSaveSettings = async (settingsData) => {
    try {
      const updated = await api.updateSettings(settingsData);
      setSettings(updated);
      showToast('Showroom settings updated.');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  // ================= ENQUIRY HANDLERS =================
  const handleSaveEnquiry = async (data) => {
    try {
      if (editingEnquiry) {
        const updated = await api.updateEnquiry(editingEnquiry.id, data);
        setEnquiries(prev => prev.map(e => e.id === editingEnquiry.id ? updated : e));
        showToast(`Enquiry for "${updated.customerName}" updated.`);
      } else {
        const created = await api.createEnquiry(data);
        setEnquiries(prev => [created, ...prev]);
        showToast(`New lead from "${created.customerName}" recorded.`);
      }
    } catch (err) {
      showToast('Failed to save enquiry', 'error');
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try {
      await api.deleteEnquiry(id);
      setEnquiries(prev => prev.filter(e => e.id !== id));
      showToast('Enquiry removed.');
    } catch (err) {
      showToast('Failed to delete enquiry', 'error');
    }
  };

  // ================= QUOTATION HANDLERS =================
  const handleSaveQuotation = async (quotData) => {
    try {
      if (editingQuotation) {
        const updated = await api.updateQuotation(editingQuotation.id, quotData);
        setQuotations(prev => prev.map(q => q.id === editingQuotation.id ? updated : q));
        showToast(`Quotation ${updated.quotationNo} updated.`);
      } else {
        const created = await api.createQuotation(quotData);
        setQuotations(prev => [created, ...prev]);
        showToast(`Pro-Forma Quotation ${created.quotationNo} generated.`);
        setSelectedQuotation(created);
        setIsQuotationViewOpen(true);
      }
    } catch (err) {
      showToast('Failed to save quotation', 'error');
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Delete this pro-forma quotation?')) return;
    try {
      await api.deleteQuotation(id);
      setQuotations(prev => prev.filter(q => q.id !== id));
      showToast('Quotation deleted.');
    } catch (err) {
      showToast('Failed to delete quotation', 'error');
    }
  };

  const handleConvertToSale = (quot) => {
    setIsQuotationViewOpen(false);
    // Find matching vehicle
    const matchedVeh = vehicles.find(v => v.id === quot.vehicleId) || {
      id: quot.vehicleId || 'custom',
      brand: quot.vehicleName ? quot.vehicleName.split(' ')[0] : 'Vehicle',
      model: quot.vehicleName || 'Custom Model',
      price: quot.exShowroomPrice || quot.totalAmount
    };
    setPreselectedVehicleForSale(matchedVeh);
    setIsSaleModalOpen(true);
  };

  // ================= SPARE PARTS HANDLERS =================
  const handleSavePart = async (partData) => {
    try {
      if (editingPart) {
        const updated = await api.updatePart(editingPart.id, partData);
        setParts(prev => prev.map(p => p.id === editingPart.id ? updated : p));
        showToast(`Part "${updated.name}" updated.`);
      } else {
        const created = await api.createPart(partData);
        setParts(prev => [created, ...prev]);
        showToast(`Spare part "${created.name}" added to inventory.`);
      }
    } catch (err) {
      showToast('Failed to save spare part', 'error');
    }
  };

  const handleDeletePart = async (id) => {
    if (!window.confirm('Delete this spare part from catalog?')) return;
    try {
      await api.deletePart(id);
      setParts(prev => prev.filter(p => p.id !== id));
      showToast('Spare part deleted.');
    } catch (err) {
      showToast('Failed to delete part', 'error');
    }
  };

  const handleUpdatePartStock = async (id, newStock) => {
    try {
      const updated = await api.updatePart(id, { stock: newStock });
      setParts(prev => prev.map(p => p.id === id ? updated : p));
      showToast(`Stock for ${updated.partNo} set to ${updated.stock}.`);
    } catch (err) {
      showToast('Failed to adjust stock', 'error');
    }
  };

  // ================= VEHICLE PROCUREMENT HANDLERS =================
  const handleSaveProcurement = async (orderData) => {
    try {
      if (editingProcurement) {
        const updated = await api.updateProcurement(editingProcurement.id, orderData);
        setProcurement(prev => prev.map(o => o.id === editingProcurement.id ? updated : o));
        showToast(`Factory Order ${updated.poNumber} updated.`);
      } else {
        const created = await api.createProcurement(orderData);
        setProcurement(prev => [created, ...prev]);
        showToast(`Factory Purchase Order ${created.poNumber} issued.`);
      }
    } catch (err) {
      showToast('Failed to save procurement order', 'error');
    }
  };

  const handleDeleteProcurement = async (id) => {
    if (!window.confirm('Cancel / delete this procurement order?')) return;
    try {
      await api.deleteProcurement(id);
      setProcurement(prev => prev.filter(o => o.id !== id));
      showToast('Purchase order deleted.');
    } catch (err) {
      showToast('Failed to delete procurement order', 'error');
    }
  };

  const handleUpdateProcurementStatus = async (id, nextStatus) => {
    try {
      const updated = await api.updateProcurement(id, { status: nextStatus });
      setProcurement(prev => prev.map(o => o.id === id ? updated : o));
      showToast(`Order ${updated.poNumber} status updated to "${nextStatus}".`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleProcurementAddToInventory = async (order) => {
    try {
      const newVeh = await api.createVehicle({
        brand: order.brand,
        model: order.model,
        year: order.year || 2026,
        price: order.suggestedRetailPrice || Math.round(Number(order.purchaseCost) * 1.15),
        category: order.category || 'Supercar',
        status: 'Available',
        stock: 1,
        color: order.exteriorColor || 'Guards Red',
        vin: order.vin,
        features: ['Factory Direct', 'Weissach Package', 'PDI Inspected']
      });
      setVehicles(prev => [newVeh, ...prev]);
      showToast(`Vehicle "${order.brand} ${order.model}" added to live showroom fleet!`);
      refreshDashboard();
    } catch (err) {
      showToast('Failed to add vehicle to showroom', 'error');
    }
  };

  // Compute live notifications for Header
  const alerts = useMemo(() => {
    const result = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Low stock vehicles
    vehicles.filter(v => Number(v.stock) <= 1 && v.status === 'Available').forEach(v => {
      result.push({ type: 'stock', title: 'Low Vehicle Stock', body: `${v.brand} ${v.model} — only 1 unit in showroom` });
    });

    // Low stock spare parts
    parts.filter(p => Number(p.stock) <= Number(p.minStock || 3)).forEach(p => {
      result.push({ type: 'stock', title: 'Spare Part Reorder', body: `${p.name} (${p.stock} units left)` });
    });

    // Today's test drives
    testdrives.filter(t => t.status === 'Scheduled' && t.date === today).forEach(t => {
      result.push({ type: 'testdrive', title: 'Test Drive Today', body: `${t.customerName} — ${t.vehicleName} at ${t.timeSlot}` });
    });

    // Pending services
    services.filter(s => s.status === 'Pending').forEach(s => {
      result.push({ type: 'service', title: 'Workshop Service', body: `Ticket ${s.ticketNo} — ${s.serviceType}` });
    });

    return result;
  }, [vehicles, parts, testdrives, services]);

  // If not logged in, render the login page!
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      
      {/* Toast Alert Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '32px',
          zIndex: 2000,
          background: toast.type === 'error' ? '#fef2f2' : '#ffffff',
          color: toast.type === 'error' ? '#dc2626' : '#0f172a',
          border: toast.type === 'error' ? '1px solid #fecaca' : '1px solid #e2e8f0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '12px 20px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideUp 0.25s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} color="#dc2626" /> : <CheckCircle2 size={18} color="#16a34a" />}
          <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* Sidebar with Role Access */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        counts={{
          vehicles: vehicles.length,
          customers: customers.length,
          sales: sales.length,
          enquiries: enquiries.filter(e => e.status === 'New' || e.status === 'Follow-up').length,
          testdrives: testdrives.filter(t => t.status === 'Scheduled').length,
          services: services.filter(s => s.status !== 'Completed').length,
          quotations: quotations.filter(q => q.status === 'Sent' || q.status === 'Accepted').length,
          parts: parts.filter(p => Number(p.stock) <= Number(p.minStock || 3)).length,
          procurement: procurement.filter(o => o.status === 'In Transit').length
        }}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header 
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          settings={settings}
          alerts={alerts}
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={(tab) => setActiveTab(tab)}
          vehicles={vehicles}
          customers={customers}
          quotations={quotations}
          sales={sales}
          onQuickAction={() => {
            setPreselectedVehicleForSale(null);
            setIsSaleModalOpen(true);
          }}
        />

        <main style={{ flex: 1, padding: '30px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          {loading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div className="status-dot active" style={{ marginBottom: '14px', width: '12px', height: '12px' }}></div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Syncing Apex Horizon Showroom Data...</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Loading inventory, quotes, parts, and deals</div>
            </div>
          ) : (
            <>
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <Dashboard 
                  dashboardData={dashboardData}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onViewInvoice={(sale) => {
                    setSelectedInvoiceSale(sale);
                    setIsInvoiceOpen(true);
                  }}
                  onOpenAddSale={() => {
                    setPreselectedVehicleForSale(null);
                    setIsSaleModalOpen(true);
                  }}
                  onOpenAddVehicle={() => {
                    setEditingVehicle(null);
                    setIsVehicleModalOpen(true);
                  }}
                  onOpenAddTestDrive={() => {
                    setTestDriveInitialData(null);
                    setIsTestDriveModalOpen(true);
                  }}
                  onOpenAddService={() => setIsServiceModalOpen(true)}
                />
              )}

              {/* Vehicles Inventory */}
              {activeTab === 'inventory' && (
                <Inventory 
                  vehicles={vehicles}
                  onAddVehicle={() => {
                    setEditingVehicle(null);
                    setIsVehicleModalOpen(true);
                  }}
                  onEditVehicle={(v) => {
                    setEditingVehicle(v);
                    setIsVehicleModalOpen(true);
                  }}
                  onDeleteVehicle={handleDeleteVehicle}
                  onSellVehicle={(v) => {
                    setPreselectedVehicleForSale(v);
                    setIsSaleModalOpen(true);
                  }}
                  onBookTestDrive={(v) => {
                    setTestDriveInitialData(v);
                    setIsTestDriveModalOpen(true);
                  }}
                />
              )}

              {/* Customers */}
              {activeTab === 'customers' && (
                <Customers 
                  customers={customers}
                  onAddCustomer={() => {
                    setEditingCustomer(null);
                    setIsCustomerModalOpen(true);
                  }}
                  onEditCustomer={(c) => {
                    setEditingCustomer(c);
                    setIsCustomerModalOpen(true);
                  }}
                  onDeleteCustomer={handleDeleteCustomer}
                  onBookTestDrive={(data) => {
                    setTestDriveInitialData(data);
                    setIsTestDriveModalOpen(true);
                  }}
                />
              )}

              {/* Enquiries & Leads */}
              {activeTab === 'enquiries' && (
                <Enquiries
                  enquiries={enquiries}
                  searchQuery={searchQuery}
                  onAddEnquiry={() => { setEditingEnquiry(null); setIsEnquiryModalOpen(true); }}
                  onEditEnquiry={(e) => { setEditingEnquiry(e); setIsEnquiryModalOpen(true); }}
                  onDeleteEnquiry={handleDeleteEnquiry}
                  onConvertTestDrive={(enq) => {
                    setTestDriveInitialData({ customerName: enq.customerName, vehicleName: enq.vehicleInterest });
                    setIsTestDriveModalOpen(true);
                  }}
                />
              )}

              {/* Quotations / Pro-Forma */}
              {activeTab === 'quotations' && (
                <Quotations
                  quotations={quotations}
                  onAddQuotation={() => {
                    setEditingQuotation(null);
                    setIsQuotationModalOpen(true);
                  }}
                  onEditQuotation={(q) => {
                    setEditingQuotation(q);
                    setIsQuotationModalOpen(true);
                  }}
                  onDeleteQuotation={handleDeleteQuotation}
                  onViewQuotation={(q) => {
                    setSelectedQuotation(q);
                    setIsQuotationViewOpen(true);
                  }}
                  onConvertToSale={handleConvertToSale}
                />
              )}

              {/* Sales & Invoices */}
              {activeTab === 'sales' && (
                <Sales 
                  sales={sales}
                  onAddSale={() => {
                    setPreselectedVehicleForSale(null);
                    setIsSaleModalOpen(true);
                  }}
                  onDeleteSale={handleDeleteSale}
                  onViewInvoice={(sale) => {
                    setSelectedInvoiceSale(sale);
                    setIsInvoiceOpen(true);
                  }}
                />
              )}

              {/* Test Drives */}
              {activeTab === 'testdrives' && (
                <TestDrives 
                  testdrives={testdrives}
                  onAddTestDrive={() => {
                    setTestDriveInitialData(null);
                    setIsTestDriveModalOpen(true);
                  }}
                  onUpdateStatus={handleUpdateTestDriveStatus}
                  onDeleteTestDrive={handleDeleteTestDrive}
                />
              )}

              {/* Spare Parts Inventory (Admin Only) */}
              {activeTab === 'parts' && currentUser?.role === 'admin' && (
                <Parts
                  parts={parts}
                  onAddPart={() => {
                    setEditingPart(null);
                    setIsPartModalOpen(true);
                  }}
                  onEditPart={(p) => {
                    setEditingPart(p);
                    setIsPartModalOpen(true);
                  }}
                  onDeletePart={handleDeletePart}
                  onUpdateStock={handleUpdatePartStock}
                />
              )}

              {/* Vehicle Procurement / Factory Orders (Admin Only) */}
              {activeTab === 'procurement' && currentUser?.role === 'admin' && (
                <Procurement
                  procurement={procurement}
                  onAddOrder={() => {
                    setEditingProcurement(null);
                    setIsProcurementModalOpen(true);
                  }}
                  onEditOrder={(o) => {
                    setEditingProcurement(o);
                    setIsProcurementModalOpen(true);
                  }}
                  onDeleteOrder={handleDeleteProcurement}
                  onUpdateStatus={handleUpdateProcurementStatus}
                  onAddToInventory={handleProcurementAddToInventory}
                />
              )}

              {/* Service Center (Admin Only) */}
              {activeTab === 'service' && currentUser?.role === 'admin' && (
                <Service 
                  services={services}
                  onAddService={() => setIsServiceModalOpen(true)}
                  onUpdateStatus={handleUpdateServiceStatus}
                  onDeleteService={handleDeleteService}
                />
              )}

              {/* Staff Management (Admin Only) */}
              {activeTab === 'staff' && currentUser?.role === 'admin' && (
                <Staff 
                  staff={staff}
                  onAddStaff={() => {
                    setEditingStaff(null);
                    setIsStaffModalOpen(true);
                  }}
                  onEditStaff={(member) => {
                    setEditingStaff(member);
                    setIsStaffModalOpen(true);
                  }}
                  onDeleteStaff={handleDeleteStaff}
                />
              )}

              {/* Financial Reports (Admin Only) */}
              {activeTab === 'reports' && currentUser?.role === 'admin' && (
                <Reports 
                  dashboardData={dashboardData}
                  sales={sales}
                  vehicles={vehicles}
                />
              )}

              {/* Settings (Admin Only) */}
              {activeTab === 'settings' && currentUser?.role === 'admin' && (
                <Settings 
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}

              {/* EMI Calculator */}
              {activeTab === 'finance' && <Finance />}
            </>
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}
      <InvoiceModal 
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={selectedInvoiceSale}
        settings={settings}
      />

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
        onConvertToSale={handleConvertToSale}
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
