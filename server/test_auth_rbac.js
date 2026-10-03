const http = require('http');

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

async function runAuthRBACTests() {
  console.log('============================================================');
  console.log('🛡️ [TEST] Apex Horizon Motors — Authentication & RBAC Test Suite');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, detail = '') {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  // 1. ADMIN LOGIN TEST
  console.log('📌 Test Suite 1: Authentication & Credentials Validation');
  const adminRes = await post('/api/auth/login', { username: 'admin', password: 'admin123' });
  assert(adminRes.status === 200, 'Admin login succeeds with 200 OK');
  assert(!!adminRes.data.token, 'Admin login returns JWT token');
  assert(adminRes.data.user.role === 'ADMIN', 'Admin user payload contains role ADMIN', adminRes.data.user.name);
  const adminToken = adminRes.data.token;

  // 2. SALES EXECUTIVE LOGIN TEST
  const salesRes = await post('/api/auth/login', { username: 'sales', password: 'sales123' });
  assert(salesRes.status === 200, 'Sales Executive login succeeds with 200 OK');
  assert(!!salesRes.data.token, 'Sales Executive login returns JWT token');
  assert(salesRes.data.user.role === 'SALES_EXECUTIVE', 'Sales Executive user payload contains role SALES_EXECUTIVE', salesRes.data.user.name);
  const salesToken = salesRes.data.token;

  // 3. WRONG PASSWORD REJECTION TEST
  const wrongPassRes = await post('/api/auth/login', { username: 'admin', password: 'bad_password_999' });
  assert(wrongPassRes.status === 401, 'Wrong password returns 401 Unauthorized');
  assert(wrongPassRes.data.error.includes('Incorrect password'), 'Returns descriptive error message for incorrect password');

  // 4. NON-EXISTENT USER REJECTION TEST
  const nonExistRes = await post('/api/auth/login', { username: 'ghost_advisor_xyz', password: 'any_password' });
  assert(nonExistRes.status === 401, 'Non-existent user returns 401 Unauthorized');
  assert(nonExistRes.data.error.includes('User not found'), 'Returns user not found error');

  // 5. SESSION PERSISTENCE (TOKEN VERIFICATION VIA /api/auth/me)
  console.log('\n📌 Test Suite 2: Session Persistence & Token Verification');
  const meAdmin = await get('/api/auth/me', adminToken);
  assert(meAdmin.status === 200, '/api/auth/me succeeds with valid Admin token');
  assert(meAdmin.data.username === 'admin' && meAdmin.data.role === 'ADMIN', 'Session persists Admin user identity and role');

  const meSales = await get('/api/auth/me', salesToken);
  assert(meSales.status === 200, '/api/auth/me succeeds with valid Sales token');
  assert(meSales.data.username === 'sales' && meSales.data.role === 'SALES_EXECUTIVE', 'Session persists Sales user identity and role');

  // 6. PROTECTED ROUTES WITHOUT AUTHENTICATION (MUST REJECT 401)
  console.log('\n📌 Test Suite 3: Protected Routes Unauthenticated Rejection (401)');
  const unauthDash = await get('/api/dashboard');
  assert(unauthDash.status === 401, 'Accessing /api/dashboard without token is rejected with 401');

  const unauthVeh = await get('/api/vehicles');
  assert(unauthVeh.status === 401, 'Accessing /api/vehicles without token is rejected with 401');

  const unauthPayroll = await get('/api/payroll');
  assert(unauthPayroll.status === 401, 'Accessing /api/payroll without token is rejected with 401');

  const badTokenRes = await get('/api/dashboard', 'fake_invalid_token_12345');
  assert(badTokenRes.status === 401, 'Accessing with corrupted token is rejected with 401');

  // 7. ROLE RESTRICTIONS: SALES EXECUTIVE ALLOWED ROUTES
  console.log('\n📌 Test Suite 4: SALES_EXECUTIVE Permitted Modules (200 OK)');
  const salesAllowedRoutes = [
    { path: '/api/dashboard', name: 'Dashboard' },
    { path: '/api/vehicles', name: 'Inventory / Vehicles' },
    { path: '/api/customers', name: 'Customers CRM' },
    { path: '/api/leads', name: 'Leads & Enquiries' },
    { path: '/api/estimates', name: 'Estimates' },
    { path: '/api/quotations', name: 'Quotations' },
    { path: '/api/sales', name: 'Sales Orders' },
    { path: '/api/invoices', name: 'Invoices' },
    { path: '/api/payments', name: 'Payments' },
    { path: '/api/receipts', name: 'Receipts' },
    { path: '/api/testdrives', name: 'Test Drives' },
    { path: '/api/finance-apps', name: 'EMI & Finance Records' },
    { path: '/api/communications', name: 'Communications Log' },
    { path: '/api/reminders', name: 'Sales Reminders' },
    { path: '/api/reports/summary', name: 'Financial Revenue & Margins Summary' }
  ];

  for (const r of salesAllowedRoutes) {
    const res = await get(r.path, salesToken);
    assert(res.status === 200, `Sales Executive is ALLOWED access to ${r.name}`, `GET ${r.path} -> 200`);
  }

  // 8. ROLE RESTRICTIONS: SALES EXECUTIVE BLOCKED FROM SENSITIVE ADMIN APIS (MUST REJECT 403)
  console.log('\n📌 Test Suite 5: SALES_EXECUTIVE Blocked Administrative Modules (403 Forbidden)');
  const salesBlockedRoutes = [
    { path: '/api/payroll', name: 'Payroll Records & Compensation' },
    { path: '/api/expenses', name: 'Showroom Operational Expenses' },
    { path: '/api/services', name: 'Service & Workshop Tickets' },
    { path: '/api/procurement', name: 'Factory Purchase Orders & Confidential Cost' },
    { path: '/api/parts', name: 'Spare Parts Cost & Inventory' },
    { path: '/api/vendors', name: 'Suppliers & Vendor Contracts' },
    { path: '/api/staff', name: 'Staff Management & Salaries' },
    { path: '/api/settings', name: 'Showroom Dealership Settings' },
    { path: '/api/backup', name: 'Database Backup & System Maintenance' },
    { path: '/api/audit-logs', name: 'Enterprise Audit Trail Logs' }
  ];

  for (const r of salesBlockedRoutes) {
    const res = await get(r.path, salesToken);
    assert(res.status === 403, `Backend BLOCKS Sales Executive from ${r.name}`, `GET ${r.path} -> 403 Forbidden`);
    assert(res.data.error && res.data.error.includes('Access denied'), `Returns clear Access Denied message for ${r.path}`);
  }

  // Also verify Sales Executive cannot DELETE critical records
  const salesDeleteVeh = await del('/api/vehicles/veh_01', salesToken);
  assert(salesDeleteVeh.status === 403, 'Backend BLOCKS Sales Executive from deleting vehicle inventory (403 Forbidden)');

  // 9. ADMIN FULL SYSTEM ACCESS (MUST BE 200 OK ACROSS ALL ADMIN ENDPOINTS)
  console.log('\n📌 Test Suite 6: ADMIN Unrestricted Access Across All Modules (200 OK)');
  for (const r of salesBlockedRoutes) {
    const res = await get(r.path, adminToken);
    assert(res.status === 200, `ADMIN has full access to ${r.name}`, `GET ${r.path} -> 200 OK`);
  }

  // 10. LOGOUT & AUDIT TRAIL TEST
  console.log('\n📌 Test Suite 7: Logout Functionality & Audit Verification');
  const logoutRes = await post('/api/auth/logout', {}, salesToken);
  assert(logoutRes.status === 200, 'Logout endpoint succeeds with 200 OK');
  assert(logoutRes.data.success === true, 'Logout returns success confirmation');

  // Verify that an audit log for LOGOUT was recorded in the database
  const auditRes = await get('/api/audit-logs', adminToken);
  assert(auditRes.status === 200, 'Admin successfully inspects audit logs');
  const logoutLog = auditRes.data.find(l => l.action === 'LOGOUT');
  assert(!!logoutLog, 'Audit trail verified: LOGOUT action is persistently recorded', logoutLog ? logoutLog.description : '');

  console.log('\n============================================================');
  console.log(`🎉 [SUCCESS] All ${passed}/${total} Authentication & RBAC tests PASSED!`);
  console.log('============================================================\n');

  return {
    success: true,
    passed,
    total
  };
}

if (require.main === module) {
  runAuthRBACTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = runAuthRBACTests;
