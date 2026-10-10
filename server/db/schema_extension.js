const db = require('./connection');

function applySchemaExtensions() {
  console.log('🔧 [DB EXTENSION] Checking and applying enterprise schema extensions for 5 Business Sections...');

  db.transaction(() => {
    // =========================================================================
    // 1. CUSTOMERS & LEADS (DEMOGRAPHICS: Village, Tehsil, District)
    // =========================================================================
    const custCols = db.prepare('PRAGMA table_info(customers)').all().map(c => c.name);
    
    if (!custCols.includes('date_of_birth')) {
      db.exec("ALTER TABLE customers ADD COLUMN date_of_birth TEXT DEFAULT '1990-05-15'");
    }
    if (!custCols.includes('anniversary_date')) {
      db.exec("ALTER TABLE customers ADD COLUMN anniversary_date TEXT DEFAULT '2023-10-04'");
    }
    if (!custCols.includes('customer_group')) {
      db.exec("ALTER TABLE customers ADD COLUMN customer_group TEXT DEFAULT 'Standard'");
    }
    if (!custCols.includes('village')) {
      db.exec("ALTER TABLE customers ADD COLUMN village TEXT DEFAULT 'Shivaji Nagar'");
    }
    if (!custCols.includes('tehsil')) {
      db.exec("ALTER TABLE customers ADD COLUMN tehsil TEXT DEFAULT 'Haveli'");
    }
    if (!custCols.includes('district')) {
      db.exec("ALTER TABLE customers ADD COLUMN district TEXT DEFAULT 'Pune'");
    }
    if (!custCols.includes('occupation')) {
      db.exec("ALTER TABLE customers ADD COLUMN occupation TEXT DEFAULT 'Agriculture / Farming'");
    }

    const leadCols = db.prepare('PRAGMA table_info(leads)').all().map(c => c.name);
    if (!leadCols.includes('village')) {
      db.exec("ALTER TABLE leads ADD COLUMN village TEXT DEFAULT 'Hadapsar'");
    }
    if (!leadCols.includes('tehsil')) {
      db.exec("ALTER TABLE leads ADD COLUMN tehsil TEXT DEFAULT 'Haveli'");
    }
    if (!leadCols.includes('district')) {
      db.exec("ALTER TABLE leads ADD COLUMN district TEXT DEFAULT 'Pune'");
    }
    if (!leadCols.includes('hp_interest')) {
      db.exec("ALTER TABLE leads ADD COLUMN hp_interest INTEGER DEFAULT 50");
    }

    // Seed realistic demographics to existing customers
    const demoVillages = [
      { village: 'Baramati', tehsil: 'Baramati', district: 'Pune' },
      { village: 'Shirur Rural', tehsil: 'Shirur', district: 'Pune' },
      { village: 'Daund Khurd', tehsil: 'Daund', district: 'Pune' },
      { village: 'Indapur Kasba', tehsil: 'Indapur', district: 'Pune' },
      { village: 'Khed Shivapur', tehsil: 'Khed', district: 'Pune' },
      { village: 'Narayangaon', tehsil: 'Junnar', district: 'Pune' },
      { village: 'Wai Rural', tehsil: 'Wai', district: 'Satara' },
      { village: 'Karad Shivar', tehsil: 'Karad', district: 'Satara' },
      { village: 'Phaltan Central', tehsil: 'Phaltan', district: 'Satara' },
      { village: 'Pandharpur Gramin', tehsil: 'Pandharpur', district: 'Solapur' }
    ];

    const allCusts = db.prepare('SELECT id FROM customers').all();
    allCusts.forEach((c, idx) => {
      const v = demoVillages[idx % demoVillages.length];
      db.prepare('UPDATE customers SET village = ?, tehsil = ?, district = ? WHERE id = ?')
        .run(v.village, v.tehsil, v.district, c.id);
    });

    // =========================================================================
    // 2. VEHICLES (HORSEPOWER VERIFICATION & HP MAPPING)
    // =========================================================================
    const vehCols = db.prepare('PRAGMA table_info(vehicles)').all().map(c => c.name);
    if (!vehCols.includes('horsepower')) {
      db.exec("ALTER TABLE vehicles ADD COLUMN horsepower INTEGER DEFAULT 55");
    }
    if (!vehCols.includes('procurement_cost')) {
      db.exec("ALTER TABLE vehicles ADD COLUMN procurement_cost REAL DEFAULT 0");
    }

    // Populate procurement cost for vehicle profit calculation if 0
    db.prepare(`
      UPDATE vehicles 
      SET procurement_cost = ROUND(ex_showroom_price * 0.82) 
      WHERE procurement_cost IS NULL OR procurement_cost = 0
    `).run();

    // Ensure horsepower values are present and realistic (40 HP to 120 HP for tractors/automobiles)
    const hpList = [45, 50, 55, 60, 65, 75, 90, 110, 130];
    const allVehs = db.prepare('SELECT id, horsepower FROM vehicles').all();
    allVehs.forEach((vh, idx) => {
      if (!vh.horsepower || vh.horsepower < 30) {
        const hp = hpList[idx % hpList.length];
        db.prepare('UPDATE vehicles SET horsepower = ? WHERE id = ?').run(hp, vh.id);
      }
    });

    // =========================================================================
    // 3. IMPLEMENTS (Agricultural Implements Purchase, Stock & Sales)
    // =========================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS implements (
        id TEXT PRIMARY KEY,
        implement_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        compatible_hp_min INTEGER DEFAULT 40,
        compatible_hp_max INTEGER DEFAULT 75,
        purchase_cost REAL NOT NULL,
        selling_price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 1 CHECK(stock_quantity >= 0),
        status TEXT NOT NULL DEFAULT 'In Stock',
        supplier_name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS implement_purchases (
        id TEXT PRIMARY KEY,
        po_number TEXT UNIQUE NOT NULL,
        supplier_name TEXT NOT NULL,
        implement_id TEXT REFERENCES implements(id),
        implement_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_cost REAL NOT NULL,
        total_cost REAL NOT NULL,
        purchase_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Received',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS implement_sales (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id TEXT REFERENCES customers(id),
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        village TEXT,
        tehsil TEXT,
        implement_id TEXT REFERENCES implements(id),
        implement_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        sale_price REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax_rate REAL DEFAULT 12.0,
        tax_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        payment_mode TEXT DEFAULT 'Cash',
        sale_date TEXT NOT NULL,
        sales_agent_id TEXT REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'Completed',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Seed initial implements if empty
    const impCount = db.prepare('SELECT count(*) as c FROM implements').get().c;
    if (impCount === 0) {
      console.log('  -> Seeding demo tractor & equipment implements...');
      const insertImp = db.prepare(`
        INSERT INTO implements (
          id, implement_code, name, category, compatible_hp_min, compatible_hp_max, 
          purchase_cost, selling_price, stock_quantity, status, supplier_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const initialImplements = [
        ['imp_01', 'IMP-ROT-07', 'Rotavator 7 Feet (Multi-Speed HD)', 'Tillage', 45, 65, 115000, 138000, 4, 'In Stock', 'Shaktiman Agro Equipment Ltd'],
        ['imp_02', 'IMP-ROT-08', 'Rotavator 8 Feet (Super Heavy Duty)', 'Tillage', 55, 75, 132000, 158000, 3, 'In Stock', 'Shaktiman Agro Equipment Ltd'],
        ['imp_03', 'IMP-CUL-09', 'Tractor Cultivator (9 Tyne Spring Loaded)', 'Tillage', 40, 55, 38000, 47000, 6, 'In Stock', 'Khedut Agro Implements'],
        ['imp_04', 'IMP-CUL-11', 'Tractor Cultivator (11 Tyne Heavy Duty)', 'Tillage', 50, 75, 46000, 56000, 5, 'In Stock', 'Khedut Agro Implements'],
        ['imp_05', 'IMP-TRL-05', 'Hydraulic Tipping Trolley (5 Ton)', 'Haulage', 45, 65, 175000, 210000, 3, 'In Stock', 'Mahindra Industrial Trailers'],
        ['imp_06', 'IMP-TRL-10', 'Hydraulic Heavy Trailer (10 Ton Dual Axle)', 'Haulage', 65, 90, 280000, 335000, 2, 'In Stock', 'Mahindra Industrial Trailers'],
        ['imp_07', 'IMP-LDR-01', 'Front End Heavy Hydraulic Tractor Loader', 'Earthmoving', 50, 75, 220000, 265000, 2, 'In Stock', 'Bull Machines Ltd'],
        ['imp_08', 'IMP-LSR-01', 'Laser Land Leveler with Transmitter & Mast', 'Precision', 55, 80, 290000, 345000, 2, 'In Stock', 'Sonalika Precision Agro']
      ];

      initialImplements.forEach(item => insertImp.run(...item));

      // Seed implement sales
      const insertImpSale = db.prepare(`
        INSERT INTO implement_sales (
          id, invoice_number, customer_id, customer_name, customer_phone, village, tehsil,
          implement_id, implement_name, quantity, sale_price, discount, tax_rate, tax_amount, total_amount,
          payment_mode, sale_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertImpSale.run(
        'isale_01', 'IMP-INV-2026-001', 'cust_01', 'Rahul Sharma', '+91 98201 11222', 'Baramati', 'Baramati',
        'imp_01', 'Rotavator 7 Feet (Multi-Speed HD)', 1, 138000, 3000, 12, 16200, 151200, 'Cash', '2026-09-18', 'Completed'
      );
      insertImpSale.run(
        'isale_02', 'IMP-INV-2026-002', 'cust_02', 'Ananya Verma', '+91 98202 33444', 'Shirur Rural', 'Shirur',
        'imp_05', 'Hydraulic Tipping Trolley (5 Ton)', 1, 210000, 5000, 12, 24600, 229600, 'Bank Transfer', '2026-09-24', 'Completed'
      );
      insertImpSale.run(
        'isale_03', 'IMP-INV-2026-003', 'cust_03', 'Vikramaditya Singhania', '+91 98203 55666', 'Daund Khurd', 'Daund',
        'imp_07', 'Front End Heavy Hydraulic Tractor Loader', 1, 265000, 5000, 12, 31200, 291200, 'RTGS / NEFT', '2026-10-02', 'Completed'
      );
    }

    // =========================================================================
    // 4. DELIVERY CHALLANS & SALE AGREEMENTS
    // =========================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS delivery_challans (
        id TEXT PRIMARY KEY,
        challan_number TEXT UNIQUE NOT NULL,
        sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
        invoice_number TEXT,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_village TEXT,
        customer_tehsil TEXT,
        vehicle_name TEXT NOT NULL,
        chassis_number TEXT NOT NULL,
        engine_number TEXT,
        color TEXT,
        key_number TEXT DEFAULT 'KEY-01 & KEY-02',
        battery_make TEXT DEFAULT 'Exide OEM Matrix',
        toolkit_included INTEGER DEFAULT 1,
        handover_date TEXT NOT NULL,
        delivered_by TEXT DEFAULT 'Alex Rivera (Sales Exec)',
        recipient_name TEXT,
        status TEXT NOT NULL DEFAULT 'Delivered',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sale_agreements (
        id TEXT PRIMARY KEY,
        agreement_number TEXT UNIQUE NOT NULL,
        sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
        invoice_number TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_village TEXT,
        vehicle_name TEXT NOT NULL,
        chassis_number TEXT NOT NULL,
        deal_value REAL NOT NULL,
        hypothecation_bank TEXT DEFAULT 'State Bank of India (Agri Division)',
        terms_accepted INTEGER DEFAULT 1,
        agreement_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Executed',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Seed delivery challans from existing sales
    const dcCount = db.prepare('SELECT count(*) as c FROM delivery_challans').get().c;
    if (dcCount === 0) {
      console.log('  -> Seeding delivery challans & sale agreements from active sales...');
      const salesRows = db.prepare(`
        SELECT s.*, c.name as c_name, c.phone as c_phone, c.village as c_village, c.tehsil as c_tehsil,
               v.brand || ' ' || v.model as v_name, v.vin as v_vin, v.color as v_color,
               i.invoice_number
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        JOIN vehicles v ON s.vehicle_id = v.id
        LEFT JOIN invoices i ON i.sale_id = s.id
        LIMIT 10
      `).all();

      const insertDC = db.prepare(`
        INSERT INTO delivery_challans (
          id, challan_number, sale_id, invoice_number, customer_id, customer_name, customer_phone,
          customer_village, customer_tehsil, vehicle_name, chassis_number, color, handover_date, recipient_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertAgr = db.prepare(`
        INSERT INTO sale_agreements (
          id, agreement_number, sale_id, invoice_number, customer_name, customer_phone, customer_village,
          vehicle_name, chassis_number, deal_value, agreement_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      salesRows.forEach((s, idx) => {
        const dcNum = `DC-2026-${String(idx + 1).padStart(3, '0')}`;
        const agrNum = `AGR-2026-${String(idx + 1).padStart(3, '0')}`;
        insertDC.run(
          `dc_${idx + 1}`, dcNum, s.id, s.invoice_number || `INV-2026-${idx + 1}`,
          s.customer_id, s.c_name, s.c_phone, s.c_village || 'Baramati', s.c_tehsil || 'Baramati',
          s.v_name, s.v_vin, s.v_color, s.actual_delivery_date || s.booking_date, s.c_name
        );
        insertAgr.run(
          `agr_${idx + 1}`, agrNum, s.id, s.invoice_number || `INV-2026-${idx + 1}`,
          s.c_name, s.c_phone, s.c_village || 'Baramati', s.v_name, s.v_vin,
          s.total_amount, s.booking_date
        );
      });
    }

    // =========================================================================
    // 5. SERVICE MANAGEMENT: SPARE INVOICES, ACCESSORIES, AND PARTS LEDGER
    // =========================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS spare_invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        vehicle_number TEXT,
        items_json TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax_rate REAL DEFAULT 18.0,
        tax_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        payment_mode TEXT DEFAULT 'Cash',
        invoice_type TEXT NOT NULL DEFAULT 'Spare' CHECK(invoice_type IN ('Spare', 'Accessories')),
        invoice_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Paid',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS parts_ledger (
        id TEXT PRIMARY KEY,
        part_id TEXT NOT NULL REFERENCES spare_parts(id),
        part_number TEXT NOT NULL,
        part_name TEXT NOT NULL,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('INWARD_PURCHASE', 'OUTWARD_JOB_CARD', 'OUTWARD_COUNTER_SALE', 'ADJUSTMENT')),
        reference_no TEXT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        balance_stock INTEGER NOT NULL,
        transaction_date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS job_estimates (
        id TEXT PRIMARY KEY,
        estimate_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        vehicle_model TEXT NOT NULL,
        vin TEXT,
        estimated_labor REAL NOT NULL DEFAULT 0,
        estimated_parts REAL NOT NULL DEFAULT 0,
        tax_rate REAL DEFAULT 18.0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        complaints TEXT,
        status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Converted', 'Rejected')),
        estimate_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS service_invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        job_card_id TEXT REFERENCES job_cards(id) ON DELETE SET NULL,
        service_ticket_id TEXT REFERENCES service_tickets(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        vehicle_model TEXT NOT NULL,
        vin TEXT,
        technician_name TEXT,
        labor_charges REAL NOT NULL DEFAULT 0,
        parts_charges REAL NOT NULL DEFAULT 0,
        subtotal REAL NOT NULL DEFAULT 0,
        tax_rate REAL DEFAULT 18.0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        payment_mode TEXT DEFAULT 'Cash',
        invoice_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Paid',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_job_estimates_num ON job_estimates(estimate_number);
      CREATE INDEX IF NOT EXISTS idx_service_invoices_num ON service_invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_service_invoices_jc ON service_invoices(job_card_id);
    `);

    // Seed job_estimates if empty
    const jeCount = db.prepare('SELECT count(*) as c FROM job_estimates').get().c;
    if (jeCount === 0) {
      console.log('  -> Seeding job estimates for workshop repairs...');
      const insertJE = db.prepare(`
        INSERT INTO job_estimates (
          id, estimate_number, customer_name, customer_phone, vehicle_model, vin,
          estimated_labor, estimated_parts, tax_rate, tax_amount, total_amount, complaints, status, estimate_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertJE.run(
        'je_01', 'JEST-2026-001', 'Ramesh Jadhav', '+91 98901 22334', 'Mahindra 575 DI Tractor', 'VIN-M575-8910',
        4500, 12000, 18, 2970, 19470, 'Hydraulic lift leakage and rear brake squeal', 'Approved', '2026-09-18'
      );
      insertJE.run(
        'je_02', 'JEST-2026-002', 'Santosh Shinde', '+91 98902 44556', 'Swaraj 855 FE Tractor', 'VIN-SW855-4412',
        3800, 8500, 18, 2214, 14514, 'Clutch slippage under rotavator load & 500h service', 'Pending', '2026-09-25'
      );
      insertJE.run(
        'je_03', 'JEST-2026-003', 'Rahul Sharma', '+91 98201 11222', 'Tata Safari Dark Edition', 'MAT622019P1049281',
        6500, 18500, 18, 4500, 29500, 'Suspension noise over rough rural roads & AC filter replace', 'Converted', '2026-10-02'
      );
    }

    // Seed service_invoices if empty
    const sinvCount = db.prepare('SELECT count(*) as c FROM service_invoices').get().c;
    if (sinvCount === 0) {
      console.log('  -> Seeding service invoices from completed job cards...');
      const insertSrvInv = db.prepare(`
        INSERT INTO service_invoices (
          id, invoice_number, job_card_id, service_ticket_id, customer_name, customer_phone,
          vehicle_model, vin, technician_name, labor_charges, parts_charges, subtotal,
          tax_rate, tax_amount, total_amount, payment_mode, invoice_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const completedCards = db.prepare(`
        SELECT jc.*, st.customer_name, st.customer_phone, st.vehicle_model, st.vin
        FROM job_cards jc
        JOIN service_tickets st ON jc.service_ticket_id = st.id
        LIMIT 5
      `).all();

      completedCards.forEach((c, idx) => {
        const invNum = `SRV-INV-2026-${String(idx + 1).padStart(3, '0')}`;
        const labor = Number(c.labor_charges || 3500);
        const parts = Number(c.parts_total_cost || 5000);
        const sub = labor + parts;
        const tax = Math.round(sub * 0.18);
        const tot = sub + tax;
        insertSrvInv.run(
          `sinv_${idx + 1}`, invNum, c.id, c.service_ticket_id, c.customer_name, c.customer_phone || '',
          c.vehicle_model, c.vin, c.technician_name || 'Suresh Patil',
          labor, parts, sub, 18.0, tax, tot, 'Cash', '2026-09-22', 'Paid'
        );
      });
    }

    // Seed initial spare invoices and parts movement ledger
    const spiCount = db.prepare('SELECT count(*) as c FROM spare_invoices').get().c;
    if (spiCount === 0) {
      console.log('  -> Seeding spare & accessories invoices and parts ledger...');
      const insertSpInv = db.prepare(`
        INSERT INTO spare_invoices (
          id, invoice_number, customer_name, customer_phone, vehicle_number,
          items_json, subtotal, tax_rate, tax_amount, total_amount, payment_mode, invoice_type, invoice_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertSpInv.run(
        'spinv_01', 'SPI-2026-001', 'Ramesh Jadhav', '+91 98901 22334', 'MH-12-AQ-9901',
        JSON.stringify([{ code: 'PRT-2026-001', name: 'Ceramic Heavy Brake Pads', qty: 2, price: 8500 }]),
        17000, 18, 3060, 20060, 'Cash', 'Spare', '2026-09-21', 'Paid'
      );
      insertSpInv.run(
        'spinv_02', 'SPI-2026-002', 'Santosh Shinde', '+91 98902 44556', 'MH-14-BT-4412',
        JSON.stringify([{ code: 'PRT-2026-003', name: 'Synthetic Low-Viscosity Engine Oil 5W-40', qty: 3, price: 5400 }]),
        16200, 18, 2916, 19116, 'UPI / Card', 'Spare', '2026-09-28', 'Paid'
      );
      insertSpInv.run(
        'accinv_01', 'ACC-2026-001', 'Vikramaditya Singhania', '+91 98203 55666', 'MH-01-EE-0007',
        JSON.stringify([{ code: 'ACC-01', name: 'Carbon Fiber All-Weather Floor Mats', qty: 1, price: 18500 }, { code: 'ACC-02', name: 'Ceramic Paint Shield Coating Kit', qty: 1, price: 24000 }]),
        42500, 18, 7650, 50150, 'RTGS / NEFT', 'Accessories', '2026-10-01', 'Paid'
      );

      // Parts ledger seed entries
      const samplePart = db.prepare('SELECT id, part_number, name, unit_cost, selling_price, stock_quantity FROM spare_parts LIMIT 1').get();
      if (samplePart) {
        const insertPL = db.prepare(`
          INSERT INTO parts_ledger (
            id, part_id, part_number, part_name, transaction_type, reference_no, quantity, unit_price, balance_stock, transaction_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertPL.run(
          'pl_01', samplePart.id, samplePart.part_number, samplePart.name, 'INWARD_PURCHASE', 'PO-2026-001', 25, samplePart.unit_cost, samplePart.stock_quantity, '2026-09-01', 'Initial OEM Stock Inward'
        );
        insertPL.run(
          'pl_02', samplePart.id, samplePart.part_number, samplePart.name, 'OUTWARD_JOB_CARD', 'JC-2026-001', -2, samplePart.selling_price, Math.max(0, samplePart.stock_quantity - 2), '2026-09-15', 'Allocated to Service Job Card JC-2026-001'
        );
        insertPL.run(
          'pl_03', samplePart.id, samplePart.part_number, samplePart.name, 'OUTWARD_COUNTER_SALE', 'SPI-2026-001', -2, samplePart.selling_price, Math.max(0, samplePart.stock_quantity - 4), '2026-09-21', 'Over the counter retail spare sale'
        );
      }
    }

    // =========================================================================
    // 6. ACCOUNTS MANAGEMENT: VOUCHERS, CASH BOOK, BANK BOOK, PAYOUTS & RTO
    // =========================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS account_vouchers (
        id TEXT PRIMARY KEY,
        voucher_number TEXT UNIQUE NOT NULL,
        voucher_type TEXT NOT NULL CHECK(voucher_type IN ('PAYMENT', 'RECEIPT')),
        category TEXT NOT NULL,
        party_type TEXT NOT NULL DEFAULT 'customer' CHECK(party_type IN ('customer', 'vendor', 'employee', 'bank', 'rto', 'insurance', 'other')),
        party_name TEXT NOT NULL,
        party_id TEXT,
        amount REAL NOT NULL,
        payment_mode TEXT NOT NULL CHECK(payment_mode IN ('Cash', 'Bank Transfer', 'Cheque', 'RTGS / NEFT', 'UPI')),
        bank_name TEXT,
        cheque_or_ref_no TEXT,
        voucher_date TEXT NOT NULL,
        narration TEXT,
        created_by TEXT DEFAULT 'admin',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS finance_payouts (
        id TEXT PRIMARY KEY,
        payout_ref TEXT UNIQUE NOT NULL,
        bank_name TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        loan_amount REAL NOT NULL,
        commission_rate_pct REAL NOT NULL,
        payout_amount REAL NOT NULL,
        payout_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Received',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS insurance_payouts (
        id TEXT PRIMARY KEY,
        payout_ref TEXT UNIQUE NOT NULL,
        insurer_name TEXT NOT NULL,
        policy_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        premium_amount REAL NOT NULL,
        commission_rate_pct REAL NOT NULL,
        payout_amount REAL NOT NULL,
        payout_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Received',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS rto_records (
        id TEXT PRIMARY KEY,
        rto_file_no TEXT UNIQUE NOT NULL,
        sale_id TEXT REFERENCES sales(id),
        customer_name TEXT NOT NULL,
        vehicle_name TEXT NOT NULL,
        chassis_no TEXT NOT NULL,
        rto_office TEXT NOT NULL DEFAULT 'MH-12 Pune RTO',
        tax_collected REAL NOT NULL,
        govt_tax_paid REAL NOT NULL,
        registration_no TEXT,
        rc_status TEXT NOT NULL DEFAULT 'Approved' CHECK(rc_status IN ('Pending', 'Approved', 'Dispatched', 'Handed Over')),
        application_date TEXT NOT NULL,
        passing_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Seed vouchers if empty
    const vcCount = db.prepare('SELECT count(*) as c FROM account_vouchers').get().c;
    if (vcCount === 0) {
      console.log('  -> Seeding payment & receipt vouchers, cash book and bank entries...');
      const insertVoucher = db.prepare(`
        INSERT INTO account_vouchers (
          id, voucher_number, voucher_type, category, party_type, party_name, party_id,
          amount, payment_mode, bank_name, cheque_or_ref_no, voucher_date, narration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 1. Receipt Vouchers (Inflows)
      insertVoucher.run('vch_01', 'RV-2026-001', 'RECEIPT', 'Margin Money', 'customer', 'Rahul Sharma', 'cust_01', 450000, 'RTGS / NEFT', 'HDFC Bank', 'UTR-882910', '2026-09-12', 'Customer margin money down payment for vehicle loan file');
      insertVoucher.run('vch_02', 'RV-2026-002', 'RECEIPT', 'Customer Inflow', 'customer', 'Ananya Verma', 'cust_02', 250000, 'Cash', 'Showroom Cash Box', 'CASH-REC-102', '2026-09-15', 'Advance booking cash token receipt');
      insertVoucher.run('vch_03', 'RV-2026-003', 'RECEIPT', 'Finance Payout', 'bank', 'HDFC Bank Auto Finance', 'bnk_01', 54000, 'Bank Transfer', 'HDFC Bank', 'CREDIT-COMM-991', '2026-09-22', 'Dealership DSA finance commission payout for Q3 closed files');
      insertVoucher.run('vch_04', 'RV-2026-004', 'RECEIPT', 'Insurance Payout', 'insurance', 'Bajaj Allianz General Insurance', 'ins_01', 42000, 'Bank Transfer', 'ICICI Bank', 'INS-COMM-441', '2026-09-25', 'Zero-Dep policy dealer subvention & brokerage payout');

      // 2. Payment Vouchers (Outflows)
      insertVoucher.run('vch_05', 'PV-2026-001', 'PAYMENT', 'Supplier Payout', 'vendor', 'Tata AutoComp Systems Ltd', 'vend_01', 185000, 'RTGS / NEFT', 'HDFC Bank', 'UTR-771829', '2026-09-10', 'Vendor payment for spare parts consignment');
      insertVoucher.run('vch_06', 'PV-2026-002', 'PAYMENT', 'Expense', 'other', 'Tata Power / MSEDCL', null, 48500, 'Bank Transfer', 'HDFC Bank', 'NEFT-ELEC-442', '2026-09-18', 'Showroom monthly commercial electricity bill');
      insertVoucher.run('vch_07', 'PV-2026-003', 'PAYMENT', 'Salary', 'employee', 'Alex Rivera (Sales Exec)', 'emp_02', 65000, 'Bank Transfer', 'HDFC Bank', 'SAL-DIR-0926', '2026-09-30', 'Staff monthly salary payout with sales incentives');
      insertVoucher.run('vch_08', 'PV-2026-004', 'PAYMENT', 'RTO Charges', 'rto', 'Pune RTO Office', null, 124500, 'Cheque', 'State Bank of India', 'CHQ-890123', '2026-10-02', 'Government RTO road tax & hypothecation fee challan payment');
    }

    // Seed finance & insurance payouts
    const fpCount = db.prepare('SELECT count(*) as c FROM finance_payouts').get().c;
    if (fpCount === 0) {
      console.log('  -> Seeding finance and insurance payouts...');
      db.prepare(`
        INSERT INTO finance_payouts (
          id, payout_ref, bank_name, customer_name, loan_amount, commission_rate_pct, payout_amount, payout_date, status, notes
        ) VALUES 
        ('fp_01', 'FP-2026-001', 'State Bank of India (Agri Division)', 'Vikramaditya Singhania', 2500000, 1.8, 45000, '2026-09-20', 'Received', 'Tractor loan file subvention disbursed to dealer account'),
        ('fp_02', 'FP-2026-002', 'HDFC Bank Auto Loans', 'Rahul Sharma', 1800000, 2.0, 36000, '2026-09-28', 'Received', 'Commercial vehicle retail loan commission payout'),
        ('fp_03', 'FP-2026-003', 'Cholamandalam Investment & Finance', 'Ananya Verma', 1400000, 2.2, 30800, '2026-10-02', 'Received', 'Tractor & implement package finance dealer bonus')
      `).run();

      db.prepare(`
        INSERT INTO insurance_payouts (
          id, payout_ref, insurer_name, policy_number, customer_name, premium_amount, commission_rate_pct, payout_amount, payout_date, status, notes
        ) VALUES 
        ('ip_01', 'IP-2026-001', 'HDFC ERGO General Insurance', 'POL-HDFC-99201', 'Rahul Sharma', 64500, 15.0, 9675, '2026-09-15', 'Received', 'Comprehensive + Zero-Dep agency commission'),
        ('ip_02', 'IP-2026-002', 'Bajaj Allianz General Insurance', 'POL-BAJAJ-77192', 'Vikramaditya Singhania', 185000, 18.0, 33300, '2026-09-26', 'Received', 'Platinum Commercial Shield broker payout'),
        ('ip_03', 'IP-2026-003', 'ICICI Lombard General Insurance', 'POL-ICICI-88412', 'Ananya Verma', 48200, 15.0, 7230, '2026-10-01', 'Received', 'Return to Invoice policy commission')
      `).run();
    }

    // Seed RTO records
    const rtoCount = db.prepare('SELECT count(*) as c FROM rto_records').get().c;
    if (rtoCount === 0) {
      console.log('  -> Seeding RTO summaries and passing records...');
      db.prepare(`
        INSERT INTO rto_records (
          id, rto_file_no, customer_name, vehicle_name, chassis_no, rto_office,
          tax_collected, govt_tax_paid, registration_no, rc_status, application_date, passing_date
        ) VALUES 
        ('rto_01', 'RTO-MH12-2026-01', 'Rahul Sharma', 'Tata Safari Dark Edition', 'MAT622019P1049281', 'MH-12 Pune RTO', 245000, 238000, 'MH-12-TX-4401', 'Handed Over', '2026-09-14', '2026-09-19'),
        ('rto_02', 'RTO-MH12-2026-02', 'Ananya Verma', 'Hyundai Creta SX(O)', 'MALC18402P3948192', 'MH-14 Pimpri-Chinchwad', 178000, 172000, 'MH-14-GH-8812', 'Dispatched', '2026-09-20', '2026-09-25'),
        ('rto_03', 'RTO-MH12-2026-03', 'Vikramaditya Singhania', 'Mercedes-Benz GLC 300 4MATIC', 'WDC253912026P8471', 'MH-12 Pune RTO', 885000, 870000, 'MH-12-VIP-0007', 'Approved', '2026-09-28', '2026-10-03')
      `).run();
    }

    // =========================================================================
    // 7. EXCHANGE MANAGEMENT (TRADE-INS & RESALE ENHANCEMENTS)
    // =========================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS trade_ins (
        id TEXT PRIMARY KEY,
        exchange_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_village TEXT DEFAULT 'Baramati',
        customer_tehsil TEXT DEFAULT 'Baramati',
        customer_district TEXT DEFAULT 'Pune',
        salesman_name TEXT DEFAULT 'Alex Rivera',
        old_brand TEXT NOT NULL,
        old_model TEXT NOT NULL,
        old_year INTEGER NOT NULL DEFAULT 2019,
        horsepower INTEGER DEFAULT 50,
        registration_no TEXT NOT NULL,
        odometer_km INTEGER NOT NULL DEFAULT 0,
        condition_rating TEXT NOT NULL DEFAULT 'Good',
        estimated_valuation REAL NOT NULL DEFAULT 0,
        refurbishment_cost REAL NOT NULL DEFAULT 0,
        expected_resale_price REAL NOT NULL DEFAULT 0,
        actual_resale_price REAL DEFAULT 0,
        resale_customer_name TEXT,
        resale_date TEXT,
        approved_adjustment_amount REAL NOT NULL DEFAULT 0,
        adjusted_against_sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'Evaluated' CHECK(status IN ('Evaluated', 'In Stock', 'Sold', 'Rejected')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Ensure columns exist on trade_ins
    const tiCols = db.prepare('PRAGMA table_info(trade_ins)').all().map(c => c.name);
    if (!tiCols.includes('customer_village')) db.exec("ALTER TABLE trade_ins ADD COLUMN customer_village TEXT DEFAULT 'Baramati'");
    if (!tiCols.includes('customer_tehsil')) db.exec("ALTER TABLE trade_ins ADD COLUMN customer_tehsil TEXT DEFAULT 'Baramati'");
    if (!tiCols.includes('customer_district')) db.exec("ALTER TABLE trade_ins ADD COLUMN customer_district TEXT DEFAULT 'Pune'");
    if (!tiCols.includes('salesman_name')) db.exec("ALTER TABLE trade_ins ADD COLUMN salesman_name TEXT DEFAULT 'Alex Rivera'");
    if (!tiCols.includes('horsepower')) db.exec("ALTER TABLE trade_ins ADD COLUMN horsepower INTEGER DEFAULT 50");
    if (!tiCols.includes('refurbishment_cost')) db.exec("ALTER TABLE trade_ins ADD COLUMN refurbishment_cost REAL DEFAULT 0");
    if (!tiCols.includes('expected_resale_price')) db.exec("ALTER TABLE trade_ins ADD COLUMN expected_resale_price REAL DEFAULT 0");
    if (!tiCols.includes('actual_resale_price')) db.exec("ALTER TABLE trade_ins ADD COLUMN actual_resale_price REAL DEFAULT 0");
    if (!tiCols.includes('resale_customer_name')) db.exec("ALTER TABLE trade_ins ADD COLUMN resale_customer_name TEXT");
    if (!tiCols.includes('resale_date')) db.exec("ALTER TABLE trade_ins ADD COLUMN resale_date TEXT");

    // Seed realistic trade-in records if count < 4
    const tiCount = db.prepare('SELECT count(*) as c FROM trade_ins').get().c;
    if (tiCount < 4) {
      console.log('  -> Seeding exchange purchases and resale records...');
      const insertTI = db.prepare(`
        INSERT OR REPLACE INTO trade_ins (
          id, exchange_number, customer_name, customer_phone, customer_village, customer_tehsil, customer_district,
          salesman_name, old_brand, old_model, old_year, horsepower, registration_no, odometer_km, condition_rating,
          estimated_valuation, refurbishment_cost, expected_resale_price, actual_resale_price, resale_customer_name, resale_date,
          approved_adjustment_amount, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertTI.run(
        'ti_01', 'EXC-2026-001', 'Santosh Pawar', '+91 98221 44551', 'Baramati', 'Baramati', 'Pune',
        'Alex Rivera', 'Mahindra', '575 DI Sarpanch Tractor', 2018, 47, 'MH-12-BG-1092', 45000, 'Good',
        280000, 15000, 340000, 335000, 'Dnyaneshwar Shinde', '2026-09-25', 280000, 'Sold', 'Exchange valuation adjusted against new tractor purchase'
      );
      insertTI.run(
        'ti_02', 'EXC-2026-002', 'Babanrao Kadam', '+91 98222 66772', 'Shirur Rural', 'Shirur', 'Pune',
        'Marcus Vance', 'Swaraj', '744 FE 4WD Tractor', 2020, 52, 'MH-14-CW-7721', 32000, 'Excellent',
        360000, 12000, 420000, 415000, 'Kisan Patil', '2026-09-30', 360000, 'Sold', 'Clean engine and hydraulic system'
      );
      insertTI.run(
        'ti_03', 'EXC-2026-003', 'Vitthal Jagtap', '+91 98223 88993', 'Indapur Kasba', 'Indapur', 'Pune',
        'Alex Rivera', 'John Deere', '5050 D PowerPro Tractor', 2021, 50, 'MH-12-DK-4482', 28000, 'Excellent',
        410000, 18000, 480000, 0, null, null, 410000, 'In Stock', 'In showroom used stock after complete mechanical service'
      );
      insertTI.run(
        'ti_04', 'EXC-2026-004', 'Suresh Gholap', '+91 98224 11224', 'Wai Rural', 'Wai', 'Satara',
        'Alex Rivera', 'Tafe Massey Ferguson', '241 DI Maha Shakti', 2019, 42, 'MH-11-AA-9912', 41000, 'Good',
        260000, 14000, 310000, 0, null, null, 260000, 'In Stock', 'Under refurbishment for pre-owned customer sale'
      );
    }

    // =========================================================================
    // 8. INSURANCE POLICIES & PDI
    // =========================================================================
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

      CREATE TABLE IF NOT EXISTS pdi_records (
        id TEXT PRIMARY KEY,
        pdi_number TEXT UNIQUE NOT NULL,
        sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
        invoice_no TEXT,
        vehicle_name TEXT NOT NULL,
        vin TEXT,
        customer_name TEXT NOT NULL,
        inspector_name TEXT NOT NULL,
        inspection_date TEXT NOT NULL,
        exterior_status TEXT DEFAULT 'Passed',
        interior_status TEXT DEFAULT 'Passed',
        engine_fluids_status TEXT DEFAULT 'Passed',
        electricals_status TEXT DEFAULT 'Passed',
        toolkit_provided INTEGER DEFAULT 1,
        keys_provided INTEGER DEFAULT 2,
        status TEXT DEFAULT 'Passed',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // =========================================================================
    // 9. PERFORMANCE INDEXES ON FOREIGN KEYS & DEMOGRAPHICS
    // =========================================================================
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_implements_cat ON implements(category);
      CREATE INDEX IF NOT EXISTS idx_implement_sales_cust ON implement_sales(customer_id);
      CREATE INDEX IF NOT EXISTS idx_delivery_challans_sale ON delivery_challans(sale_id);
      CREATE INDEX IF NOT EXISTS idx_sale_agreements_sale ON sale_agreements(sale_id);
      CREATE INDEX IF NOT EXISTS idx_spare_invoices_date ON spare_invoices(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_parts_ledger_part ON parts_ledger(part_id);
      CREATE INDEX IF NOT EXISTS idx_account_vouchers_type ON account_vouchers(voucher_type, voucher_date);
      CREATE INDEX IF NOT EXISTS idx_account_vouchers_party ON account_vouchers(party_type, party_name);
      CREATE INDEX IF NOT EXISTS idx_trade_ins_status ON trade_ins(status);
      CREATE INDEX IF NOT EXISTS idx_rto_records_sale ON rto_records(sale_id);
      CREATE INDEX IF NOT EXISTS idx_customers_village ON customers(village);
      CREATE INDEX IF NOT EXISTS idx_customers_tehsil ON customers(tehsil);
    `);
  })();

  console.log('✅ [DB EXTENSION] All 5 Business Section schemas and data models verified successfully.');
}

if (require.main === module) {
  applySchemaExtensions();
}

module.exports = applySchemaExtensions;
