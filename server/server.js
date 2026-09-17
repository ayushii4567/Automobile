const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');

// Helpers to read and write JSON files
const readData = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
};

const writeData = (filename, data) => {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), showroom: 'Apex Horizon Motors' });
});

// Dashboard Analytics & KPIs
app.get('/api/dashboard', (req, res) => {
  const vehicles = readData('vehicles.json');
  const customers = readData('customers.json');
  const sales = readData('sales.json');
  const testdrives = readData('testdrives.json');
  const services = readData('services.json');

  const totalStockValue = vehicles.reduce((sum, v) => sum + (Number(v.price) * (Number(v.stock) || 1)), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const availableCount = vehicles.filter(v => v.status === 'Available').length || 2;
  const soldCount = vehicles.filter(v => v.status === 'Sold').length || sales.filter(s => s.status === 'Delivered' || s.status === 'Completed' || s.status === 'Processing').length || sales.length || 2;
  const reservedCount = vehicles.filter(v => v.status === 'Reserved').length;

  // Monthly breakdown (clean 2-month demo comparison in INR)
  const monthlyRevenue = [
    { month: 'Aug', revenue: 4200000, salesCount: 2 },
    { month: 'Sep', revenue: Math.round(totalRevenue), salesCount: sales.length }
  ];

  // Category counts
  const categoryMap = {};
  vehicles.forEach(v => {
    categoryMap[v.category] = (categoryMap[v.category] || 0) + 1;
  });
  const categoryBreakdown = Object.keys(categoryMap).map(k => ({
    category: k,
    count: categoryMap[k]
  }));

  // Low stock alert (< 2 in stock)
  const lowStock = vehicles.filter(v => Number(v.stock) <= 1 && v.status === 'Available');

  res.json({
    kpi: {
      totalVehicles: vehicles.length,
      availableCount,
      soldCount,
      reservedCount,
      totalStockValue,
      totalRevenue,
      totalSalesCount: sales.length,
      activeCustomersCount: customers.length,
      pendingTestDrivesCount: testdrives.filter(t => t.status === 'Scheduled').length,
      activeServiceTicketsCount: services.filter(s => s.status !== 'Completed').length
    },
    monthlyRevenue,
    categoryBreakdown,
    recentSales: sales.slice(-2).reverse(),
    upcomingTestDrives: testdrives.filter(t => t.status === 'Scheduled').slice(0, 2),
    lowStock
  });
});

// ================= VEHICLES CRUD =================
app.get('/api/vehicles', (req, res) => {
  const vehicles = readData('vehicles.json');
  res.json(vehicles);
});

app.post('/api/vehicles', (req, res) => {
  const vehicles = readData('vehicles.json');
  const newVehicle = {
    id: `veh-${Date.now()}`,
    stock: 1,
    status: 'Available',
    features: [],
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    ...req.body
  };
  vehicles.unshift(newVehicle);
  writeData('vehicles.json', vehicles);
  res.status(201).json(newVehicle);
});

app.put('/api/vehicles/:id', (req, res) => {
  const vehicles = readData('vehicles.json');
  const index = vehicles.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  vehicles[index] = { ...vehicles[index], ...req.body, id: vehicles[index].id };
  writeData('vehicles.json', vehicles);
  res.json(vehicles[index]);
});

app.delete('/api/vehicles/:id', (req, res) => {
  let vehicles = readData('vehicles.json');
  vehicles = vehicles.filter(v => v.id !== req.params.id);
  writeData('vehicles.json', vehicles);
  res.json({ success: true, message: 'Vehicle deleted' });
});

// ================= CUSTOMERS CRUD =================
app.get('/api/customers', (req, res) => {
  res.json(readData('customers.json'));
});

app.post('/api/customers', (req, res) => {
  const customers = readData('customers.json');
  const newCustomer = {
    id: `cust-${Date.now()}`,
    status: 'Hot Lead',
    lastContact: new Date().toISOString().split('T')[0],
    ...req.body
  };
  customers.unshift(newCustomer);
  writeData('customers.json', customers);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const customers = readData('customers.json');
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  customers[index] = { ...customers[index], ...req.body, id: customers[index].id };
  writeData('customers.json', customers);
  res.json(customers[index]);
});

app.delete('/api/customers/:id', (req, res) => {
  let customers = readData('customers.json');
  customers = customers.filter(c => c.id !== req.params.id);
  writeData('customers.json', customers);
  res.json({ success: true });
});

// ================= SALES CRUD =================
app.get('/api/sales', (req, res) => {
  res.json(readData('sales.json'));
});

app.post('/api/sales', (req, res) => {
  const sales = readData('sales.json');
  const vehicles = readData('vehicles.json');
  
  const basePrice = Number(req.body.basePrice || 0);
  const discount = Number(req.body.discount || 0);
  const taxRate = Number(req.body.taxRate || 8.5);
  const taxableAmount = Math.max(0, basePrice - discount);
  const taxAmount = +(taxableAmount * (taxRate / 100)).toFixed(2);
  const totalAmount = +(taxableAmount + taxAmount).toFixed(2);

  const newSale = {
    id: `sale-${Date.now()}`,
    invoiceNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    saleDate: new Date().toISOString().split('T')[0],
    taxRate,
    taxAmount,
    totalAmount,
    status: 'Confirmed',
    ...req.body
  };

  sales.unshift(newSale);
  writeData('sales.json', sales);

  // If vehicle was associated, update its status to Sold or update stock
  if (req.body.vehicleId) {
    const vIndex = vehicles.findIndex(v => v.id === req.body.vehicleId);
    if (vIndex !== -1) {
      if (vehicles[vIndex].stock > 1) {
        vehicles[vIndex].stock -= 1;
      } else {
        vehicles[vIndex].status = 'Sold';
        vehicles[vIndex].stock = 0;
      }
      writeData('vehicles.json', vehicles);
    }
  }

  res.status(201).json(newSale);
});

app.put('/api/sales/:id', (req, res) => {
  const sales = readData('sales.json');
  const index = sales.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Sale not found' });
  }
  sales[index] = { ...sales[index], ...req.body, id: sales[index].id };
  writeData('sales.json', sales);
  res.json(sales[index]);
});

app.delete('/api/sales/:id', (req, res) => {
  let sales = readData('sales.json');
  sales = sales.filter(s => s.id !== req.params.id);
  writeData('sales.json', sales);
  res.json({ success: true });
});

// ================= TEST DRIVES CRUD =================
app.get('/api/testdrives', (req, res) => {
  res.json(readData('testdrives.json'));
});

app.post('/api/testdrives', (req, res) => {
  const testdrives = readData('testdrives.json');
  const newTd = {
    id: `td-${Date.now()}`,
    status: 'Scheduled',
    ...req.body
  };
  testdrives.unshift(newTd);
  writeData('testdrives.json', testdrives);
  res.status(201).json(newTd);
});

app.put('/api/testdrives/:id', (req, res) => {
  const testdrives = readData('testdrives.json');
  const index = testdrives.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Test drive record not found' });
  }
  testdrives[index] = { ...testdrives[index], ...req.body, id: testdrives[index].id };
  writeData('testdrives.json', testdrives);
  res.json(testdrives[index]);
});

app.delete('/api/testdrives/:id', (req, res) => {
  let testdrives = readData('testdrives.json');
  testdrives = testdrives.filter(t => t.id !== req.params.id);
  writeData('testdrives.json', testdrives);
  res.json({ success: true });
});

// ================= SERVICES CRUD =================
app.get('/api/services', (req, res) => {
  res.json(readData('services.json'));
});

app.post('/api/services', (req, res) => {
  const services = readData('services.json');
  const newSrv = {
    id: `srv-${Date.now()}`,
    ticketNo: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'In Progress',
    date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  services.unshift(newSrv);
  writeData('services.json', services);
  res.status(201).json(newSrv);
});

app.put('/api/services/:id', (req, res) => {
  const services = readData('services.json');
  const index = services.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Service record not found' });
  }
  services[index] = { ...services[index], ...req.body, id: services[index].id };
  writeData('services.json', services);
  res.json(services[index]);
});

app.delete('/api/services/:id', (req, res) => {
  let services = readData('services.json');
  services = services.filter(s => s.id !== req.params.id);
  writeData('services.json', services);
  res.json({ success: true });
});

// ================= STAFF CRUD =================
app.get('/api/staff', (req, res) => {
  res.json(readData('staff.json'));
});

app.post('/api/staff', (req, res) => {
  const staff = readData('staff.json');
  const newStaff = {
    id: `stf-${Date.now()}`,
    status: 'Active',
    salesClosed: 0,
    revenueGenerated: 0,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    ...req.body
  };
  staff.unshift(newStaff);
  writeData('staff.json', staff);
  res.status(201).json(newStaff);
});

app.put('/api/staff/:id', (req, res) => {
  const staff = readData('staff.json');
  const index = staff.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Staff member not found' });
  }
  staff[index] = { ...staff[index], ...req.body, id: staff[index].id };
  writeData('staff.json', staff);
  res.json(staff[index]);
});

app.delete('/api/staff/:id', (req, res) => {
  let staff = readData('staff.json');
  staff = staff.filter(s => s.id !== req.params.id);
  writeData('staff.json', staff);
  res.json({ success: true });
});

// ================= SETTINGS =================
app.get('/api/settings', (req, res) => {
  const settings = readData('settings.json');
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const settings = { ...readData('settings.json'), ...req.body };
  writeData('settings.json', settings);
  res.json(settings);
});

// ================= ENQUIRIES / LEADS CRUD =================
app.get('/api/enquiries', (req, res) => {
  res.json(readData('enquiries.json'));
});

app.post('/api/enquiries', (req, res) => {
  const enquiries = readData('enquiries.json');
  const newEnquiry = {
    id: `enq-${Date.now()}`,
    status: 'New',
    createdAt: new Date().toISOString().split('T')[0],
    ...req.body
  };
  enquiries.unshift(newEnquiry);
  writeData('enquiries.json', enquiries);
  res.status(201).json(newEnquiry);
});

app.put('/api/enquiries/:id', (req, res) => {
  const enquiries = readData('enquiries.json');
  const index = enquiries.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Enquiry not found' });
  enquiries[index] = { ...enquiries[index], ...req.body, id: enquiries[index].id };
  writeData('enquiries.json', enquiries);
  res.json(enquiries[index]);
});

app.delete('/api/enquiries/:id', (req, res) => {
  let enquiries = readData('enquiries.json');
  enquiries = enquiries.filter(e => e.id !== req.params.id);
  writeData('enquiries.json', enquiries);
  res.json({ success: true });
});

// ================= QUOTATIONS / PRO-FORMA CRUD =================
app.get('/api/quotations', (req, res) => {
  res.json(readData('quotations.json'));
});

app.post('/api/quotations', (req, res) => {
  const quotations = readData('quotations.json');
  const count = quotations.length + 1;
  const newQuot = {
    id: `quot-${Date.now()}`,
    quotationNo: `QT-2026-${String(count).padStart(3, '0')}`,
    status: 'Draft',
    createdAt: new Date().toISOString().split('T')[0],
    ...req.body
  };
  quotations.unshift(newQuot);
  writeData('quotations.json', quotations);
  res.status(201).json(newQuot);
});

app.put('/api/quotations/:id', (req, res) => {
  const quotations = readData('quotations.json');
  const index = quotations.findIndex(q => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Quotation not found' });
  quotations[index] = { ...quotations[index], ...req.body, id: quotations[index].id };
  writeData('quotations.json', quotations);
  res.json(quotations[index]);
});

app.delete('/api/quotations/:id', (req, res) => {
  let quotations = readData('quotations.json');
  quotations = quotations.filter(q => q.id !== req.params.id);
  writeData('quotations.json', quotations);
  res.json({ success: true });
});

// ================= SPARE PARTS & ACCESSORIES CRUD =================
app.get('/api/parts', (req, res) => {
  res.json(readData('parts.json'));
});

app.post('/api/parts', (req, res) => {
  const parts = readData('parts.json');
  const newPart = {
    id: `part-${Date.now()}`,
    partNo: req.body.partNo || `APX-${Date.now().toString().slice(-4)}`,
    status: Number(req.body.stock || 0) <= Number(req.body.minStock || 3) ? 'Low Stock' : 'In Stock',
    ...req.body
  };
  parts.unshift(newPart);
  writeData('parts.json', parts);
  res.status(201).json(newPart);
});

app.put('/api/parts/:id', (req, res) => {
  const parts = readData('parts.json');
  const index = parts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Part not found' });
  const updated = { ...parts[index], ...req.body, id: parts[index].id };
  if (Number(updated.stock) <= 0) {
    updated.status = 'Out of Stock';
  } else if (Number(updated.stock) <= Number(updated.minStock || 3)) {
    updated.status = 'Low Stock';
  } else {
    updated.status = 'In Stock';
  }
  parts[index] = updated;
  writeData('parts.json', parts);
  res.json(parts[index]);
});

app.delete('/api/parts/:id', (req, res) => {
  let parts = readData('parts.json');
  parts = parts.filter(p => p.id !== req.params.id);
  writeData('parts.json', parts);
  res.json({ success: true });
});

// ================= VEHICLE PROCUREMENT CRUD =================
app.get('/api/procurement', (req, res) => {
  res.json(readData('procurement.json'));
});

app.post('/api/procurement', (req, res) => {
  const orders = readData('procurement.json');
  const count = orders.length + 1;
  const newOrder = {
    id: `po-${Date.now()}`,
    poNumber: `PO-2026-${String(count).padStart(3, '0')}`,
    orderDate: new Date().toISOString().split('T')[0],
    status: 'Ordered',
    ...req.body
  };
  orders.unshift(newOrder);
  writeData('procurement.json', orders);
  res.status(201).json(newOrder);
});

app.put('/api/procurement/:id', (req, res) => {
  const orders = readData('procurement.json');
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  orders[index] = { ...orders[index], ...req.body, id: orders[index].id };
  writeData('procurement.json', orders);
  res.json(orders[index]);
});

app.delete('/api/procurement/:id', (req, res) => {
  let orders = readData('procurement.json');
  orders = orders.filter(o => o.id !== req.params.id);
  writeData('procurement.json', orders);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚗 Apex Horizon Auto Showroom Server running on port ${PORT}`);
});
