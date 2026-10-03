const bcrypt = require('bcryptjs');
const db = require('./connection');

function runVerification() {
  console.log('============================================================');
  console.log('🔍 [VERIFY] Apex Horizon Motors — Database & Foundation Verification');
  console.log('============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. DATABASE CONNECTION & INTEGRITY
  console.log('📌 Test Suite 1: Database Connection & Pragmas');
  const journalMode = db.pragma('journal_mode', { simple: true });
  assert(journalMode.toLowerCase() === 'wal', `Database journal mode is WAL (current: ${journalMode})`);

  const foreignKeys = db.pragma('foreign_keys', { simple: true });
  assert(foreignKeys === 1, `Foreign keys are enforced (foreign_keys = 1)`);

  const integrity = db.pragma('integrity_check', { simple: true });
  assert(integrity === 'ok', `Database integrity check returned: "${integrity}"`);

  const fkViolations = db.prepare('PRAGMA foreign_key_check').all();
  assert(fkViolations.length === 0, `Database has 0 foreign key violations (found: ${fkViolations.length})`);

  // 2. REQUIRED ENTITY COVERAGE (ALL 30 TABLES)
  console.log('\n📌 Test Suite 2: All 30 Required Relational Entities');
  const requiredEntities = [
    'roles',
    'permissions',
    'role_permissions',
    'users',
    'showroom_settings',
    'vehicles',
    'customers',
    'leads',
    'estimates',
    'quotations',
    'sales',
    'invoices',
    'payments',
    'receipts',
    'test_drives',
    'finance_records',
    'spare_parts',
    'procurement_orders',
    'procurement_items',
    'service_tickets',
    'job_cards',
    'staff',
    'payroll',
    'expenses',
    'campaigns',
    'communications',
    'reminders',
    'documents',
    'notifications',
    'audit_logs'
  ];

  const dbTables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);

  for (const entity of requiredEntities) {
    assert(dbTables.includes(entity), `Table "${entity}" exists in database`);
    const count = db.prepare(`SELECT COUNT(*) as count FROM "${entity}"`).get().count;
    assert(count > 0, `Table "${entity}" contains seeded demo records (count: ${count})`);
  }

  // 3. AUTHENTICATION & USERS VERIFICATION
  console.log('\n📌 Test Suite 3: Enterprise Roles & User Authentication');
  const adminUser = db.prepare(`
    SELECT u.*, r.name as role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.username = 'admin'
  `).get();
  assert(!!adminUser, 'Admin user "admin" exists in database');
  assert(adminUser.role_name === 'ADMIN', `Admin user has role 'ADMIN' (found: ${adminUser.role_name})`);
  assert(bcrypt.compareSync('admin123', adminUser.password_hash), 'Admin user password "admin123" verifies via bcrypt');

  const salesUser = db.prepare(`
    SELECT u.*, r.name as role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.username = 'sales'
  `).get();
  assert(!!salesUser, 'Sales user "sales" exists in database');
  assert(salesUser.role_name === 'SALES_EXECUTIVE', `Sales user has role 'SALES_EXECUTIVE' (found: ${salesUser.role_name})`);
  assert(bcrypt.compareSync('sales123', salesUser.password_hash), 'Sales user password "sales123" verifies via bcrypt');

  // 4. RELATIONAL INTEGRITY & CROSS-TABLE RELATIONSHIPS
  console.log('\n📌 Test Suite 4: Relational Foreign Key Integrity');
  // Check Sale -> Customer, Vehicle, Quotation
  const saleOrder = db.prepare(`
    SELECT 
      s.sale_order_number, 
      c.name as customer_name, 
      v.brand || ' ' || v.model as vehicle_name, 
      q.quotation_number,
      i.invoice_number,
      p.payment_reference,
      r.receipt_number
    FROM sales s
    JOIN customers c ON s.customer_id = c.id
    JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN quotations q ON s.quotation_id = q.id
    JOIN invoices i ON i.sale_id = s.id
    JOIN payments p ON p.sale_id = s.id
    JOIN receipts r ON r.payment_id = p.id
    WHERE s.id = 'sale_01'
  `).get();

  assert(!!saleOrder, 'Full relational chain Sale -> Customer -> Vehicle -> Invoice -> Payment -> Receipt verified');
  console.log(`     ↳ Sale: ${saleOrder.sale_order_number} | Customer: ${saleOrder.customer_name} | Vehicle: ${saleOrder.vehicle_name} | Invoice: ${saleOrder.invoice_number} | Receipt: ${saleOrder.receipt_number}`);

  // Check Service Ticket -> Job Card
  const serviceRel = db.prepare(`
    SELECT st.ticket_number, jc.job_card_number, jc.technician_name, jc.total_service_cost
    FROM service_tickets st
    JOIN job_cards jc ON jc.service_ticket_id = st.id
    WHERE st.id = 'st_01'
  `).get();
  assert(!!serviceRel, 'Relational link Service Ticket -> Job Card verified');
  console.log(`     ↳ Service Ticket: ${serviceRel.ticket_number} | Job Card: ${serviceRel.job_card_number} | Tech: ${serviceRel.technician_name}`);

  // Check Staff -> User & Payroll
  const staffRel = db.prepare(`
    SELECT st.employee_code, st.name, u.username, py.payroll_period, py.net_salary
    FROM staff st
    JOIN users u ON st.user_id = u.id
    JOIN payroll py ON py.staff_id = st.id
    WHERE st.id = 'stf_02'
  `).get();
  assert(!!staffRel, 'Relational link Staff -> User -> Payroll verified');
  console.log(`     ↳ Staff: ${staffRel.employee_code} (${staffRel.name}) | User: ${staffRel.username} | Payroll: ${staffRel.payroll_period} (₹${staffRel.net_salary})`);

  // 5. CONSTRAINT ENFORCEMENT TESTS
  console.log('\n📌 Test Suite 5: Database Constraint Enforcement (FK, Unique, Check)');
  
  // 5a. Foreign Key Constraint Enforcement
  let fkBlocked = false;
  try {
    db.prepare(`
      INSERT INTO leads (id, customer_id, contact_name, phone)
      VALUES ('lead_bad', 'non_existent_customer_xyz', 'Ghost Contact', '+91 00000 00000')
    `).run();
  } catch (err) {
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      fkBlocked = true;
    }
  }
  assert(fkBlocked, 'Foreign Key constraint successfully prevents orphan record insertion');

  // 5b. Unique Constraint Enforcement
  let uniqueBlocked = false;
  try {
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, name, role_id)
      VALUES ('usr_dup', 'admin', 'duplicate_admin@mail.com', 'dummy_hash', 'Imposter', 'role_admin')
    `).run();
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      uniqueBlocked = true;
    }
  }
  assert(uniqueBlocked, 'Unique constraint successfully blocks duplicate username "admin"');

  // 5c. Check Constraint Enforcement
  let checkBlocked = false;
  try {
    db.prepare(`
      INSERT INTO vehicles (id, vin, brand, model, year, category, color, fuel_type, transmission, ex_showroom_price, status)
      VALUES ('veh_bad', 'VINBAD999', 'FakeBrand', 'Speedster', 2026, 'Spaceship', 'Red', 'Petrol', 'Automatic', 100000, 'Available')
    `).run();
  } catch (err) {
    if (err.message.includes('CHECK constraint failed')) {
      checkBlocked = true;
    }
  }
  assert(checkBlocked, 'CHECK constraint successfully validates vehicle category against permitted enum values');

  console.log('\n============================================================');
  console.log(`🎉 [SUCCESS] All ${passedTests}/${totalTests} automated database foundation tests PASSED!`);
  console.log('============================================================');

  return {
    success: true,
    passedTests,
    totalTests
  };
}

if (require.main === module) {
  try {
    runVerification();
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

module.exports = runVerification;
