const db = require('./connection');

function applySchemaExtensions() {
  console.log('🔧 [DB EXTENSION] Checking and applying schema extensions for Financials, Communications, and Reminders...');

  db.transaction(() => {
    // 1. Check & Add columns to customers (date_of_birth, anniversary_date, customer_group)
    const custCols = db.prepare('PRAGMA table_info(customers)').all().map(c => c.name);
    
    if (!custCols.includes('date_of_birth')) {
      console.log('  -> Adding date_of_birth to customers...');
      db.exec("ALTER TABLE customers ADD COLUMN date_of_birth TEXT DEFAULT '1990-05-15'");
    }
    if (!custCols.includes('anniversary_date')) {
      console.log('  -> Adding anniversary_date to customers...');
      db.exec("ALTER TABLE customers ADD COLUMN anniversary_date TEXT DEFAULT '2023-10-04'");
    }
    if (!custCols.includes('customer_group')) {
      console.log('  -> Adding customer_group to customers...');
      db.exec("ALTER TABLE customers ADD COLUMN customer_group TEXT DEFAULT 'Standard'");
    }

    // 2. Ensure insurance_policies table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS insurance_policies (
        id TEXT PRIMARY KEY,
        policy_number TEXT UNIQUE NOT NULL,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
        vehicle_name TEXT NOT NULL,
        vin TEXT,
        provider TEXT NOT NULL,
        policy_type TEXT NOT NULL,
        premium_amount REAL NOT NULL,
        idv_amount REAL NOT NULL,
        start_date TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_insurance_policies_expiry ON insurance_policies(expiry_date);
      CREATE INDEX IF NOT EXISTS idx_insurance_policies_cust ON insurance_policies(customer_id);
    `);

    // 3. Ensure communications status column exists if not present
    const commCols = db.prepare('PRAGMA table_info(communications)').all().map(c => c.name);
    if (!commCols.includes('status')) {
      console.log('  -> Adding status to communications...');
      db.exec("ALTER TABLE communications ADD COLUMN status TEXT DEFAULT 'GATEWAY_UNCONFIGURED_MANUAL_DISPATCH'");
    }
    if (!commCols.includes('recipient')) {
      console.log('  -> Adding recipient to communications...');
      db.exec("ALTER TABLE communications ADD COLUMN recipient TEXT");
    }

    // 4. Seed dates of birth, anniversaries, and groups for existing demo customers
    // System date is 2026-10-03, so let's set birthdays and anniversaries around today & this week!
    db.prepare("UPDATE customers SET date_of_birth = '1988-10-03', anniversary_date = '2024-10-04', customer_group = 'VIP' WHERE id = 'cust_01'").run(); // Rahul Sharma: Birthday TODAY (Oct 3)! Anniversary Tomorrow (Oct 4)!
    db.prepare("UPDATE customers SET date_of_birth = '1992-10-05', anniversary_date = '2025-09-28', customer_group = 'Corporate' WHERE id = 'cust_02'").run(); // Ananya Verma: Birthday in 2 days (Oct 5)!
    db.prepare("UPDATE customers SET date_of_birth = '1979-10-08', anniversary_date = '2026-09-20', customer_group = 'VIP' WHERE id = 'cust_03'").run(); // Vikramaditya: Delivery Anniversary Sept 20!
    db.prepare("UPDATE customers SET date_of_birth = '1995-10-12', anniversary_date = '2025-10-03', customer_group = 'EV Pioneers' WHERE id = 'cust_04'").run(); // Priya Iyer: Purchase Anniversary TODAY (Oct 3)!
    db.prepare("UPDATE customers SET date_of_birth = '1985-11-20', anniversary_date = '2024-12-10', customer_group = 'Standard' WHERE id = 'cust_05'").run();

    // 5. Seed realistic insurance policies (including expiring soon & active)
    const insCount = db.prepare('SELECT count(*) as c FROM insurance_policies').get().c;
    if (insCount === 0) {
      console.log('  -> Seeding initial insurance policies...');
      const insertIns = db.prepare(`
        INSERT INTO insurance_policies (
          id, policy_number, customer_id, customer_name, vehicle_id, vehicle_name, vin,
          provider, policy_type, premium_amount, idv_amount, start_date, expiry_date, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Policy 1: Expiring in 5 days (Oct 8, 2026) -> Trigger for Insurance Reminder!
      insertIns.run(
        'ins_01', 'POL-HDFC-99201', 'cust_01', 'Rahul Sharma', 'veh_01', 'Tata Safari Dark Edition', 'MAT622019P1049281',
        'HDFC ERGO General Insurance', 'Zero Depreciation + Engine Protect', 64500, 2420000,
        '2025-10-08', '2026-10-08', 'Expiring Soon', 'Renewal quotation requested by customer; 5 days remaining'
      );

      // Policy 2: Expiring in 18 days (Oct 21, 2026) -> Upcoming reminder
      insertIns.run(
        'ins_02', 'POL-ICICI-88412', 'cust_02', 'Ananya Verma', 'veh_02', 'Hyundai Creta SX(O)', 'MALC18402P3948192',
        'ICICI Lombard General Insurance', 'Comprehensive + Return to Invoice', 48200, 1790000,
        '2025-10-21', '2026-10-21', 'Expiring Soon', 'Annual policy up for renewal'
      );

      // Policy 3: Active luxury policy
      insertIns.run(
        'ins_03', 'POL-BAJAJ-77192', 'cust_03', 'Vikramaditya Singhania', 'veh_05', 'Mercedes-Benz GLC 300 4MATIC', 'WDC253912026P8471',
        'Bajaj Allianz General Insurance', 'Platinum Luxury Shield (Zero Dep + Consumables + RSA)', 185000, 7000000,
        '2026-09-20', '2027-09-19', 'Active', '3-year corporate comprehensive coverage package'
      );

      // Policy 4: Expired 3 days ago (Sept 30, 2026) -> Overdue Urgent Alert!
      insertIns.run(
        'ins_04', 'POL-TATA-33109', 'cust_05', 'Amit Patil', 'veh_02', 'Hyundai Creta SX(O)', 'MALC18402P3948192',
        'Tata AIG General Insurance', 'Comprehensive Standard', 39000, 1650000,
        '2025-09-30', '2026-09-30', 'Expired', 'Policy expired! Vehicle running without cover. Urgent follow-up required.'
      );
    }
  })();

  console.log('✅ [DB EXTENSION] Schema extensions successfully verified & applied.');
}

if (require.main === module) {
  applySchemaExtensions();
}

module.exports = applySchemaExtensions;
