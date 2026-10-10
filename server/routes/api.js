const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/connection');
const { 
  generateToken, 
  authenticateToken, 
  optionalAuth, 
  requireRole, 
  recordAudit 
} = require('../middleware/auth');

const reportService = require('../services/reportService');
const communicationService = require('../services/communicationService');
const reminderService = require('../services/reminderService');
const documentService = require('../services/documentService');
const backupService = require('../services/backupService');
const settingsService = require('../services/settingsService');

// Multer config for document uploads (max 10MB per file)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

// Helper to safely parse JSON strings from SQLite
const safeParse = (str, fallback = []) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// Helper to validate ISO date string formats (YYYY-MM-DD or standard ISO date)
const isValidDateStr = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  }
  const dateObj = new Date(dateStr);
  return !isNaN(dateObj.getTime());
};

// ============================================================================
// 1. AUTHENTICATION & SESSION
// ============================================================================

// POST /api/auth/login (Public)
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const user = db.prepare(`
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.username = ?
  `).get(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  const hash = user.password_hash || user.password;
  const isMatch = hash ? bcrypt.compareSync(password, hash) : false;
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
  }

  const token = generateToken(user);
  recordAudit(db, user, 'LOGIN', 'AUTH', `User ${user.name} logged in successfully`, user.id, req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      title: user.title,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

// POST /api/auth/logout (Protected: ADMIN & SALES_EXECUTIVE)
router.post('/auth/logout', authenticateToken, (req, res) => {
  recordAudit(db, req.user, 'LOGOUT', 'AUTH', `User ${req.user.name} logged out of session`, req.user.id, req.ip);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me (Protected: Session persistence verification)
router.get('/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.name, r.name as role, u.title, u.email, u.phone, u.avatar 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.id = ?
  `).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ============================================================================
// 2. SYSTEM HEALTH & PUBLIC DIAGNOSTICS
// ============================================================================

// GET /api/health (Public)
router.get('/health', (req, res) => {
  let showroomName = 'Apex Horizon Motors';
  try {
    const setting = db.prepare('SELECT showroom_name FROM showroom_settings LIMIT 1').get();
    if (setting && setting.showroom_name) showroomName = setting.showroom_name;
  } catch {}
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    showroom: showroomName,
    database: 'SQLite 3 (WAL mode)'
  });
});

// Mount specialized dealership business sections routes (Sales, Service, Exchange, Accounts, Reports)
router.use(require('./dealership_sections'));

// ============================================================================
// 3. DASHBOARD (Protected: ADMIN & SALES_EXECUTIVE)
// ============================================================================

router.get('/dashboard', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles').all();
  const customers = db.prepare('SELECT * FROM customers').all();
  const sales = db.prepare(`
    SELECT s.*, c.name as customer_name, v.brand || ' ' || v.model as vehicle_name, v.vin as vehicle_vin
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN vehicles v ON s.vehicle_id = v.id
    ORDER BY s.booking_date DESC
  `).all();
  const testdrives = db.prepare('SELECT * FROM test_drives').all();
  const services = db.prepare('SELECT * FROM service_tickets').all();

  const totalStockValue = vehicles.reduce((sum, v) => sum + (Number(v.ex_showroom_price) * (Number(v.stock_quantity) || 1)), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const soldCount = sales.length;
  const reservedCount = vehicles.filter(v => v.status === 'Reserved').length;

  const monthlyRevenue = [
    { month: 'Aug', revenue: 4200000, salesCount: 2 },
    { month: 'Sep', revenue: Math.round(totalRevenue), salesCount: sales.length }
  ];

  const categoryMap = {};
  vehicles.forEach(v => {
    categoryMap[v.category] = (categoryMap[v.category] || 0) + 1;
  });

  const categoryBreakdown = Object.keys(categoryMap).map(k => ({
    name: k,
    value: categoryMap[k]
  }));

  const lowStockMap = {};
  vehicles.forEach(v => {
    if (v.status === 'Available' && (v.stock_quantity || 0) <= 2) {
      const name = `${v.brand} ${v.model}`;
      if (!lowStockMap[name]) {
        lowStockMap[name] = {
          id: v.id,
          brand: v.brand,
          model: v.model,
          name: name,
          stock: v.stock_quantity,
          vin: v.vin
        };
      }
    }
  });
  const lowStock = Object.values(lowStockMap);

  res.json({
    kpi: {
      totalVehicles: vehicles.length,
      availableCount: availableCount,
      reservedCount: reservedCount,
      soldCount: soldCount,
      activeCustomersCount: customers.length,
      totalRevenue: totalRevenue,
      inventoryValue: totalStockValue,
      pendingTestDrivesCount: testdrives.filter(t => t.status === 'Scheduled').length,
      activeServicesCount: services.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled').length
    },
    metrics: {
      totalVehicles: vehicles.length,
      availableVehicles: availableCount,
      reservedVehicles: reservedCount,
      soldVehicles: soldCount,
      totalCustomers: customers.length,
      totalSalesRevenue: totalRevenue,
      inventoryValue: totalStockValue,
      pendingTestDrives: testdrives.filter(t => t.status === 'Scheduled').length,
      activeServices: services.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled').length
    },
    monthlyRevenue,
    categoryBreakdown,
    recentSales: sales.slice(0, 5),
    upcomingTestDrives: testdrives.filter(t => t.status === 'Scheduled').slice(0, 5),
    lowStock
  });
});

// ============================================================================
// 4. VEHICLES / INVENTORY (Protected: Read/Write: ADMIN & SALES; Delete: ADMIN)
// ============================================================================

router.get('/vehicles', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, category, status, fuel } = req.query;
  let sql = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (brand LIKE ? OR model LIKE ? OR vin LIKE ? OR color LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (fuel && fuel !== 'All') {
    sql += ' AND fuel_type = ?';
    params.push(fuel);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(v => ({
    ...v,
    price: v.ex_showroom_price,
    stock: v.stock_quantity,
    image: v.image_url,
    fuel: v.fuel_type,
    features: safeParse(v.features)
  })));
});

router.get('/vehicles/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const v = db.prepare('SELECT * FROM vehicles WHERE id = ? OR vin = ?').get(req.params.id, req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({
    ...v,
    price: v.ex_showroom_price,
    stock: v.stock_quantity,
    image: v.image_url,
    fuel: v.fuel_type,
    features: safeParse(v.features)
  });
});

const VALID_VEHICLE_CATEGORIES = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Electric', 'Commercial'];
function normalizeVehicleCategory(cat) {
  if (!cat) return 'SUV';
  const match = VALID_VEHICLE_CATEGORIES.find(c => c.toLowerCase() === cat.toLowerCase());
  if (match) return match;
  const lower = cat.toLowerCase();
  if (lower.includes('electric') || lower.includes('ev')) return 'Electric';
  if (lower.includes('coupe') || lower.includes('convertible') || lower.includes('sports') || lower.includes('gt') || lower.includes('supercar') || lower.includes('lux')) return 'Luxury';
  if (lower.includes('sedan') || lower.includes('saloon')) return 'Sedan';
  if (lower.includes('hatch')) return 'Hatchback';
  if (lower.includes('van') || lower.includes('truck') || lower.includes('commercial')) return 'Commercial';
  return 'SUV';
}

const VALID_TRANSMISSIONS = ['Manual', 'Automatic', 'CVT', 'Dual-Clutch'];
function normalizeVehicleTransmission(t) {
  if (!t) return 'Automatic';
  const match = VALID_TRANSMISSIONS.find(v => v.toLowerCase() === t.toLowerCase());
  if (match) return match;
  const lower = t.toLowerCase();
  if (lower.includes('dual') || lower.includes('clutch') || lower.includes('dct') || lower.includes('dsg') || lower.includes('pdk')) return 'Dual-Clutch';
  if (lower.includes('cvt')) return 'CVT';
  if (lower.includes('manual')) return 'Manual';
  return 'Automatic';
}

const VALID_FUELS = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
function normalizeVehicleFuel(f) {
  if (!f) return 'Petrol';
  const match = VALID_FUELS.find(v => v.toLowerCase() === f.toLowerCase());
  if (match) return match;
  const lower = f.toLowerCase();
  if (lower.includes('diesel')) return 'Diesel';
  if (lower.includes('electric') || lower.includes('ev')) return 'Electric';
  if (lower.includes('hybrid')) return 'Hybrid';
  if (lower.includes('cng')) return 'CNG';
  return 'Petrol';
}

router.post('/vehicles', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `veh_${Date.now()}`;
  const vin = (req.body.vin || `VIN${Date.now().toString().slice(-10)}`).trim().toUpperCase();

  if (!vin) {
    return res.status(400).json({ error: 'Vehicle VIN is required.' });
  }

  // Duplicate VIN validation
  const existingVin = db.prepare('SELECT id, brand, model FROM vehicles WHERE vin = ?').get(vin);
  if (existingVin) {
    return res.status(409).json({
      error: `Duplicate VIN: A vehicle (${existingVin.brand} ${existingVin.model}) with VIN '${vin}' is already registered in inventory.`
    });
  }

  const year = Number(req.body.year || 2026);
  if (isNaN(year) || year < 1900 || year > 2100) {
    return res.status(400).json({ error: 'Invalid manufacturing year. Must be a valid year between 1900 and 2100.' });
  }

  const price = Number(req.body.price ?? req.body.ex_showroom_price ?? 2000000);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Ex-showroom price must be a non-negative number.' });
  }

  const category = normalizeVehicleCategory(req.body.category);
  const transmission = normalizeVehicleTransmission(req.body.transmission);
  const fuel = normalizeVehicleFuel(req.body.fuel || req.body.fuel_type);
  const features = JSON.stringify(req.body.features || []);

  try {
    const insert = db.prepare(`
      INSERT INTO vehicles (
        id, vin, brand, model, variant, year, category, color, fuel_type,
        transmission, engine, horsepower, mileage_kmpl, ex_showroom_price,
        stock_quantity, status, image_url, features, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insert.run(
      id,
      vin,
      req.body.brand || 'Tata',
      req.body.model || 'Harrier',
      req.body.variant || 'XZ+',
      year,
      category,
      req.body.color || 'Black',
      fuel,
      transmission,
      req.body.engine || '2.0L Turbo',
      Number(req.body.horsepower || 170),
      Number(req.body.mileage || req.body.mileage_kmpl || 15.0),
      price,
      Number(req.body.stock ?? req.body.stock_quantity ?? 1),
      req.body.status || 'Available',
      req.body.image || req.body.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
      features
    );

    recordAudit(db, req.user, 'CREATE', 'INVENTORY', `Added vehicle ${req.body.brand || 'Tata'} ${req.body.model || 'Harrier'} (VIN: ${vin})`, id);
    const created = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.status(201).json({
      ...created,
      price: created.ex_showroom_price,
      stock: created.stock_quantity,
      image: created.image_url,
      features: safeParse(created.features)
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Vehicle VIN '${vin}' or ID already exists in database.` });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/vehicles/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Vehicle not found' });

  const updated = { ...current, ...req.body };
  const category = normalizeVehicleCategory(updated.category);
  const transmission = normalizeVehicleTransmission(updated.transmission);
  const fuel = normalizeVehicleFuel(updated.fuel || updated.fuel_type);
  const features = typeof updated.features === 'string' ? updated.features : JSON.stringify(updated.features || []);

  db.prepare(`
    UPDATE vehicles SET
      brand = ?, model = ?, variant = ?, year = ?, category = ?, color = ?, fuel_type = ?,
      transmission = ?, engine = ?, horsepower = ?, mileage_kmpl = ?, ex_showroom_price = ?,
      stock_quantity = ?, status = ?, image_url = ?, features = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    updated.brand, updated.model, updated.variant, Number(updated.year), category, updated.color,
    fuel, transmission, updated.engine, Number(updated.horsepower),
    Number(updated.mileage || updated.mileage_kmpl), Number(updated.price || updated.ex_showroom_price),
    Number(updated.stock ?? updated.stock_quantity), updated.status, updated.image || updated.image_url,
    features, req.params.id
  );

  recordAudit(db, req.user, 'UPDATE', 'INVENTORY', `Updated vehicle ${updated.brand} ${updated.model}`, req.params.id);
  res.json({
    ...updated,
    price: updated.price || updated.ex_showroom_price,
    stock: updated.stock ?? updated.stock_quantity,
    features: safeParse(features)
  });
});

router.delete('/vehicles/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const v = db.prepare('SELECT id, brand, model FROM vehicles WHERE id = ?').get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });

  const linkedSales = db.prepare('SELECT count(*) as c FROM sales WHERE vehicle_id = ?').get(req.params.id).c;
  if (linkedSales > 0) {
    return res.status(400).json({ error: `Cannot delete vehicle '${v.brand} ${v.model}' because it is linked to ${linkedSales} active sales order(s).` });
  }

  try {
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'INVENTORY', `Deleted vehicle ${v.brand} ${v.model}`, req.params.id);
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// 5. CUSTOMERS (Protected: Read/Write: ADMIN & SALES; Delete: ADMIN)
// ============================================================================

router.get('/customers', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, status, type } = req.query;
  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type && type !== 'All') {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/customers', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const name = (req.body.name || '').trim();
  const phone = (req.body.phone || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }
  if (!phone) {
    return res.status(400).json({ error: 'Customer phone number is required.' });
  }

  // Duplicate phone check
  const existingCust = db.prepare('SELECT id, name FROM customers WHERE phone = ?').get(phone);
  if (existingCust) {
    return res.status(409).json({ error: `Customer with phone number '${phone}' already exists (${existingCust.name}).` });
  }

  const id = req.body.id || `cust_${Date.now()}`;
  try {
    db.prepare(`
      INSERT INTO customers (id, name, phone, email, address, city, state, pincode, pan_number, aadhaar_number, type, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, name, phone, req.body.email || '', req.body.address || '',
      req.body.city || 'Mumbai', req.body.state || 'Maharashtra', req.body.pincode || '400001',
      req.body.pan_number || req.body.pan || '', req.body.aadhaar_number || '',
      req.body.type || 'Individual', req.body.status || 'Active', req.body.notes || ''
    );
    recordAudit(db, req.user, 'CREATE', 'CUSTOMERS', `Registered customer ${name} (${phone})`, id);
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(id));
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Customer phone '${phone}' or ID already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/customers/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Customer not found' });
  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, city = ?, state = ?, pincode = ?, pan_number = ?, type = ?, status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(u.name, u.phone, u.email, u.address, u.city, u.state, u.pincode, u.pan_number, u.type, u.status, u.notes, req.params.id);
  recordAudit(db, req.user, 'UPDATE', 'CUSTOMERS', `Updated customer ${u.name}`, req.params.id);
  res.json(u);
});

router.delete('/customers/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Customer not found' });

  const linkedSales = db.prepare('SELECT count(*) as c FROM sales WHERE customer_id = ?').get(req.params.id).c;
  if (linkedSales > 0) {
    return res.status(400).json({ error: `Cannot delete customer '${current.name}' because they have ${linkedSales} active sales order(s).` });
  }

  try {
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'CUSTOMERS', `Deleted customer ${current.name}`, req.params.id);
    res.json({ success: true, message: `Customer ${current.name} deleted.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// 6. LEADS & ENQUIRIES (Protected: ADMIN & SALES_EXECUTIVE)
// ============================================================================

router.get('/leads', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, status, source } = req.query;
  let sql = `
    SELECT l.*, c.name as customer_name_joined, v.brand || ' ' || v.model as vehicle_interest_name, u.name as assigned_staff_name
    FROM leads l
    LEFT JOIN customers c ON l.customer_id = c.id
    LEFT JOIN vehicles v ON l.vehicle_interest_id = v.id
    LEFT JOIN users u ON l.assigned_staff_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (l.contact_name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.vehicle_interest_text LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (status && status !== 'All') {
    sql += ' AND l.status = ?';
    params.push(status);
  }
  if (source && source !== 'All') {
    sql += ' AND l.source = ?';
    params.push(source);
  }

  sql += ' ORDER BY l.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(l => ({
    ...l,
    customerName: l.contact_name,
    vehicleOfInterest: l.vehicle_interest_text || l.vehicle_interest_name,
    budget: l.budget_max
  })));
});

// Support both /api/leads and /api/enquiries
router.get('/enquiries', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, status, source } = req.query;
  let sql = `
    SELECT l.*, c.name as customer_name_joined, v.brand || ' ' || v.model as vehicle_interest_name
    FROM leads l
    LEFT JOIN customers c ON l.customer_id = c.id
    LEFT JOIN vehicles v ON l.vehicle_interest_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (l.contact_name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.vehicle_interest_text LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (status && status !== 'All') {
    sql += ' AND l.status = ?';
    params.push(status);
  }
  if (source && source !== 'All') {
    sql += ' AND l.source = ?';
    params.push(source);
  }

  sql += ' ORDER BY l.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(l => ({
    ...l,
    customerName: l.contact_name,
    vehicleOfInterest: l.vehicle_interest_text || l.vehicle_interest_name,
    budget: l.budget_max
  })));
});

router.get(['/leads/:id', '/enquiries/:id'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const l = db.prepare(`
    SELECT l.*, c.name as customer_name, v.brand || ' ' || v.model as vehicle_interest_name
    FROM leads l
    LEFT JOIN customers c ON l.customer_id = c.id
    LEFT JOIN vehicles v ON l.vehicle_interest_id = v.id
    WHERE l.id = ?
  `).get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Lead not found' });
  res.json({
    ...l,
    customerName: l.contact_name,
    vehicleOfInterest: l.vehicle_interest_text || l.vehicle_interest_name,
    budget: l.budget_max
  });
});

router.post(['/leads', '/enquiries'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `lead_${Date.now()}`;
  db.prepare(`
    INSERT INTO leads (id, customer_id, contact_name, phone, email, vehicle_interest_id, vehicle_interest_text, budget_min, budget_max, source, status, assigned_staff_id, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id, req.body.customer_id || req.body.customerId || null,
    req.body.contact_name || req.body.customerName || 'Prospect',
    req.body.phone || '+91 99999 00000',
    req.body.email || '',
    req.body.vehicle_interest_id || req.body.vehicleInterestId || null,
    req.body.vehicle_interest_text || req.body.vehicleOfInterest || '',
    Number(req.body.budget_min || 0),
    Number(req.body.budget_max || req.body.budget || 2000000),
    req.body.source || 'Walk-in',
    req.body.status || 'New',
    req.user?.id && req.user.id !== 'anon' ? req.user.id : null,
    req.body.notes || ''
  );
  recordAudit(db, req.user, 'CREATE', 'LEADS', `Created lead for ${req.body.contact_name || req.body.customerName}`, id);
  res.status(201).json(db.prepare('SELECT * FROM leads WHERE id = ?').get(id));
});

// Workflow Conversion: Lead -> Customer
router.post(['/leads/:id/convert-customer', '/enquiries/:id/convert-customer'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  let customer = null;
  if (lead.phone) {
    customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(lead.phone);
  }

  if (!customer) {
    const custId = `cust_${Date.now()}`;
    db.prepare(`
      INSERT INTO customers (id, name, phone, email, address, city, state, pincode, type, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      custId, lead.contact_name, lead.phone, lead.email || '',
      req.body.address || '', req.body.city || 'Mumbai', 'Maharashtra', req.body.pincode || '400051',
      'Individual', 'Active', `Converted from Lead ${lead.id}. ${lead.notes || ''}`
    );
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(custId);
  }

  db.prepare(`
    UPDATE leads SET customer_id = ?, status = 'Converted', updated_at = datetime('now')
    WHERE id = ?
  `).run(customer.id, lead.id);

  recordAudit(db, req.user, 'CREATE', 'CUSTOMERS', `Converted Lead ${lead.contact_name} into Customer ${customer.name}`, customer.id);
  res.json({ success: true, customer, leadId: lead.id });
});

router.put(['/leads/:id', '/enquiries/:id'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Lead not found' });
  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE leads SET contact_name = ?, phone = ?, email = ?, vehicle_interest_text = ?, budget_max = ?, source = ?, status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    u.contact_name || u.customerName, u.phone, u.email,
    u.vehicle_interest_text || u.vehicleOfInterest, Number(u.budget_max || u.budget),
    u.source, u.status, u.notes, req.params.id
  );
  recordAudit(db, req.user, 'UPDATE', 'LEADS', `Updated lead status to ${u.status}`, req.params.id);
  res.json(u);
});

router.delete(['/leads/:id', '/enquiries/:id'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============================================================================
// 7. ESTIMATES & QUOTATIONS (Protected: ADMIN & SALES_EXECUTIVE)
// ============================================================================

router.get('/estimates', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, status } = req.query;
  let sql = 'SELECT * FROM estimates WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (id LIKE ? OR estimate_number LIKE ? OR customer_name LIKE ? OR vehicle_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(e => ({
    ...e,
    estimateNo: e.estimate_number,
    customerName: e.customer_name,
    vehicleName: e.vehicle_name,
    exShowroomPrice: e.ex_showroom_price,
    rtoCharges: e.rto_charges,
    insuranceAmount: e.insurance_amount,
    accessoriesCost: e.accessories_cost,
    warrantyCost: e.warranty_cost,
    discountAmount: e.discount_amount,
    total: e.total_estimated_amount,
    validUntil: e.valid_until
  })));
});

router.get('/estimates/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const e = db.prepare('SELECT * FROM estimates WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Estimate not found' });
  res.json({
    ...e,
    estimateNo: e.estimate_number,
    customerName: e.customer_name,
    vehicleName: e.vehicle_name,
    exShowroomPrice: e.ex_showroom_price,
    rtoCharges: e.rto_charges,
    insuranceAmount: e.insurance_amount,
    accessoriesCost: e.accessories_cost,
    warrantyCost: e.warranty_cost,
    discountAmount: e.discount_amount,
    total: e.total_estimated_amount,
    validUntil: e.valid_until
  });
});

router.post('/estimates', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `est_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM estimates').get().c + 1;
  const estNo = req.body.estimate_number || req.body.estimateNo || `EST-2026-${String(totalCount).padStart(3, '0')}`;

  const customerId = req.body.customer_id || req.body.customerId || null;
  if (customerId) {
    const c = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
    if (!c) return res.status(404).json({ error: `Customer with ID '${customerId}' not found.` });
  }

  const vehicleId = req.body.vehicle_id || req.body.vehicleId || null;
  if (vehicleId) {
    const v = db.prepare('SELECT id, model FROM vehicles WHERE id = ?').get(vehicleId);
    if (!v) return res.status(404).json({ error: `Vehicle with ID '${vehicleId}' not found.` });
  }

  const validUntil = req.body.valid_until || req.body.validUntil || '2026-11-01';
  if (!isValidDateStr(validUntil)) {
    return res.status(400).json({ error: 'Invalid valid_until date format. Expected YYYY-MM-DD.' });
  }

  const exShowroom = Number(req.body.ex_showroom_price || req.body.exShowroomPrice || 2000000);
  const rto = Number(req.body.rto_charges || req.body.rtoCharges || 150000);
  const insurance = Number(req.body.insurance_amount || req.body.insuranceAmount || 80000);
  const accessories = Number(req.body.accessories_cost || req.body.accessoriesCost || 20000);
  const warranty = Number(req.body.warranty_cost || req.body.warrantyCost || 30000);
  const discount = Number(req.body.discount_amount || req.body.discountAmount || 0);
  const totalEstimated = exShowroom + rto + insurance + accessories + warranty - discount;

  try {
    db.prepare(`
      INSERT INTO estimates (id, estimate_number, customer_id, customer_name, vehicle_id, vehicle_name, ex_showroom_price, rto_charges, insurance_amount, accessories_cost, warranty_cost, discount_amount, total_estimated_amount, valid_until, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, estNo, customerId,
      req.body.customer_name || req.body.customerName || 'Valued Customer',
      vehicleId,
      req.body.vehicle_name || req.body.vehicleName || 'Tata Safari',
      exShowroom, rto, insurance, accessories, warranty, discount,
      totalEstimated, validUntil,
      req.body.status || 'Active', req.user?.id || null
    );
    recordAudit(db, req.user, 'CREATE', 'ESTIMATES', `Generated Estimate ${estNo} for ${req.body.customer_name || req.body.customerName}`, id);
    const created = db.prepare('SELECT * FROM estimates WHERE id = ?').get(id);
    res.status(201).json({
      ...created,
      estimateNo: created.estimate_number,
      customerName: created.customer_name,
      vehicleName: created.vehicle_name,
      exShowroomPrice: created.ex_showroom_price,
      rtoCharges: created.rto_charges,
      insuranceAmount: created.insurance_amount,
      accessoriesCost: created.accessories_cost,
      warrantyCost: created.warranty_cost,
      discountAmount: created.discount_amount,
      total: created.total_estimated_amount,
      validUntil: created.valid_until
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/estimates/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM estimates WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Estimate not found' });
  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE estimates SET status = ?, ex_showroom_price = ?, rto_charges = ?, insurance_amount = ?, accessories_cost = ?, warranty_cost = ?, discount_amount = ?, total_estimated_amount = ?, valid_until = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    u.status, Number(u.ex_showroom_price), Number(u.rto_charges), Number(u.insurance_amount),
    Number(u.accessories_cost), Number(u.warranty_cost), Number(u.discount_amount),
    Number(u.total_estimated_amount), u.valid_until, req.params.id
  );
  res.json(u);
});

router.delete('/estimates/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  db.prepare('DELETE FROM estimates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Workflow Conversion: Estimate -> Quotation
router.post('/estimates/:id/convert-quotation', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const estimate = db.prepare('SELECT * FROM estimates WHERE id = ?').get(req.params.id);
  if (!estimate) return res.status(404).json({ error: 'Estimate not found' });

  const totalCount = db.prepare('SELECT count(*) as c FROM quotations').get().c + 1;
  const quoteNo = `QUOT-2026-${String(totalCount).padStart(3, '0')}`;
  const quotId = `quot_${Date.now()}`;

  let custPhone = '+91 99999 00000';
  let custEmail = '';
  if (estimate.customer_id) {
    const cust = db.prepare('SELECT phone, email FROM customers WHERE id = ?').get(estimate.customer_id);
    if (cust) {
      custPhone = cust.phone;
      custEmail = cust.email || '';
    }
  }

  db.transaction(() => {
    db.prepare(`
      INSERT INTO quotations (
        id, quotation_number, estimate_id, customer_id, customer_name, customer_phone, customer_email,
        vehicle_id, vehicle_name, ex_showroom_price, rto_tax, insurance, warranty_pack, accessories,
        discount, total_amount, valid_until, status, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      quotId, quoteNo, estimate.id, estimate.customer_id, estimate.customer_name, custPhone, custEmail,
      estimate.vehicle_id, estimate.vehicle_name, estimate.ex_showroom_price, estimate.rto_charges,
      estimate.insurance_amount, estimate.warranty_cost, estimate.accessories_cost, estimate.discount_amount,
      estimate.total_estimated_amount, estimate.valid_until, 'Draft',
      `Generated from Estimate ${estimate.estimate_number}`, req.user?.id || null
    );

    db.prepare(`
      UPDATE estimates SET status = 'Converted', updated_at = datetime('now')
      WHERE id = ?
    `).run(estimate.id);
  })();

  recordAudit(db, req.user, 'CREATE', 'QUOTATIONS', `Converted Estimate ${estimate.estimate_number} into Quotation ${quoteNo}`, quotId);
  const created = db.prepare('SELECT * FROM quotations WHERE id = ?').get(quotId);
  res.status(201).json({ success: true, quotation: created });
});

router.get('/quotations', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, status } = req.query;
  let sql = 'SELECT * FROM quotations WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (quotation_number LIKE ? OR customer_name LIKE ? OR vehicle_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(q => ({
    ...q,
    quotationNo: q.quotation_number,
    total: q.total_amount,
    customerName: q.customer_name,
    vehicleName: q.vehicle_name
  })));
});

router.post('/quotations', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `quot_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM quotations').get().c + 1;
  const quoteNo = req.body.quotation_number || req.body.quotationNo || `QUOT-2026-${String(totalCount).padStart(3, '0')}`;

  const customerId = req.body.customer_id || req.body.customerId || null;
  if (customerId) {
    const c = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
    if (!c) return res.status(404).json({ error: `Customer with ID '${customerId}' not found.` });
  }

  const vehicleId = req.body.vehicle_id || req.body.vehicleId || null;
  if (vehicleId) {
    const v = db.prepare('SELECT id, model FROM vehicles WHERE id = ?').get(vehicleId);
    if (!v) return res.status(404).json({ error: `Vehicle with ID '${vehicleId}' not found.` });
  }

  const validUntil = req.body.valid_until || req.body.validUntil || '2026-11-01';
  if (!isValidDateStr(validUntil)) {
    return res.status(400).json({ error: 'Invalid valid_until date format. Expected YYYY-MM-DD.' });
  }

  const exPrice = Number(req.body.ex_showroom_price || req.body.exShowroomPrice || 2000000);
  const rto = Number(req.body.rto_tax || req.body.rtoTax || 150000);
  const ins = Number(req.body.insurance || 80000);
  const war = Number(req.body.warranty_pack || req.body.warrantyPack || 30000);
  const acc = Number(req.body.accessories || 20000);
  const disc = Number(req.body.discount || 0);
  const total = Number(req.body.total_amount || req.body.total || (exPrice + rto + ins + war + acc - disc));

  try {
    db.prepare(`
      INSERT INTO quotations (id, quotation_number, estimate_id, customer_id, customer_name, customer_phone, customer_email, vehicle_id, vehicle_name, ex_showroom_price, rto_tax, insurance, warranty_pack, accessories, discount, total_amount, valid_until, status, notes, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, quoteNo, req.body.estimate_id || null, customerId,
      req.body.customer_name || req.body.customerName || 'Customer',
      req.body.customer_phone || req.body.customerPhone || '+91 99999 00000',
      req.body.customer_email || req.body.customerEmail || '',
      vehicleId,
      req.body.vehicle_name || req.body.vehicleName || 'Vehicle',
      exPrice, rto, ins, war, acc, disc, total,
      validUntil,
      req.body.status || 'Draft',
      req.body.notes || '',
      req.user?.id || null
    );
    recordAudit(db, req.user, 'CREATE', 'QUOTATIONS', `Generated Quotation ${quoteNo} for ${req.body.customer_name || req.body.customerName}`, id);
    res.status(201).json(db.prepare('SELECT * FROM quotations WHERE id = ?').get(id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/quotations/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Quotation not found' });
  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE quotations SET status = ?, notes = ?, total_amount = ?, discount = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(u.status, u.notes, Number(u.total_amount || u.total), Number(u.discount || 0), req.params.id);
  res.json(u);
});

router.delete('/quotations/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  db.prepare('DELETE FROM quotations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============================================================================
// 8. SALES & INVOICES (Protected: Read/Write: ADMIN & SALES; Delete: ADMIN)
// ============================================================================

function normalizeSalesPaymentMethod(mode) {
  const m = String(mode || '').trim();
  if (m.includes('RTGS') || m.includes('NEFT') || m.includes('Wire') || m.includes('Net Banking') || m.includes('Banking')) return 'Net Banking / RTGS';
  if (m.includes('Loan') || m.includes('Bank') || m.includes('Financ')) return 'Car Loan / Bank';
  if (m.includes('UPI') || m.includes('Card') || m.includes('Debit') || m.includes('Credit')) return 'UPI / Card';
  if (m.includes('Cheque') || m.includes('Demand Draft') || m.includes('DD')) return 'Cheque';
  if (m.includes('Cash')) return 'Cash';
  return 'Net Banking / RTGS';
}

function normalizePaymentMode(mode) {
  const m = String(mode || '').trim();
  if (m.includes('RTGS') || m.includes('NEFT') || m.includes('Wire') || m.includes('Net Banking') || m.includes('Banking')) return 'RTGS / NEFT';
  if (m.includes('Loan') || m.includes('Bank') || m.includes('Financ')) return 'Car Loan / Bank';
  if (m.includes('UPI') || m.includes('Card') || m.includes('Debit') || m.includes('Credit')) return 'UPI / Card';
  if (m.includes('Cheque') || m.includes('Demand Draft') || m.includes('DD')) return 'Cheque';
  if (m.includes('Cash')) return 'Cash';
  return 'RTGS / NEFT';
}

function normalizePaymentType(type) {
  const t = String(type || '').trim().toLowerCase();
  if (t.includes('advance') || t.includes('booking')) return 'Booking Advance';
  if (t.includes('down') || t.includes('partial') || t.includes('install')) return 'Down Payment';
  if (t.includes('settlement') || t.includes('full') || t.includes('balance') || t.includes('final')) return 'Full Settlement';
  if (t.includes('service') || t.includes('repair') || t.includes('part')) return 'Service Bill';
  if (t.includes('exchange') || t.includes('trade')) return 'Exchange Adjustment';
  return 'Down Payment';
}

// Showroom Dealership Profile accessible to both ADMIN and SALES_EXECUTIVE for dynamic Invoices & Receipts
router.get(['/dealership-profile', '/showroom-info'], authenticateToken, (req, res) => {
  const s = db.prepare('SELECT id, showroom_name, address, phone, email, currency_symbol, currency_code, dealer_license, gstin, tax_rate, business_hours FROM showroom_settings LIMIT 1').get();
  res.json(s || {
    showroom_name: 'Apex Horizon Motors',
    address: 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051',
    phone: '+91 98200 12345',
    email: 'info@apexhorizonmotors.in',
    currency_symbol: '₹',
    currency_code: 'INR',
    dealer_license: 'DL-MH-02-SHOWROOM-2026',
    gstin: '27AABCA1234F1Z8',
    tax_rate: 18.0
  });
});

router.get('/sales', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, 
           c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
           v.brand || ' ' || v.model as vehicle_name, v.vin as vehicle_vin, v.color as vehicle_color,
           i.id as invoice_id, i.invoice_number, i.balance_due, i.paid_amount, i.status as invoice_status,
           u.name as sales_agent_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN invoices i ON i.sale_id = s.id
    LEFT JOIN users u ON s.sales_agent_id = u.id
    ORDER BY s.booking_date DESC, s.created_at DESC
  `).all();
  res.json(rows.map(s => ({
    ...s,
    saleOrderNumber: s.sale_order_number,
    invoiceNo: s.invoice_number,
    invoiceId: s.invoice_id,
    customerName: s.customer_name,
    customerPhone: s.customer_phone,
    customerEmail: s.customer_email,
    vehicleName: s.vehicle_name,
    vin: s.vehicle_vin,
    color: s.vehicle_color,
    basePrice: s.base_price,
    discount: s.discount,
    taxRate: s.tax_rate,
    taxAmount: s.tax_amount,
    totalAmount: s.total_amount,
    paidAmount: s.paid_amount ?? 0,
    balanceDue: s.balance_due ?? s.total_amount,
    invoiceStatus: s.invoice_status || 'Issued',
    paymentMethod: s.payment_method,
    saleDate: s.booking_date,
    bookingDate: s.booking_date,
    deliveryDate: s.expected_delivery_date,
    salesAgent: s.sales_agent_name || 'Julian Vance'
  })));
});

router.post('/sales', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `sale_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM sales').get().c + 1;
  const soNumber = req.body.sale_order_number || req.body.saleOrderNumber || `SO-2026-${String(totalCount).padStart(3, '0')}`;
  const invNumber = req.body.invoice_number || `INV-2026-${String(totalCount).padStart(3, '0')}`;

  let vehicleId = req.body.vehicle_id || req.body.vehicleId;
  let customerId = req.body.customer_id || req.body.customerId;

  if (!vehicleId) {
    return res.status(400).json({ error: 'Vehicle selection is required to create a sale order.' });
  }

  // 1. Fetch Vehicle
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  // 2. Fetch or create Customer
  let customer = null;
  if (customerId) {
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!customer) {
      return res.status(404).json({ error: `Customer with ID '${customerId}' not found.` });
    }
  } else if (req.body.customer_name || req.body.customerName) {
    const custName = req.body.customer_name || req.body.customerName;
    customer = db.prepare('SELECT * FROM customers WHERE name LIKE ? LIMIT 1').get(custName);
    if (!customer) {
      customerId = `cust_${Date.now()}`;
      const fallbackPhone = req.body.customer_phone || req.body.customerPhone || `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;
      db.prepare(`
        INSERT INTO customers (id, name, phone, email, address, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Active', datetime('now'), datetime('now'))
      `).run(customerId, custName, fallbackPhone, req.body.customer_email || req.body.customerEmail || '', req.body.customer_address || 'Mumbai');
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    } else {
      customerId = customer.id;
    }
  } else {
    customer = db.prepare('SELECT * FROM customers LIMIT 1').get();
    if (!customer) {
      return res.status(400).json({ error: 'No customers available in database. Please register a customer before booking a sale.' });
    }
    customerId = customer.id;
  }

  // 3. Check Vehicle Availability
  if (vehicle.status === 'Sold') {
    return res.status(400).json({
      error: `Vehicle ${vehicle.brand} ${vehicle.model} (VIN: ${vehicle.vin}) has already been SOLD. Double-selling is strictly prohibited.`
    });
  }
  if (vehicle.status !== 'Available' && vehicle.status !== 'Reserved') {
    return res.status(400).json({
      error: `Vehicle ${vehicle.brand} ${vehicle.model} is currently '${vehicle.status}'. Only vehicles with status 'Available' or 'Reserved' can be sold.`
    });
  }

  // Validate dates
  if (req.body.booking_date && !isValidDateStr(req.body.booking_date)) {
    return res.status(400).json({ error: 'Invalid booking date format. Expected YYYY-MM-DD.' });
  }
  if (req.body.expected_delivery_date && !isValidDateStr(req.body.expected_delivery_date)) {
    return res.status(400).json({ error: 'Invalid expected delivery date format. Expected YYYY-MM-DD.' });
  }

  // 3. Dynamic Showroom Settings & GST Calculation
  const showroomSetting = db.prepare('SELECT * FROM showroom_settings LIMIT 1').get() || {};
  const defaultTax = Number(showroomSetting.tax_rate || 18.0);
  const taxRate = Number(req.body.tax_rate ?? req.body.taxRate ?? defaultTax);
  const basePrice = Number(req.body.base_price ?? req.body.basePrice ?? vehicle.ex_showroom_price ?? 2500000);
  const discount = Math.max(0, Number(req.body.discount || 0));

  if (discount > basePrice) {
    return res.status(400).json({ error: 'Executive discount cannot exceed vehicle base price.' });
  }

  const taxableAmount = Math.max(0, basePrice - discount);
  const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
  const cgstAmount = Math.round((taxAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((taxAmount / 2) * 100) / 100;
  const totalAmount = taxableAmount + taxAmount;

  const paymentMethod = normalizeSalesPaymentMethod(req.body.payment_method || req.body.paymentMethod);
  const bookingDate = req.body.booking_date || req.body.bookingDate || req.body.saleDate || new Date().toISOString().split('T')[0];
  const deliveryDate = req.body.expected_delivery_date || req.body.deliveryDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const quotationId = req.body.quotation_id || req.body.quotationId || null;

  const invoiceId = `inv_${Date.now()}`;

  // 4. ATOMIC DATABASE TRANSACTION
  db.transaction(() => {
    // A. Insert Sale
    db.prepare(`
      INSERT INTO sales (
        id, sale_order_number, quotation_id, customer_id, vehicle_id, sales_agent_id,
        base_price, discount, tax_rate, tax_amount, total_amount, payment_method,
        booking_date, expected_delivery_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, soNumber, quotationId, customerId, vehicleId, req.user?.id || null,
      basePrice, discount, taxRate, taxAmount, totalAmount, paymentMethod,
      bookingDate, deliveryDate, 'Booked'
    );

    // B. Auto-generate corresponding Invoice
    db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, sale_id, customer_id, customer_name, customer_gstin,
        vehicle_id, vin, subtotal, discount, taxable_amount, cgst_amount, sgst_amount,
        total_amount, paid_amount, balance_due, invoice_date, due_date, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      invoiceId, invNumber, id, customerId, customer.name, customer.gstin || null,
      vehicleId, vehicle.vin, basePrice, discount, taxableAmount, cgstAmount, sgstAmount,
      totalAmount, 0, totalAmount,
      bookingDate, deliveryDate, 'Issued'
    );

    // C. CRITICAL: AUTOMATICALLY UPDATE VEHICLE STATUS AVAILABLE -> SOLD
    db.prepare(`
      UPDATE vehicles 
      SET status = 'Sold', stock_quantity = MAX(0, stock_quantity - 1), updated_at = datetime('now')
      WHERE id = ?
    `).run(vehicleId);

    // D. Update linked Quotation status to Converted_To_Sale
    if (quotationId) {
      db.prepare(`
        UPDATE quotations 
        SET status = 'Converted_To_Sale', updated_at = datetime('now')
        WHERE id = ?
      `).run(quotationId);
    }
  })();

  recordAudit(db, req.user, 'CREATE', 'SALES', `Created Sale Order ${soNumber} (Invoice ${invNumber}, Vehicle ${vehicle.vin} marked SOLD) for ₹${totalAmount}`, id);

  const createdSale = db.prepare(`
    SELECT s.*, 
           c.name as customer_name, c.phone as customer_phone,
           v.brand || ' ' || v.model as vehicle_name, v.vin as vehicle_vin,
           i.id as invoice_id, i.invoice_number, i.balance_due, i.paid_amount, i.status as invoice_status
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN invoices i ON i.sale_id = s.id
    WHERE s.id = ?
  `).get(id);

  res.status(201).json({
    ...createdSale,
    saleOrderNumber: createdSale.sale_order_number,
    invoiceNo: createdSale.invoice_number,
    invoiceId: createdSale.invoice_id,
    customerName: createdSale.customer_name,
    customerPhone: createdSale.customer_phone,
    vehicleName: createdSale.vehicle_name,
    vin: createdSale.vehicle_vin,
    totalAmount: createdSale.total_amount,
    paidAmount: createdSale.paid_amount,
    balanceDue: createdSale.balance_due,
    invoiceStatus: createdSale.invoice_status,
    paymentMethod: createdSale.payment_method,
    saleDate: createdSale.booking_date,
    bookingDate: createdSale.booking_date
  });
});

router.put('/sales/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Sale record not found' });
  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE sales SET status = ?, actual_delivery_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(u.status, u.actual_delivery_date, req.params.id);
  res.json(u);
});

router.delete('/sales/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale record not found' });

  db.transaction(() => {
    // Delete linked receipts and payments for invoices of this sale
    const inv = db.prepare('SELECT id FROM invoices WHERE sale_id = ?').get(sale.id);
    if (inv) {
      db.prepare('DELETE FROM receipts WHERE invoice_id = ?').run(inv.id);
      db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(inv.id);
      db.prepare('DELETE FROM invoices WHERE id = ?').run(inv.id);
    }
    db.prepare('DELETE FROM payments WHERE sale_id = ?').run(sale.id);
    db.prepare('DELETE FROM sales WHERE id = ?').run(sale.id);

    // Revert vehicle status back to Available
    if (sale.vehicle_id) {
      db.prepare("UPDATE vehicles SET status = 'Available', stock_quantity = stock_quantity + 1, updated_at = datetime('now') WHERE id = ?")
        .run(sale.vehicle_id);
    }
  })();

  recordAudit(db, req.user, 'DELETE', 'SALES', `Deleted sale order ${sale.sale_order_number} and reverted vehicle status to Available`, sale.id);
  res.json({ success: true });
});

// Invoices List with joined customer & vehicle
router.get('/invoices', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, 
           s.sale_order_number, s.payment_method, s.booking_date,
           c.phone as customer_phone, c.email as customer_email, c.address as customer_address, c.pan_number as customer_pan,
           v.brand as vehicle_brand, v.model as vehicle_model, v.variant as vehicle_variant, v.year as vehicle_year, v.color as vehicle_color,
           (SELECT count(*) FROM payments p WHERE p.invoice_id = i.id) as payment_count
    FROM invoices i
    LEFT JOIN sales s ON i.sale_id = s.id
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    ORDER BY i.invoice_date DESC, i.created_at DESC
  `).all();
  res.json(rows.map(i => ({
    ...i,
    invoiceNo: i.invoice_number,
    saleOrderNumber: i.sale_order_number,
    customerName: i.customer_name,
    customerPhone: i.customer_phone,
    customerEmail: i.customer_email,
    customerAddress: i.customer_address,
    customerPan: i.customer_pan,
    vehicleName: i.vehicle_brand ? `${i.vehicle_brand} ${i.vehicle_model} (${i.vehicle_year})` : 'Vehicle',
    subtotal: i.subtotal,
    discount: i.discount,
    taxableAmount: i.taxable_amount,
    cgstAmount: i.cgst_amount,
    sgstAmount: i.sgst_amount,
    totalAmount: i.total_amount,
    paidAmount: i.paid_amount,
    balanceDue: i.balance_due,
    invoiceDate: i.invoice_date,
    dueDate: i.due_date,
    status: i.status
  })));
});

// Pending Invoices (balance_due > 0)
router.get('/invoices/pending', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, 
           s.sale_order_number, s.payment_method,
           c.phone as customer_phone,
           v.brand || ' ' || v.model as vehicle_name
    FROM invoices i
    LEFT JOIN sales s ON i.sale_id = s.id
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    WHERE i.balance_due > 0 AND i.status != 'Cancelled'
    ORDER BY i.balance_due DESC
  `).all();
  res.json(rows.map(i => ({
    ...i,
    invoiceNo: i.invoice_number,
    saleOrderNumber: i.sale_order_number,
    customerName: i.customer_name,
    customerPhone: i.customer_phone,
    vehicleName: i.vehicle_name,
    totalAmount: i.total_amount,
    paidAmount: i.paid_amount,
    balanceDue: i.balance_due,
    invoiceDate: i.invoice_date,
    status: i.status
  })));
});

// Single Invoice with Payment History & Showroom Branding
router.get('/invoices/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, 
           s.sale_order_number, s.payment_method, s.booking_date, s.base_price, s.tax_rate,
           c.phone as customer_phone, c.email as customer_email, c.address as customer_address, c.pan_number as customer_pan,
           v.brand as vehicle_brand, v.model as vehicle_model, v.variant as vehicle_variant, v.year as vehicle_year, v.color as vehicle_color
    FROM invoices i
    LEFT JOIN sales s ON i.sale_id = s.id
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    WHERE i.id = ? OR i.invoice_number = ?
  `).get(req.params.id, req.params.id);

  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

  const payments = db.prepare(`
    SELECT p.*, r.receipt_number
    FROM payments p
    LEFT JOIN receipts r ON r.payment_id = p.id
    WHERE p.invoice_id = ?
    ORDER BY p.payment_date ASC
  `).all(invoice.id);

  const settings = db.prepare('SELECT showroom_name, address, phone, email, currency_symbol, gstin, dealer_license, tax_rate FROM showroom_settings LIMIT 1').get() || {};

  res.json({
    ...invoice,
    invoiceNo: invoice.invoice_number,
    saleOrderNumber: invoice.sale_order_number,
    customerName: invoice.customer_name,
    customerPhone: invoice.customer_phone,
    customerEmail: invoice.customer_email,
    customerAddress: invoice.customer_address,
    customerPan: invoice.customer_pan,
    vehicleName: invoice.vehicle_brand ? `${invoice.vehicle_brand} ${invoice.vehicle_model} (${invoice.vehicle_year})` : 'Vehicle',
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    taxableAmount: invoice.taxable_amount,
    cgstAmount: invoice.cgst_amount,
    sgstAmount: invoice.sgst_amount,
    totalAmount: invoice.total_amount,
    paidAmount: invoice.paid_amount,
    balanceDue: invoice.balance_due,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    status: invoice.status,
    payments: payments.map(p => ({
      ...p,
      receiptNo: p.receipt_number || p.payment_reference,
      amount: p.amount,
      paymentMode: p.payment_mode,
      paymentType: p.payment_type,
      paymentDate: p.payment_date,
      transactionRef: p.transaction_id
    })),
    settings
  });
});

// ============================================================================
// 9. PAYMENTS & RECEIPTS (Protected: Read/Write: ADMIN & SALES; Delete: ADMIN)
// ============================================================================

router.get('/payments', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, 
           c.name as customer_name, c.phone as customer_phone,
           s.sale_order_number,
           i.invoice_number, i.total_amount as invoice_total, i.balance_due as invoice_balance_due,
           r.receipt_number, r.id as receipt_id
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN sales s ON p.sale_id = s.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN receipts r ON r.payment_id = p.id
    ORDER BY p.payment_date DESC, p.created_at DESC
  `).all();
  res.json(rows.map(p => ({
    ...p,
    receiptNo: p.receipt_number || p.payment_reference,
    receiptId: p.receipt_id,
    customerName: p.customer_name,
    customerPhone: p.customer_phone,
    invoiceNo: p.invoice_number,
    invoiceTotal: p.invoice_total,
    remainingBalance: p.invoice_balance_due,
    saleOrderNumber: p.sale_order_number,
    paymentMode: p.payment_mode,
    paymentType: p.payment_type,
    paymentDate: p.payment_date,
    transactionRef: p.transaction_id
  })));
});

router.post('/payments', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be a positive number greater than 0.' });
  }

  // 1. Resolve linked Invoice and Sale
  let invoiceId = req.body.invoice_id || req.body.invoiceId || null;
  let saleId = req.body.sale_id || req.body.saleId || null;

  if (!invoiceId && saleId) {
    const inv = db.prepare('SELECT id FROM invoices WHERE sale_id = ?').get(saleId);
    if (inv) invoiceId = inv.id;
  }

  let invoice = null;
  if (invoiceId) {
    invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Linked invoice not found.' });
    }
    saleId = invoice.sale_id;
  }

  // 2. Validate Invoice Business Rules
  if (invoice) {
    if (invoice.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot accept payments for a Cancelled invoice.' });
    }
    if (invoice.balance_due <= 0.01) {
      return res.status(400).json({
        error: `Invoice ${invoice.invoice_number} is already Paid In Full. Current outstanding balance is ₹0.`
      });
    }
    // OVERPAYMENT CHECK: Prevent invalid transactions
    if (amount > invoice.balance_due + 0.01) {
      return res.status(400).json({
        error: `Invalid transaction: Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds the outstanding balance due (₹${invoice.balance_due.toLocaleString('en-IN')}).`
      });
    }
  }

  // 3. Resolve Customer
  let customerId = req.body.customer_id || req.body.customerId || (invoice ? invoice.customer_id : null);
  if (customerId) {
    const c = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
    if (!c) {
      return res.status(404).json({ error: `Customer with ID '${customerId}' not found.` });
    }
  } else {
    const c = db.prepare('SELECT id FROM customers LIMIT 1').get();
    if (!c) return res.status(400).json({ error: 'No customers available in database.' });
    customerId = c.id;
  }
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  const customerName = customer ? customer.name : (req.body.customer_name || req.body.customerName || 'Customer');

  // 4. Normalize Mode and Type
  const paymentMode = normalizePaymentMode(req.body.payment_mode || req.body.paymentMode);
  const paymentType = normalizePaymentType(req.body.payment_type || req.body.paymentType);
  const payDate = req.body.payment_date || req.body.paymentDate || new Date().toISOString().split('T')[0];
  if (!isValidDateStr(payDate)) {
    return res.status(400).json({ error: 'Invalid payment date format. Expected YYYY-MM-DD.' });
  }

  const totalCount = db.prepare('SELECT count(*) as c FROM payments').get().c + 1;
  const id = req.body.id || `pay_${Date.now()}`;
  const payRef = req.body.payment_reference || req.body.receiptNo || `PAY-2026-${String(totalCount).padStart(3, '0')}`;
  const rcptNo = `RCPT-2026-${String(totalCount).padStart(3, '0')}`;
  const txnId = req.body.transaction_id || req.body.transactionRef || req.body.utr || `TXN-${Date.now().toString().slice(-6)}`;
  const receiptId = `rcpt_${Date.now()}`;
  const notes = req.body.notes || `${paymentType} registered against ${invoice ? `Invoice ${invoice.invoice_number}` : 'vehicle sale'}.`;

  let updatedInvoice = null;

  // 5. ATOMIC DATABASE TRANSACTION
  db.transaction(() => {
    // A. Insert Payment
    db.prepare(`
      INSERT INTO payments (
        id, payment_reference, sale_id, invoice_id, customer_id, amount, payment_mode,
        transaction_id, payment_type, payment_date, status, notes, received_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, payRef, saleId, invoiceId, customerId, amount, paymentMode,
      txnId, paymentType, payDate, 'Cleared', notes, req.user?.id || null
    );

    // B. Automatically Generate Linked Receipt
    db.prepare(`
      INSERT INTO receipts (
        id, receipt_number, payment_id, invoice_id, customer_id, customer_name,
        amount, payment_mode, transaction_reference, receipt_date, authorized_by, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      receiptId, rcptNo, id, invoiceId, customerId, customerName,
      amount, paymentMode, txnId, payDate, req.user?.id || null, notes
    );

    // C. Update Invoice Paid Amount, Balance Due, and Status
    if (invoice) {
      const newPaid = Math.round((Number(invoice.paid_amount || 0) + amount) * 100) / 100;
      const newBalance = Math.max(0, Math.round((Number(invoice.total_amount) - newPaid) * 100) / 100);
      const newStatus = newBalance <= 0.01 ? 'Paid In Full' : 'Partially Paid';

      db.prepare(`
        UPDATE invoices 
        SET paid_amount = ?, balance_due = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newPaid, newBalance, newStatus, invoice.id);

      // If fully paid, update Sale record status to 'Processing' if was 'Booked'
      if (newBalance <= 0.01 && invoice.sale_id) {
        db.prepare(`
          UPDATE sales 
          SET status = CASE WHEN status = 'Booked' THEN 'Processing' ELSE status END,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(invoice.sale_id);
      }

      updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);
    }
  })();

  recordAudit(db, req.user, 'CREATE', 'PAYMENTS', `Registered payment ${payRef} of ₹${amount} (${paymentType}) & issued receipt ${rcptNo} for ${customerName}`, id);

  const paymentRecord = db.prepare(`
    SELECT p.*, c.name as customer_name, c.phone as customer_phone, s.sale_order_number, i.invoice_number, r.receipt_number
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN sales s ON p.sale_id = s.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN receipts r ON r.payment_id = p.id
    WHERE p.id = ?
  `).get(id);

  res.status(201).json({
    ...paymentRecord,
    receiptNo: paymentRecord.receipt_number || rcptNo,
    receipt_number: paymentRecord.receipt_number || rcptNo,
    linked_receipt_number: paymentRecord.receipt_number || rcptNo,
    receiptId,
    customerName: paymentRecord.customer_name,
    customerPhone: paymentRecord.customer_phone,
    invoiceNo: paymentRecord.invoice_number,
    saleOrderNumber: paymentRecord.sale_order_number,
    paymentMode: paymentRecord.payment_mode,
    paymentType: paymentRecord.payment_type,
    paymentDate: paymentRecord.payment_date,
    transactionRef: paymentRecord.transaction_id,
    invoice_balance_due: updatedInvoice ? updatedInvoice.balance_due : 0,
    invoice_status: updatedInvoice ? updatedInvoice.status : 'Paid In Full',
    updatedInvoice: updatedInvoice ? {
      ...updatedInvoice,
      paidAmount: updatedInvoice.paid_amount,
      balanceDue: updatedInvoice.balance_due,
      status: updatedInvoice.status
    } : null
  });
});

router.delete('/payments/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  db.transaction(() => {
    // If linked to an invoice, revert the balance
    if (payment.invoice_id) {
      const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(payment.invoice_id);
      if (invoice) {
        const newPaid = Math.max(0, invoice.paid_amount - payment.amount);
        const newBalance = Math.min(invoice.total_amount, invoice.balance_due + payment.amount);
        const newStatus = newPaid <= 0 ? 'Issued' : (newBalance <= 0 ? 'Paid In Full' : 'Partially Paid');
        db.prepare("UPDATE invoices SET paid_amount = ?, balance_due = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
          .run(newPaid, newBalance, newStatus, invoice.id);
      }
    }
    // Delete linked receipt
    db.prepare('DELETE FROM receipts WHERE payment_id = ?').run(payment.id);
    // Delete payment
    db.prepare('DELETE FROM payments WHERE id = ?').run(payment.id);
  })();

  recordAudit(db, req.user, 'DELETE', 'PAYMENTS', `Deleted payment record ${payment.payment_reference}`, payment.id);
  res.json({ success: true });
});

router.get('/receipts', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, 
           c.phone as customer_phone,
           i.invoice_number, i.total_amount as invoice_total, i.balance_due as invoice_balance_due,
           p.payment_reference, p.payment_type, p.transaction_id,
           u.name as authorized_by_name
    FROM receipts r
    LEFT JOIN customers c ON r.customer_id = c.id
    LEFT JOIN invoices i ON r.invoice_id = i.id
    LEFT JOIN payments p ON r.payment_id = p.id
    LEFT JOIN users u ON r.authorized_by = u.id
    ORDER BY r.receipt_date DESC, r.created_at DESC
  `).all();
  res.json(rows.map(r => ({
    ...r,
    receiptNo: r.receipt_number,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    invoiceNo: r.invoice_number,
    invoiceTotal: r.invoice_total,
    remainingBalance: r.invoice_balance_due,
    paymentMode: r.payment_mode,
    paymentType: r.payment_type || 'Payment',
    transactionRef: r.transaction_reference || r.transaction_id,
    receiptDate: r.receipt_date,
    authorizedBy: r.authorized_by_name || 'Accounts Desk'
  })));
});

router.get('/receipts/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const receipt = db.prepare(`
    SELECT r.*, 
           c.phone as customer_phone, c.address as customer_address,
           i.invoice_number, i.total_amount as invoice_total, i.balance_due as invoice_balance_due, i.paid_amount as invoice_paid_amount,
           p.payment_reference, p.payment_type, p.transaction_id,
           u.name as authorized_by_name
    FROM receipts r
    LEFT JOIN customers c ON r.customer_id = c.id
    LEFT JOIN invoices i ON r.invoice_id = i.id
    LEFT JOIN payments p ON r.payment_id = p.id
    LEFT JOIN users u ON r.authorized_by = u.id
    WHERE r.id = ? OR r.receipt_number = ?
  `).get(req.params.id, req.params.id);

  if (!receipt) return res.status(404).json({ error: 'Receipt not found.' });

  const settings = db.prepare('SELECT showroom_name, address, phone, email, currency_symbol, gstin, dealer_license FROM showroom_settings LIMIT 1').get() || {};

  res.json({
    ...receipt,
    receiptNo: receipt.receipt_number,
    customerName: receipt.customer_name,
    customerPhone: receipt.customer_phone,
    customerAddress: receipt.customer_address,
    invoiceNo: receipt.invoice_number,
    invoiceTotal: receipt.invoice_total,
    remainingBalance: receipt.invoice_balance_due,
    invoicePaidAmount: receipt.invoice_paid_amount,
    paymentMode: receipt.payment_mode,
    paymentType: receipt.payment_type || 'Payment',
    transactionRef: receipt.transaction_reference || receipt.transaction_id,
    receiptDate: receipt.receipt_date,
    authorizedBy: receipt.authorized_by_name || 'Cashier / Accounts Desk',
    settings
  });
});

// ============================================================================
// 10. TEST DRIVES (Protected: ADMIN & SALES_EXECUTIVE)
// ============================================================================

router.get(['/testdrives', '/test-drives'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, status } = req.query;
  let sql = `
    SELECT td.*, v.brand || ' ' || v.model as vehicle_name
    FROM test_drives td
    LEFT JOIN vehicles v ON td.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (td.booking_number LIKE ? OR td.customer_name LIKE ? OR td.customer_phone LIKE ? OR v.brand LIKE ? OR v.model LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (status && status !== 'All') {
    sql += ' AND td.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY td.scheduled_date DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(t => ({
    ...t,
    customerName: t.customer_name,
    customerPhone: t.customer_phone,
    vehicleModel: t.vehicle_name,
    date: t.scheduled_date,
    timeSlot: t.time_slot,
    drivingLicense: t.driving_license_number
  })));
});

router.post(['/testdrives', '/test-drives'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `td_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM test_drives').get().c + 1;
  const bookingNo = req.body.booking_number || `TD-2026-${String(totalCount).padStart(3, '0')}`;

  let vehicleId = req.body.vehicle_id || req.body.vehicleId;
  if (!vehicleId) {
    const v = db.prepare('SELECT id FROM vehicles LIMIT 1').get();
    if (!v) return res.status(400).json({ error: 'No vehicles available in inventory for test drives.' });
    vehicleId = v.id;
  } else {
    const v = db.prepare('SELECT id, model FROM vehicles WHERE id = ?').get(vehicleId);
    if (!v) return res.status(404).json({ error: `Vehicle with ID '${vehicleId}' not found.` });
  }

  const customerId = req.body.customer_id || req.body.customerId || null;
  if (customerId) {
    const c = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
    if (!c) return res.status(404).json({ error: `Customer with ID '${customerId}' not found.` });
  }

  const schedDate = req.body.scheduled_date || req.body.date || new Date().toISOString().split('T')[0];
  if (!isValidDateStr(schedDate)) {
    return res.status(400).json({ error: 'Invalid scheduled_date format. Expected YYYY-MM-DD.' });
  }

  try {
    db.prepare(`
      INSERT INTO test_drives (id, booking_number, customer_id, customer_name, customer_phone, vehicle_id, scheduled_date, time_slot, driving_license_number, assigned_staff_id, status, customer_feedback, route_taken, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, bookingNo, customerId,
      req.body.customer_name || req.body.customerName || 'Prospect',
      req.body.customer_phone || req.body.customerPhone || '+91 99999 00000',
      vehicleId,
      schedDate,
      req.body.time_slot || req.body.timeSlot || '02:00 PM - 03:00 PM',
      req.body.driving_license_number || req.body.drivingLicense || 'DL-APX-9921',
      req.user?.id || null,
      req.body.status || 'Scheduled',
      req.body.customer_feedback || '',
      req.body.route_taken || 'BKC Loop'
    );
    recordAudit(db, req.user, 'CREATE', 'TEST_DRIVES', `Booked test drive ${bookingNo} for ${req.body.customer_name || req.body.customerName}`, id);
    res.status(201).json(db.prepare('SELECT * FROM test_drives WHERE id = ?').get(id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put(['/testdrives/:id', '/test-drives/:id'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM test_drives WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Test drive not found' });
  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE test_drives SET status = ?, customer_feedback = ?, route_taken = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(u.status, u.customer_feedback || u.feedback, u.route_taken, req.params.id);
  res.json(u);
});

router.delete(['/testdrives/:id', '/test-drives/:id'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  db.prepare('DELETE FROM test_drives WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============================================================================
// 11. FINANCE & EMI RECORDS (Protected: ADMIN & SALES_EXECUTIVE)
// ============================================================================

router.get(['/finance-apps', '/finance-records'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { search, status, bank } = req.query;
  let sql = `
    SELECT fr.*, c.name as customer_name, c.phone as customer_phone, v.brand || ' ' || v.model as vehicle_name
    FROM finance_records fr
    LEFT JOIN customers c ON fr.customer_id = c.id
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (fr.application_number LIKE ? OR c.name LIKE ? OR v.brand LIKE ? OR v.model LIKE ? OR fr.bank_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (status && status !== 'All' && status !== 'ALL') {
    sql += ' AND (fr.status = ? OR fr.status LIKE ?)';
    params.push(status, `%${status}%`);
  }
  if (bank && bank !== 'All') {
    sql += ' AND fr.bank_name LIKE ?';
    params.push(`%${bank}%`);
  }

  sql += ' ORDER BY fr.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(f => ({
    ...f,
    applicationNo: f.application_number,
    customerName: f.customer_name,
    customerPhone: f.customer_phone,
    vehicleName: f.vehicle_name,
    vehicleModel: f.vehicle_name,
    bankName: f.bank_name,
    loanAmount: f.loan_amount,
    downPayment: f.down_payment,
    tenureMonths: f.tenure_months,
    interestRate: f.interest_rate_pct,
    monthlyEmi: f.monthly_emi,
    emiAmount: f.monthly_emi,
    applicationStatus: f.status
  })));
});

router.post(['/finance-apps', '/finance-records'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `fin_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM finance_records').get().c + 1;
  const appNo = req.body.application_number || req.body.applicationNo || `FIN-2026-${String(totalCount).padStart(3, '0')}`;

  let customerId = req.body.customer_id || req.body.customerId;
  if (customerId) {
    const c = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
    if (!c) return res.status(404).json({ error: `Customer with ID '${customerId}' not found.` });
  } else {
    const c = db.prepare('SELECT id FROM customers LIMIT 1').get();
    if (!c) return res.status(400).json({ error: 'No customers available in database.' });
    customerId = c.id;
  }

  let vehicleId = req.body.vehicle_id || req.body.vehicleId;
  if (vehicleId) {
    const v = db.prepare('SELECT id, model FROM vehicles WHERE id = ?').get(vehicleId);
    if (!v) return res.status(404).json({ error: `Vehicle with ID '${vehicleId}' not found.` });
  } else {
    const v = db.prepare('SELECT id FROM vehicles LIMIT 1').get();
    if (!v) return res.status(400).json({ error: 'No vehicles available in database.' });
    vehicleId = v.id;
  }

  const loanAmount = Number(req.body.loan_amount || req.body.loanAmount || 1500000);
  const tenure = Number(req.body.tenure_months || req.body.tenureMonths || 60);
  const interest = Number(req.body.interest_rate_pct || req.body.interestRate || 8.5);
  const monthlyRate = (interest / 100) / 12;
  const emi = req.body.emiAmount || req.body.monthlyEmi || Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1));

  let status = req.body.status || req.body.applicationStatus || 'Applied';
  if (status === 'Under Review') status = 'In Review';
  if (!['Applied', 'In Review', 'Approved', 'Disbursed', 'Rejected'].includes(status)) {
    status = 'Applied';
  }

  try {
    db.prepare(`
      INSERT INTO finance_records (id, application_number, customer_id, sale_id, vehicle_id, bank_name, loan_amount, down_payment, tenure_months, interest_rate_pct, monthly_emi, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, appNo, customerId, req.body.sale_id || null, vehicleId,
      req.body.bank_name || req.body.bankName || 'HDFC Bank',
      loanAmount, Number(req.body.down_payment || req.body.downPayment || 400000), tenure, interest, emi,
      status, req.body.notes || ''
    );
    recordAudit(db, req.user, 'CREATE', 'FINANCE', `Submitted finance application ${appNo} for ₹${loanAmount}`, id);
    const created = db.prepare(`
      SELECT fr.*, c.name as customer_name, c.phone as customer_phone, v.brand || ' ' || v.model as vehicle_name
      FROM finance_records fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN vehicles v ON fr.vehicle_id = v.id
      WHERE fr.id = ?
    `).get(id);

    res.status(201).json({
      ...created,
      applicationNo: created.application_number,
      customerName: created.customer_name,
      customerPhone: created.customer_phone,
      vehicleName: created.vehicle_name,
      vehicleModel: created.vehicle_name,
      bankName: created.bank_name,
      loanAmount: created.loan_amount,
      downPayment: created.down_payment,
      tenureMonths: created.tenure_months,
      interestRate: created.interest_rate_pct,
      monthlyEmi: created.monthly_emi,
      emiAmount: created.monthly_emi,
      applicationStatus: created.status
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put(['/finance-apps/:id', '/finance-records/:id'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM finance_records WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Finance application not found' });
  
  let status = req.body.status || req.body.applicationStatus || current.status;
  if (status === 'Under Review') status = 'In Review';
  if (!['Applied', 'In Review', 'Approved', 'Disbursed', 'Rejected'].includes(status)) {
    status = current.status;
  }
  const loanAmount = req.body.loanAmount !== undefined ? Number(req.body.loanAmount) : (req.body.loan_amount !== undefined ? Number(req.body.loan_amount) : current.loan_amount);
  const tenure = req.body.tenureMonths !== undefined ? Number(req.body.tenureMonths) : (req.body.tenure_months !== undefined ? Number(req.body.tenure_months) : current.tenure_months);
  const interest = req.body.interestRate !== undefined ? Number(req.body.interestRate) : (req.body.interest_rate_pct !== undefined ? Number(req.body.interest_rate_pct) : current.interest_rate_pct);
  const monthlyRate = (interest / 100) / 12;
  const emi = req.body.emiAmount || req.body.monthlyEmi || Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1));
  const bankName = req.body.bankName || req.body.bank_name || current.bank_name;
  const notes = req.body.notes !== undefined ? req.body.notes : current.notes;

  db.prepare(`
    UPDATE finance_records SET status = ?, loan_amount = ?, tenure_months = ?, interest_rate_pct = ?, monthly_emi = ?, bank_name = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, loanAmount, tenure, interest, emi, bankName, notes, req.params.id);

  const updated = db.prepare(`
    SELECT fr.*, c.name as customer_name, c.phone as customer_phone, v.brand || ' ' || v.model as vehicle_name
    FROM finance_records fr
    LEFT JOIN customers c ON fr.customer_id = c.id
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    WHERE fr.id = ?
  `).get(req.params.id);

  res.json({
    ...updated,
    applicationNo: updated.application_number,
    customerName: updated.customer_name,
    customerPhone: updated.customer_phone,
    vehicleName: updated.vehicle_name,
    vehicleModel: updated.vehicle_name,
    bankName: updated.bank_name,
    loanAmount: updated.loan_amount,
    downPayment: updated.down_payment,
    tenureMonths: updated.tenure_months,
    interestRate: updated.interest_rate_pct,
    monthlyEmi: updated.monthly_emi,
    emiAmount: updated.monthly_emi,
    applicationStatus: updated.status
  });
});

router.delete(['/finance-apps/:id', '/finance-records/:id'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  db.prepare('DELETE FROM finance_records WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============================================================================
// 12. COMMUNICATIONS, CAMPAIGNS & REMINDERS (Protected: ADMIN & SALES_EXECUTIVE)
// ============================================================================

// A. Communications & Multi-Channel Dispatcher
router.get('/communications', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  res.json(db.prepare('SELECT * FROM communications ORDER BY occurred_at DESC').all());
});

router.get('/communications/gateway-status', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  res.json(communicationService.getGatewayStatus());
});

router.post('/communications/send', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), async (req, res) => {
  try {
    const {
      channel = 'whatsapp',
      recipient,
      subject,
      messageText,
      customerId,
      leadId,
      templateType,
      templateData
    } = req.body;

    let textToSend = messageText;
    let subjectToSend = subject;

    if (templateType) {
      const generated = communicationService.generateTemplate(templateType, templateData || req.body);
      textToSend = textToSend || generated.text;
      subjectToSend = subjectToSend || generated.subject;
    }

    const result = await communicationService.dispatchMessage({
      channel,
      recipient,
      subject: subjectToSend,
      messageText: textToSend,
      customerId,
      leadId,
      userId: req.user?.id
    });

    recordAudit(db, req.user, 'CREATE', 'COMMUNICATIONS', `Dispatched ${channel.toUpperCase()} to ${recipient} [Status: ${result.status}]`, result.communicationId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/communications/templates', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const { type, ...data } = req.query;
  const tmpl = communicationService.generateTemplate(type || 'quotation', data);
  res.json(tmpl);
});

router.get('/communications/occasions', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const today = req.query.date || '2026-10-03';
  const automated = reminderService.getAutomatedReminders(today);
  const birthdays = automated.reminders.filter(r => r.category === 'Birthday');
  const anniversaries = automated.reminders.filter(r => r.category === 'Anniversary');

  res.json({
    today,
    todaysBirthdays: birthdays.filter(b => b.status === 'TODAY'),
    upcomingBirthdays: birthdays.filter(b => b.status !== 'TODAY'),
    todaysAnniversaries: anniversaries.filter(a => a.status === 'TODAY'),
    upcomingAnniversaries: anniversaries.filter(a => a.status !== 'TODAY')
  });
});

router.post('/communications', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `comm_${Date.now()}`;
  db.prepare(`
    INSERT INTO communications (id, customer_id, lead_id, type, direction, subject_or_summary, details, performed_by, status, recipient, occurred_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'LOGGED_RECORD', ?, datetime('now'), datetime('now'))
  `).run(
    id, req.body.customer_id || null, req.body.lead_id || null,
    req.body.type || 'Phone Call', req.body.direction || 'Outbound',
    req.body.subject_or_summary || req.body.subject || 'Client Follow-up',
    req.body.details || '', req.user?.id || null, req.body.recipient || req.body.phone || null
  );
  res.status(201).json(db.prepare('SELECT * FROM communications WHERE id = ?').get(id));
});

// B. Marketing Campaigns & Customer Groups
router.get('/campaigns', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY start_date DESC').all();
  res.json(campaigns);
});

router.post('/campaigns', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const id = req.body.id || `camp_${Date.now()}`;
  const code = req.body.campaign_code || `CAMP-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;

  db.prepare(`
    INSERT INTO campaigns (
      id, campaign_code, name, channel, target_model, budget,
      leads_generated, conversions_count, start_date, end_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id, code, req.body.name || 'Festive Campaign',
    req.body.channel || 'SMS & WhatsApp Broadcast',
    req.body.target_model || 'All Vehicles',
    Number(req.body.budget || 50000),
    Number(req.body.leads_generated || 0),
    Number(req.body.conversions_count || 0),
    req.body.start_date || new Date().toISOString().split('T')[0],
    req.body.end_date || '2026-10-31',
    req.body.status || 'Active'
  );
  recordAudit(db, req.user, 'CREATE', 'CAMPAIGNS', `Created campaign ${code} (${req.body.name})`, id);
  res.status(201).json(db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id));
});

router.put('/campaigns/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Campaign not found' });

  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE campaigns SET
      name = ?, channel = ?, target_model = ?, budget = ?,
      leads_generated = ?, conversions_count = ?, start_date = ?, end_date = ?, status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    u.name, u.channel, u.target_model, Number(u.budget),
    Number(u.leads_generated), Number(u.conversions_count),
    u.start_date, u.end_date, u.status, req.params.id
  );
  recordAudit(db, req.user, 'UPDATE', 'CAMPAIGNS', `Updated campaign ${current.campaign_code}`, req.params.id);
  res.json(db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id));
});

router.delete('/campaigns/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Campaign not found' });

  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'CAMPAIGNS', `Deleted campaign ${current.campaign_code}`, req.params.id);
  res.json({ success: true, message: `Campaign ${current.campaign_code} deleted.` });
});

router.get('/customer-groups', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const allCustomers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
  const sales = db.prepare("SELECT customer_id FROM sales WHERE status = 'Delivered'").all().map(s => s.customer_id);

  const groups = [
    {
      id: 'vip',
      name: 'VIP & High-Net-Worth Patrons',
      description: 'Customers categorized as VIP status or multiple luxury purchases',
      customers: allCustomers.filter(c => c.status === 'VIP' || c.customer_group === 'VIP')
    },
    {
      id: 'recent-buyers',
      name: 'Recent Car Buyers (Delivered)',
      description: 'Patrons who completed vehicle purchase and delivery',
      customers: allCustomers.filter(c => sales.includes(c.id))
    },
    {
      id: 'service-due',
      name: 'Service Due & Aftersales Prospects',
      description: 'Vehicles due for periodic maintenance checkup',
      customers: allCustomers.filter(c => c.customer_group === 'EV Pioneers' || c.status === 'Active')
    },
    {
      id: 'active-leads',
      name: 'Hot & Warm Prospect Pipeline',
      description: 'Active enquiries evaluating purchase within 30 days',
      customers: allCustomers.filter(c => c.status === 'Lead' || c.type === 'Corporate')
    },
    {
      id: 'all',
      name: 'All Registered Customers',
      description: 'Complete verified customer directory',
      customers: allCustomers
    }
  ];

  const enriched = groups.map(g => ({
    ...g,
    count: g.customers.length
  }));

  res.json(enriched);
});

router.post('/campaigns/:id/broadcast', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), async (req, res) => {
  const { customerGroupId = 'vip', channel = 'whatsapp', customMessage } = req.body;
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const allCustomers = db.prepare('SELECT * FROM customers').all();
  let targetCustomers = allCustomers;
  if (customerGroupId === 'vip') targetCustomers = allCustomers.filter(c => c.status === 'VIP' || c.customer_group === 'VIP');

  const dispatchResults = [];
  for (const cust of targetCustomers.slice(0, 15)) {
    const text = customMessage || `Greetings from Apex Horizon Motors! Explore exclusive offers during our ${campaign.name} for ${campaign.target_model}. Call +91 22 2650 9000 for your VIP preview.`;
    const resItem = await communicationService.dispatchMessage({
      channel,
      recipient: channel === 'email' ? cust.email : cust.phone,
      subject: `Special Invitation: ${campaign.name}`,
      messageText: text,
      customerId: cust.id,
      userId: req.user?.id,
      campaignId: campaign.id
    });
    dispatchResults.push({
      customerId: cust.id,
      customerName: cust.name,
      ...resItem
    });
  }

  // Update campaign leads count
  db.prepare('UPDATE campaigns SET leads_generated = leads_generated + ? WHERE id = ?').run(dispatchResults.length, campaign.id);
  recordAudit(db, req.user, 'CREATE', 'CAMPAIGNS', `Broadcasted campaign ${campaign.campaign_code} to group ${customerGroupId} (${dispatchResults.length} contacts)`, campaign.id);

  res.json({
    success: true,
    campaignCode: campaign.campaign_code,
    totalDispatched: dispatchResults.length,
    results: dispatchResults
  });
});

// C. Reminders & Alerts Endpoints
router.get('/reminders/automated', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const today = req.query.date || '2026-10-03';
  const automated = reminderService.getAutomatedReminders(today);
  res.json(automated);
});

router.get('/reminders', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const manual = db.prepare('SELECT * FROM reminders ORDER BY due_date ASC').all();
  const automated = reminderService.getAutomatedReminders('2026-10-03');
  res.json({
    manualReminders: manual,
    automatedReminders: automated.reminders,
    summary: {
      totalAlerts: manual.filter(m => !m.is_completed).length + automated.reminders.length,
      urgentCount: automated.urgentCount,
      byCategory: automated.byCategory
    }
  });
});

router.post('/reminders', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `rem_${Date.now()}`;
  db.prepare(`
    INSERT INTO reminders (id, user_id, title, description, entity_type, entity_id, due_date, priority, is_completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
  `).run(
    id, req.user?.id || 'usr_sales_01', req.body.title || 'Follow-up Task',
    req.body.description || '', req.body.entity_type || 'custom',
    req.body.entity_id || null, req.body.due_date || new Date().toISOString().split('T')[0],
    req.body.priority || 'Medium'
  );
  recordAudit(db, req.user, 'CREATE', 'REMINDERS', `Created manual reminder "${req.body.title}"`, id);
  res.status(201).json(db.prepare('SELECT * FROM reminders WHERE id = ?').get(id));
});

router.put('/reminders/:id/complete', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  db.prepare("UPDATE reminders SET is_completed = 1, completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'Reminder marked as completed.' });
});

router.delete('/reminders/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Reminder deleted.' });
});

// D. Insurance Policies Real Database CRUD
router.get('/insurance', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const policies = db.prepare(`
    SELECT 
      p.id,
      p.policy_number as policyNo,
      p.customer_id as customerId,
      p.customer_name as customerName,
      p.vehicle_id as vehicleId,
      p.vehicle_name as vehicleName,
      p.vin,
      p.provider,
      p.policy_type as policyType,
      p.premium_amount as premiumAmount,
      p.idv_amount as idvAmount,
      p.start_date as startDate,
      p.expiry_date as expiryDate,
      p.status,
      p.notes,
      p.created_at,
      p.updated_at
    FROM insurance_policies p
    ORDER BY p.expiry_date ASC
  `).all();
  res.json(policies);
});

router.post('/insurance', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `ins_${Date.now()}`;
  const polNo = req.body.policyNo || req.body.policy_number || `POL-${Math.floor(100000 + Math.random() * 900000)}`;

  db.prepare(`
    INSERT INTO insurance_policies (
      id, policy_number, customer_id, customer_name, vehicle_id, vehicle_name,
      vin, provider, policy_type, premium_amount, idv_amount, start_date, expiry_date, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, polNo, req.body.customerId || null, req.body.customerName || 'Customer',
    req.body.vehicleId || null, req.body.vehicleName || 'Vehicle', req.body.vin || null,
    req.body.provider || 'HDFC ERGO General Insurance', req.body.policyType || 'Comprehensive',
    Number(req.body.premiumAmount || 45000), Number(req.body.idvAmount || 1500000),
    req.body.startDate || new Date().toISOString().split('T')[0],
    req.body.expiryDate || '2027-10-01',
    req.body.status || 'Active',
    req.body.notes || null
  );

  recordAudit(db, req.user, 'CREATE', 'INSURANCE', `Registered insurance policy ${polNo}`, id);
  res.status(201).json(db.prepare('SELECT * FROM insurance_policies WHERE id = ?').get(id));
});

router.put('/insurance/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM insurance_policies WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Policy not found' });

  const u = { ...current, ...req.body };
  db.prepare(`
    UPDATE insurance_policies SET
      provider = ?, policy_type = ?, premium_amount = ?, idv_amount = ?,
      start_date = ?, expiry_date = ?, status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    u.provider, u.policyType || u.policy_type,
    Number(u.premiumAmount || u.premium_amount),
    Number(u.idvAmount || u.idv_amount),
    u.startDate || u.start_date, u.expiryDate || u.expiry_date,
    u.status, u.notes, req.params.id
  );

  recordAudit(db, req.user, 'UPDATE', 'INSURANCE', `Updated policy ${current.policy_number}`, req.params.id);
  res.json(db.prepare('SELECT * FROM insurance_policies WHERE id = ?').get(req.params.id));
});

router.delete('/insurance/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM insurance_policies WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Policy not found' });

  db.prepare('DELETE FROM insurance_policies WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'INSURANCE', `Deleted insurance policy ${current.policy_number}`, req.params.id);
  res.json({ success: true, message: `Policy ${current.policy_number} deleted.` });
});

// ============================================================================
// NEW: PDI & TRADE-INS
// ============================================================================

router.get('/pdi', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const pdis = db.prepare('SELECT * FROM pdi_records ORDER BY created_at DESC').all();
  res.json(pdis.map(row => ({
    id: row.id,
    pdiNo: row.pdi_number,
    saleId: row.sale_id,
    invoiceNo: row.invoice_no,
    vehicleName: row.vehicle_name,
    vin: row.vin,
    customerName: row.customer_name,
    inspectorName: row.inspector_name,
    inspectionDate: row.inspection_date,
    exteriorStatus: row.exterior_status,
    interiorStatus: row.interior_status,
    engineFluidsStatus: row.engine_fluids_status,
    electricalsStatus: row.electricals_status,
    toolkitProvided: Boolean(row.toolkit_provided),
    keysProvided: Number(row.keys_provided),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })));
});

router.post('/pdi', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `pdi_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM pdi_records').get().c + 1;
  const pdiNo = req.body.pdiNo || `PDI-2026-${String(totalCount).padStart(3, '0')}`;

  db.prepare(`
    INSERT INTO pdi_records (
      id, pdi_number, sale_id, invoice_no, vehicle_name, vin, customer_name,
      inspector_name, inspection_date, exterior_status, interior_status,
      engine_fluids_status, electricals_status, toolkit_provided, keys_provided,
      status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, pdiNo, req.body.saleId || null, req.body.invoiceNo || null,
    req.body.vehicleName || 'Unknown Vehicle', req.body.vin || 'VIN-TBD',
    req.body.customerName || 'Unknown Customer',
    req.body.inspectorName || 'Inspector',
    req.body.inspectionDate || new Date().toISOString().split('T')[0],
    req.body.exteriorStatus || 'Passed', req.body.interiorStatus || 'Passed',
    req.body.engineFluidsStatus || 'Passed', req.body.electricalsStatus || 'Passed',
    req.body.toolkitProvided ? 1 : 0, Number(req.body.keysProvided || 2),
    req.body.status || 'Passed', req.body.notes || ''
  );
  recordAudit(db, req.user, 'CREATE', 'PDI', `Created PDI inspection ${pdiNo}`, id);
  const created = db.prepare('SELECT * FROM pdi_records WHERE id = ?').get(id);
  res.status(201).json({
    id: created.id,
    pdiNo: created.pdi_number,
    saleId: created.sale_id,
    invoiceNo: created.invoice_no,
    vehicleName: created.vehicle_name,
    vin: created.vin,
    customerName: created.customer_name,
    inspectorName: created.inspector_name,
    inspectionDate: created.inspection_date,
    exteriorStatus: created.exterior_status,
    interiorStatus: created.interior_status,
    engineFluidsStatus: created.engine_fluids_status,
    electricalsStatus: created.electricals_status,
    toolkitProvided: Boolean(created.toolkit_provided),
    keysProvided: Number(created.keys_provided),
    status: created.status,
    notes: created.notes,
    createdAt: created.created_at,
    updatedAt: created.updated_at
  });
});

router.put('/pdi/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM pdi_records WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'PDI record not found' });
  
  db.prepare(`
    UPDATE pdi_records SET
      inspector_name = ?, inspection_date = ?, exterior_status = ?, interior_status = ?,
      engine_fluids_status = ?, electricals_status = ?, toolkit_provided = ?, keys_provided = ?,
      status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    req.body.inspectorName || current.inspector_name,
    req.body.inspectionDate || current.inspection_date,
    req.body.exteriorStatus || current.exterior_status,
    req.body.interiorStatus || current.interior_status,
    req.body.engineFluidsStatus || current.engine_fluids_status,
    req.body.electricalsStatus || current.electricals_status,
    req.body.toolkitProvided ? 1 : 0,
    Number(req.body.keysProvided ?? current.keys_provided),
    req.body.status || current.status,
    req.body.notes || current.notes,
    req.params.id
  );
  recordAudit(db, req.user, 'UPDATE', 'PDI', `Updated PDI inspection ${current.pdi_number}`, req.params.id);
  const updated = db.prepare('SELECT * FROM pdi_records WHERE id = ?').get(req.params.id);
  res.json({
    id: updated.id,
    pdiNo: updated.pdi_number,
    saleId: updated.sale_id,
    invoiceNo: updated.invoice_no,
    vehicleName: updated.vehicle_name,
    vin: updated.vin,
    customerName: updated.customer_name,
    inspectorName: updated.inspector_name,
    inspectionDate: updated.inspection_date,
    exteriorStatus: updated.exterior_status,
    interiorStatus: updated.interior_status,
    engineFluidsStatus: updated.engine_fluids_status,
    electricalsStatus: updated.electricals_status,
    toolkitProvided: Boolean(updated.toolkit_provided),
    keysProvided: Number(updated.keys_provided),
    status: updated.status,
    notes: updated.notes,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at
  });
});

router.delete('/pdi/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM pdi_records WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'PDI record not found' });
  db.prepare('DELETE FROM pdi_records WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'PDI', `Deleted PDI inspection ${current.pdi_number}`, req.params.id);
  res.json({ success: true });
});

router.get('/tradeins', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const tradeins = db.prepare('SELECT * FROM trade_ins ORDER BY created_at DESC').all();
  res.json(tradeins.map(row => ({
    id: row.id,
    exchangeNo: row.exchange_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    oldBrand: row.old_brand,
    oldModel: row.old_model,
    oldYear: Number(row.old_year),
    registrationNo: row.registration_no,
    odometerKm: Number(row.odometer_km),
    conditionRating: row.condition_rating,
    estimatedValuation: Number(row.estimated_valuation),
    approvedAdjustmentAmount: Number(row.approved_adjustment_amount),
    adjustedAgainstSaleId: row.adjusted_against_sale_id,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })));
});

router.post('/tradeins', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const id = req.body.id || `exch_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM trade_ins').get().c + 1;
  const exchangeNo = req.body.exchangeNo || `EX-2026-${String(totalCount).padStart(3, '0')}`;

  db.prepare(`
    INSERT INTO trade_ins (
      id, exchange_number, customer_name, customer_phone, old_brand, old_model,
      old_year, registration_no, odometer_km, condition_rating, estimated_valuation,
      approved_adjustment_amount, adjusted_against_sale_id, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, exchangeNo, req.body.customerName || 'Customer', req.body.customerPhone || '',
    req.body.oldBrand || 'Brand', req.body.oldModel || 'Model',
    Number(req.body.oldYear || 2019), req.body.registrationNo || 'UNKNOWN',
    Number(req.body.odometerKm || 0), req.body.conditionRating || 'Good',
    Number(req.body.estimatedValuation || 0), Number(req.body.approvedAdjustmentAmount || 0),
    req.body.adjustedAgainstSaleId || null, req.body.status || 'Evaluated', req.body.notes || ''
  );
  recordAudit(db, req.user, 'CREATE', 'TRADEIN', `Created Trade-In ${exchangeNo}`, id);
  const created = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(id);
  res.status(201).json({
    id: created.id,
    exchangeNo: created.exchange_number,
    customerName: created.customer_name,
    customerPhone: created.customer_phone,
    oldBrand: created.old_brand,
    oldModel: created.old_model,
    oldYear: Number(created.old_year),
    registrationNo: created.registration_no,
    odometerKm: Number(created.odometer_km),
    conditionRating: created.condition_rating,
    estimatedValuation: Number(created.estimated_valuation),
    approvedAdjustmentAmount: Number(created.approved_adjustment_amount),
    adjustedAgainstSaleId: created.adjusted_against_sale_id,
    status: created.status,
    notes: created.notes,
    createdAt: created.created_at,
    updatedAt: created.updated_at
  });
});

router.put('/tradeins/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Trade-in record not found' });

  db.prepare(`
    UPDATE trade_ins SET
      condition_rating = ?, estimated_valuation = ?, approved_adjustment_amount = ?,
      adjusted_against_sale_id = ?, status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    req.body.conditionRating || current.condition_rating,
    Number(req.body.estimatedValuation ?? current.estimated_valuation),
    Number(req.body.approvedAdjustmentAmount ?? current.approved_adjustment_amount),
    req.body.adjustedAgainstSaleId !== undefined ? req.body.adjustedAgainstSaleId : current.adjusted_against_sale_id,
    req.body.status || current.status,
    req.body.notes || current.notes,
    req.params.id
  );
  recordAudit(db, req.user, 'UPDATE', 'TRADEIN', `Updated Trade-In ${current.exchange_number}`, req.params.id);
  const updated = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(req.params.id);
  res.json({
    id: updated.id,
    exchangeNo: updated.exchange_number,
    customerName: updated.customer_name,
    customerPhone: updated.customer_phone,
    oldBrand: updated.old_brand,
    oldModel: updated.old_model,
    oldYear: Number(updated.old_year),
    registrationNo: updated.registration_no,
    odometerKm: Number(updated.odometer_km),
    conditionRating: updated.condition_rating,
    estimatedValuation: Number(updated.estimated_valuation),
    approvedAdjustmentAmount: Number(updated.approved_adjustment_amount),
    adjustedAgainstSaleId: updated.adjusted_against_sale_id,
    status: updated.status,
    notes: updated.notes,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at
  });
});

router.delete('/tradeins/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const current = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Trade-in record not found' });
  db.prepare('DELETE FROM trade_ins WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'TRADEIN', `Deleted Trade-In ${current.exchange_number}`, req.params.id);
  res.json({ success: true });
});

router.get('/warranties', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  res.json([]);
});


router.get('/appointments', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  res.json([]);
});

router.get('/feedback', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  res.json([]);
});

// ============================================================================
// 14. ADMIN ONLY RESTRICTED MODULES (Strictly Blocked for SALES_EXECUTIVE -> 403)
// ============================================================================

// ----------------------------------------------------------------------------
// A. SPARE PARTS & INVENTORY (ADMIN ONLY)
// ----------------------------------------------------------------------------
const VALID_PART_CATEGORIES = ['Braking', 'Maintenance', 'Electrical', 'Engine', 'Suspension', 'Body & Glass', 'Accessories', 'Tires'];

function normalizePartCategory(cat) {
  if (!cat) return 'Maintenance';
  const match = VALID_PART_CATEGORIES.find(c => c.toLowerCase() === cat.toLowerCase());
  if (match) return match;
  if (cat.toLowerCase().includes('brake')) return 'Braking';
  if (cat.toLowerCase().includes('tire') || cat.toLowerCase().includes('wheel')) return 'Tires';
  if (cat.toLowerCase().includes('electr')) return 'Electrical';
  if (cat.toLowerCase().includes('engine') || cat.toLowerCase().includes('exhaust')) return 'Engine';
  if (cat.toLowerCase().includes('susp')) return 'Suspension';
  if (cat.toLowerCase().includes('glass') || cat.toLowerCase().includes('aero') || cat.toLowerCase().includes('body')) return 'Body & Glass';
  if (cat.toLowerCase().includes('access')) return 'Accessories';
  return 'Maintenance';
}

function computePartStatus(stock, minLevel = 3) {
  const s = Number(stock || 0);
  const m = Number(minLevel || 3);
  if (s <= 0) return 'Out of Stock';
  if (s <= m) return 'Low Stock';
  return 'In Stock';
}

router.get('/parts', authenticateToken, requireRole('ADMIN'), (req, res) => {
  let query = 'SELECT * FROM spare_parts WHERE 1=1';
  const params = [];
  if (req.query.category && req.query.category !== 'All') {
    query += ' AND category = ?';
    params.push(req.query.category);
  }
  if (req.query.status && req.query.status !== 'All') {
    query += ' AND status = ?';
    params.push(req.query.status);
  }
  if (req.query.search) {
    query += ' AND (name LIKE ? OR part_number LIKE ? OR compatible_models LIKE ?)';
    const term = `%${req.query.search}%`;
    params.push(term, term, term);
  }
  query += ' ORDER BY created_at DESC';
  const parts = db.prepare(query).all(...params);
  // Format with camelCase aliases for frontend compatibility
  const formatted = parts.map(p => ({
    ...p,
    partNo: p.part_number,
    stock: p.stock_quantity,
    minStock: p.min_reorder_level,
    unitCost: p.unit_cost,
    sellingPrice: p.selling_price,
    compatibleModel: p.compatible_models,
    supplier: p.supplier_name,
    location: p.shelf_location
  }));
  res.json(formatted);
});

router.get('/parts/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const p = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Spare part SKU not found' });
  res.json({
    ...p,
    partNo: p.part_number,
    stock: p.stock_quantity,
    minStock: p.min_reorder_level,
    unitCost: p.unit_cost,
    sellingPrice: p.selling_price,
    compatibleModel: p.compatible_models,
    supplier: p.supplier_name,
    location: p.shelf_location
  });
});

router.post('/parts', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const id = req.body.id || `part_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM spare_parts').get().c + 1;
  const partNo = req.body.part_number || req.body.partNo || `PRT-2026-${String(totalCount).padStart(3, '0')}`;
  const name = req.body.name || req.body.partName;
  if (!name) return res.status(400).json({ error: 'Part name is required' });

  const category = normalizePartCategory(req.body.category);
  const compatible = req.body.compatible_models || req.body.compatibleModel || req.body.compatible || 'All Showroom Models';
  const stock = Number(req.body.stock_quantity ?? req.body.stock ?? 10);
  const minStock = Number(req.body.min_reorder_level ?? req.body.minStock ?? 3);
  const unitCost = Number(req.body.unit_cost ?? req.body.unitCost ?? 2000);
  const sellingPrice = Number(req.body.selling_price ?? req.body.sellingPrice ?? unitCost * 1.35);
  const supplier = req.body.supplier_name || req.body.supplier || 'OEM Direct';
  const shelf = req.body.shelf_location || req.body.location || 'Bay-A1';
  const status = computePartStatus(stock, minStock);

  db.prepare(`
    INSERT INTO spare_parts (
      id, part_number, name, category, compatible_models, stock_quantity,
      min_reorder_level, unit_cost, selling_price, supplier_name, shelf_location,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, partNo, name, category, compatible, stock, minStock, unitCost, sellingPrice, supplier, shelf, status);

  recordAudit(db, req.user, 'CREATE', 'PARTS', `Added spare part ${partNo} (${name}) with stock ${stock}`, id);
  const created = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
  res.status(201).json({
    ...created,
    partNo: created.part_number,
    stock: created.stock_quantity,
    minStock: created.min_reorder_level,
    unitCost: created.unit_cost,
    sellingPrice: created.selling_price,
    compatibleModel: created.compatible_models,
    supplier: created.supplier_name,
    location: created.shelf_location
  });
});

router.put('/parts/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Part not found' });

  const stock = Number(req.body.stock_quantity ?? req.body.stock ?? current.stock_quantity);
  const minStock = Number(req.body.min_reorder_level ?? req.body.minStock ?? current.min_reorder_level);
  const status = req.body.status || computePartStatus(stock, minStock);
  const category = req.body.category ? normalizePartCategory(req.body.category) : current.category;

  db.prepare(`
    UPDATE spare_parts SET
      name = COALESCE(?, name),
      category = ?,
      compatible_models = COALESCE(?, compatible_models),
      stock_quantity = ?,
      min_reorder_level = ?,
      unit_cost = COALESCE(?, unit_cost),
      selling_price = COALESCE(?, selling_price),
      supplier_name = COALESCE(?, supplier_name),
      shelf_location = COALESCE(?, shelf_location),
      status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    req.body.name, category, req.body.compatible_models || req.body.compatibleModel,
    stock, minStock,
    req.body.unit_cost !== undefined ? Number(req.body.unit_cost) : (req.body.unitCost !== undefined ? Number(req.body.unitCost) : null),
    req.body.selling_price !== undefined ? Number(req.body.selling_price) : (req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : null),
    req.body.supplier_name || req.body.supplier,
    req.body.shelf_location || req.body.location,
    status, req.params.id
  );

  recordAudit(db, req.user, 'UPDATE', 'PARTS', `Updated spare part ${current.part_number} stock to ${stock}`, req.params.id);
  const updated = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(req.params.id);
  res.json({
    ...updated,
    partNo: updated.part_number,
    stock: updated.stock_quantity,
    minStock: updated.min_reorder_level,
    unitCost: updated.unit_cost,
    sellingPrice: updated.selling_price,
    compatibleModel: updated.compatible_models,
    supplier: updated.supplier_name,
    location: updated.shelf_location
  });
});

router.delete('/parts/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Part not found' });

  db.prepare('DELETE FROM spare_parts WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'PARTS', `Deleted spare part ${current.part_number} (${current.name})`, req.params.id);
  res.json({ success: true, message: `Part ${current.part_number} deleted from inventory.` });
});

// ----------------------------------------------------------------------------
// B. PROCUREMENT / FACTORY ORDERS (ADMIN ONLY)
// Workflow: Procurement -> Vehicle Received -> Inventory
// ----------------------------------------------------------------------------
router.get('/procurement', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const orders = db.prepare('SELECT * FROM procurement_orders ORDER BY order_date DESC').all();
  const ordersWithItems = orders.map(order => {
    const items = db.prepare('SELECT * FROM procurement_items WHERE procurement_order_id = ?').all(order.id);
    const firstItem = items[0] || {};
    return {
      ...order,
      poNumber: order.po_number,
      supplier: order.supplier_name,
      orderDate: order.order_date,
      expectedDelivery: order.expected_delivery_date,
      actualDelivery: order.actual_delivery_date,
      purchaseCost: order.total_cost,
      brand: (firstItem.item_name || '').split(' ')[0] || 'Luxury OEM',
      model: (firstItem.item_name || '').slice((firstItem.item_name || '').indexOf(' ') + 1) || 'Vehicle Allocation',
      vin: firstItem.sku_or_vin || 'Pending Assignment',
      items
    };
  });
  res.json(ordersWithItems);
});

router.get('/procurement/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const order = db.prepare('SELECT * FROM procurement_orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Procurement order not found' });
  const items = db.prepare('SELECT * FROM procurement_items WHERE procurement_order_id = ?').all(order.id);
  res.json({
    ...order,
    poNumber: order.po_number,
    supplier: order.supplier_name,
    orderDate: order.order_date,
    expectedDelivery: order.expected_delivery_date,
    items
  });
});

router.post('/procurement', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const createProcurementTx = db.transaction(() => {
    const id = req.body.id || `po_${Date.now()}`;
    const totalCount = db.prepare('SELECT count(*) as c FROM procurement_orders').get().c + 1;
    const poNo = req.body.po_number || req.body.poNumber || `PO-2026-${String(totalCount).padStart(3, '0')}`;
    const supplier = req.body.supplier_name || req.body.supplier || 'OEM Manufacturer';
    const orderDate = req.body.order_date || req.body.orderDate || new Date().toISOString().split('T')[0];
    const expDelivery = req.body.expected_delivery_date || req.body.expectedDelivery || '2026-11-20';
    const cost = Number(req.body.total_cost ?? req.body.purchaseCost ?? 3500000);
    const status = req.body.status || 'Ordered';
    const notes = req.body.notes || `${req.body.brand || ''} ${req.body.model || ''} allocation`.trim();

    db.prepare(`
      INSERT INTO procurement_orders (
        id, po_number, supplier_name, order_date, expected_delivery_date,
        total_cost, status, notes, ordered_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, poNo, supplier, orderDate, expDelivery, cost, status, notes, req.user?.id || null);

    const brand = req.body.brand || 'Luxury';
    const model = req.body.model || 'Performance Edition';
    const itemName = req.body.item_name || `${brand} ${model}`;
    const itemType = req.body.item_type || 'Vehicle';
    const vin = req.body.vin || req.body.sku_or_vin || `VIN${Date.now().toString().slice(-10)}`;
    const qty = Number(req.body.quantity || 1);

    db.prepare(`
      INSERT INTO procurement_items (
        id, procurement_order_id, item_type, item_name, sku_or_vin, quantity, unit_cost, total_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(`poi_${Date.now()}`, id, itemType, itemName, vin, qty, cost / qty, cost);

    recordAudit(db, req.user, 'CREATE', 'PROCUREMENT', `Placed factory procurement order ${poNo} (₹${cost})`, id);
    const created = db.prepare('SELECT * FROM procurement_orders WHERE id = ?').get(id);
    const items = db.prepare('SELECT * FROM procurement_items WHERE procurement_order_id = ?').all(id);
    return {
      ...created,
      poNumber: created.po_number,
      supplier: created.supplier_name,
      purchaseCost: created.total_cost,
      brand,
      model,
      vin,
      items
    };
  });

  try {
    const result = createProcurementTx();
    res.status(201).json(result);
  } catch (err) {
    console.error('Procurement creation error:', err);
    res.status(400).json({ error: err.message || 'Failed to create procurement order' });
  }
});

router.put('/procurement/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM procurement_orders WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Procurement order not found' });

  let status = req.body.status || current.status;
  if (status === 'Delivered') status = 'Received';

  db.prepare(`
    UPDATE procurement_orders SET
      supplier_name = COALESCE(?, supplier_name),
      expected_delivery_date = COALESCE(?, expected_delivery_date),
      total_cost = COALESCE(?, total_cost),
      status = ?,
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    req.body.supplier_name || req.body.supplier,
    req.body.expected_delivery_date || req.body.expectedDelivery,
    req.body.total_cost !== undefined ? Number(req.body.total_cost) : (req.body.purchaseCost !== undefined ? Number(req.body.purchaseCost) : null),
    status, req.body.notes, req.params.id
  );

  recordAudit(db, req.user, 'UPDATE', 'PROCUREMENT', `Updated procurement order ${current.po_number} status to ${status}`, req.params.id);
  const updated = db.prepare('SELECT * FROM procurement_orders WHERE id = ?').get(req.params.id);
  res.json({ ...updated, poNumber: updated.po_number, supplier: updated.supplier_name, purchaseCost: updated.total_cost });
});

// CRITICAL WORKFLOW: Procurement -> Vehicle Received -> Inventory
router.post('/procurement/:id/receive', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const receiveTx = db.transaction(() => {
    const order = db.prepare('SELECT * FROM procurement_orders WHERE id = ?').get(req.params.id);
    if (!order) throw new Error('Procurement order not found');

    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE procurement_orders SET
        status = 'Received',
        actual_delivery_date = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(today, order.id);

    const items = db.prepare('SELECT * FROM procurement_items WHERE procurement_order_id = ?').all(order.id);
    const addedVehicles = [];

    for (const item of items) {
      if (item.item_type === 'Vehicle') {
        const vin = item.sku_or_vin || `VIN${Date.now().toString().slice(-10)}`;
        const existingVeh = db.prepare('SELECT * FROM vehicles WHERE vin = ?').get(vin);

        if (existingVeh) {
          db.prepare(`
            UPDATE vehicles SET
              stock_quantity = stock_quantity + ?,
              status = 'Available',
              updated_at = datetime('now')
            WHERE id = ?
          `).run(item.quantity, existingVeh.id);
          addedVehicles.push(existingVeh);
        } else {
          const vehId = `veh_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const parts = (item.item_name || 'Luxury Edition').split(' ');
          const brand = parts[0] || 'Apex';
          const model = parts.slice(1).join(' ') || 'Grand Tourer';
          const price = Number(req.body.suggestedRetailPrice || req.body.retailPrice || (item.unit_cost * 1.25));

          db.prepare(`
            INSERT INTO vehicles (
              id, vin, brand, model, year, category, transmission, fuel_type,
              ex_showroom_price, stock_quantity, status, color,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, 2026, 'Sedan', 'Automatic', 'Petrol', ?, ?, 'Available', 'Obsidian Black', datetime('now'), datetime('now'))
          `).run(vehId, vin, brand, model, price, item.quantity);

          addedVehicles.push(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehId));
        }
      } else if (item.item_type === 'Spare Part') {
        const existingPart = db.prepare('SELECT * FROM spare_parts WHERE part_number = ? OR name = ?').get(item.sku_or_vin, item.item_name);
        if (existingPart) {
          db.prepare(`
            UPDATE spare_parts SET
              stock_quantity = stock_quantity + ?,
              status = 'In Stock',
              updated_at = datetime('now')
            WHERE id = ?
          `).run(item.quantity, existingPart.id);
        }
      }
    }

    recordAudit(db, req.user, 'RECEIVE', 'PROCUREMENT', `Received order ${order.po_number} and transferred units into showroom inventory`, order.id);

    return {
      success: true,
      message: `Procurement order ${order.po_number} received. Units synchronized with showroom stock.`,
      addedVehicles
    };
  });

  try {
    const result = receiveTx();
    res.json(result);
  } catch (err) {
    console.error('Receive procurement error:', err);
    res.status(400).json({ error: err.message || 'Failed to receive order into inventory' });
  }
});

router.delete('/procurement/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM procurement_orders WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Order not found' });

  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM procurement_items WHERE procurement_order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM procurement_orders WHERE id = ?').run(req.params.id);
  });

  deleteTx();
  recordAudit(db, req.user, 'DELETE', 'PROCUREMENT', `Deleted procurement order ${current.po_number}`, req.params.id);
  res.json({ success: true, message: `Procurement order ${current.po_number} removed.` });
});

// ----------------------------------------------------------------------------
// C. SERVICE & WORKSHOP (ADMIN ONLY)
// Workflow: Customer -> Vehicle -> Job Card -> Parts -> Service -> Service History
// ----------------------------------------------------------------------------
const VALID_SERVICE_TYPES = ['First Free Service', 'Periodic Maintenance', 'Running Repair', 'Accidental Repair', 'Warranty Claim', 'Detailing & Polish'];

function normalizeServiceType(type) {
  if (!type) return 'Periodic Maintenance';
  const match = VALID_SERVICE_TYPES.find(t => t.toLowerCase() === type.toLowerCase());
  if (match) return match;
  if (type.toLowerCase().includes('free')) return 'First Free Service';
  if (type.toLowerCase().includes('repair') || type.toLowerCase().includes('running')) return 'Running Repair';
  if (type.toLowerCase().includes('accident')) return 'Accidental Repair';
  if (type.toLowerCase().includes('warranty')) return 'Warranty Claim';
  if (type.toLowerCase().includes('polish') || type.toLowerCase().includes('detail')) return 'Detailing & Polish';
  return 'Periodic Maintenance';
}

router.get('/services', authenticateToken, requireRole('ADMIN'), (req, res) => {
  let query = `
    SELECT st.*, c.name as customer_crm_name, c.phone as customer_crm_phone,
           jc.id as job_card_id, jc.job_card_number, jc.technician_name,
           jc.labor_charges, jc.parts_total_cost, jc.total_service_cost,
           jc.bay_number, jc.status as job_card_status
    FROM service_tickets st
    LEFT JOIN customers c ON st.customer_id = c.id
    LEFT JOIN job_cards jc ON jc.service_ticket_id = st.id
    WHERE 1=1
  `;
  const params = [];
  if (req.query.status && req.query.status !== 'All') {
    query += ' AND st.status = ?';
    params.push(req.query.status);
  }
  if (req.query.vin) {
    query += ' AND st.vin = ?';
    params.push(req.query.vin);
  }
  if (req.query.search) {
    query += ' AND (st.ticket_number LIKE ? OR st.customer_name LIKE ? OR st.vehicle_model LIKE ? OR st.vin LIKE ?)';
    const term = `%${req.query.search}%`;
    params.push(term, term, term, term);
  }
  query += ' ORDER BY st.entry_date DESC';
  const rows = db.prepare(query).all(...params);

  const formatted = rows.map(r => ({
    ...r,
    ticketNo: r.ticket_number,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    vehicleModel: r.vehicle_model,
    serviceType: r.service_type,
    date: r.entry_date,
    estimatedCost: r.total_service_cost || 12000,
    technician: r.technician_name || 'Master Technician'
  }));
  res.json(formatted);
});

router.get('/services/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const st = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(req.params.id);
  if (!st) return res.status(404).json({ error: 'Service ticket not found' });
  const jobCard = db.prepare('SELECT * FROM job_cards WHERE service_ticket_id = ?').get(st.id);
  res.json({
    ...st,
    ticketNo: st.ticket_number,
    jobCard: jobCard ? {
      ...jobCard,
      partsAllocated: jobCard.parts_allocated ? JSON.parse(jobCard.parts_allocated) : []
    } : null
  });
});

// Service History for vehicle VIN (supports both /services/history/:vin and /services/history/vehicle/:vin)
router.get(['/services/history/:vin', '/services/history/vehicle/:vin'], authenticateToken, requireRole('ADMIN'), (req, res) => {
  const history = db.prepare(`
    SELECT st.*, jc.job_card_number, jc.technician_name, jc.labor_charges, jc.parts_total_cost, jc.total_service_cost, jc.parts_allocated
    FROM service_tickets st
    LEFT JOIN job_cards jc ON jc.service_ticket_id = st.id
    WHERE st.vin = ?
    ORDER BY st.entry_date DESC
  `).all(req.params.vin);
  res.json(history);
});

router.post('/services', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const createServiceTx = db.transaction(() => {
    const id = req.body.id || `st_${Date.now()}`;
    const totalCount = db.prepare('SELECT count(*) as c FROM service_tickets').get().c + 1;
    const ticketNo = req.body.ticket_number || req.body.ticketNo || `ST-2026-${String(totalCount).padStart(3, '0')}`;
    const custName = req.body.customer_name || req.body.customerName;
    if (!custName) throw new Error('Customer name is required');

    const phone = req.body.customer_phone || req.body.customerPhone || '+91 98000 00000';
    const vehModel = req.body.vehicle_model || req.body.vehicleModel || 'Mercedes-Benz E-Class';
    const vin = req.body.vin || `VIN${Date.now().toString().slice(-10)}`;
    const serviceType = normalizeServiceType(req.body.service_type || req.body.serviceType);
    const entryDate = req.body.entry_date || req.body.date || new Date().toISOString().split('T')[0];
    const complaints = req.body.customer_complaints || req.body.complaints || req.body.notes || 'Routine health check & scheduled maintenance';

    db.prepare(`
      INSERT INTO service_tickets (
        id, ticket_number, customer_id, customer_name, customer_phone, vehicle_model,
        vin, odometer_reading, service_type, entry_date, expected_delivery,
        assigned_advisor_id, status, customer_complaints, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, datetime('now'), datetime('now'))
    `).run(
      id, ticketNo, req.body.customer_id || req.body.customerId || null,
      custName, phone, vehModel, vin, Number(req.body.odometer_reading || 15000),
      serviceType, entryDate, req.body.expected_delivery || '2026-10-10',
      req.user?.id || null, complaints
    );

    const jcId = `jc_${Date.now()}`;
    const jcNo = `JC-2026-${String(totalCount).padStart(3, '0')}`;
    const tech = req.body.technician || req.body.technician_name || 'Suresh Patil (Master Tech)';
    const labor = Number(req.body.labor_charges || 3500);

    db.prepare(`
      INSERT INTO job_cards (
        id, job_card_number, service_ticket_id, technician_name, labor_charges,
        parts_total_cost, total_service_cost, bay_number, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?, 'Bay-1', 'Assigned', datetime('now'), datetime('now'))
    `).run(jcId, jcNo, id, tech, labor, labor);

    recordAudit(db, req.user, 'CREATE', 'SERVICE', `Opened service ticket ${ticketNo} for ${custName}`, id);

    const created = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(id);
    return {
      ...created,
      ticketNo: created.ticket_number,
      customerName: created.customer_name,
      vehicleModel: created.vehicle_model,
      technician: tech,
      estimatedCost: labor
    };
  });

  try {
    const result = createServiceTx();
    res.status(201).json(result);
  } catch (err) {
    console.error('Service ticket error:', err);
    res.status(400).json({ error: err.message || 'Failed to create service ticket' });
  }
});

router.put('/services/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Service ticket not found' });

  let status = req.body.status || current.status;
  if (status === 'Waiting on Parts') status = 'Awaiting Parts';
  if (status === 'Completed' || status === 'Done') status = 'Work Completed';

  db.prepare(`
    UPDATE service_tickets SET
      status = ?,
      customer_complaints = COALESCE(?, customer_complaints),
      expected_delivery = COALESCE(?, expected_delivery),
      actual_delivery = COALESCE(?, actual_delivery),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(status, req.body.customer_complaints || req.body.notes, req.body.expected_delivery, req.body.actual_delivery, req.params.id);

  recordAudit(db, req.user, 'UPDATE', 'SERVICE', `Updated ticket ${current.ticket_number} status to ${status}`, req.params.id);
  const updated = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(req.params.id);
  res.json({
    ...updated,
    ticketNo: updated.ticket_number,
    customerName: updated.customer_name,
    vehicleModel: updated.vehicle_model
  });
});

router.delete('/services/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Service ticket not found' });

  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM job_cards WHERE service_ticket_id = ?').run(req.params.id);
    db.prepare('DELETE FROM service_tickets WHERE id = ?').run(req.params.id);
  });
  deleteTx();

  recordAudit(db, req.user, 'DELETE', 'SERVICE', `Deleted service ticket ${current.ticket_number}`, req.params.id);
  res.json({ success: true, message: `Service ticket ${current.ticket_number} deleted.` });
});

// Job Cards & Parts Allocation
router.get('/job-cards', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const cards = db.prepare(`
    SELECT jc.*, st.ticket_number, st.customer_name, st.vehicle_model, st.vin
    FROM job_cards jc
    JOIN service_tickets st ON jc.service_ticket_id = st.id
    ORDER BY jc.created_at DESC
  `).all();
  res.json(cards);
});

router.post('/job-cards/:id/allocate-parts', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const allocateTx = db.transaction(() => {
    const jc = db.prepare('SELECT * FROM job_cards WHERE id = ?').get(req.params.id);
    if (!jc) throw new Error('Job Card not found');

    const partsList = req.body.parts || [];
    if (!Array.isArray(partsList) || partsList.length === 0) {
      throw new Error('Please select at least one spare part to allocate');
    }

    let partsTotal = 0;
    const allocatedRecords = [];

    for (const p of partsList) {
      const partRecord = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(p.part_id);
      if (!partRecord) throw new Error(`Part ${p.part_id} not found in inventory`);

      const qty = Number(p.quantity || 1);
      if (partRecord.stock_quantity < qty) {
        throw new Error(`Insufficient inventory for ${partRecord.name}. In stock: ${partRecord.stock_quantity}, requested: ${qty}`);
      }

      const remainingStock = partRecord.stock_quantity - qty;
      const newStatus = computePartStatus(remainingStock, partRecord.min_reorder_level);

      db.prepare(`
        UPDATE spare_parts SET
          stock_quantity = ?,
          status = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(remainingStock, newStatus, partRecord.id);

      const unitPrice = Number(p.unit_price || partRecord.selling_price);
      const lineCost = unitPrice * qty;
      partsTotal += lineCost;

      allocatedRecords.push({
        partId: partRecord.id,
        partNumber: partRecord.part_number,
        partName: partRecord.name,
        quantity: qty,
        unitPrice,
        lineCost
      });
    }

    const currentAllocated = jc.parts_allocated ? JSON.parse(jc.parts_allocated) : [];
    const combinedAllocated = [...currentAllocated, ...allocatedRecords];
    const newPartsTotal = Number(jc.parts_total_cost || 0) + partsTotal;
    const newTotalCost = Number(jc.labor_charges || 0) + newPartsTotal;

    db.prepare(`
      UPDATE job_cards SET
        parts_allocated = ?,
        parts_total_cost = ?,
        total_service_cost = ?,
        status = 'Work In Progress',
        updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(combinedAllocated), newPartsTotal, newTotalCost, jc.id);

    db.prepare(`
      UPDATE service_tickets SET
        status = 'In Progress',
        updated_at = datetime('now')
      WHERE id = ?
    `).run(jc.service_ticket_id);

    recordAudit(db, req.user, 'ALLOCATE_PARTS', 'SERVICE', `Allocated ${allocatedRecords.length} spare parts (₹${partsTotal}) to Job Card ${jc.job_card_number}`, jc.id);

    return {
      success: true,
      jobCardNumber: jc.job_card_number,
      partsTotalCost: newPartsTotal,
      totalServiceCost: newTotalCost,
      allocatedParts: combinedAllocated
    };
  });

  try {
    const result = allocateTx();
    res.json(result);
  } catch (err) {
    console.error('Parts allocation error:', err);
    res.status(400).json({ error: err.message || 'Failed to allocate parts' });
  }
});

// ----------------------------------------------------------------------------
// D. STAFF MANAGEMENT (ADMIN ONLY)
// Workflow: Staff -> Salary -> Payroll -> Salary History
// ----------------------------------------------------------------------------
const VALID_DEPARTMENTS = ['Sales', 'Service & Workshop', 'Finance & Insurance', 'Parts & Inventory', 'Executive & Management'];

function normalizeStaffDept(dept) {
  if (!dept) return 'Sales';
  const match = VALID_DEPARTMENTS.find(d => d.toLowerCase() === dept.toLowerCase());
  if (match) return match;
  if (dept.toLowerCase().includes('service') || dept.toLowerCase().includes('workshop')) return 'Service & Workshop';
  if (dept.toLowerCase().includes('finance') || dept.toLowerCase().includes('insurance')) return 'Finance & Insurance';
  if (dept.toLowerCase().includes('part') || dept.toLowerCase().includes('inventory')) return 'Parts & Inventory';
  if (dept.toLowerCase().includes('exec') || dept.toLowerCase().includes('manage')) return 'Executive & Management';
  return 'Sales';
}

router.get('/staff', authenticateToken, requireRole('ADMIN'), (req, res) => {
  let query = 'SELECT * FROM staff WHERE 1=1';
  const params = [];
  if (req.query.department && req.query.department !== 'All') {
    query += ' AND department = ?';
    params.push(req.query.department);
  }
  if (req.query.search) {
    query += ' AND (name LIKE ? OR role_title LIKE ? OR email LIKE ? OR employee_code LIKE ?)';
    const term = `%${req.query.search}%`;
    params.push(term, term, term, term);
  }
  query += ' ORDER BY joining_date ASC';
  const rows = db.prepare(query).all(...params);
  const formatted = rows.map(s => ({
    ...s,
    role: s.role_title,
    salesClosed: s.sales_closed_count || 0,
    revenueGenerated: s.revenue_generated || 0,
    baseSalary: s.base_salary
  }));
  res.json(formatted);
});

router.get('/staff/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const staffMember = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!staffMember) return res.status(404).json({ error: 'Staff member not found' });
  const recentPayroll = db.prepare('SELECT * FROM payroll WHERE staff_id = ? ORDER BY payroll_period DESC').all(staffMember.id);
  res.json({ ...staffMember, role: staffMember.role_title, recentPayroll });
});

router.post('/staff', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const id = req.body.id || `stf_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM staff').get().c + 1;
  const empCode = req.body.employee_code || req.body.empCode || `EMP-${String(totalCount).padStart(3, '0')}`;
  const name = req.body.name;
  if (!name) return res.status(400).json({ error: 'Staff member name is required' });

  const dept = normalizeStaffDept(req.body.department);
  const roleTitle = req.body.role_title || req.body.role || 'Client Advisor';
  const email = req.body.email || `${name.toLowerCase().replace(/\s+/g, '.')}@motormart.com`;
  const phone = req.body.phone || '+91 99999 00000';
  const joiningDate = req.body.joining_date || req.body.joiningDate || new Date().toISOString().split('T')[0];
  const baseSalary = Number(req.body.base_salary ?? req.body.baseSalary ?? 45000);
  const status = req.body.status || 'Active';

  db.prepare(`
    INSERT INTO staff (
      id, user_id, employee_code, name, department, role_title, email,
      phone, joining_date, base_salary, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, req.body.user_id || null, empCode, name, dept, roleTitle, email, phone, joiningDate, baseSalary, status);

  recordAudit(db, req.user, 'CREATE', 'STAFF', `Added staff member ${name} (${empCode})`, id);
  const created = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
  res.status(201).json({ ...created, role: created.role_title });
});

router.put('/staff/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Staff member not found' });

  const dept = req.body.department ? normalizeStaffDept(req.body.department) : current.department;

  db.prepare(`
    UPDATE staff SET
      name = COALESCE(?, name),
      department = ?,
      role_title = COALESCE(?, role_title),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      base_salary = COALESCE(?, base_salary),
      status = COALESCE(?, status),
      sales_closed_count = COALESCE(?, sales_closed_count),
      revenue_generated = COALESCE(?, revenue_generated),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    req.body.name, dept, req.body.role_title || req.body.role,
    req.body.email, req.body.phone,
    req.body.base_salary !== undefined ? Number(req.body.base_salary) : (req.body.baseSalary !== undefined ? Number(req.body.baseSalary) : null),
    req.body.status,
    req.body.sales_closed_count !== undefined ? Number(req.body.sales_closed_count) : null,
    req.body.revenue_generated !== undefined ? Number(req.body.revenue_generated) : null,
    req.params.id
  );

  recordAudit(db, req.user, 'UPDATE', 'STAFF', `Updated staff profile ${current.employee_code}`, req.params.id);
  const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  res.json({ ...updated, role: updated.role_title });
});

router.delete('/staff/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Staff member not found' });

  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'STAFF', `Removed staff member ${current.name} (${current.employee_code})`, req.params.id);
  res.json({ success: true, message: `Staff member ${current.name} removed.` });
});

// ----------------------------------------------------------------------------
// E. PAYROLL (ADMIN ONLY)
// Workflow: Staff -> Salary -> Payroll -> Salary History
// ----------------------------------------------------------------------------
router.get('/payroll', authenticateToken, requireRole('ADMIN'), (req, res) => {
  let query = `
    SELECT p.*, s.name as staff_name, s.employee_code, s.department, s.role_title, s.phone as staff_phone
    FROM payroll p
    JOIN staff s ON p.staff_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (req.query.period && req.query.period !== 'All') {
    query += ' AND p.payroll_period = ?';
    params.push(req.query.period);
  }
  if (req.query.status && req.query.status !== 'All') {
    query += ' AND p.status = ?';
    params.push(req.query.status);
  }
  query += ' ORDER BY p.payroll_period DESC, p.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/payroll/staff/:staffId', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const history = db.prepare(`
    SELECT p.*, s.name as staff_name, s.employee_code, s.department, s.role_title
    FROM payroll p
    JOIN staff s ON p.staff_id = s.id
    WHERE p.staff_id = ?
    ORDER BY p.payroll_period DESC
  `).all(req.params.staffId);
  res.json(history);
});

router.post('/payroll', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const id = req.body.id || `payr_${Date.now()}`;
  const staffId = req.body.staff_id || req.body.staffId;
  if (!staffId) return res.status(400).json({ error: 'Staff ID is required for payroll' });

  const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(staffId);
  if (!staff) return res.status(404).json({ error: 'Staff record not found' });

  const period = req.body.payroll_period || req.body.period || '2026-10';
  const baseSalary = Number(req.body.base_salary ?? req.body.baseSalary ?? staff.base_salary);
  const incentive = Number(req.body.sales_incentive ?? req.body.incentive ?? 0);
  const allowances = Number(req.body.allowances ?? 3500);
  const deductions = Number(req.body.deductions ?? (baseSalary * 0.05));
  const netSalary = Number(req.body.net_salary ?? (baseSalary + incentive + allowances - deductions));
  const payDate = req.body.payment_date || req.body.paymentDate || new Date().toISOString().split('T')[0];
  const mode = req.body.payment_mode || 'Direct Bank Transfer';
  const status = req.body.status || 'Paid';

  db.prepare(`
    INSERT INTO payroll (
      id, payroll_period, staff_id, base_salary, sales_incentive, allowances,
      deductions, net_salary, payment_date, payment_mode, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, period, staffId, baseSalary, incentive, allowances, deductions, netSalary, payDate, mode, status);

  recordAudit(db, req.user, 'CREATE', 'PAYROLL', `Processed ${period} payroll for ${staff.name} (Net: ₹${netSalary})`, id);
  const created = db.prepare(`
    SELECT p.*, s.name as staff_name, s.employee_code, s.department, s.role_title
    FROM payroll p
    JOIN staff s ON p.staff_id = s.id
    WHERE p.id = ?
  `).get(id);
  res.status(201).json(created);
});

router.post('/payroll/generate-batch', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const period = req.body.payroll_period || '2026-10';
  const batchTx = db.transaction(() => {
    const activeStaff = db.prepare("SELECT * FROM staff WHERE status = 'Active'").all();
    const createdRecords = [];

    for (const stf of activeStaff) {
      const existing = db.prepare('SELECT id FROM payroll WHERE staff_id = ? AND payroll_period = ?').get(stf.id, period);
      if (!existing) {
        const id = `payr_${Date.now()}_${stf.id.slice(-4)}`;
        const base = Number(stf.base_salary || 45000);
        const closedCount = Number(stf.sales_closed_count || 0);
        const incentive = closedCount * 5000;
        const allowances = 4000;
        const deductions = Math.round(base * 0.05);
        const net = base + incentive + allowances - deductions;

        db.prepare(`
          INSERT INTO payroll (
            id, payroll_period, staff_id, base_salary, sales_incentive, allowances,
            deductions, net_salary, payment_date, payment_mode, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'Direct Bank Transfer', 'Approved', datetime('now'), datetime('now'))
        `).run(id, period, stf.id, base, incentive, allowances, deductions, net);

        createdRecords.push(id);
      }
    }

    recordAudit(db, req.user, 'BATCH_PAYROLL', 'PAYROLL', `Generated batch payroll for period ${period} (${createdRecords.length} staff)`, req.user.id);
    return createdRecords;
  });

  try {
    const records = batchTx();
    res.json({ success: true, period, count: records.length, message: `Generated ${records.length} payroll records for ${period}` });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to generate batch payroll' });
  }
});

router.put('/payroll/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM payroll WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Payroll record not found' });

  const base = Number(req.body.base_salary ?? current.base_salary);
  const inc = Number(req.body.sales_incentive ?? current.sales_incentive);
  const allow = Number(req.body.allowances ?? current.allowances);
  const ded = Number(req.body.deductions ?? current.deductions);
  const net = Number(req.body.net_salary ?? (base + inc + allow - ded));
  const status = req.body.status || current.status;

  db.prepare(`
    UPDATE payroll SET
      base_salary = ?, sales_incentive = ?, allowances = ?, deductions = ?,
      net_salary = ?, status = ?, payment_date = COALESCE(?, payment_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(base, inc, allow, ded, net, status, req.body.payment_date, req.params.id);

  recordAudit(db, req.user, 'UPDATE', 'PAYROLL', `Updated payroll ${current.payroll_period} status to ${status}`, req.params.id);
  const updated = db.prepare(`
    SELECT p.*, s.name as staff_name, s.employee_code, s.department, s.role_title
    FROM payroll p
    JOIN staff s ON p.staff_id = s.id
    WHERE p.id = ?
  `).get(req.params.id);
  res.json(updated);
});

router.delete('/payroll/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM payroll WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Payroll record not found' });

  db.prepare('DELETE FROM payroll WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'PAYROLL', `Deleted payroll entry for period ${current.payroll_period}`, req.params.id);
  res.json({ success: true, message: 'Payroll record deleted.' });
});

// ----------------------------------------------------------------------------
// F. EXPENSE MANAGEMENT (ADMIN ONLY)
// Workflow: Expenses -> Financial Records
// ----------------------------------------------------------------------------
const VALID_EXPENSE_CATEGORIES = [
  'Showroom Rent', 'Electricity & Utilities', 'Marketing & Ads',
  'Logistics & Fuel', 'Workshop Consumables', 'Office & IT Supplies',
  'Staff Welfare', 'Miscellaneous'
];

function normalizeExpenseCategory(cat) {
  if (!cat) return 'Miscellaneous';
  const match = VALID_EXPENSE_CATEGORIES.find(c => c.toLowerCase() === cat.toLowerCase());
  if (match) return match;
  if (cat.toLowerCase().includes('rent')) return 'Showroom Rent';
  if (cat.toLowerCase().includes('elect') || cat.toLowerCase().includes('util')) return 'Electricity & Utilities';
  if (cat.toLowerCase().includes('market') || cat.toLowerCase().includes('ad')) return 'Marketing & Ads';
  if (cat.toLowerCase().includes('fuel') || cat.toLowerCase().includes('logit')) return 'Logistics & Fuel';
  if (cat.toLowerCase().includes('workshop') || cat.toLowerCase().includes('consum')) return 'Workshop Consumables';
  if (cat.toLowerCase().includes('office') || cat.toLowerCase().includes('supply') || cat.toLowerCase().includes('it')) return 'Office & IT Supplies';
  if (cat.toLowerCase().includes('welfare') || cat.toLowerCase().includes('staff')) return 'Staff Welfare';
  return 'Miscellaneous';
}

router.get('/expenses', authenticateToken, requireRole('ADMIN'), (req, res) => {
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  if (req.query.category && req.query.category !== 'All') {
    query += ' AND category = ?';
    params.push(req.query.category);
  }
  if (req.query.status && req.query.status !== 'All') {
    query += ' AND status = ?';
    params.push(req.query.status);
  }
  if (req.query.search) {
    query += ' AND (title LIKE ? OR expense_code LIKE ? OR vendor_or_payee LIKE ?)';
    const term = `%${req.query.search}%`;
    params.push(term, term, term);
  }
  query += ' ORDER BY expense_date DESC';
  const expenses = db.prepare(query).all(...params);
  res.json(expenses);
});

router.get('/expenses/summary', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const expenses = db.prepare('SELECT category, sum(amount) as total_amount, count(*) as count FROM expenses GROUP BY category').all();
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
  res.json({ categories: expenses, totalAmount });
});

router.post('/expenses', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const id = req.body.id || `exp_${Date.now()}`;
  const totalCount = db.prepare('SELECT count(*) as c FROM expenses').get().c + 1;
  const expCode = req.body.expense_code || `EXP-2026-${String(totalCount).padStart(3, '0')}`;
  const category = normalizeExpenseCategory(req.body.category);
  const title = req.body.title || 'Dealership Operational Expense';
  const amount = Number(req.body.amount || 15000);
  const date = req.body.expense_date || req.body.date || new Date().toISOString().split('T')[0];
  const mode = req.body.payment_mode || 'Bank Transfer';
  const payee = req.body.vendor_or_payee || req.body.payee || 'Direct Vendor';
  const status = req.body.status || 'Approved';
  const notes = req.body.notes || '';

  db.prepare(`
    INSERT INTO expenses (
      id, expense_code, category, title, amount, expense_date,
      payment_mode, vendor_or_payee, receipt_url, approved_by,
      status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, expCode, category, title, amount, date, mode, payee, req.body.receipt_url || null, req.user?.id || null, status, notes);

  recordAudit(db, req.user, 'CREATE', 'EXPENSES', `Approved showroom expense ${expCode} (₹${amount})`, id);
  res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id));
});

router.put('/expenses/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Expense record not found' });

  const category = req.body.category ? normalizeExpenseCategory(req.body.category) : current.category;

  db.prepare(`
    UPDATE expenses SET
      category = ?,
      title = COALESCE(?, title),
      amount = COALESCE(?, amount),
      expense_date = COALESCE(?, expense_date),
      payment_mode = COALESCE(?, payment_mode),
      vendor_or_payee = COALESCE(?, vendor_or_payee),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    category, req.body.title,
    req.body.amount !== undefined ? Number(req.body.amount) : null,
    req.body.expense_date, req.body.payment_mode,
    req.body.vendor_or_payee, req.body.status,
    req.body.notes, req.params.id
  );

  recordAudit(db, req.user, 'UPDATE', 'EXPENSES', `Updated expense ${current.expense_code}`, req.params.id);
  res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id));
});

router.delete('/expenses/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const current = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Expense not found' });

  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  recordAudit(db, req.user, 'DELETE', 'EXPENSES', `Deleted expense ${current.expense_code}`, req.params.id);
  res.json({ success: true, message: `Expense ${current.expense_code} deleted.` });
});

// ----------------------------------------------------------------------------
// G. FINANCIAL REPORTS & ACCOUNTS ENGINE (ADMIN & EXECUTIVES)
// Calculated strictly from REAL SQLite Database Transactions
// ----------------------------------------------------------------------------

router.get('/reports/summary', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const pnl = reportService.getProfitAndLoss();
  const balanceSheet = reportService.getBalanceSheet();
  const gst = reportService.getGstReport();
  const salesSummary = reportService.getSalesReport().summary;
  const invCapital = reportService.getInventoryCapital();

  res.json({
    totalCarSalesRevenue: pnl.revenue.carSalesRevenue,
    totalGrossRevenue: pnl.revenue.totalOperatingRevenue,
    totalPayrollSpend: pnl.expenses.payrollSpend,
    totalExpenseSpend: pnl.expenses.totalOperatingExpenses - pnl.expenses.payrollSpend,
    totalInventoryCapital: invCapital.combinedTotalCapital,
    netOperationalProfit: pnl.profit.netOperatingProfit,
    marginPct: pnl.profit.netProfitMarginPct,
    cashAndBankBalance: balanceSheet.assets.currentAssets.cashAndBankBalance,
    accountsReceivable: balanceSheet.assets.currentAssets.accountsReceivable,
    netGstPayable: gst.netGstPayable,
    totalUnitsSold: salesSummary.totalUnits
  });
});

router.get('/reports/financial-summary', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const pnl = reportService.getProfitAndLoss(req.query);
  const balanceSheet = reportService.getBalanceSheet();
  const gst = reportService.getGstReport(req.query);
  const invCap = reportService.getInventoryCapital();
  const deptRev = reportService.getDepartmentRevenue();

  res.json({
    pnl,
    balanceSheet,
    gst,
    invCap,
    deptRev
  });
});

router.get('/reports/sales', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getSalesReport(req.query);
  res.json(data);
});

router.get('/reports/revenue', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getRevenueReport(req.query);
  res.json(data);
});

router.get('/reports/payments-in', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getPaymentsIn(req.query);
  res.json(data);
});

router.get('/reports/payments-out', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getPaymentsOut(req.query);
  res.json(data);
});

router.get('/reports/expenses', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getExpenseReport(req.query);
  res.json(data);
});

router.get('/reports/party-ledger', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getPartyLedger(req.query);
  res.json(data);
});

router.get(['/reports/profit-and-loss', '/reports/pnl'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getProfitAndLoss(req.query);
  res.json(data);
});

router.get('/reports/balance-sheet', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getBalanceSheet();
  res.json(data);
});

router.get(['/reports/tax-gst', '/reports/gst'], authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getGstReport(req.query);
  res.json(data);
});

router.get('/reports/inventory-capital', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getInventoryCapital();
  res.json(data);
});

router.get('/reports/department-revenue', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const data = reportService.getDepartmentRevenue();
  res.json(data);
});

// Real dynamic CSV export across all reports
router.get('/reports/export-csv', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  const reportType = (req.query.reportType || req.query.type || 'sales').toLowerCase();
  let csv = '';
  let filename = 'Apex_Horizon_Report.csv';

  if (reportType === 'sales') {
    filename = 'Apex_Horizon_Sales_Report.csv';
    const report = reportService.getSalesReport(req.query);
    csv = 'Sale Order Number,Date,Customer Name,Customer Phone,Vehicle,VIN,Base Price,Discount,Tax Amount,Total Amount,Payment Mode,Status,Sales Advisor\n';
    report.records.forEach(s => {
      csv += `"${s.sale_order_number}","${s.booking_date}","${s.customer_name}","${s.customer_phone}","${s.brand} ${s.model}","${s.vin}",${s.base_price},${s.discount},${s.tax_amount},${s.total_amount},"${s.payment_method}","${s.status}","${s.sales_agent_name || 'Admin'}"\n`;
    });
  } else if (reportType === 'revenue') {
    filename = 'Apex_Horizon_Revenue_Inflows.csv';
    const report = reportService.getRevenueReport(req.query);
    csv = 'Payment Ref,Date,Customer Name,Payment Mode,Transaction ID,Amount,Invoice Number,Status\n';
    report.clearedPayments.forEach(p => {
      csv += `"${p.payment_reference}","${p.payment_date}","${p.customer_name}","${p.payment_mode}","${p.transaction_id || ''}",${p.amount},"${p.invoice_number || ''}","${p.status}"\n`;
    });
  } else if (reportType === 'payments-in') {
    filename = 'Apex_Horizon_Payments_In.csv';
    const report = reportService.getPaymentsIn(req.query);
    csv = 'Payment Ref,Date,Customer Name,Phone,Type,Payment Mode,Amount,Transaction ID,Receipt No,Status\n';
    report.records.forEach(p => {
      csv += `"${p.payment_reference}","${p.payment_date}","${p.customer_name}","${p.customer_phone}","${p.payment_type}","${p.payment_mode}",${p.amount},"${p.transaction_id || ''}","${p.receipt_number || ''}","${p.status}"\n`;
    });
  } else if (reportType === 'payments-out') {
    filename = 'Apex_Horizon_Payments_Out.csv';
    const report = reportService.getPaymentsOut(req.query);
    csv = 'Voucher Number,Date,Payee,Category,Outflow Type,Payment Mode,Amount,Status,Notes\n';
    report.records.forEach(o => {
      csv += `"${o.voucherNo}","${o.date}","${o.payee}","${o.category}","${o.outflowType}","${o.paymentMode}",${o.amount},"${o.status}","${(o.notes || '').replace(/"/g, '""')}"\n`;
    });
  } else if (reportType === 'expenses') {
    filename = 'Apex_Horizon_Expense_Report.csv';
    const report = reportService.getExpenseReport(req.query);
    csv = 'Expense Code,Date,Title,Category,Amount,Payment Mode,Vendor,Status\n';
    report.records.forEach(e => {
      csv += `"${e.expense_code}","${e.expense_date}","${(e.title || '').replace(/"/g, '""')}","${e.category}",${e.amount},"${e.payment_mode}","${e.vendor_or_payee || ''}","${e.status}"\n`;
    });
  } else if (reportType === 'pnl') {
    filename = 'Apex_Horizon_Profit_And_Loss.csv';
    const pnl = reportService.getProfitAndLoss(req.query);
    csv = 'Line Item,Category,Amount (INR)\n';
    csv += `"New Vehicle Sales Revenue","Income",${pnl.revenue.carSalesRevenue}\n`;
    csv += `"Workshop Labor & Services","Income",${pnl.revenue.serviceRevenue}\n`;
    csv += `"Spare Parts Counter Margin","Income",${pnl.revenue.partsRevenue}\n`;
    csv += `"Finance & Insurance Commissions","Income",${pnl.revenue.ancillaryRevenue}\n`;
    csv += `"TOTAL OPERATING REVENUE","Total Income",${pnl.revenue.totalOperatingRevenue}\n`;
    csv += `"Cost of Goods Sold (Procurement)","COGS",${pnl.cogs.totalCOGS}\n`;
    csv += `"GROSS OPERATING PROFIT","Gross Profit",${pnl.cogs.grossProfit}\n`;
    csv += `"Staff Payroll & Compensation","Operating Expense",${pnl.expenses.payrollSpend}\n`;
    csv += `"Showroom Commercial Rent","Operating Expense",${pnl.expenses.rentSpend}\n`;
    csv += `"Electricity & EV Fast Charging Utilities","Operating Expense",${pnl.expenses.utilitySpend}\n`;
    csv += `"Marketing & Advertising Spend","Operating Expense",${pnl.expenses.marketingSpend}\n`;
    csv += `"Workshop Consumables & Tools","Operating Expense",${pnl.expenses.workshopConsumables}\n`;
    csv += `"Office & General OPEX","Operating Expense",${pnl.expenses.otherOpex}\n`;
    csv += `"TOTAL OPERATING EXPENSES","Total OPEX",${pnl.expenses.totalOperatingExpenses}\n`;
    csv += `"NET OPERATING PROFIT","Net Profit",${pnl.profit.netOperatingProfit}\n`;
    csv += `"NET PROFIT MARGIN %","Margin",${pnl.profit.netProfitMarginPct}%\n`;
  } else if (reportType === 'gst') {
    filename = 'Apex_Horizon_GST_Report.csv';
    const gst = reportService.getGstReport(req.query);
    csv = 'Invoice Number,Invoice Date,Customer Name,Customer GSTIN,Taxable Amount (INR),CGST 9% (INR),SGST 9% (INR),Total Output GST (INR),Status\n';
    gst.invoiceList.forEach(inv => {
      csv += `"${inv.invoice_number}","${inv.invoice_date}","${inv.customer_name}","${inv.customer_gstin || 'B2C'}","${inv.taxable_amount}","${inv.cgst_amount}","${inv.sgst_amount}",${Number(inv.cgst_amount) + Number(inv.sgst_amount)},"${inv.status}"\n`;
    });
  } else if (reportType === 'inventory') {
    filename = 'Apex_Horizon_Inventory_Capital.csv';
    const inv = reportService.getInventoryCapital();
    csv = 'Item Type,VIN or Part Number,Name,Category,Stock Quantity,Unit Valuation (INR),Total Capital Invested (INR),Status\n';
    inv.vehicles.inventoryList.forEach(v => {
      csv += `"Vehicle","${v.vin}","${v.brand} ${v.model} ${v.variant || ''}","${v.category}",${v.stock_quantity || 1},${v.ex_showroom_price},${Number(v.ex_showroom_price) * Number(v.stock_quantity || 1)},"${v.status}"\n`;
    });
    inv.parts.partsList.forEach(p => {
      csv += `"Spare Part","${p.part_number}","${p.name}","${p.category}",${p.stock_quantity},${p.unit_cost},${Number(p.unit_cost) * Number(p.stock_quantity)},"${p.status}"\n`;
    });
  } else {
    filename = 'Apex_Horizon_Report.csv';
    csv = 'Header 1,Header 2\nValue 1,Value 2\n';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ----------------------------------------------------------------------------
// H. VENDORS & SUPPLIERS (ADMIN ONLY)
// ----------------------------------------------------------------------------
router.get('/vendors', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const vendors = db.prepare('SELECT DISTINCT supplier_name as companyName, count(*) as activeOrders FROM procurement_orders GROUP BY supplier_name').all();
  res.json(vendors);
});


// ============================================================================
// H. SHOWROOM SETTINGS (ADMIN ONLY) — Enhanced with all document/invoice fields
// ============================================================================
router.get('/settings', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const settings = settingsService.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const updated = settingsService.updateSettings(req.body);
    recordAudit(db, req.user, 'UPDATE', 'SETTINGS', 'Updated dealership showroom settings', updated.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logo upload endpoint
router.post('/settings/logo', authenticateToken, requireRole('ADMIN'), upload.single('logo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No logo file provided' });
    const logoDir = path.resolve(__dirname, '../data/assets');
    if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });
    const ext = path.extname(req.file.originalname) || '.png';
    const logoFilename = `showroom_logo${ext}`;
    const logoPath = path.join(logoDir, logoFilename);
    fs.writeFileSync(logoPath, req.file.buffer);
    const logoUrl = `data/assets/${logoFilename}`;
    settingsService.updateSettings({ logo_url: logoUrl });
    recordAudit(db, req.user, 'UPDATE', 'SETTINGS', 'Updated showroom logo', 'primary_setting');
    res.json({ success: true, logoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve logo file
router.get('/settings/logo', (req, res) => {
  try {
    const settings = settingsService.getSettings();
    if (!settings.logo_url) return res.status(404).json({ error: 'No logo configured' });
    const logoPath = path.resolve(__dirname, '..', settings.logo_url);
    if (!fs.existsSync(logoPath)) return res.status(404).json({ error: 'Logo file not found' });
    res.sendFile(logoPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public settings endpoint (for Invoice/Receipt/Quotation rendering — no auth required for key fields)
router.get('/dealership-settings', (req, res) => {
  try {
    const s = settingsService.getSettings();
    res.json({
      showroom_name: s.showroom_name,
      address: s.address,
      phone: s.phone,
      email: s.email,
      gstin: s.gstin,
      dealer_license: s.dealer_license,
      currency_symbol: s.currency_symbol,
      tax_rate: s.tax_rate,
      tagline: s.tagline,
      logo_url: s.logo_url,
      authorized_signatory: s.authorized_signatory,
      signatory_name: s.signatory_name,
      invoice_prefix: s.invoice_prefix,
      invoice_terms: s.invoice_terms,
      invoice_footer: s.invoice_footer,
      quotation_prefix: s.quotation_prefix,
      quotation_validity_days: s.quotation_validity_days,
      quotation_terms: s.quotation_terms,
      estimate_prefix: s.estimate_prefix,
      receipt_prefix: s.receipt_prefix,
      cgst_rate: s.cgst_rate,
      sgst_rate: s.sgst_rate,
      state_code: s.state_code,
      state_name: s.state_name,
      pan_number: s.pan_number,
      bank_name: s.bank_name,
      bank_account_no: s.bank_account_no,
      bank_ifsc: s.bank_ifsc,
      bank_branch: s.bank_branch,
      website: s.website
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// I. AUDIT TRAIL LOGS (ADMIN ONLY)
// ============================================================================
router.get('/audit-logs', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200').all();
  res.json(logs);
});

// ============================================================================
// J. DOCUMENTS MANAGEMENT (Protected: ADMIN & SALES_EXECUTIVE)
// ============================================================================

// Upload a document
router.post('/documents/upload', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { entity_type, entity_id, title, doc_type } = req.body;
    if (!entity_type || !entity_id || !title || !doc_type) {
      return res.status(400).json({ error: 'entity_type, entity_id, title, and doc_type are required' });
    }
    const doc = documentService.upload({
      entityType: entity_type,
      entityId: entity_id,
      title,
      docType: doc_type,
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      uploadedBy: req.user?.id || null
    });
    recordAudit(db, req.user, 'CREATE', 'DOCUMENTS', `Uploaded ${doc_type}: ${title} for ${entity_type}/${entity_id}`, doc.id);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List documents for an entity
router.get('/documents/:entityType/:entityId', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  try {
    const docs = documentService.listByEntity(req.params.entityType, req.params.entityId);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all documents with optional filters
router.get('/documents', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  try {
    const docs = documentService.listAll(req.query);
    const stats = documentService.getStats();
    res.json({ documents: docs, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Document history for an entity
router.get('/documents/:entityType/:entityId/history', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  try {
    const history = documentService.getHistory(req.params.entityType, req.params.entityId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download a document
router.get('/documents/download/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  try {
    const info = documentService.getDownloadInfo(req.params.id);
    res.setHeader('Content-Type', info.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${info.doc.title}${info.ext}"`);
    res.setHeader('Content-Length', info.size);
    info.stream.pipe(res);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Preview a document (inline display)
router.get('/documents/preview/:id', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  try {
    const info = documentService.getDownloadInfo(req.params.id);
    res.setHeader('Content-Type', info.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${info.doc.title}${info.ext}"`);
    info.stream.pipe(res);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Delete a document
router.delete('/documents/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const doc = documentService.getById(req.params.id);
    const deleted = documentService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Document not found' });
    recordAudit(db, req.user, 'DELETE', 'DOCUMENTS', `Deleted document: ${doc?.title || req.params.id}`, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Document stats
router.get('/documents-stats', authenticateToken, requireRole('ADMIN', 'SALES_EXECUTIVE'), (req, res) => {
  try {
    res.json(documentService.getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// K. BACKUP & DATA MANAGEMENT (ADMIN ONLY) — Real file-based backups
// ============================================================================

// Get database health diagnostics
router.get('/backup/health', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const health = backupService.getDatabaseHealth();
    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all backups
router.get('/backup', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const backups = backupService.listBackups();
    const health = backupService.getDatabaseHealth();
    res.json({ backups, health });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new backup (REAL file-based SQLite snapshot)
router.post('/backup', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const label = req.body.label || 'manual';
    const manifest = backupService.createBackup(label);
    recordAudit(db, req.user, 'CREATE', 'BACKUP', `Created database backup: ${manifest.filename} (${manifest.sizeMB} MB, ${manifest.totalRecords} records)`, req.user.id, req.ip);
    res.status(201).json({
      success: true,
      message: `Database backup created successfully: ${manifest.filename}`,
      backup: manifest
    });
  } catch (err) {
    res.status(500).json({ error: `Backup failed: ${err.message}` });
  }
});

// Verify a backup's integrity
router.get('/backup/verify/:filename', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const result = backupService.verifyBackup(req.params.filename);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Download a backup file
router.get('/backup/download/:filename', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const info = backupService.getBackupStream(req.params.filename);
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Length', info.size);
    info.stream.pipe(res);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Delete a backup
router.delete('/backup/:filename', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const result = backupService.deleteBackup(req.params.filename);
    recordAudit(db, req.user, 'DELETE', 'BACKUP', `Deleted backup: ${req.params.filename}`, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Export full database as JSON
router.get('/backup/export-json', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const data = backupService.exportDataAsJson();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="apex_horizon_data_export_${new Date().toISOString().split('T')[0]}.json"`);
    recordAudit(db, req.user, 'EXPORT', 'BACKUP', 'Exported full database as JSON', req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore database from a backup snapshot (ADMIN ONLY)
router.post('/backup/restore/:filename', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const result = backupService.restoreBackup(req.params.filename);
    recordAudit(db, req.user, 'UPDATE', 'BACKUP', `Restored database from ${req.params.filename} (${result.totalRecordsRestored} records across ${result.tablesRestored} tables)`, req.user.id);
    res.json({
      success: true,
      message: `Database successfully restored from ${req.params.filename}`,
      result
    });
  } catch (err) {
    res.status(500).json({ error: `Restore failed: ${err.message}` });
  }
});

module.exports = router;


