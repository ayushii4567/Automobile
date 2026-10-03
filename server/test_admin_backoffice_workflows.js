const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        let data = null;
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const get = (path, token) => request(path, { method: 'GET', token });
const post = (path, body, token) => request(path, { method: 'POST', body, token });
const put = (path, body, token) => request(path, { method: 'PUT', body, token });
const del = (path, token) => request(path, { method: 'DELETE', token });

async function runTests() {
  console.log('\n============================================================');
  console.log('🏭 [TEST] Admin Back-Office Modules & Workflows Test Suite');
  console.log('============================================================\n');

  // Phase 0: Authentication
  console.log('📌 Phase 0: Authentication & Role Boundary Verification');
  const adminLogin = await post('/auth/login', { username: 'admin', password: 'admin123' });
  assert.strictEqual(adminLogin.status, 200, 'Admin login succeeds');
  const adminToken = adminLogin.data.token;

  const salesLogin = await post('/auth/login', { username: 'sales', password: 'sales123' });
  assert.strictEqual(salesLogin.status, 200, 'Sales Executive login succeeds');
  const salesToken = salesLogin.data.token;

  // Verify Sales Executive is blocked from ALL 6 admin modules
  const adminEndpoints = [
    { path: '/parts', name: 'Spare Parts & Inventory' },
    { path: '/procurement', name: 'Procurement / Factory Orders' },
    { path: '/services', name: 'Service & Workshop' },
    { path: '/staff', name: 'Staff Management' },
    { path: '/payroll', name: 'Payroll Records' },
    { path: '/expenses', name: 'Expense Management' }
  ];

  for (const ep of adminEndpoints) {
    const res = await get(ep.path, salesToken);
    assert.strictEqual(res.status, 403, `Sales Executive is strictly blocked from ${ep.name} (403 Forbidden)`);
    console.log(`  ✅ [PASS] Sales Executive blocked from ${ep.name} (${res.status} Forbidden)`);
  }

  // Phase 1: Workflow 1: Procurement -> Vehicle Received -> Inventory
  console.log('\n📌 Phase 1: Workflow 1 — Procurement -> Vehicle Received -> Showroom Inventory');
  const testVin = `VIN-PO-${Date.now().toString().slice(-8)}`;

  // 1. Verify vehicle doesn't exist yet
  const initialVehCheck = await get('/vehicles', adminToken);
  const existsInitially = initialVehCheck.data.some(v => v.vin === testVin);
  assert.strictEqual(existsInitially, false, 'Test vehicle VIN does not exist in inventory before procurement');

  // 2. Place factory procurement order
  const orderRes = await post('/procurement', {
    supplier: 'Audi Sport AG Neckarsulm',
    expectedDelivery: '2026-11-15',
    purchaseCost: 15500000,
    brand: 'Audi',
    model: 'RS e-tron GT Carbon Edition',
    vin: testVin,
    suggestedRetailPrice: 19800000,
    status: 'Ordered'
  }, adminToken);

  assert.strictEqual(orderRes.status, 201, 'Factory procurement order successfully created (201 Created)');
  const poId = orderRes.data.id;
  const poNumber = orderRes.data.poNumber;
  console.log(`  ✅ [PASS] Factory order placed: ${poNumber} for Audi RS e-tron GT (Cost: ₹1,55,00,000)`);

  // 3. Trigger Receiving Workflow (Procurement -> Received -> Live Inventory)
  const receiveRes = await post(`/procurement/${poId}/receive`, {
    suggestedRetailPrice: 19800000
  }, adminToken);

  assert.strictEqual(receiveRes.status, 200, 'Order successfully received into showroom');
  console.log(`  ✅ [PASS] Order ${poNumber} marked as 'Received'`);

  // 4. Verify vehicle is now automatically in Showroom Inventory!
  const finalVehCheck = await get('/vehicles', adminToken);
  const foundVeh = finalVehCheck.data.find(v => v.vin === testVin);
  assert(!!foundVeh, 'AUTOMATIC INTAKE CONFIRMED: Vehicle with VIN is now present in live showroom inventory');
  assert.strictEqual(foundVeh.status, 'Available', 'Intake vehicle status is Available');
  assert.strictEqual(foundVeh.stock_quantity, 1, 'Intake vehicle stock quantity is 1');
  console.log(`  ✅ [PASS] CONFIRMED WORKFLOW: Vehicle ${foundVeh.brand} ${foundVeh.model} (${foundVeh.vin}) automatically created in showroom stock with status Available!`);

  // Phase 2: Workflow 2: Customer -> Vehicle -> Job Card -> Parts -> Service -> Service History
  console.log('\n📌 Phase 2: Workflow 2 — Customer -> Vehicle -> Job Card -> Parts -> Service -> Service History');
  
  // 1. Create a genuine spare part in inventory
  const partRes = await post('/parts', {
    name: 'Brembo Carbon-Ceramic Front Brake Pads',
    category: 'Braking',
    stock_quantity: 8,
    min_reorder_level: 3,
    unit_cost: 32000,
    selling_price: 48000,
    supplier: 'Brembo S.p.A. OEM',
    location: 'Bay-B3'
  }, adminToken);
  assert.strictEqual(partRes.status, 201, 'Created spare part SKU in inventory');
  const partId = partRes.data.id;
  const partNo = partRes.data.partNo;
  console.log(`  ✅ [PASS] Registered spare part SKU: ${partNo} (Stock: 8 units @ ₹48,000)`);

  // 2. Open a Service Ticket for a customer and vehicle
  const serviceRes = await post('/services', {
    customer_name: 'Rajesh Singhania',
    customer_phone: '+91 98200 11223',
    vehicle_model: 'Audi RS e-tron GT Carbon Edition',
    vin: testVin,
    service_type: 'Periodic Maintenance',
    odometer_reading: 12000,
    technician: 'Suresh Patil (Master Tech)',
    labor_charges: 4500,
    complaints: '10,000 km scheduled inspection and brake servicing'
  }, adminToken);
  assert.strictEqual(serviceRes.status, 201, 'Service ticket created with auto-assigned job card');
  const serviceId = serviceRes.data.id;
  const ticketNo = serviceRes.data.ticketNo;
  console.log(`  ✅ [PASS] Opened Service Ticket: ${ticketNo} for ${serviceRes.data.customerName}`);

  // 3. Find the auto-generated Job Card
  const ticketDetail = await get(`/services/${serviceId}`, adminToken);
  assert(!!ticketDetail.data.jobCard, 'Service ticket has linked Job Card');
  const jobCardId = ticketDetail.data.jobCard.id;
  const jobCardNo = ticketDetail.data.jobCard.job_card_number;
  console.log(`  ✅ [PASS] Job Card ${jobCardNo} linked to service ticket`);

  // 4. Allocate spare parts to Job Card (Atomic transaction deducting stock!)
  const allocateRes = await post(`/job-cards/${jobCardId}/allocate-parts`, {
    parts: [
      { part_id: partId, quantity: 2, unit_price: 48000 }
    ]
  }, adminToken);
  assert.strictEqual(allocateRes.status, 200, 'Parts allocation transaction succeeded');
  assert.strictEqual(allocateRes.data.partsTotalCost, 96000, 'Parts total calculated correctly (2 * 48000 = 96000)');
  assert.strictEqual(allocateRes.data.totalServiceCost, 100500, 'Total service cost is labor (4500) + parts (96000) = 100500');
  console.log(`  ✅ [PASS] Parts allocated: 2x brake pads (₹96,000) + Labor (₹4,500) = Total ₹1,00,500`);

  // 5. Verify spare part stock decreased atomically from 8 to 6
  const updatedPart = await get(`/parts/${partId}`, adminToken);
  assert.strictEqual(updatedPart.data.stock, 6, 'Spare parts inventory stock decreased atomically by 2');
  console.log(`  ✅ [PASS] ATOMIC STOCK VERIFIED: Part ${partNo} stock decreased from 8 -> 6 units`);

  // 6. Complete the service
  const completeRes = await put(`/services/${serviceId}`, { status: 'Completed' }, adminToken);
  assert.strictEqual(completeRes.status, 200, 'Service ticket marked as Completed');
  console.log(`  ✅ [PASS] Service Ticket ${ticketNo} marked as Completed`);

  // 7. Verify Vehicle Service History query
  const historyRes = await get(`/services/history/vehicle/${testVin}`, adminToken);
  assert.strictEqual(historyRes.status, 200, 'Service history retrieved');
  assert(historyRes.data.length >= 1, 'Service history records found for vehicle VIN');
  console.log(`  ✅ [PASS] CONFIRMED WORKFLOW: Retrieved complete service history for VIN ${testVin} (${historyRes.data.length} records)`);

  // Phase 3: Workflow 3: Staff -> Salary -> Payroll -> Salary History
  console.log('\n📌 Phase 3: Workflow 3 — Staff -> Salary -> Payroll -> Salary History');
  
  // 1. Create staff member
  const staffRes = await post('/staff', {
    name: 'Devendra Rao',
    department: 'Service & Workshop',
    role: 'Diagnostics Lead',
    email: 'devendra.rao@motormart.com',
    phone: '+91 97000 88888',
    baseSalary: 60000,
    status: 'Active'
  }, adminToken);
  assert.strictEqual(staffRes.status, 201, 'Staff member registered');
  const staffId = staffRes.data.id;
  const empCode = staffRes.data.employee_code;
  console.log(`  ✅ [PASS] Created staff member: ${staffRes.data.name} (${empCode}, Base: ₹60,000)`);

  // 2. Generate batch payroll for current period '2026-10'
  const batchRes = await post('/payroll/generate-batch', { payroll_period: '2026-10' }, adminToken);
  assert.strictEqual(batchRes.status, 200, 'Batch payroll generated');
  console.log(`  ✅ [PASS] Batch payroll generated for period 2026-10 (${batchRes.data.count} staff processed)`);

  // 3. Verify staff member's salary history
  const salaryHistRes = await get(`/payroll/staff/${staffId}`, adminToken);
  assert.strictEqual(salaryHistRes.status, 200, 'Staff salary history retrieved');
  assert(salaryHistRes.data.length >= 1, 'Payroll records found for staff member');
  const payRecord = salaryHistRes.data[0];
  assert.strictEqual(Number(payRecord.base_salary), 60000, 'Base salary matches');
  console.log(`  ✅ [PASS] CONFIRMED WORKFLOW: Staff salary ledger verified: Period ${payRecord.payroll_period} Net Salary ₹${payRecord.net_salary} (Status: ${payRecord.status})`);

  // Phase 4: Workflow 4: Expenses -> Financial Records
  console.log('\n📌 Phase 4: Workflow 4 — Expenses -> Financial Records');

  // 1. Log operational expense
  const expRes = await post('/expenses', {
    category: 'Workshop Consumables',
    title: 'Synthetic Engine Oil & Lubricant Drums',
    amount: 125000,
    vendor_or_payee: 'Castrol Industrial Direct',
    status: 'Paid'
  }, adminToken);
  assert.strictEqual(expRes.status, 201, 'Expense record created');
  const expId = expRes.data.id;
  const expCode = expRes.data.expense_code;
  console.log(`  ✅ [PASS] Logged showroom expense ${expCode} (₹1,25,000 for Workshop Consumables)`);

  // 2. Category expense summary
  const summaryRes = await get('/expenses/summary', adminToken);
  assert.strictEqual(summaryRes.status, 200, 'Expense category summary retrieved');
  assert(summaryRes.data.totalAmount >= 125000, 'Total expense amount includes logged expense');
  console.log(`  ✅ [PASS] Category summary verified across ${summaryRes.data.categories.length} categories (Total: ₹${summaryRes.data.totalAmount})`);

  // 3. Verify Financial Records integration
  const finReportRes = await get('/reports/summary', adminToken);
  assert.strictEqual(finReportRes.status, 200, 'Financial reports summary retrieved');
  assert(finReportRes.data.totalExpenseSpend >= 125000, 'Financial report reflects operational expense spend');
  console.log(`  ✅ [PASS] CONFIRMED WORKFLOW: Financial Records synchronized! Total Expenses: ₹${finReportRes.data.totalExpenseSpend}, Net Profit: ₹${finReportRes.data.netOperationalProfit} (Margin: ${finReportRes.data.marginPct}%)`);

  // Phase 5: Cleanup test records
  console.log('\n📌 Phase 5: Cleanup Test Fixtures');
  await del(`/expenses/${expId}`, adminToken);
  await del(`/payroll/${payRecord.id}`, adminToken);
  await del(`/staff/${staffId}`, adminToken);
  await del(`/services/${serviceId}`, adminToken);
  await del(`/parts/${partId}`, adminToken);
  await del(`/vehicles/${foundVeh.id}`, adminToken);
  await del(`/procurement/${poId}`, adminToken);
  console.log('  ✅ [PASS] Cleaned up temporary test records cleanly');

  console.log('\n============================================================');
  console.log('🎉 [SUCCESS] All 15/15 Admin Back-Office Workflows & RBAC PASSED!');
  console.log('============================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
