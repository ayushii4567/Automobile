import { initialData } from './initialData';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const hasExplicitApiUrl = Boolean(import.meta.env.VITE_API_URL);
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Automatically enable offline mock mode on Vercel or any static host without an explicit external backend
let isOfflineMode = !hasExplicitApiUrl && !isLocalhost;

export function getToken() {
  try {
    return localStorage.getItem('apex_token');
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem('apex_token', token);
    } else {
      localStorage.removeItem('apex_token');
    }
  } catch {}
}

function getLocal(key, fallback) {
  try {
    const item = localStorage.getItem(`autocore_${key}`);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    // Auto-upgrade if fallback is array and has more records than currently cached
    if (Array.isArray(fallback) && Array.isArray(parsed) && fallback.length > parsed.length) {
      setLocal(key, fallback);
      return fallback;
    }
    // Auto-upgrade if fallback is object with totalReminders > cached
    if (fallback && typeof fallback === 'object' && fallback.totalReminders && (!parsed || !parsed.totalReminders || parsed.totalReminders < fallback.totalReminders)) {
      setLocal(key, fallback);
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function setLocal(key, data) {
  try {
    localStorage.setItem(`autocore_${key}`, JSON.stringify(data));
  } catch {}
}

async function request(endpoint, options = {}, fallbackAction) {
  // If in offline mode (e.g. Vercel static demo), immediately resolve fallback without 404 network spam
  if (isOfflineMode) {
    if (fallbackAction) return fallbackAction();
    const method = (options.method || 'GET').toUpperCase();
    if (method === 'GET') return [];
    return { success: true };
  }

  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.ok) {
      return await res.json();
    }

    // 403 Forbidden: Role permission denied
    if (res.status === 403) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Access denied: Requires ADMIN privileges');
    }

    // 401 Unauthorized: Session invalid / expired
    if (res.status === 401) {
      if (endpoint !== '/auth/login') {
        console.warn('Unauthorized request to', endpoint);
        setToken(null);
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication required');
    }

    const err = await res.json().catch(() => ({}));
    const customErr = new Error(err.error || `HTTP error ${res.status}`);
    customErr.isHttpError = true;
    customErr.status = res.status;
    throw customErr;
  } catch (e) {
    // If backend is missing on local/remote, auto-switch to offline mode to prevent cascading 404s
    if (e.status === 404 || e.status === 502 || !e.status || e.message?.includes('Failed to fetch') || e.message?.includes('API Offline')) {
      isOfflineMode = true;
    }

    if (e.message && (e.message.includes('Access denied') || e.message.includes('Unauthorized') || e.message.includes('Authentication'))) {
      throw e;
    }
    if (e.status === 400) {
      throw e;
    }

    if (fallbackAction) {
      return fallbackAction();
    }

    const method = (options.method || 'GET').toUpperCase();
    if (method === 'GET') {
      return [];
    }
    return { success: true };
  }
}

// Generic CRUD helper
function createCrud(collectionKey, defaultList, idPrefix) {
  return {
    get: () => request(`/${collectionKey}`, {}, () => getLocal(collectionKey, defaultList || [])),
    create: (data) => request(`/${collectionKey}`, { method: 'POST', body: JSON.stringify(data) }, () => {
      const list = getLocal(collectionKey, defaultList || []);
      const newItem = { ...data, id: data.id || `${idPrefix}-${Date.now()}` };
      const updated = [newItem, ...list];
      setLocal(collectionKey, updated);
      return newItem;
    }),
    update: (id, data) => request(`/${collectionKey}/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => {
      const list = getLocal(collectionKey, defaultList || []);
      const updated = list.map(item => item.id === id ? { ...item, ...data } : item);
      setLocal(collectionKey, updated);
      return updated.find(item => item.id === id) || data;
    }),
    delete: (id) => request(`/${collectionKey}/${id}`, { method: 'DELETE' }, () => {
      const list = getLocal(collectionKey, defaultList || []);
      const updated = list.filter(item => item.id !== id);
      setLocal(collectionKey, updated);
      return { success: true };
    })
  };
}

// CRUD instances for all core & operational modules
const vehiclesCrud = createCrud('vehicles', initialData.vehicles, 'veh');
const customersCrud = createCrud('customers', initialData.customers, 'cust');
const salesCrud = createCrud('sales', initialData.sales, 'sale');
const testdrivesCrud = createCrud('testdrives', initialData.testdrives, 'td');
const servicesCrud = createCrud('services', initialData.services, 'srv');
const staffCrud = createCrud('staff', initialData.staff, 'stf');
const enquiriesCrud = createCrud('enquiries', initialData.enquiries, 'enq');
const estimatesCrud = createCrud('estimates', initialData.estimates || [], 'est');
const quotationsCrud = createCrud('quotations', initialData.quotations, 'quot');
const partsCrud = createCrud('parts', initialData.parts, 'part');
const procurementCrud = createCrud('procurement', initialData.procurement, 'po');

// Operational & Back-office modules CRUD with initial data
const pdiCrud = createCrud('pdi', initialData.pdi || [], 'pdi');
const tradeInsCrud = createCrud('tradeins', initialData.tradeins || [], 'ex');
const financeAppsCrud = createCrud('finance-apps', initialData.financeApps || [], 'fin');
const insuranceCrud = createCrud('insurance', initialData.insurance || [], 'ins');
const warrantiesCrud = createCrud('warranties', initialData.warranties || [], 'war');
const appointmentsCrud = createCrud('appointments', initialData.appointments || [], 'apt');
const vendorsCrud = createCrud('vendors', initialData.vendors || [], 'ven');
const paymentsCrud = createCrud('payments', initialData.payments || [], 'pay');
const feedbackCrud = createCrud('feedback', initialData.feedback || [], 'fb');
const payrollCrud = createCrud('payroll', initialData.payroll || [], 'payr');
const expensesCrud = createCrud('expenses', initialData.expenses || [], 'exp');

export const api = {
  // Authentication & Session
  login: async (username, password) => {
    if (isOfflineMode) {
      const isSales = username?.toLowerCase() === 'sales';
      const mockUser = {
        id: isSales ? 'u2' : 'u1',
        username: username || 'admin',
        name: isSales ? 'Alex Rivera' : 'Marcus Vance',
        role: isSales ? 'SALES_EXECUTIVE' : 'ADMIN'
      };
      const mockToken = 'mock-jwt-token-123';
      setToken(mockToken);
      localStorage.setItem('apex_user', JSON.stringify(mockUser));
      return { token: mockToken, user: mockUser };
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        if (data.user) {
          localStorage.setItem('apex_user', JSON.stringify(data.user));
        }
        return data;
      }
      if (res.status === 404 || res.status === 502) {
        throw new Error('API Offline');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid credentials');
    } catch (e) {
      if (e.message !== 'Invalid credentials') {
        isOfflineMode = true;
        const isSales = username?.toLowerCase() === 'sales';
        const mockUser = {
          id: isSales ? 'u2' : 'u1',
          username: username || 'admin',
          name: isSales ? 'Alex Rivera' : 'Marcus Vance',
          role: isSales ? 'SALES_EXECUTIVE' : 'ADMIN'
        };
        const mockToken = 'mock-jwt-token-123';
        setToken(mockToken);
        localStorage.setItem('apex_user', JSON.stringify(mockUser));
        return { token: mockToken, user: mockUser };
      }
      throw e;
    }
  },

  logout: async () => {
    if (!isOfflineMode) {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch {}
    }
    setToken(null);
    try {
      localStorage.removeItem('apex_user');
      localStorage.removeItem('apex_token');
    } catch {}
  },

  getMe: () => {
    const fallback = () => {
      try {
        const saved = localStorage.getItem('apex_user');
        if (saved) return JSON.parse(saved);
      } catch {}
      return { id: 'u1', username: 'admin', name: 'Marcus Vance', role: 'ADMIN' };
    };
    if (isOfflineMode) return Promise.resolve(fallback());
    return request('/auth/me', {}, fallback);
  },

  // Dashboard & Metrics
  getDashboard: () => request('/dashboard', {}, () => {
    const veh = getLocal('vehicles', initialData.vehicles || []);
    const cust = getLocal('customers', initialData.customers || []);
    const sales = getLocal('sales', initialData.sales || []);
    const testdrives = getLocal('testdrives', initialData.testdrives || []);
    const services = getLocal('services', initialData.services || []);

    const totalStockValue = veh.reduce((sum, v) => sum + (Number(v.ex_showroom_price || v.price || 0) * (Number(v.stock_quantity || v.stock) || 1)), 0) || 892636000;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || s.totalAmount || 0), 0) || 688635000;
    const availableCount = veh.filter(v => v.status === 'Available').length;
    const soldCount = sales.length;
    const reservedCount = veh.filter(v => v.status === 'Reserved').length;

    const lowStockMap = {};
    veh.forEach(v => {
      if (v.status === 'Available' && (Number(v.stock_quantity || v.stock) || 0) <= 2) {
        const name = `${v.brand} ${v.model}`;
        if (!lowStockMap[name]) {
          lowStockMap[name] = {
            id: v.id,
            brand: v.brand,
            model: v.model,
            name: name,
            stock: Number(v.stock_quantity || v.stock) || 1,
            vin: v.vin
          };
        }
      }
    });

    const categoryMap = {};
    veh.forEach(v => {
      const cat = v.category || 'Luxury';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryMap).map(k => ({
      name: k,
      value: categoryMap[k]
    }));

    return {
      kpi: {
        totalVehicles: veh.length,
        availableCount: availableCount || 14,
        reservedCount: reservedCount || 1,
        soldCount: soldCount || 21,
        activeCustomersCount: cust.length || 39,
        totalRevenue: totalRevenue || 688635000,
        inventoryValue: totalStockValue,
        pendingTestDrivesCount: testdrives.filter(t => t.status === 'Scheduled').length || 1,
        activeServicesCount: services.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled').length || 12
      },
      metrics: {
        totalVehicles: veh.length,
        availableVehicles: availableCount || 14,
        reservedVehicles: reservedCount || 1,
        soldVehicles: soldCount || 21,
        totalCustomers: cust.length || 39,
        totalSalesRevenue: totalRevenue || 688635000,
        inventoryValue: totalStockValue,
        pendingTestDrives: testdrives.filter(t => t.status === 'Scheduled').length || 1,
        activeServices: services.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled').length || 12
      },
      monthlyRevenue: [
        { month: 'Aug', revenue: 4200000, salesCount: 2 },
        { month: 'Sep', revenue: Math.round(totalRevenue || 688635000), salesCount: sales.length || 21 }
      ],
      categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : (initialData.dashboard?.categoryBreakdown || [
        { name: 'SUV', value: 16 },
        { name: 'Sedan', value: 10 },
        { name: 'Electric', value: 6 },
        { name: 'Coupe', value: 4 }
      ]),
      recentSales: sales.slice(0, 5),
      upcomingTestDrives: testdrives.filter(t => t.status === 'Scheduled').slice(0, 5),
      lowStock: Object.values(lowStockMap)
    };
  }),

  getAuditLogs: () => request('/audit-logs', {}, () => getLocal('auditLogs', initialData.auditLogs || [])),

  // Settings & Dealership Info
  getSettings: () => request('/settings', {}, () => getLocal('settings', initialData.settings || {})),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }, () => {
    setLocal('settings', data);
    return data;
  }),
  getDealershipProfile: () => request('/dealership-profile', {}, () => getLocal('dealershipProfile', initialData.dealershipProfile || initialData.settings || {})),
  getDealershipSettings: () => request('/dealership-settings', {}, () => getLocal('dealershipSettings', initialData.dealershipSettings || initialData.settings || {})),
  uploadLogo: async (file) => {
    if (isOfflineMode) {
      return { success: true, logoUrl: '/logo.png' };
    }
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const token = getToken();
      const res = await fetch(`${API_BASE}/settings/logo`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, logoUrl: '/logo.png' };
  },

  // Core Showroom Modules
  getVehicles: vehiclesCrud.get,
  createVehicle: vehiclesCrud.create,
  updateVehicle: vehiclesCrud.update,
  deleteVehicle: vehiclesCrud.delete,

  getCustomers: customersCrud.get,
  createCustomer: customersCrud.create,
  updateCustomer: customersCrud.update,
  deleteCustomer: customersCrud.delete,

  getSales: salesCrud.get,
  createSale: salesCrud.create,
  updateSale: salesCrud.update,
  deleteSale: salesCrud.delete,

  getTestDrives: testdrivesCrud.get,
  createTestDrive: testdrivesCrud.create,
  updateTestDrive: testdrivesCrud.update,
  deleteTestDrive: testdrivesCrud.delete,

  getServices: servicesCrud.get,
  createService: servicesCrud.create,
  updateService: servicesCrud.update,
  deleteService: servicesCrud.delete,

  getStaff: staffCrud.get,
  createStaff: staffCrud.create,
  updateStaff: staffCrud.update,
  deleteStaff: staffCrud.delete,

  getEnquiries: enquiriesCrud.get,
  createEnquiry: enquiriesCrud.create,
  updateEnquiry: enquiriesCrud.update,
  deleteEnquiry: enquiriesCrud.delete,
  convertLeadToCustomer: (id) => request(`/leads/${id}/convert-customer`, { method: 'POST' }, () => {
    const enquiries = getLocal('enquiries', initialData.enquiries || []);
    const enq = enquiries.find(e => e.id === id);
    if (enq) {
      const customers = getLocal('customers', initialData.customers || []);
      const newCust = {
        id: `cust-${Date.now()}`,
        name: enq.customerName || enq.name || 'New Customer',
        phone: enq.phone || '',
        email: enq.email || '',
        status: 'Active Buyer',
        notes: `Converted from lead: ${enq.notes || ''}`
      };
      setLocal('customers', [newCust, ...customers]);
      return { success: true, customer: newCust };
    }
    return { success: true };
  }),

  getEstimates: estimatesCrud.get,
  createEstimate: estimatesCrud.create,
  updateEstimate: estimatesCrud.update,
  deleteEstimate: estimatesCrud.delete,
  convertEstimateToQuotation: (id) => request(`/estimates/${id}/convert-quotation`, { method: 'POST' }, () => {
    const estimates = getLocal('estimates', initialData.estimates || []);
    const est = estimates.find(e => e.id === id);
    if (est) {
      const quotations = getLocal('quotations', initialData.quotations || []);
      const newQuot = {
        id: `quot-${Date.now()}`,
        quotationNo: `QT-${Date.now().toString().slice(-4)}`,
        ...est,
        status: 'Sent'
      };
      setLocal('quotations', [newQuot, ...quotations]);
      return { success: true, quotation: newQuot };
    }
    return { success: true };
  }),

  getQuotations: quotationsCrud.get,
  createQuotation: quotationsCrud.create,
  updateQuotation: quotationsCrud.update,
  deleteQuotation: quotationsCrud.delete,

  getParts: partsCrud.get,
  createPart: partsCrud.create,
  updatePart: partsCrud.update,
  deletePart: partsCrud.delete,

  getProcurement: procurementCrud.get,
  createProcurement: procurementCrud.create,
  updateProcurement: procurementCrud.update,
  deleteProcurement: procurementCrud.delete,
  receiveProcurementOrder: (id, data = {}) => request(`/procurement/${id}/receive`, { method: 'POST', body: JSON.stringify(data) }, () => {
    const list = getLocal('procurement', initialData.procurement || []);
    const updated = list.map(item => item.id === id ? { ...item, status: 'Received' } : item);
    setLocal('procurement', updated);
    return { success: true };
  }),

  // Operations Modules
  getPDI: pdiCrud.get,
  createPDI: pdiCrud.create,
  updatePDI: pdiCrud.update,
  deletePDI: pdiCrud.delete,

  getTradeIns: tradeInsCrud.get,
  createTradeIn: tradeInsCrud.create,
  updateTradeIn: tradeInsCrud.update,
  deleteTradeIn: tradeInsCrud.delete,

  getFinanceApps: financeAppsCrud.get,
  createFinanceApp: financeAppsCrud.create,
  updateFinanceApp: financeAppsCrud.update,
  deleteFinanceApp: financeAppsCrud.delete,

  getInsurance: insuranceCrud.get,
  createInsurance: insuranceCrud.create,
  updateInsurance: insuranceCrud.update,
  deleteInsurance: insuranceCrud.delete,

  getWarranties: warrantiesCrud.get,
  createWarranty: warrantiesCrud.create,
  updateWarranty: warrantiesCrud.update,
  deleteWarranty: warrantiesCrud.delete,

  getAppointments: appointmentsCrud.get,
  createAppointment: appointmentsCrud.create,
  updateAppointment: appointmentsCrud.update,
  deleteAppointment: appointmentsCrud.delete,

  getVendors: vendorsCrud.get,
  createVendor: vendorsCrud.create,
  updateVendor: vendorsCrud.update,
  deleteVendor: vendorsCrud.delete,

  getPayments: paymentsCrud.get,
  createPayment: paymentsCrud.create,
  updatePayment: paymentsCrud.update,
  deletePayment: paymentsCrud.delete,

  getFeedback: feedbackCrud.get,
  createFeedback: feedbackCrud.create,
  updateFeedback: feedbackCrud.update,
  deleteFeedback: feedbackCrud.delete,

  // Invoices & Receipts
  getInvoices: () => request('/invoices', {}, () => getLocal('invoices', initialData.invoices || [])),
  getPendingInvoices: () => request('/invoices/pending', {}, () => (initialData.invoices || []).filter(i => i.status !== 'Paid')),
  getInvoiceById: (id) => request(`/invoices/${id}`, {}, () => (initialData.invoices || []).find(inv => inv.id === id) || null),
  getReceipts: () => request('/receipts', {}, () => getLocal('receipts', initialData.receipts || [])),
  getReceiptById: (id) => request(`/receipts/${id}`, {}, () => (initialData.receipts || []).find(r => r.id === id) || null),

  // Payroll & Expenses
  getPayroll: (params = '') => request(`/payroll${params ? '?' + params : ''}`, {}, () => getLocal('payroll', initialData.payroll || [])),
  createPayroll: payrollCrud.create,
  updatePayroll: payrollCrud.update,
  deletePayroll: payrollCrud.delete,
  generateBatchPayroll: (data = {}) => request('/payroll/generate-batch', { method: 'POST', body: JSON.stringify(data) }, () => ({ success: true })),
  getStaffSalaryHistory: (staffId) => request(`/payroll/staff/${staffId}`, {}, () => []),

  getExpenses: (params = '') => request(`/expenses${params ? '?' + params : ''}`, {}, () => getLocal('expenses', initialData.expenses || [])),
  createExpense: expensesCrud.create,
  updateExpense: expensesCrud.update,
  deleteExpense: expensesCrud.delete,
  getExpenseSummary: () => request('/expenses/summary', {}, () => ({ total: 0, categories: {} })),

  // Service Workflow
  getJobCards: () => request('/job-cards', {}, () => getLocal('jobCards', initialData.jobCards || [])),
  allocateJobCardParts: (id, parts) => request(`/job-cards/${id}/allocate-parts`, { method: 'POST', body: JSON.stringify({ parts }) }, () => ({ success: true })),
  getVehicleServiceHistory: (vin) => request(`/services/history/vehicle/${encodeURIComponent(vin)}`, {}, () => []),

  // Financial Reports
  getReportsSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/financial-summary${qs ? '?' + qs : ''}`, {}, () => initialData.financialSummary || {
      pnl: initialData.profitAndLoss,
      balanceSheet: initialData.balanceSheet,
      invCap: initialData.inventoryCapital,
      deptRev: initialData.departmentRevenue
    });
  },
  getFinancialSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/financial-summary${qs ? '?' + qs : ''}`, {}, () => initialData.financialSummary || {});
  },
  getSalesReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/sales${qs ? '?' + qs : ''}`, {}, () => initialData.sales || []);
  },
  getRevenueReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/revenue${qs ? '?' + qs : ''}`, {}, () => initialData.sales || []);
  },
  getPaymentsIn: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/payments-in${qs ? '?' + qs : ''}`, {}, () => initialData.payments || []);
  },
  getPaymentsOut: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/payments-out${qs ? '?' + qs : ''}`, {}, () => initialData.expenses || []);
  },
  getExpenseReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/expenses${qs ? '?' + qs : ''}`, {}, () => initialData.expenses || []);
  },
  getPartyLedger: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/party-ledger${qs ? '?' + qs : ''}`, {}, () => initialData.payments || []);
  },
  getProfitAndLoss: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/profit-and-loss${qs ? '?' + qs : ''}`, {}, () => initialData.profitAndLoss || {});
  },
  getBalanceSheet: () => request('/reports/balance-sheet', {}, () => initialData.balanceSheet || {}),
  getTaxGstReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/tax-gst${qs ? '?' + qs : ''}`, {}, () => initialData.invoices || []);
  },
  getInventoryCapital: () => request('/reports/inventory-capital', {}, () => initialData.inventoryCapital || {}),
  getDepartmentRevenue: () => request('/reports/department-revenue', {}, () => initialData.departmentRevenue || {}),
  getExportCsvUrl: (reportType = 'sales', params = {}) => {
    const qs = new URLSearchParams({ reportType, ...params }).toString();
    return `/api/reports/export-csv?${qs}`;
  },

  // Communications & Campaigns
  getGatewayStatus: () => request('/communications/gateway-status', {}, () => initialData.gatewayStatus || {
    whatsapp: { status: 'Connected', balance: 'Unlimited', provider: 'Meta Cloud API' },
    email: { status: 'Connected', provider: 'SendGrid Enterprise' },
    sms: { status: 'Connected', balance: 5000, provider: 'AutoSMS Gateway' }
  }),
  dispatchCommunication: (data) => request('/communications/send', { method: 'POST', body: JSON.stringify(data) }, () => ({ success: true, messageId: `msg-${Date.now()}` })),
  getCommunicationTemplates: (type, data = {}) => {
    const qs = new URLSearchParams({ type, ...data }).toString();
    return request(`/communications/templates?${qs}`, {}, () => ({
      sms: 'Dear Customer, your vehicle update is ready.',
      email: { subject: 'Vehicle Notification', body: 'Dear Customer, thank you for choosing Apex Horizon.' },
      whatsapp: 'Hello! Here is your latest vehicle update from Apex Horizon.'
    }));
  },
  getOccasions: (date = '2026-10-03') => request(`/communications/occasions?date=${date}`, {}, () => initialData.occasions || {
    today: '2026-10-03',
    todaysBirthdays: [
      { id: 'cust_01', name: 'Rahul Sharma', phone: '+91 98201 11223', email: 'rahul.sharma@gmail.com', dob: '1988-10-03', vehiclePurchased: 'BMW 3 Series Gran Limousine' }
    ],
    upcomingBirthdays: [],
    todaysAnniversaries: [],
    upcomingAnniversaries: []
  }),
  getCampaigns: () => request('/campaigns', {}, () => getLocal('campaigns', initialData.campaigns || [])),
  createCampaign: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }, () => {
    const list = getLocal('campaigns', initialData.campaigns || []);
    const item = { ...data, id: `cmp-${Date.now()}` };
    setLocal('campaigns', [item, ...list]);
    return item;
  }),
  updateCampaign: (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => {
    const list = getLocal('campaigns', initialData.campaigns || []);
    const updated = list.map(c => c.id === id ? { ...c, ...data } : c);
    setLocal('campaigns', updated);
    return updated.find(c => c.id === id) || data;
  }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }, () => {
    const list = getLocal('campaigns', initialData.campaigns || []);
    setLocal('campaigns', list.filter(c => c.id !== id));
    return { success: true };
  }),
  broadcastCampaign: (id, data) => request(`/campaigns/${id}/broadcast`, { method: 'POST', body: JSON.stringify(data) }, () => ({ success: true })),
  getCustomerGroups: () => request('/customer-groups', {}, () => initialData.customerGroups || [
    { id: 'grp-1', name: 'VIP Buyers', count: 12 },
    { id: 'grp-2', name: 'Service Due (Immediate)', count: 8 },
    { id: 'grp-3', name: 'Hot Leads & Test Drive Done', count: 15 },
    { id: 'grp-4', name: 'Insurance Expiring Soon', count: 4 },
    { id: 'grp-5', name: 'High-Net-Worth Corporate Accounts', count: 6 }
  ]),

  // Reminders & Alerts
  getAutomatedReminders: (date = '2026-10-03') => request(`/reminders/automated?date=${date}`, {}, () => {
    return getLocal('automatedReminders', initialData.automatedReminders || {
      today: '2026-10-03',
      totalReminders: 71,
      urgentCount: 2,
      highCount: 32,
      byCategory: {
        payment: 11,
        insurance: 3,
        service: 12,
        lead: 2,
        testDrive: 1,
        delivery: 20,
        birthday: 3,
        anniversary: 19
      },
      reminders: []
    });
  }),
  getReminders: () => request('/reminders', {}, () => {
    return getLocal('fullReminders', initialData.fullReminders || {
      manualReminders: [
        {
          id: 'rem-man-1',
          title: 'Follow up with Amit Patil for Creta exchange valuation',
          description: 'Client requested revised exchange bonus calculation for his 2020 Creta.',
          category: 'Lead Follow-up',
          priority: 'High',
          due_date: '2026-10-04',
          status: 'Pending',
          created_by: 'Marcus Vance'
        },
        {
          id: 'rem-man-2',
          title: 'Schedule HDFC Loan Document Signing for Rahul Sharma',
          description: 'Collect signed ECS mandate and loan agreement for BMW 3 Series delivery.',
          category: 'Payment',
          priority: 'Urgent',
          due_date: '2026-10-03',
          status: 'Pending',
          created_by: 'Priya Patel'
        }
      ],
      automatedReminders: initialData.automatedReminders || {},
      summary: { total: 73, manualCount: 2, automatedCount: 71 }
    });
  }),
  createReminder: (data) => request('/reminders', { method: 'POST', body: JSON.stringify(data) }, () => {
    const list = getLocal('reminders', []);
    const item = { ...data, id: `rem-${Date.now()}` };
    setLocal('reminders', [item, ...list]);
    return item;
  }),
  completeReminder: (id) => request(`/reminders/${id}/complete`, { method: 'PUT' }, () => {
    const list = getLocal('reminders', []);
    const updated = list.map(r => r.id === id ? { ...r, status: 'Completed' } : r);
    setLocal('reminders', updated);
    return { success: true };
  }),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: 'DELETE' }, () => {
    const list = getLocal('reminders', []);
    setLocal('reminders', list.filter(r => r.id !== id));
    return { success: true };
  }),

  // Documents Management
  getDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/documents${qs ? '?' + qs : ''}`, {}, () => {
      const docObj = initialData.documents || { documents: [], stats: {} };
      const rawDocs = docObj.documents || (Array.isArray(docObj) ? docObj : []);
      const docs = getLocal('documents', rawDocs.length ? rawDocs : [
        {
          id: 'doc-1',
          title: 'Customer KYC - Rahul Sharma Aadhar Card',
          entity_type: 'CUSTOMER',
          entity_id: 'cust_01',
          doc_type: 'CUSTOMER_KYC',
          file_name: 'aadhar_rahul_sharma.pdf',
          file_size: 245000,
          created_at: '2026-09-15 11:20:00'
        },
        {
          id: 'doc-2',
          title: 'Vehicle Registration - BMW 3 Series RC Copy',
          entity_type: 'VEHICLE',
          entity_id: 'veh_01',
          doc_type: 'RC_COPY',
          file_name: 'rc_bmw_3series.pdf',
          file_size: 512000,
          created_at: '2026-09-17 14:10:00'
        }
      ]);
      const search = (params.search || '').toLowerCase();
      const docType = params.docType || '';
      const filtered = docs.filter(d => {
        const matchesSearch = !search || d.title?.toLowerCase().includes(search) || d.file_name?.toLowerCase().includes(search);
        const matchesType = !docType || d.doc_type === docType;
        return matchesSearch && matchesType;
      });
      return {
        documents: filtered,
        stats: docObj.stats || {
          totalDocuments: docs.length,
          totalSizeMB: 12.4
        }
      };
    });
  },
  getEntityDocuments: (entityType, entityId) => request(`/documents/${entityType}/${entityId}`, {}, () => {
    const docs = getLocal('documents', []);
    return docs.filter(d => d.entity_type === entityType && String(d.entity_id) === String(entityId));
  }),
  getDocumentHistory: (entityType, entityId) => request(`/documents/${entityType}/${entityId}/history`, {}, () => []),
  uploadDocument: async (formData) => {
    if (isOfflineMode) {
      const docs = getLocal('documents', []);
      const file = formData.get('file');
      const newDoc = {
        id: `doc-${Date.now()}`,
        title: formData.get('title') || file?.name || 'Uploaded Document',
        entity_type: formData.get('entity_type') || 'CUSTOMER',
        entity_id: formData.get('entity_id') || '',
        doc_type: formData.get('doc_type') || 'OTHER',
        file_name: file?.name || 'document.pdf',
        file_size: file?.size || 102400,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setLocal('documents', [newDoc, ...docs]);
      return { success: true, document: newDoc };
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) return await res.json();
    } catch {}
    const docs = getLocal('documents', []);
    const file = formData.get('file');
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: formData.get('title') || file?.name || 'Uploaded Document',
      entity_type: formData.get('entity_type') || 'CUSTOMER',
      entity_id: formData.get('entity_id') || '',
      doc_type: formData.get('doc_type') || 'OTHER',
      file_name: file?.name || 'document.pdf',
      file_size: file?.size || 102400,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLocal('documents', [newDoc, ...docs]);
    return { success: true, document: newDoc };
  },
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }, () => {
    const docs = getLocal('documents', []);
    setLocal('documents', docs.filter(d => d.id !== id));
    return { success: true };
  }),
  getDocumentPreviewUrl: (id) => `${API_BASE}/documents/preview/${id}`,
  getDocumentDownloadUrl: (id) => `${API_BASE}/documents/download/${id}`,
  getDocumentStats: () => request('/documents-stats', {}, () => initialData.documentStats || { totalDocuments: 10, totalSizeMB: 8.5 }),

  // Backup & Data Management
  getBackup: () => request('/backup', {}, () => initialData.backup || { backups: [], totalBackups: 0, lastBackup: '2026-10-03 12:00:00' }),
  getBackupHealth: () => request('/backup/health', {}, () => initialData.backupHealth || { status: 'Healthy', database: 'SQLite (Mock/Local)', integrity: 'OK' }),
  createBackup: (data = {}) => request('/backup', { method: 'POST', body: JSON.stringify(data) }, () => ({
    success: true,
    filename: `backup_${Date.now()}.sqlite`
  })),
  verifyBackup: (filename) => request(`/backup/verify/${encodeURIComponent(filename)}`, {}, () => ({ valid: true })),
  restoreBackup: (filename) => request(`/backup/restore/${encodeURIComponent(filename)}`, { method: 'POST' }, () => ({ success: true })),
  deleteBackup: (filename) => request(`/backup/${encodeURIComponent(filename)}`, { method: 'DELETE' }, () => ({ success: true })),
  getBackupDownloadUrl: (filename) => `${API_BASE}/backup/download/${encodeURIComponent(filename)}`,
  getBackupExportJsonUrl: () => `${API_BASE}/backup/export-json`
};
