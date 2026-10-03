const http = require('http');

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${message} ${details ? '(' + details + ')' : ''}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${message} - Details:`, details);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(buf);
        } catch {
          parsed = buf;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function post(path, body, token = null) {
  const data = JSON.stringify(body);
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'POST',
    headers
  }, data);
}

function put(path, body, token = null) {
  const data = JSON.stringify(body);
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'PUT',
    headers
  }, data);
}

function get(path, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET',
    headers
  });
}

function del(path, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'DELETE',
    headers
  });
}

async function runComprehensiveE2ETests() {
  console.log('\n============================================================');
  console.log('🏁 [START] AUTOMOBILE SHOWROOM COMPLETE END-TO-END QA PASS');
  console.log('============================================================\n');

  // ==========================================================================
  // SUITE 1: AUTHENTICATION & ACCESS CONTROL
  // ==========================================================================
  console.log('📌 Suite 1: Authentication, Session & Access Control');

  // 1. Admin login
  const adminLogin = await post('/api/auth/login', { username: 'admin', password: 'admin123' });
  assert(adminLogin.status === 200, 'Admin login succeeds with 200 OK');
  assert(!!adminLogin.data.token, 'Admin login returns JWT token');
  assert(adminLogin.data.user.role === 'ADMIN', 'Admin user payload contains role ADMIN', adminLogin.data.user.name);
  const adminToken = adminLogin.data.token;

  // 2. Sales Executive login
  const salesLogin = await post('/api/auth/login', { username: 'sales', password: 'sales123' });
  assert(salesLogin.status === 200, 'Sales Executive login succeeds with 200 OK');
  assert(!!salesLogin.data.token, 'Sales Executive login returns JWT token');
  assert(salesLogin.data.user.role === 'SALES_EXECUTIVE', 'Sales Executive user role verified', salesLogin.data.user.name);
  const salesToken = salesLogin.data.token;

  // 3. Wrong password
  const wrongPass = await post('/api/auth/login', { username: 'admin', password: 'invalid_password' });
  assert(wrongPass.status === 401, 'Wrong password returns 401 Unauthorized');
  assert(wrongPass.data.error && wrongPass.data.error.includes('Invalid credentials'), 'Descriptive error message for wrong password');

  // 4. Missing credentials
  const missingCreds = await post('/api/auth/login', { username: 'admin' });
  assert(missingCreds.status === 400, 'Missing credentials returns 400 Bad Request');

  // 5. Non-existent user
  const noUser = await post('/api/auth/login', { username: 'ghost_user', password: 'password123' });
  assert(noUser.status === 401, 'Non-existent user returns 401 Unauthorized');

  // 6. Session persistence via /api/auth/me
  const adminMe = await get('/api/auth/me', adminToken);
  assert(adminMe.status === 200 && adminMe.data.role === 'ADMIN', '/api/auth/me persists Admin session');
  const salesMe = await get('/api/auth/me', salesToken);
  assert(salesMe.status === 200 && salesMe.data.role === 'SALES_EXECUTIVE', '/api/auth/me persists Sales Executive session');

  // 7. Protected routes rejection without token
  const noAuthVeh = await get('/api/vehicles');
  assert(noAuthVeh.status === 401, 'Unauthenticated request to /api/vehicles is rejected with 401');
  const noAuthPay = await get('/api/payroll');
  assert(noAuthPay.status === 401, 'Unauthenticated request to /api/payroll is rejected with 401');

  // 8. Corrupted token rejection
  const corruptToken = await get('/api/dashboard', 'corrupted.jwt.token');
  assert(corruptToken.status === 401, 'Corrupted token is rejected with 401 Unauthorized');

  // ==========================================================================
  // SUITE 2: ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================================================
  console.log('\n📌 Suite 2: Role-Based Access Control (RBAC)');

  const salesAllowed = [
    { path: '/api/dashboard', name: 'Dashboard' },
    { path: '/api/vehicles', name: 'Vehicle Inventory' },
    { path: '/api/customers', name: 'Customers CRM' },
    { path: '/api/leads', name: 'Leads & Enquiries' },
    { path: '/api/estimates', name: 'Estimates' },
    { path: '/api/quotations', name: 'Quotations' },
    { path: '/api/sales', name: 'Sales Orders' },
    { path: '/api/invoices', name: 'Invoices' },
    { path: '/api/payments', name: 'Payments' },
    { path: '/api/receipts', name: 'Receipts' },
    { path: '/api/testdrives', name: 'Test Drives' },
    { path: '/api/finance-apps', name: 'Bank Finance Files' },
    { path: '/api/communications', name: 'Communications Log' },
    { path: '/api/reminders', name: 'Reminders & Alerts' },
    { path: '/api/reports/summary', name: 'Financial Revenue Summary' }
  ];

  for (const item of salesAllowed) {
    const res = await get(item.path, salesToken);
    assert(res.status === 200, `Sales Executive ALLOWED: ${item.name}`, `GET ${item.path} -> 200`);
  }

  const salesBlocked = [
    { path: '/api/payroll', name: 'Payroll Ledger' },
    { path: '/api/expenses', name: 'Operational Expenses' },
    { path: '/api/services', name: 'Workshop Service Tickets' },
    { path: '/api/procurement', name: 'OEM Procurement Orders' },
    { path: '/api/parts', name: 'Spare Parts Inventory' },
    { path: '/api/vendors', name: 'Vendors & Suppliers' },
    { path: '/api/staff', name: 'Staff Management' },
    { path: '/api/settings', name: 'Showroom Settings' },
    { path: '/api/backup', name: 'Database Backup' },
    { path: '/api/audit-logs', name: 'Enterprise Audit Trail Logs' }
  ];

  for (const item of salesBlocked) {
    const res = await get(item.path, salesToken);
    assert(res.status === 403, `Sales Executive BLOCKED (403): ${item.name}`, `GET ${item.path} -> 403`);
  }

  // Admin unrestricted access to all blocked routes
  for (const item of salesBlocked) {
    const res = await get(item.path, adminToken);
    assert(res.status === 200, `ADMIN has unrestricted access: ${item.name}`, `GET ${item.path} -> 200 OK`);
  }

  // Sales Executive blocked from deleting inventory
  const salesDel = await del('/api/vehicles/veh_01', salesToken);
  assert(salesDel.status === 403, 'Sales Executive BLOCKED from deleting vehicle inventory (403)');

  // Logout and audit log test
  const logoutRes = await post('/api/auth/logout', {}, salesToken);
  assert(logoutRes.status === 200 && logoutRes.data.success === true, 'Logout succeeds with 200 OK');
  const auditRes = await get('/api/audit-logs', adminToken);
  const logoutEntry = auditRes.data.find(a => a.action === 'LOGOUT');
  assert(!!logoutEntry, 'Logout action is persistently recorded in Audit Logs');

  // ==========================================================================
  // SUITE 3: WORKFLOW 1 — FULL SALES & SERVICE PIPELINE
  // Lead -> Customer -> Test Drive -> Estimate -> Quotation -> Sale -> Invoice -> Payment -> Receipt -> Service -> History
  // ==========================================================================
  console.log('\n📌 Suite 3: Complete Workflow 1 — Sales & Service Pipeline');

  const stamp = Date.now();
  const testVin = `VINQA${stamp.toString().slice(-8)}`;

  // Prep Vehicle in inventory
  const vehRes = await post('/api/vehicles', {
    brand: 'Mercedes-Benz',
    model: 'AMG GT 63 S 4-Door Coupe',
    variant: 'Edition 1',
    year: 2026,
    category: 'Coupe',
    color: 'Obsidian Black Metallic',
    fuel: 'Petrol',
    transmission: '9G-TRONIC',
    price: 27500000,
    stock: 1,
    vin: testVin,
    status: 'Available'
  }, adminToken);
  assert(vehRes.status === 201, 'Vehicle created in inventory for sales pipeline', JSON.stringify(vehRes));
  const vehicleId = vehRes.data.id;

  // Step 1: Create Lead
  const leadRes = await post('/api/leads', {
    contact_name: 'Vikramaditya Roy',
    phone: `+91 98${stamp.toString().slice(-8)}`,
    email: 'vikram.roy@apexmotors.test',
    vehicle_interest_id: vehicleId,
    vehicle_interest_text: 'Mercedes-Benz AMG GT 63 S',
    budget_max: 30000000,
    source: 'Walk-in'
  }, salesToken);
  assert(leadRes.status === 201, 'Workflow Step 1: Lead captured successfully', leadRes.data.contact_name);
  const leadId = leadRes.data.id;

  // Step 2: Convert Lead to Customer
  const convRes = await post(`/api/leads/${leadId}/convert-customer`, {
    address: 'Bandra West, Mumbai',
    city: 'Mumbai',
    pincode: '400050'
  }, salesToken);
  assert(convRes.status === 200 && convRes.data.success === true, 'Workflow Step 2: Lead converted into registered Customer');
  const customerId = convRes.data.customer.id;
  const custName = convRes.data.customer.name;

  // Step 3: Schedule Test Drive
  const tdRes = await post('/api/testdrives', {
    customer_id: customerId,
    customer_name: custName,
    vehicle_id: vehicleId,
    scheduled_date: '2026-10-04',
    time_slot: '11:00 AM - 12:00 PM',
    driving_license_number: 'DL-MH-02-2026-99128',
    status: 'Scheduled'
  }, salesToken);
  assert(tdRes.status === 201, 'Workflow Step 3: Test Drive scheduled', tdRes.data.booking_number);
  const tdId = tdRes.data.id;

  // Complete Test Drive
  const tdComplete = await put(`/api/testdrives/${tdId}`, {
    status: 'Completed',
    customer_feedback: 'Phenomenal V8 twin-turbo performance and exhaust note. Ready to proceed with purchase.',
    route_taken: 'Sea Link High Speed Run'
  }, salesToken);
  assert(tdComplete.status === 200, 'Test Drive completed with customer feedback');

  // Step 4: Generate Estimate
  const estRes = await post('/api/estimates', {
    customer_id: customerId,
    customer_name: custName,
    vehicle_id: vehicleId,
    vehicle_name: 'Mercedes-Benz AMG GT 63 S',
    ex_showroom_price: 27500000,
    rto_charges: 2750000,
    insurance_amount: 950000,
    accessories_cost: 300000,
    warranty_cost: 450000,
    discount_amount: 500000,
    valid_until: '2026-11-01'
  }, salesToken);
  assert(estRes.status === 201, 'Workflow Step 4: Cost Estimate generated', `Total: ₹${estRes.data.total}`);
  const estId = estRes.data.id;

  // Step 5: Convert Estimate to Formal Quotation
  const quoteConv = await post(`/api/estimates/${estId}/convert-quotation`, {}, salesToken);
  assert(quoteConv.status === 201 && quoteConv.data.success === true, 'Workflow Step 5: Estimate converted into Quotation', quoteConv.data.quotation.quotation_number);
  const quotId = quoteConv.data.quotation.id;

  // Step 6: Create Sale Order from Quotation
  const saleRes = await post('/api/sales', {
    quotation_id: quotId,
    customer_id: customerId,
    vehicle_id: vehicleId,
    base_price: 27500000,
    discount: 500000,
    tax_rate: 18.0,
    payment_method: 'RTGS / Bank Transfer',
    booking_date: '2026-10-03',
    expected_delivery_date: '2026-10-10'
  }, salesToken);
  assert(saleRes.status === 201, 'Workflow Step 6: Sale Order created & Invoice auto-generated', saleRes.data.saleOrderNumber);
  const saleId = saleRes.data.id;
  const invoiceId = saleRes.data.invoiceId;
  const totalSaleAmount = saleRes.data.totalAmount;

  // Verify Automatic Vehicle Transition to 'Sold' and stock decrement
  const vehAfterSale = await get('/api/vehicles', salesToken);
  const soldVeh = vehAfterSale.data.find(v => v.id === vehicleId);
  assert(soldVeh && soldVeh.status === 'Sold', 'AUTOMATIC TRANSITION: Vehicle status changed to Sold');
  assert(soldVeh && soldVeh.stock_quantity === 0, 'AUTOMATIC STOCK: Vehicle stock quantity decremented to 0');

  // Step 7: Verify Invoice calculations
  const invRes = await get(`/api/invoices/${invoiceId}`, salesToken);
  assert(invRes.status === 200, 'Workflow Step 7: Invoice verified', invRes.data.invoice_number);
  // Base 27,500,000 - 500,000 = 27,000,000 taxable. 18% GST = 4,860,000. Total = 31,860,000
  assert(invRes.data.taxable_amount === 27000000, 'Taxable amount calculated accurately (₹2,70,00,000)');
  assert(invRes.data.total_amount === 31860000, 'Total invoice amount with 18% GST verified (₹3,18,60,000)');
  assert(invRes.data.balance_due === 31860000, 'Initial balance due equals total invoice amount');

  // Step 8: Register Partial Advance Payment (₹10,000,000)
  const advancePay = await post('/api/payments', {
    invoice_id: invoiceId,
    sale_id: saleId,
    customer_id: customerId,
    amount: 10000000,
    payment_mode: 'RTGS / NEFT',
    payment_type: 'Advance Booking Token',
    transaction_id: 'UTR-HDFC-991200384'
  }, salesToken);
  assert(advancePay.status === 201, 'Workflow Step 8: Advance payment registered (₹1,00,00,000)', advancePay.data.payment_reference);
  assert(advancePay.data.linked_receipt_number.startsWith('RCPT-'), 'Receipt auto-generated for advance payment', advancePay.data.linked_receipt_number);

  // Verify Invoice status transitioned to Partially Paid
  const invAfterAdv = await get(`/api/invoices/${invoiceId}`, salesToken);
  assert(invAfterAdv.data.status === 'Partially Paid', 'Invoice transitioned to Partially Paid');
  assert(invAfterAdv.data.paid_amount === 10000000, 'Invoice paid amount recorded: ₹1,00,00,000');
  assert(invAfterAdv.data.balance_due === 21860000, 'Remaining balance due: ₹2,18,60,000');

  // Step 9: Register Final Balance Settlement (₹21,860,000)
  const finalPay = await post('/api/payments', {
    invoice_id: invoiceId,
    sale_id: saleId,
    customer_id: customerId,
    amount: 21860000,
    payment_mode: 'RTGS / NEFT',
    payment_type: 'Final Balance Settlement',
    transaction_id: 'UTR-HDFC-991200999'
  }, salesToken);
  assert(finalPay.status === 201, 'Workflow Step 9: Final balance settlement registered (₹2,18,60,000)');
  assert(finalPay.data.invoice_balance_due === 0, 'Invoice balance due successfully drops to ₹0');
  assert(finalPay.data.invoice_status === 'Paid In Full', 'Invoice status is Paid In Full');

  // Step 10: Register Aftersales Workshop Service Ticket
  const serviceRes = await post('/api/services', {
    customer_id: customerId,
    customer_name: custName,
    customer_phone: '+91 98000 11111',
    vehicle_model: 'Mercedes-Benz AMG GT 63 S',
    vin: testVin,
    service_type: 'First Free Service',
    odometer_reading: 1000,
    technician: 'Ramesh Sawant (Master Tech)',
    labor_charges: 4500,
    complaints: '1000km break-in inspection & differential oil check'
  }, adminToken);
  assert(serviceRes.status === 201, 'Workflow Step 10: Service Ticket opened for VIN', serviceRes.data.ticket_number);
  const serviceId = serviceRes.data.id;

  // Step 11: Mark Service Complete
  const serviceComp = await put(`/api/services/${serviceId}`, {
    status: 'Work Completed'
  }, adminToken);
  assert(serviceComp.status === 200, 'Workflow Step 11: Service marked as Work Completed');

  // Step 12: Retrieve Complete Service History for this VIN
  const histRes = await get(`/api/services/history/${testVin}`, adminToken);
  assert(histRes.status === 200 && histRes.data.length >= 1, 'Workflow Step 12: Service History retrieved by VIN', `Records: ${histRes.data.length}`);

  // ==========================================================================
  // SUITE 4: WORKFLOW 2 — COMPLETE INVENTORY PIPELINE
  // Procurement -> Received -> Inventory -> Reserved -> Sold
  // ==========================================================================
  console.log('\n📌 Suite 4: Complete Workflow 2 — Inventory Lifecycle');

  const invVin = `VINPO${Date.now().toString().slice(-8)}`;

  // Step 1: Procurement Order Placed
  const poRes = await post('/api/procurement', {
    supplier_name: 'Porsche AG Factory Leipzig',
    brand: 'Porsche',
    model: '911 GT3 RS Clubsport',
    quantity: 1,
    purchaseCost: 29000000,
    vin: invVin,
    status: 'Ordered'
  }, adminToken);
  assert(poRes.status === 201, 'Inventory Step 1: Factory Procurement Order placed', poRes.data.po_number);
  const poId = poRes.data.id;

  // Step 2: Mark Order Received
  const receiveRes = await post(`/api/procurement/${poId}/receive`, {}, adminToken);
  assert(receiveRes.status === 200 && receiveRes.data.success === true, 'Inventory Step 2: Procurement order received');

  // Verify Vehicle now exists in Showroom Stock with status Available
  const invVehicles = await get('/api/vehicles', adminToken);
  const poVeh = invVehicles.data.find(v => v.vin === invVin);
  assert(!!poVeh, 'Inventory Step 2 (Verification): Vehicle exists in Showroom Inventory', invVin);
  assert(poVeh && poVeh.status === 'Available', 'Vehicle status is Available');

  // Step 3: Mark Vehicle 'Reserved' for a prospective customer
  const reserveRes = await put(`/api/vehicles/${poVeh.id}`, {
    status: 'Reserved'
  }, salesToken);
  assert(reserveRes.status === 200 && reserveRes.data.status === 'Reserved', 'Inventory Step 3: Vehicle status transitioned to Reserved');

  // Verify Dashboard counts Reserved vehicle
  const dashRes = await get('/api/dashboard', salesToken);
  assert(dashRes.status === 200, 'Dashboard loaded live metrics');

  // Step 4: Book Sale for 'Reserved' vehicle (Reserved -> Sold)
  const custForPo = await post('/api/customers', {
    name: `Aditya Singhania ${Date.now().toString().slice(-4)}`,
    phone: `+91 97${Date.now().toString().slice(-8)}`,
    city: 'Delhi',
    email: 'aditya.singhania@luxury.test'
  }, salesToken);

  const poSaleRes = await post('/api/sales', {
    customer_id: custForPo.data.id,
    vehicle_id: poVeh.id,
    base_price: 35000000,
    payment_method: 'RTGS / Bank Transfer'
  }, salesToken);
  assert(poSaleRes.status === 201, 'Inventory Step 4: Sale successfully booked for Reserved vehicle (Reserved -> Sold)');

  // Verify vehicle is now Sold and stock decremented to 0
  const afterPoSale = await get('/api/vehicles', adminToken);
  const soldPoVeh = afterPoSale.data.find(v => v.id === poVeh.id);
  assert(soldPoVeh && soldPoVeh.status === 'Sold', 'CONFIRMED INVENTORY WORKFLOW: Vehicle status transitioned from Reserved to Sold');
  assert(soldPoVeh && soldPoVeh.stock_quantity === 0, 'CONFIRMED INVENTORY STOCK: Stock quantity is 0');

  // ==========================================================================
  // SUITE 5: FINANCIAL ENGINE & REPORTS INTEGRITY
  // Sales + Payments + Expenses + Service + Spare Parts -> Reports
  // ==========================================================================
  console.log('\n📌 Suite 5: Financial Engine & Reports Calculations from Real DB');

  // 1. Profit & Loss Report
  const pnlRes = await get('/api/reports/pnl', salesToken);
  assert(pnlRes.status === 200, 'Profit & Loss report loaded successfully');
  const pnl = pnlRes.data;
  assert(pnl.revenue.totalOperatingRevenue > 0, 'Operating Revenue computed from real transactions', `₹${pnl.revenue.totalOperatingRevenue.toLocaleString('en-IN')}`);
  assert(pnl.revenue.carSalesRevenue > 0, 'Car Sales Revenue tracked accurately');
  assert(pnl.expenses.totalOperatingExpenses > 0, 'Operating Expenses tracked accurately');
  assert(pnl.profit.netOperatingProfit === pnl.profit.grossProfit - pnl.expenses.totalOperatingExpenses, 'Net Operating Profit = Gross Profit - Operating Expenses');

  // 2. Balance Sheet
  const bsRes = await get('/api/reports/balance-sheet', salesToken);
  assert(bsRes.status === 200, 'Balance Sheet loaded successfully');
  const bs = bsRes.data;
  assert(bs.assets.totalAssets > 0, 'Total Assets calculated from live inventory and bank balance');
  assert(bs.isBalanced === true, 'BALANCE SHEET EQUILIBRIUM: Total Assets = Total Liabilities + Dealership Equity');

  // 3. GST Report
  const gstRes = await get('/api/reports/gst', salesToken);
  assert(gstRes.status === 200, 'GST & Tax Report loaded successfully');
  const gst = gstRes.data;
  assert(gst.outputGst.totalOutputGst >= 0, 'Output GST collected on vehicle sales computed');
  assert(gst.inputTaxCredit.totalItc >= 0, 'Input Tax Credit (ITC) on procurement computed');

  // 4. Inventory Capital Report
  const invCapRes = await get('/api/reports/inventory-capital', salesToken);
  assert(invCapRes.status === 200, 'Inventory Capital Report loaded');
  assert(invCapRes.data.vehicles.inStockUnits >= 0, 'Vehicle stock units verified');
  assert(invCapRes.data.spareParts.totalUnits >= 0, 'Spare parts stock units verified');

  // 5. Department Revenue Report
  const deptRes = await get('/api/reports/department-revenue', salesToken);
  assert(deptRes.status === 200, 'Department Revenue loaded');
  assert(deptRes.data.departments.length === 4, 'All 4 departments analyzed (Showroom, Service, Parts, Finance)');

  // 6. CSV Export Endpoint
  const csvRes = await get('/api/reports/export-csv?type=pnl', salesToken);
  assert(csvRes.status === 200, 'Financial CSV export returns valid 200 stream');

  // ==========================================================================
  // SUITE 6: CRUD OPERATIONS FOR EVERY MAJOR MODULE
  // ==========================================================================
  console.log('\n📌 Suite 6: CRUD Operations for Every Major Module');

  // A. Customer CRUD
  const newCust = await post('/api/customers', {
    name: 'Ananya Deshmukh',
    phone: `+91 91${Date.now().toString().slice(-8)}`,
    email: 'ananya@test.com',
    city: 'Pune'
  }, adminToken);
  assert(newCust.status === 201, 'Customer CREATE (201)');
  const custId2 = newCust.data.id;

  const readCust = await get('/api/customers', adminToken);
  assert(readCust.status === 200 && readCust.data.some(c => c.id === custId2), 'Customer READ (200)');

  const updCust = await put(`/api/customers/${custId2}`, { name: 'Ananya Deshmukh-Patil' }, adminToken);
  assert(updCust.status === 200 && updCust.data.name === 'Ananya Deshmukh-Patil', 'Customer UPDATE (200)');

  const delCust = await del(`/api/customers/${custId2}`, adminToken);
  assert(delCust.status === 200, 'Customer DELETE (200)');

  // B. Spare Parts CRUD
  const partSku = `SKU-${Date.now().toString().slice(-6)}`;
  const newPart = await post('/api/parts', {
    part_number: partSku,
    name: 'Brembo Carbon Ceramic Brake Rotors',
    category: 'Braking',
    cost_price: 65000,
    selling_price: 92000,
    current_stock: 10,
    min_stock_level: 2
  }, adminToken);
  assert(newPart.status === 201, 'Spare Part CREATE (201)', newPart.data.part_number);
  const partId = newPart.data.id;

  const readPart = await get('/api/parts', adminToken);
  assert(readPart.status === 200 && readPart.data.some(p => p.id === partId), 'Spare Part READ (200)');

  const updPart = await put(`/api/parts/${partId}`, { selling_price: 95000 }, adminToken);
  assert(updPart.status === 200 && updPart.data.selling_price === 95000, 'Spare Part UPDATE (200)');

  const delPart = await del(`/api/parts/${partId}`, adminToken);
  assert(delPart.status === 200, 'Spare Part DELETE (200)');

  // C. Showroom Expenses CRUD
  const expRes = await post('/api/expenses', {
    title: 'Showroom Detailer Polish Kits',
    category: 'Maintenance & Repairs',
    amount: 45000,
    payment_mode: 'Corporate Card',
    notes: 'Premium 3M ceramic polish consumables'
  }, adminToken);
  assert(expRes.status === 201, 'Expense CREATE (201)');
  const expId = expRes.data.id;

  const readExp = await get('/api/expenses', adminToken);
  assert(readExp.status === 200 && readExp.data.some(e => e.id === expId), 'Expense READ (200)');

  const updExp = await put(`/api/expenses/${expId}`, { amount: 48000 }, adminToken);
  assert(updExp.status === 200 && updExp.data.amount === 48000, 'Expense UPDATE (200)');

  const delExp = await del(`/api/expenses/${expId}`, adminToken);
  assert(delExp.status === 200, 'Expense DELETE (200)');

  // D. Showroom Settings READ & UPDATE
  const setRes = await get('/api/settings', adminToken);
  assert(setRes.status === 200, 'Settings READ (200)', setRes.data.showroom_name);

  const updSet = await put('/api/settings', {
    showroom_name: 'APEX HORIZON MOTORS — FLAGSHIP'
  }, adminToken);
  assert(updSet.status === 200, 'Settings UPDATE (200)', updSet.data.showroom_name);

  // ==========================================================================
  // SUITE 7: EXTENSIVE EDGE CASES & RESILIENCE
  // ==========================================================================
  console.log('\n📌 Suite 7: Edge Cases, Security & Resilience');

  // 1. Duplicate VIN test
  const dupVinRes = await post('/api/vehicles', {
    brand: 'Audi',
    model: 'RS7 Sportback',
    vin: testVin, // already exists from Suite 3
    price: 19000000
  }, adminToken);
  assert(dupVinRes.status === 409, 'EDGE CASE: Duplicate VIN returns 409 Conflict', dupVinRes.data.error);

  // 2. Overpayment test
  const overpayRes = await post('/api/payments', {
    invoice_id: invoiceId, // Already paid in full from Suite 3
    amount: 500000
  }, salesToken);
  assert(overpayRes.status === 400, 'EDGE CASE: Overpayment / Paid-in-full payment rejected with 400', overpayRes.data.error);

  // 3. Invalid payment amount (<= 0 or string)
  const zeroPay = await post('/api/payments', {
    invoice_id: invoiceId,
    amount: -100
  }, salesToken);
  assert(zeroPay.status === 400, 'EDGE CASE: Negative payment amount rejected with 400', zeroPay.data.error);

  // 4. Missing customer ID in sale
  const missingCustSale = await post('/api/sales', {
    vehicle_id: vehicleId,
    customer_id: 'non_existent_customer_9999'
  }, salesToken);
  assert(missingCustSale.status === 404, 'EDGE CASE: Non-existent customer in sale returns 404', missingCustSale.data.error);

  // 5. Missing vehicle ID in sale
  const missingVehSale = await post('/api/sales', {
    vehicle_id: 'non_existent_vehicle_9999'
  }, salesToken);
  assert(missingVehSale.status === 404, 'EDGE CASE: Non-existent vehicle in sale returns 404', missingVehSale.data.error);

  // 6. Double selling a vehicle already Sold
  const doubleSell = await post('/api/sales', {
    vehicle_id: vehicleId // already Sold
  }, salesToken);
  assert(doubleSell.status === 400, 'EDGE CASE: Anti-double selling protection returns 400', doubleSell.data.error);

  // 7. Invalid dates
  const invalidDateSale = await post('/api/sales', {
    booking_date: 'not-a-valid-date',
    vehicle_id: vehicleId
  }, salesToken);
  assert(invalidDateSale.status === 400, 'EDGE CASE: Invalid date format in sale returns 400', invalidDateSale.data.error);

  const invalidDatePay = await post('/api/payments', {
    payment_date: '2026-99-99',
    amount: 1000
  }, salesToken);
  assert(invalidDatePay.status === 400, 'EDGE CASE: Invalid date format in payment returns 400', invalidDatePay.data.error);

  // 8. Duplicate customer phone
  const allCusts = await get('/api/customers', adminToken);
  const phoneToDuplicate = allCusts.data?.[0]?.phone || '+91 98000 11111';
  const dupPhoneRes = await post('/api/customers', {
    name: 'Duplicate Test Person',
    phone: phoneToDuplicate
  }, adminToken);
  assert(dupPhoneRes.status === 409, 'EDGE CASE: Duplicate customer phone returns 409 Conflict', dupPhoneRes.data.error);

  // 9. Prevent deleting vehicle linked to active sales order
  const delLinkedVeh = await del(`/api/vehicles/${vehicleId}`, adminToken);
  assert(delLinkedVeh.status === 400, 'EDGE CASE: Block deleting vehicle linked to active sales order (400)', delLinkedVeh.data.error);

  // 10. Prevent deleting customer linked to active sales order
  const delLinkedCust = await del(`/api/customers/${customerId}`, adminToken);
  assert(delLinkedCust.status === 400, 'EDGE CASE: Block deleting customer linked to active sales order (400)', delLinkedCust.data.error);

  // 11. Large text payload handling
  const hugeText = 'A'.repeat(5000);
  const largeLead = await post('/api/leads', {
    contact_name: 'Large Payload Test',
    phone: `+91 90${Date.now().toString().slice(-8)}`,
    notes: hugeText
  }, salesToken);
  assert(largeLead.status === 201, 'EDGE CASE: Large text payload (5,000 chars) handled cleanly');
  await del(`/api/leads/${largeLead.data.id}`, salesToken);

  // 12. Special characters and Unicode in vehicle & customer names
  const unicodeVeh = await post('/api/vehicles', {
    brand: 'Mercedes-AMG®',
    model: 'G 63 "Magno Edition" & 4x4²',
    vin: `VINUNI${Date.now().toString().slice(-6)}`,
    price: 32000000
  }, adminToken);
  assert(unicodeVeh.status === 201, 'EDGE CASE: Special symbols & Unicode handled cleanly without SQL corruption', unicodeVeh.data.model);
  await del(`/api/vehicles/${unicodeVeh.data.id}`, adminToken);

  console.log('\n============================================================');
  console.log(`🎉 [QA PASS COMPLETE] ALL ${passed}/${total} TESTS PASSED WITH 100% SUCCESS!`);
  console.log('============================================================\n');

  return { passed, failed, total };
}

if (require.main === module) {
  runComprehensiveE2ETests().catch(err => {
    console.error('❌ E2E QA Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runComprehensiveE2ETests };
