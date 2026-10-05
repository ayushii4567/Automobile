import { initialData } from './initialData';

const API_BASE = '/api';

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
    return item ? JSON.parse(item) : fallback;
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
        // Clean expired token if not login
        setToken(null);
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication required');
    }

    const err = await res.json().catch(() => ({}));
    const customErr = new Error(err.error || `HTTP error ${res.status}`);
    customErr.isHttpError = true;
    throw customErr;
  } catch (e) {
    if (e.isHttpError || (e.message && (e.message.includes('Access denied') || e.message.includes('Unauthorized') || e.message.includes('Authentication')))) {
      throw e;
    }
    // Falls back to local store only if network unreachable
    if (fallbackAction) return fallbackAction();
    throw e;
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

// CRUD instances for all modules
const vehiclesCrud = createCrud('vehicles', initialData.vehicles, 'veh');
const customersCrud = createCrud('customers', initialData.customers, 'cust');
const salesCrud = createCrud('sales', initialData.sales, 'sale');
const testdrivesCrud = createCrud('testdrives', initialData.testdrives, 'td');
const servicesCrud = createCrud('services', initialData.services, 'srv');
const staffCrud = createCrud('staff', initialData.staff, 'stf');
const enquiriesCrud = createCrud('enquiries', initialData.enquiries, 'enq');
const estimatesCrud = createCrud('estimates', [], 'est');
const quotationsCrud = createCrud('quotations', initialData.quotations, 'quot');
const partsCrud = createCrud('parts', initialData.parts, 'part');
const procurementCrud = createCrud('procurement', initialData.procurement, 'po');

// New modules CRUD
const pdiCrud = createCrud('pdi', [], 'pdi');
const tradeInsCrud = createCrud('tradeins', [], 'ex');
const financeAppsCrud = createCrud('finance-apps', [], 'fin');
const insuranceCrud = createCrud('insurance', [], 'ins');
const warrantiesCrud = createCrud('warranties', [], 'war');
const appointmentsCrud = createCrud('appointments', [], 'apt');
const vendorsCrud = createCrud('vendors', [], 'ven');
const paymentsCrud = createCrud('payments', [], 'pay');
const feedbackCrud = createCrud('feedback', [], 'fb');
const payrollCrud = createCrud('payroll', [], 'payr');
const expensesCrud = createCrud('expenses', [], 'exp');

export const api = {
  // Authentication & Session
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      return data;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid credentials');
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {}
    setToken(null);
    try {
      localStorage.removeItem('apex_user');
      localStorage.removeItem('apex_token');
    } catch {}
  },
  getMe: () => request('/auth/me'),

  // Dashboard & Reports
  getDashboard: () => request('/dashboard'),
  getReportsSummary: () => request('/reports/summary'),
  getAuditLogs: () => request('/audit-logs'),

  // Administrative restricted modules
  getPayroll: () => request('/payroll'),
  createPayroll: (data) => request('/payroll', { method: 'POST', body: JSON.stringify(data) }),
  getExpenses: () => request('/expenses'),
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  
  // Backup endpoints
  getBackup: () => request('/backup'),
  getBackupHealth: () => request('/backup/health'),
  createBackup: (data) => request('/backup', { method: 'POST', body: JSON.stringify(data) }),
  verifyBackup: (filename) => request(`/backup/verify/${filename}`),
  deleteBackup: (filename) => request(`/backup/${filename}`, { method: 'DELETE' }),
  getBackupDownloadUrl: (filename) => `/api/backup/download/${filename}?token=${getToken()}`,
  getBackupExportJsonUrl: () => `/api/backup/export-json?token=${getToken()}`,

  // Documents
  getDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/documents${qs ? '?' + qs : ''}`);
  },
  getDocumentStats: () => request('/documents-stats'),
  uploadDocument: async (formData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData // No Content-Type, fetch sets multipart/form-data boundary automatically
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  getDocumentDownloadUrl: (id) => `/api/documents/download/${id}?token=${getToken()}`,
  getDocumentPreviewUrl: (id) => `/api/documents/preview/${id}?token=${getToken()}`,

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const token = getToken();
    const res = await fetch(`${API_BASE}/settings/logo`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload logo');
    }
    return res.json();
  },

  // Core Modules
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
  convertLeadToCustomer: (id) => request(`/leads/${id}/convert-customer`, { method: 'POST' }),

  getEstimates: estimatesCrud.get,
  createEstimate: estimatesCrud.create,
  updateEstimate: estimatesCrud.update,
  deleteEstimate: estimatesCrud.delete,
  convertEstimateToQuotation: (id) => request(`/estimates/${id}/convert-quotation`, { method: 'POST' }),

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

  // Invoices & Receipts Specific Endpoints
  getDealershipProfile: () => request('/dealership-profile'),
  getInvoices: () => request('/invoices'),
  getPendingInvoices: () => request('/invoices/pending'),
  getInvoiceById: (id) => request(`/invoices/${id}`),
  getReceipts: () => request('/receipts'),
  getReceiptById: (id) => request(`/receipts/${id}`),

  getFeedback: feedbackCrud.get,
  createFeedback: feedbackCrud.create,
  updateFeedback: feedbackCrud.update,
  deleteFeedback: feedbackCrud.delete,

  // Admin-Only Back-Office: Payroll & Compensation
  getPayroll: (params = '') => request(`/payroll${params ? '?' + params : ''}`),
  createPayroll: payrollCrud.create,
  updatePayroll: payrollCrud.update,
  deletePayroll: payrollCrud.delete,
  generateBatchPayroll: (data = {}) => request('/payroll/generate-batch', { method: 'POST', body: JSON.stringify(data) }),
  getStaffSalaryHistory: (staffId) => request(`/payroll/staff/${staffId}`),

  // Admin-Only Back-Office: Expense Management
  getExpenses: (params = '') => request(`/expenses${params ? '?' + params : ''}`),
  createExpense: expensesCrud.create,
  updateExpense: expensesCrud.update,
  deleteExpense: expensesCrud.delete,
  getExpenseSummary: () => request('/expenses/summary'),

  // Workflow: Procurement -> Vehicle Received -> Inventory
  receiveProcurementOrder: (id, data = {}) => request(`/procurement/${id}/receive`, { method: 'POST', body: JSON.stringify(data) }),

  // Workflow: Customer -> Vehicle -> Job Card -> Parts -> Service -> Service History
  getJobCards: () => request('/job-cards'),
  allocateJobCardParts: (id, parts) => request(`/job-cards/${id}/allocate-parts`, { method: 'POST', body: JSON.stringify({ parts }) }),
  getVehicleServiceHistory: (vin) => request(`/services/history/vehicle/${encodeURIComponent(vin)}`),

  // 1. FINANCIAL REPORTS & ACCOUNTS (Real DB transactions)
  getReportsSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/financial-summary${qs ? '?' + qs : ''}`);
  },
  getFinancialSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/financial-summary${qs ? '?' + qs : ''}`);
  },
  getSalesReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/sales${qs ? '?' + qs : ''}`);
  },
  getRevenueReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/revenue${qs ? '?' + qs : ''}`);
  },
  getPaymentsIn: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/payments-in${qs ? '?' + qs : ''}`);
  },
  getPaymentsOut: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/payments-out${qs ? '?' + qs : ''}`);
  },
  getExpenseReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/expenses${qs ? '?' + qs : ''}`);
  },
  getPartyLedger: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/party-ledger${qs ? '?' + qs : ''}`);
  },
  getProfitAndLoss: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/profit-and-loss${qs ? '?' + qs : ''}`);
  },
  getBalanceSheet: () => request('/reports/balance-sheet'),
  getTaxGstReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/tax-gst${qs ? '?' + qs : ''}`);
  },
  getInventoryCapital: () => request('/reports/inventory-capital'),
  getDepartmentRevenue: () => request('/reports/department-revenue'),
  getExportCsvUrl: (reportType = 'sales', params = {}) => {
    const qs = new URLSearchParams({ reportType, ...params }).toString();
    return `/api/reports/export-csv?${qs}`;
  },

  // 2. COMMUNICATION & CAMPAIGNS
  getGatewayStatus: () => request('/communications/gateway-status'),
  dispatchCommunication: (data) => request('/communications/send', { method: 'POST', body: JSON.stringify(data) }),
  getCommunicationTemplates: (type, data = {}) => {
    const qs = new URLSearchParams({ type, ...data }).toString();
    return request(`/communications/templates?${qs}`);
  },
  getOccasions: (date = '2026-10-03') => request(`/communications/occasions?date=${date}`),
  getCampaigns: () => request('/campaigns'),
  createCampaign: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaign: (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
  broadcastCampaign: (id, data) => request(`/campaigns/${id}/broadcast`, { method: 'POST', body: JSON.stringify(data) }),
  getCustomerGroups: () => request('/customer-groups'),

  // 3. REMINDERS & ALERTS
  getAutomatedReminders: (date = '2026-10-03') => request(`/reminders/automated?date=${date}`),
  getReminders: () => request('/reminders'),
  createReminder: (data) => request('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  completeReminder: (id) => request(`/reminders/${id}/complete`, { method: 'PUT' }),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),

  // 4. DOCUMENTS MANAGEMENT
  getDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/documents${qs ? '?' + qs : ''}`);
  },
  getEntityDocuments: (entityType, entityId) => request(`/documents/${entityType}/${entityId}`),
  getDocumentHistory: (entityType, entityId) => request(`/documents/${entityType}/${entityId}/history`),
  uploadDocument: async (formData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  getDocumentPreviewUrl: (id) => `${API_BASE}/documents/preview/${id}`,
  getDocumentDownloadUrl: (id) => `${API_BASE}/documents/download/${id}`,
  getDocumentStats: () => request('/documents-stats'),

  // 5. BACKUP & DATA MANAGEMENT (Real SQLite)
  getBackup: () => request('/backup'),
  getBackupHealth: () => request('/backup/health'),
  createBackup: (data = {}) => request('/backup', { method: 'POST', body: JSON.stringify(data) }),
  verifyBackup: (filename) => request(`/backup/verify/${encodeURIComponent(filename)}`),
  restoreBackup: (filename) => request(`/backup/restore/${encodeURIComponent(filename)}`, { method: 'POST' }),
  deleteBackup: (filename) => request(`/backup/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  getBackupDownloadUrl: (filename) => `${API_BASE}/backup/download/${encodeURIComponent(filename)}`,
  getBackupExportJsonUrl: () => `${API_BASE}/backup/export-json`,
  getDealershipSettings: () => request('/dealership-settings')
};


