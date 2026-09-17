const API_BASE = '/api';

async function fetchJSON(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: () => fetchJSON('/dashboard'),

  // Vehicles
  getVehicles: () => fetchJSON('/vehicles'),
  createVehicle: (data) => fetchJSON('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => fetchJSON(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id) => fetchJSON(`/vehicles/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: () => fetchJSON('/customers'),
  createCustomer: (data) => fetchJSON('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => fetchJSON(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => fetchJSON(`/customers/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: () => fetchJSON('/sales'),
  createSale: (data) => fetchJSON('/sales', { method: 'POST', body: JSON.stringify(data) }),
  updateSale: (id, data) => fetchJSON(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSale: (id) => fetchJSON(`/sales/${id}`, { method: 'DELETE' }),

  // Test Drives
  getTestDrives: () => fetchJSON('/testdrives'),
  createTestDrive: (data) => fetchJSON('/testdrives', { method: 'POST', body: JSON.stringify(data) }),
  updateTestDrive: (id, data) => fetchJSON(`/testdrives/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTestDrive: (id) => fetchJSON(`/testdrives/${id}`, { method: 'DELETE' }),

  // Services
  getServices: () => fetchJSON('/services'),
  createService: (data) => fetchJSON('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => fetchJSON(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => fetchJSON(`/services/${id}`, { method: 'DELETE' }),

  // Staff
  getStaff: () => fetchJSON('/staff'),
  createStaff: (data) => fetchJSON('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id, data) => fetchJSON(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id) => fetchJSON(`/staff/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => fetchJSON('/settings'),
  updateSettings: (data) => fetchJSON('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Enquiries / Leads
  getEnquiries: () => fetchJSON('/enquiries'),
  createEnquiry: (data) => fetchJSON('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateEnquiry: (id, data) => fetchJSON(`/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEnquiry: (id) => fetchJSON(`/enquiries/${id}`, { method: 'DELETE' }),

  // Quotations / Pro-Forma
  getQuotations: () => fetchJSON('/quotations'),
  createQuotation: (data) => fetchJSON('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  updateQuotation: (id, data) => fetchJSON(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuotation: (id) => fetchJSON(`/quotations/${id}`, { method: 'DELETE' }),

  // Spare Parts & Accessories
  getParts: () => fetchJSON('/parts'),
  createPart: (data) => fetchJSON('/parts', { method: 'POST', body: JSON.stringify(data) }),
  updatePart: (id, data) => fetchJSON(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePart: (id) => fetchJSON(`/parts/${id}`, { method: 'DELETE' }),

  // Vehicle Procurement / Factory Orders
  getProcurement: () => fetchJSON('/procurement'),
  createProcurement: (data) => fetchJSON('/procurement', { method: 'POST', body: JSON.stringify(data) }),
  updateProcurement: (id, data) => fetchJSON(`/procurement/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProcurement: (id) => fetchJSON(`/procurement/${id}`, { method: 'DELETE' }),
};
