import { initialData } from './initialData';

const API_BASE = '/api';

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

function getLocalDashboard() {
  const vehicles = getLocal('vehicles', initialData.vehicles);
  const sales = getLocal('sales', initialData.sales);
  const customers = getLocal('customers', initialData.customers);
  const testdrives = getLocal('testdrives', initialData.testdrives);
  const services = getLocal('services', initialData.services);

  const totalStockValue = vehicles.reduce((sum, v) => sum + (Number(v.price || 0) * (Number(v.stock) || 1)), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const soldCount = vehicles.filter(v => v.status === 'Sold').length;
  const reservedCount = vehicles.filter(v => v.status === 'Reserved').length;

  return {
    kpi: {
      totalVehicles: vehicles.length,
      availableCount,
      soldCount,
      reservedCount,
      totalStockValue,
      totalRevenue: totalRevenue || 4493500,
      totalSalesCount: sales.length,
      activeCustomersCount: customers.length,
      pendingTestDrivesCount: testdrives.filter(t => t.status === 'Scheduled').length,
      activeServiceTicketsCount: services.filter(s => s.status === 'In Progress').length
    },
    monthlyRevenue: [
      { month: 'Aug', revenue: 4200000, salesCount: 2 },
      { month: 'Sep', revenue: totalRevenue || 4493500, salesCount: sales.length || 2 }
    ],
    categoryBreakdown: [{ category: 'SUV', count: vehicles.length }],
    recentSales: sales.slice(0, 5),
    upcomingTestDrives: testdrives.filter(t => t.status === 'Scheduled').slice(0, 5),
    lowStock: vehicles.filter(v => Number(v.stock) <= 1)
  };
}

async function request(endpoint, options = {}, fallbackAction) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Falls back to local store if backend unreachable (e.g. static Vercel)
  }
  return fallbackAction ? fallbackAction() : null;
}

// Generic CRUD helper for local fallback
function createCrud(collectionKey, defaultList, idPrefix) {
  return {
    get: () => request(`/${collectionKey}`, {}, () => getLocal(collectionKey, defaultList)),
    create: (data) => request(`/${collectionKey}`, { method: 'POST', body: JSON.stringify(data) }, () => {
      const list = getLocal(collectionKey, defaultList);
      const newItem = { ...data, id: data.id || `${idPrefix}-${Date.now()}` };
      const updated = [newItem, ...list];
      setLocal(collectionKey, updated);
      return newItem;
    }),
    update: (id, data) => request(`/${collectionKey}/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => {
      const list = getLocal(collectionKey, defaultList);
      const updated = list.map(item => item.id === id ? { ...item, ...data } : item);
      setLocal(collectionKey, updated);
      return updated.find(item => item.id === id) || data;
    }),
    delete: (id) => request(`/${collectionKey}/${id}`, { method: 'DELETE' }, () => {
      const list = getLocal(collectionKey, defaultList);
      const updated = list.filter(item => item.id !== id);
      setLocal(collectionKey, updated);
      return { success: true };
    })
  };
}

const vehiclesCrud = createCrud('vehicles', initialData.vehicles, 'veh');
const customersCrud = createCrud('customers', initialData.customers, 'cust');
const salesCrud = createCrud('sales', initialData.sales, 'sale');
const testdrivesCrud = createCrud('testdrives', initialData.testdrives, 'td');
const servicesCrud = createCrud('services', initialData.services, 'srv');
const staffCrud = createCrud('staff', initialData.staff, 'stf');
const enquiriesCrud = createCrud('enquiries', initialData.enquiries, 'enq');
const quotationsCrud = createCrud('quotations', initialData.quotations, 'quot');
const partsCrud = createCrud('parts', initialData.parts, 'part');
const procurementCrud = createCrud('procurement', initialData.procurement, 'po');

export const api = {
  // Dashboard
  getDashboard: () => request('/dashboard', {}, () => getLocalDashboard()),

  // Vehicles
  getVehicles: vehiclesCrud.get,
  createVehicle: vehiclesCrud.create,
  updateVehicle: vehiclesCrud.update,
  deleteVehicle: vehiclesCrud.delete,

  // Customers
  getCustomers: customersCrud.get,
  createCustomer: customersCrud.create,
  updateCustomer: customersCrud.update,
  deleteCustomer: customersCrud.delete,

  // Sales
  getSales: salesCrud.get,
  createSale: salesCrud.create,
  updateSale: salesCrud.update,
  deleteSale: salesCrud.delete,

  // Test Drives
  getTestDrives: testdrivesCrud.get,
  createTestDrive: testdrivesCrud.create,
  updateTestDrive: testdrivesCrud.update,
  deleteTestDrive: testdrivesCrud.delete,

  // Services
  getServices: servicesCrud.get,
  createService: servicesCrud.create,
  updateService: servicesCrud.update,
  deleteService: servicesCrud.delete,

  // Staff
  getStaff: staffCrud.get,
  createStaff: staffCrud.create,
  updateStaff: staffCrud.update,
  deleteStaff: staffCrud.delete,

  // Settings
  getSettings: () => request('/settings', {}, () => getLocal('settings', initialData.settings)),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }, () => {
    const current = getLocal('settings', initialData.settings);
    const updated = { ...current, ...data };
    setLocal('settings', updated);
    return updated;
  }),

  // Enquiries / Leads
  getEnquiries: enquiriesCrud.get,
  createEnquiry: enquiriesCrud.create,
  updateEnquiry: enquiriesCrud.update,
  deleteEnquiry: enquiriesCrud.delete,

  // Quotations / Pro-Forma
  getQuotations: quotationsCrud.get,
  createQuotation: quotationsCrud.create,
  updateQuotation: quotationsCrud.update,
  deleteQuotation: quotationsCrud.delete,

  // Spare Parts & Accessories
  getParts: partsCrud.get,
  createPart: partsCrud.create,
  updatePart: partsCrud.update,
  deletePart: partsCrud.delete,

  // Vehicle Procurement / Factory Orders
  getProcurement: procurementCrud.get,
  createProcurement: procurementCrud.create,
  updateProcurement: procurementCrud.update,
  deleteProcurement: procurementCrud.delete,
};
