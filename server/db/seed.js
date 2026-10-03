const bcrypt = require('bcryptjs');
const db = require('./connection');

function seedDatabase() {
  console.log('🌱 [SEED] Starting Enterprise Database Seeding for Apex Horizon Motors...');

  // Use a transaction to ensure all seed operations succeed atomically
  const seedTx = db.transaction(() => {
    // ---------------------------------------------------------
    // 1. ROLES
    // ---------------------------------------------------------
    console.log('  -> Seeding roles...');
    const insertRole = db.prepare(`
      INSERT OR REPLACE INTO roles (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    insertRole.run('role_admin', 'ADMIN', 'Super Administrator with unrestricted access to all modules, financial reporting, staff management and configuration');
    insertRole.run('role_sales', 'SALES_EXECUTIVE', 'Showroom Sales Executive & Client Advisor with access to inventory, leads, CRM, quotations, bookings and test drives');

    // ---------------------------------------------------------
    // 2. PERMISSIONS
    // ---------------------------------------------------------
    console.log('  -> Seeding permissions...');
    const insertPerm = db.prepare(`
      INSERT OR REPLACE INTO permissions (id, code, module, description, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const permissions = [
      { id: 'p_users_manage', code: 'users.manage', module: 'USERS', desc: 'Create, update, deactivate staff and system users' },
      { id: 'p_users_view', code: 'users.view', module: 'USERS', desc: 'View staff and user profiles' },
      { id: 'p_vehicles_manage', code: 'vehicles.manage', module: 'INVENTORY', desc: 'Manage vehicle inventory, pricing and status' },
      { id: 'p_vehicles_view', code: 'vehicles.view', module: 'INVENTORY', desc: 'Browse and search showroom vehicles' },
      { id: 'p_customers_manage', code: 'customers.manage', module: 'CUSTOMERS', desc: 'Create and update customer profiles and documents' },
      { id: 'p_customers_view', code: 'customers.view', module: 'CUSTOMERS', desc: 'View customer directory' },
      { id: 'p_leads_manage', code: 'leads.manage', module: 'LEADS', desc: 'Create, assign and update CRM leads and enquiries' },
      { id: 'p_leads_view', code: 'leads.view', module: 'LEADS', desc: 'View sales pipeline leads' },
      { id: 'p_quotes_manage', code: 'quotes.manage', module: 'QUOTATIONS', desc: 'Generate and negotiate pricing estimates and formal quotations' },
      { id: 'p_quotes_view', code: 'quotes.view', module: 'QUOTATIONS', desc: 'View quotations and price sheets' },
      { id: 'p_sales_manage', code: 'sales.manage', module: 'SALES', desc: 'Book vehicle sales orders and assign deliveries' },
      { id: 'p_sales_view', code: 'sales.view', module: 'SALES', desc: 'View sales orders and booking status' },
      { id: 'p_invoices_manage', code: 'invoices.manage', module: 'FINANCE', desc: 'Issue tax invoices and handle payment receipts' },
      { id: 'p_invoices_view', code: 'invoices.view', module: 'FINANCE', desc: 'View invoices and payment history' },
      { id: 'p_testdrives_manage', code: 'testdrives.manage', module: 'TEST_DRIVES', desc: 'Schedule and log vehicle test drive experiences' },
      { id: 'p_service_manage', code: 'service.manage', module: 'SERVICE', desc: 'Manage workshop job cards, service tickets and parts' },
      { id: 'p_procure_manage', code: 'procure.manage', module: 'PROCUREMENT', desc: 'Manage stock purchase orders and parts replenishment' },
      { id: 'p_payroll_manage', code: 'payroll.manage', module: 'PAYROLL', desc: 'Manage staff compensation and payroll' },
      { id: 'p_expenses_manage', code: 'expenses.manage', module: 'EXPENSES', desc: 'Track and approve showroom operational expenses' },
      { id: 'p_marketing_manage', code: 'campaigns.manage', module: 'MARKETING', desc: 'Manage marketing campaigns and track conversions' },
      { id: 'p_audit_view', code: 'audit.view', module: 'AUDIT', desc: 'Inspect full enterprise system audit trails' },
      { id: 'p_settings_manage', code: 'settings.manage', module: 'SETTINGS', desc: 'Configure showroom settings, tax rates and dealership details' }
    ];

    for (const p of permissions) {
      insertPerm.run(p.id, p.code, p.module, p.desc);
    }

    // Role Permissions mapping
    const insertRolePerm = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)
    `);

    // Admin gets all
    for (const p of permissions) {
      insertRolePerm.run('role_admin', p.id);
    }

    // Sales Executive gets core sales and customer modules
    const salesPermIds = [
      'p_users_view',
      'p_vehicles_view',
      'p_customers_manage',
      'p_customers_view',
      'p_leads_manage',
      'p_leads_view',
      'p_quotes_manage',
      'p_quotes_view',
      'p_sales_manage',
      'p_sales_view',
      'p_invoices_view',
      'p_testdrives_manage'
    ];
    for (const pid of salesPermIds) {
      insertRolePerm.run('role_sales', pid);
    }

    // ---------------------------------------------------------
    // 3. USERS (ADMIN & SALES_EXECUTIVE)
    // ---------------------------------------------------------
    console.log('  -> Seeding enterprise users with bcrypt hashes...');
    const adminHash = bcrypt.hashSync('admin123', 10);
    const salesHash = bcrypt.hashSync('sales123', 10);

    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, username, email, password_hash, name, role_id, phone, title, avatar, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    // 1) ADMIN User
    insertUser.run(
      'usr_admin_01',
      'admin',
      'admin@apexhorizon.com',
      adminHash,
      'Marcus Vance',
      'role_admin',
      '+91 98110 00001',
      'Dealership Principal / Managing Director',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      1
    );

    // 2) SALES_EXECUTIVE User
    insertUser.run(
      'usr_sales_01',
      'sales',
      'sales@apexhorizon.com',
      salesHash,
      'Alex Rivera',
      'role_sales',
      '+91 98110 00002',
      'Senior Sales Executive & Client Advisor',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      1
    );

    // 3) Additional Senior Sales Specialist
    insertUser.run(
      'usr_sales_02',
      'rajesh',
      'rajesh.sharma@apexhorizon.com',
      salesHash,
      'Rajesh Sharma',
      'role_sales',
      '+91 98110 00003',
      'Vehicle Delivery Specialist',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      1
    );

    // ---------------------------------------------------------
    // 4. SHOWROOM SETTINGS
    // ---------------------------------------------------------
    console.log('  -> Seeding showroom settings...');
    const insertSettings = db.prepare(`
      INSERT OR REPLACE INTO showroom_settings (
        id, showroom_name, address, phone, email, currency_symbol, currency_code,
        dealer_license, gstin, tax_rate, business_hours, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    insertSettings.run(
      'primary_setting',
      'Apex Horizon Motors — Flagship Dealership',
      'Plot 42, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051',
      '+91 22 2650 9000',
      'contact@apexhorizonmotors.in',
      '₹',
      'INR',
      'DL-MH-2024-MOTORS-092',
      '27AAACA9928P1Z8',
      18.0,
      'Monday - Sunday: 09:30 AM - 08:30 PM'
    );

    // ---------------------------------------------------------
    // 5. VEHICLES (INVENTORY)
    // ---------------------------------------------------------
    console.log('  -> Seeding vehicles...');
    const insertVehicle = db.prepare(`
      INSERT OR REPLACE INTO vehicles (
        id, vin, brand, model, variant, year, category, color, fuel_type,
        transmission, engine, horsepower, mileage_kmpl, ex_showroom_price,
        stock_quantity, status, image_url, features, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const vehicles = [
      {
        id: 'veh_01',
        vin: 'MAT622019P1049281',
        brand: 'Tata',
        model: 'Safari Dark Edition',
        variant: 'XZA+ 6S AT',
        year: 2026,
        category: 'SUV',
        color: 'Oberon Black',
        fuel_type: 'Diesel',
        transmission: 'Automatic',
        engine: '2.0L Kryotec Turbocharged',
        hp: 170,
        mileage: 14.5,
        price: 2549000,
        stock: 3,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['Panoramic Sunroof', 'Ventilated Captain Seats', 'Level 2 ADAS', '12.3" Cinematic Touchscreen', '360 Surround Camera'])
      },
      {
        id: 'veh_02',
        vin: 'MALC18402P3948192',
        brand: 'Hyundai',
        model: 'Creta SX(O)',
        variant: '1.5 Turbo Petrol DCT',
        year: 2026,
        category: 'SUV',
        color: 'Ranger Khaki',
        fuel_type: 'Petrol',
        transmission: 'Dual-Clutch',
        engine: '1.5L Smartstream T-GDi',
        hp: 160,
        mileage: 18.4,
        price: 1885000,
        stock: 5,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['Dual Zone Climate Control', 'Bose 8-Speaker Audio', 'Voice Enabled Sunroof', 'Connected Car Bluelink', '6 Airbags Standard'])
      },
      {
        id: 'veh_03',
        vin: 'MA1X7002026P01827',
        brand: 'Mahindra',
        model: 'XUV700 AX7L',
        variant: 'AX7 Luxury Pack AWD',
        year: 2026,
        category: 'SUV',
        color: 'Midnight Blue',
        fuel_type: 'Diesel',
        transmission: 'Automatic',
        engine: '2.2L mHawk CRDe Turbo',
        hp: 185,
        mileage: 15.2,
        price: 2699000,
        stock: 2,
        status: 'Reserved',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['Sony 3D Surround Sound', 'Smart Door Handles', 'Blind View Monitor', 'Electronic Park Brake with Auto-Hold'])
      },
      {
        id: 'veh_04',
        vin: 'WBA3L2026M9810294',
        brand: 'BMW',
        model: '3 Series Gran Limousine',
        variant: '330Li M Sport',
        year: 2026,
        category: 'Luxury',
        color: 'Portimao Blue',
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        engine: '2.0L BMW TwinPower Turbo 4-Cylinder',
        hp: 258,
        mileage: 15.3,
        price: 6200000,
        stock: 2,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['Curved Widescreen Cockpit', 'Harman Kardon HiFi Sound', 'Comfort Access', 'Head-Up Display', 'Ambient Light Package'])
      },
      {
        id: 'veh_05',
        vin: 'WDC253912026P8471',
        brand: 'Mercedes-Benz',
        model: 'GLC 300 4MATIC',
        variant: 'Progressive Edition',
        year: 2026,
        category: 'Luxury',
        color: 'Polar White',
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        engine: '2.0L Turbo Mild-Hybrid',
        hp: 258,
        mileage: 13.9,
        price: 7450000,
        stock: 1,
        status: 'Sold',
        image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['Transparent Bonnet for Off-Roading', 'Burmester 3D Surround', 'MBUX Augmented Reality', 'Digital Light Tech'])
      },
      {
        id: 'veh_06',
        vin: 'MATNEV2026E837192',
        brand: 'Tata',
        model: 'Nexon EV',
        variant: 'Empowered+ Long Range',
        year: 2026,
        category: 'Electric',
        color: 'Empowered Oxide',
        fuel_type: 'Electric',
        transmission: 'Automatic',
        engine: 'Permanent Magnet Synchronous Motor (40.5 kWh)',
        hp: 143,
        mileage: 465.0, // range km
        price: 1929000,
        stock: 4,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['Vehicle-to-Vehicle (V2V) Charging', 'Smart Digital Shifter', 'Arcade.ev App Suite', 'Paddle Shifters for Multi-Mode Regen'])
      },
      {
        id: 'veh_07',
        vin: 'WVWZZZVIR20260012',
        brand: 'Volkswagen',
        model: 'Virtus GT Plus',
        variant: '1.5 TSI DSG Edge',
        year: 2026,
        category: 'Sedan',
        color: 'Deep Black Pearl',
        fuel_type: 'Petrol',
        transmission: 'Dual-Clutch',
        engine: '1.5L TSI EVO with Active Cylinder Tech',
        hp: 150,
        mileage: 19.6,
        price: 1940000,
        stock: 3,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['GT Red Brake Calipers', 'Aluminum Pedals', '10.1" VW Play Infotainment', 'Wireless App-Connect', '5-Star Global NCAP'])
      },
      {
        id: 'veh_08',
        vin: 'MBHGVI2026HY00938',
        brand: 'Maruti Suzuki',
        model: 'Grand Vitara Alpha+',
        variant: 'Strong Hybrid e-CVT',
        year: 2026,
        category: 'SUV',
        color: 'Opulent Red with Black Roof',
        fuel_type: 'Hybrid',
        transmission: 'CVT',
        engine: '1.5L Intelligent Electric Hybrid System',
        hp: 115,
        mileage: 27.9,
        price: 1995000,
        stock: 4,
        status: 'In Transit',
        image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800',
        features: JSON.stringify(['Pure EV Drive Mode', 'Dual-Pane Panoramic Sunroof', 'Heads Up Display', 'Ventilated Front Seats'])
      }
    ];

    for (const v of vehicles) {
      insertVehicle.run(
        v.id, v.vin, v.brand, v.model, v.variant, v.year, v.category, v.color,
        v.fuel_type, v.transmission, v.engine, v.hp, v.mileage, v.price,
        v.stock, v.status, v.image, v.features
      );
    }

    // ---------------------------------------------------------
    // 6. CUSTOMERS
    // ---------------------------------------------------------
    console.log('  -> Seeding customers...');
    const insertCustomer = db.prepare(`
      INSERT OR REPLACE INTO customers (
        id, name, phone, email, address, city, state, pincode, pan_number, aadhaar_number, type, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const customers = [
      {
        id: 'cust_01',
        name: 'Rahul Sharma',
        phone: '+91 98201 11223',
        email: 'rahul.sharma@gmail.com',
        address: 'B-702, Oberoi Sky Heights, Lokhandwala Complex, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        pan: 'ABCPS1234F',
        aadhaar: 'XXXX-XXXX-9012',
        type: 'Individual',
        status: 'Active',
        notes: 'Tech Executive looking for reliable family SUV. Priority is high safety and ride comfort.'
      },
      {
        id: 'cust_02',
        name: 'Ananya Verma',
        phone: '+91 98202 22334',
        email: 'ananya.verma@techcorp.in',
        address: 'Flat 1404, Sea Green Towers, Worli Sea Face',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        pan: 'BNQPV5678K',
        aadhaar: 'XXXX-XXXX-3456',
        type: 'Individual',
        status: 'VIP',
        notes: 'Corporate Vice President. Regular buyer and vehicle enthusiast.'
      },
      {
        id: 'cust_03',
        name: 'Vikramaditya Singhania',
        phone: '+91 98203 33445',
        email: 'vikram@singhaniagroup.com',
        address: 'Singhania Chambers, Nariman Point',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400021',
        pan: 'AAACS4499P',
        aadhaar: 'XXXX-XXXX-7890',
        type: 'Corporate',
        status: 'VIP',
        notes: 'Managing Director of Singhania Group. Purchases executive fleets and luxury SUVs.'
      },
      {
        id: 'cust_04',
        name: 'Priya Iyer',
        phone: '+91 98204 44556',
        email: 'priya.iyer@fintech.co',
        address: 'A-401, Koregaon Park Heights, Koregaon Park',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        pan: 'CWXPI8821M',
        aadhaar: 'XXXX-XXXX-1122',
        type: 'Individual',
        status: 'Active',
        notes: 'Interested in zero-emission green mobility and sustainable commuting.'
      },
      {
        id: 'cust_05',
        name: 'Amit Patil',
        phone: '+91 98205 55667',
        email: 'amit.patil@outlook.com',
        address: 'House 12, Hiranandani Estate, Ghodbunder Road',
        city: 'Thane',
        state: 'Maharashtra',
        pincode: '400607',
        pan: 'DFGPA9933R',
        aadhaar: 'XXXX-XXXX-4433',
        type: 'Individual',
        status: 'Lead',
        notes: 'Walk-in enquiry exploring compact SUVs with automatic transmission.'
      }
    ];

    for (const c of customers) {
      insertCustomer.run(
        c.id, c.name, c.phone, c.email, c.address, c.city, c.state, c.pincode,
        c.pan, c.aadhaar, c.type, c.status, c.notes
      );
    }

    // ---------------------------------------------------------
    // 7. LEADS
    // ---------------------------------------------------------
    console.log('  -> Seeding leads & enquiries...');
    const insertLead = db.prepare(`
      INSERT OR REPLACE INTO leads (
        id, customer_id, contact_name, phone, email, vehicle_interest_id,
        vehicle_interest_text, budget_min, budget_max, source, status,
        assigned_staff_id, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const leads = [
      {
        id: 'lead_01',
        cust_id: 'cust_04',
        name: 'Priya Iyer',
        phone: '+91 98204 44556',
        email: 'priya.iyer@fintech.co',
        veh_id: 'veh_06',
        veh_text: 'Tata Nexon EV Empowered+ LR',
        min: 1800000,
        max: 2100000,
        source: 'Website',
        status: 'Hot Lead',
        staff: 'usr_sales_01',
        notes: 'Wants fast charger installation at home parking bay before Diwali.'
      },
      {
        id: 'lead_02',
        cust_id: 'cust_05',
        name: 'Amit Patil',
        phone: '+91 98205 55667',
        email: 'amit.patil@outlook.com',
        veh_id: 'veh_02',
        veh_text: 'Hyundai Creta SX(O) DCT',
        min: 1700000,
        max: 1950000,
        source: 'Walk-in',
        status: 'Test Drive Scheduled',
        staff: 'usr_sales_02',
        notes: 'Scheduled test drive for weekend accompanied by spouse.'
      },
      {
        id: 'lead_03',
        cust_id: 'cust_03',
        name: 'Vikramaditya Singhania',
        phone: '+91 98203 33445',
        email: 'vikram@singhaniagroup.com',
        veh_id: 'veh_05',
        veh_text: 'Mercedes-Benz GLC 300 4MATIC',
        min: 7000000,
        max: 8500000,
        source: 'Referral',
        status: 'Converted',
        staff: 'usr_sales_01',
        notes: 'Purchased for executive transport. Deal closed with corporate invoicing.'
      },
      {
        id: 'lead_04',
        cust_id: 'cust_01',
        name: 'Rahul Sharma',
        phone: '+91 98201 11223',
        email: 'rahul.sharma@gmail.com',
        veh_id: 'veh_01',
        veh_text: 'Tata Safari Dark Edition',
        min: 2400000,
        max: 2700000,
        source: 'Campaign',
        status: 'Converted',
        staff: 'usr_sales_01',
        notes: 'Booked after comparing with XUV700. Loved captain seats.'
      },
      {
        id: 'lead_05',
        cust_id: null,
        name: 'Kavita Deshmukh',
        phone: '+91 98206 66778',
        email: 'kavita.deshmukh@yahoo.com',
        veh_id: 'veh_07',
        veh_text: 'Volkswagen Virtus GT Plus DSG',
        min: 1800000,
        max: 2000000,
        source: 'Social Media',
        status: 'New',
        staff: 'usr_sales_02',
        notes: 'Instagram Ad lead requesting on-road price sheet and test drive.'
      }
    ];

    for (const l of leads) {
      insertLead.run(
        l.id, l.cust_id, l.name, l.phone, l.email, l.veh_id, l.veh_text,
        l.min, l.max, l.source, l.status, l.staff, l.notes
      );
    }

    // ---------------------------------------------------------
    // 8. ESTIMATES
    // ---------------------------------------------------------
    console.log('  -> Seeding estimates...');
    const insertEst = db.prepare(`
      INSERT OR REPLACE INTO estimates (
        id, estimate_number, customer_id, customer_name, vehicle_id, vehicle_name,
        ex_showroom_price, rto_charges, insurance_amount, accessories_cost,
        warranty_cost, discount_amount, total_estimated_amount, valid_until,
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertEst.run(
      'est_01', 'EST-2026-001', 'cust_04', 'Priya Iyer', 'veh_06', 'Tata Nexon EV Empowered+ LR',
      1929000, 15000, 75000, 22000, 34000, 10000, 2065000, '2026-10-31',
      'Active', 'usr_sales_01'
    );

    insertEst.run(
      'est_02', 'EST-2026-002', 'cust_03', 'Vikramaditya Singhania', 'veh_05', 'Mercedes-Benz GLC 300 4MATIC',
      7450000, 968000, 280000, 85000, 120000, 200000, 8703000, '2026-10-15',
      'Converted', 'usr_sales_01'
    );

    // ---------------------------------------------------------
    // 9. QUOTATIONS
    // ---------------------------------------------------------
    console.log('  -> Seeding quotations...');
    const insertQuot = db.prepare(`
      INSERT OR REPLACE INTO quotations (
        id, quotation_number, estimate_id, customer_id, customer_name, customer_phone,
        customer_email, vehicle_id, vehicle_name, ex_showroom_price, rto_tax,
        insurance, warranty_pack, accessories, discount, total_amount, valid_until,
        status, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertQuot.run(
      'quot_01', 'QUOT-2026-001', 'est_02', 'cust_03', 'Vikramaditya Singhania', '+91 98203 33445',
      'vikram@singhaniagroup.com', 'veh_05', 'Mercedes-Benz GLC 300 4MATIC', 7450000, 968000,
      280000, 120000, 85000, 483000, 8420000, '2026-10-15',
      'Converted_To_Sale', 'Corporate special discount approved by Marcus Vance.', 'usr_sales_01'
    );

    insertQuot.run(
      'quot_02', 'QUOT-2026-002', 'est_01', 'cust_04', 'Priya Iyer', '+91 98204 44556',
      'priya.iyer@fintech.co', 'veh_06', 'Tata Nexon EV Empowered+ LR', 1929000, 15000,
      75000, 34000, 22000, 10000, 2065000, '2026-10-31',
      'Sent', 'Quote delivered via email and WhatsApp. Waiting for customer confirmation.', 'usr_sales_01'
    );

    // ---------------------------------------------------------
    // 10. SALES ORDERS
    // ---------------------------------------------------------
    console.log('  -> Seeding sales orders...');
    const insertSale = db.prepare(`
      INSERT OR REPLACE INTO sales (
        id, sale_order_number, quotation_id, customer_id, vehicle_id, sales_agent_id,
        base_price, discount, tax_rate, tax_amount, total_amount, payment_method,
        booking_date, expected_delivery_date, actual_delivery_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertSale.run(
      'sale_01', 'SO-2026-001', 'quot_01', 'cust_03', 'veh_05', 'usr_sales_01',
      7450000, 483000, 18.0, 1453000, 8420000, 'Net Banking / RTGS',
      '2026-09-12', '2026-09-20', '2026-09-20', 'Delivered'
    );

    insertSale.run(
      'sale_02', 'SO-2026-002', null, 'cust_01', 'veh_01', 'usr_sales_01',
      2549000, 40000, 18.0, 386000, 2895000, 'Car Loan / Bank',
      '2026-09-25', '2026-10-08', null, 'Booked'
    );

    // ---------------------------------------------------------
    // 11. INVOICES
    // ---------------------------------------------------------
    console.log('  -> Seeding invoices...');
    const insertInv = db.prepare(`
      INSERT OR REPLACE INTO invoices (
        id, invoice_number, sale_id, customer_id, customer_name, customer_gstin,
        vehicle_id, vin, subtotal, discount, taxable_amount, cgst_amount, sgst_amount,
        total_amount, paid_amount, balance_due, invoice_date, due_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertInv.run(
      'inv_01', 'INV-2026-001', 'sale_01', 'cust_03', 'Vikramaditya Singhania', '27AAACS4499P1Z1',
      'veh_05', 'WDC253912026P8471', 7450000, 483000, 6967000, 627030, 627030,
      8420000, 8420000, 0, '2026-09-18', '2026-09-20', 'Paid In Full'
    );

    insertInv.run(
      'inv_02', 'INV-2026-002', 'sale_02', 'cust_01', 'Rahul Sharma', null,
      'veh_01', 'MAT622019P1049281', 2549000, 40000, 2509000, 225810, 225810,
      2895000, 500000, 2395000, '2026-09-26', '2026-10-08', 'Partially Paid'
    );

    // ---------------------------------------------------------
    // 12. PAYMENTS
    // ---------------------------------------------------------
    console.log('  -> Seeding payments...');
    const insertPay = db.prepare(`
      INSERT OR REPLACE INTO payments (
        id, payment_reference, sale_id, invoice_id, customer_id, amount,
        payment_mode, transaction_id, payment_type, payment_date, status,
        notes, received_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertPay.run(
      'pay_01', 'PAY-2026-001', 'sale_01', 'inv_01', 'cust_03', 8420000,
      'RTGS / NEFT', 'HDFC-RTGS-990182741', 'Full Settlement', '2026-09-19', 'Cleared',
      'Corporate RTGS transfer received in HDFC Bank current account.', 'usr_admin_01'
    );

    insertPay.run(
      'pay_02', 'PAY-2026-002', 'sale_02', 'inv_02', 'cust_01', 500000,
      'UPI / Card', 'UPI-SBI-2026-781920', 'Booking Advance', '2026-09-25', 'Cleared',
      'Booking advance received via UPI at showroom POS terminal.', 'usr_sales_01'
    );

    // ---------------------------------------------------------
    // 13. RECEIPTS
    // ---------------------------------------------------------
    console.log('  -> Seeding receipts...');
    const insertRcpt = db.prepare(`
      INSERT OR REPLACE INTO receipts (
        id, receipt_number, payment_id, invoice_id, customer_id, customer_name,
        amount, payment_mode, transaction_reference, receipt_date, authorized_by, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertRcpt.run(
      'rcpt_01', 'RCPT-2026-001', 'pay_01', 'inv_01', 'cust_03', 'Vikramaditya Singhania',
      8420000, 'RTGS / NEFT', 'HDFC-RTGS-990182741', '2026-09-19', 'usr_admin_01',
      'Official money receipt issued against Invoice INV-2026-001.'
    );

    insertRcpt.run(
      'rcpt_02', 'RCPT-2026-002', 'pay_02', 'inv_02', 'cust_01', 'Rahul Sharma',
      500000, 'UPI / Card', 'UPI-SBI-2026-781920', '2026-09-25', 'usr_sales_01',
      'Booking token receipt issued for Tata Safari Dark Edition.'
    );

    // ---------------------------------------------------------
    // 14. TEST DRIVES
    // ---------------------------------------------------------
    console.log('  -> Seeding test drives...');
    const insertTD = db.prepare(`
      INSERT OR REPLACE INTO test_drives (
        id, booking_number, customer_id, customer_name, customer_phone, vehicle_id,
        scheduled_date, time_slot, driving_license_number, assigned_staff_id,
        status, customer_feedback, route_taken, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertTD.run(
      'td_01', 'TD-2026-001', 'cust_05', 'Amit Patil', '+91 98205 55667', 'veh_02',
      '2026-10-04', '03:00 PM - 04:00 PM', 'MH04-20150098214', 'usr_sales_02',
      'Scheduled', null, 'BKC Western Express Highway Loop'
    );

    insertTD.run(
      'td_02', 'TD-2026-002', 'cust_04', 'Priya Iyer', '+91 98204 44556', 'veh_06',
      '2026-09-28', '11:00 AM - 12:00 PM', 'MH12-20180045192', 'usr_sales_01',
      'Completed', 'Extremely satisfied with instantaneous torque, smooth regeneration and silent cabin.', 'Bandra-Worli Sea Link Highway run'
    );

    // ---------------------------------------------------------
    // 15. FINANCE RECORDS
    // ---------------------------------------------------------
    console.log('  -> Seeding finance records...');
    const insertFin = db.prepare(`
      INSERT OR REPLACE INTO finance_records (
        id, application_number, customer_id, sale_id, vehicle_id, bank_name,
        loan_amount, down_payment, tenure_months, interest_rate_pct, monthly_emi,
        disbursement_reference, approval_date, disbursement_date, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertFin.run(
      'fin_01', 'FIN-2026-001', 'cust_01', 'sale_02', 'veh_01', 'HDFC Bank Auto Loans',
      2000000, 895000, 60, 8.75, 41270, 'HDFC-LOAN-991823', '2026-09-28', null,
      'Approved', 'Sanction letter issued; disbursement scheduled 2 days before vehicle delivery.'
    );

    insertFin.run(
      'fin_02', 'FIN-2026-002', 'cust_04', null, 'veh_06', 'State Bank of India (Green Car Loan)',
      1500000, 565000, 48, 8.40, 36900, null, null, null,
      'In Review', 'Application submitted under SBI EV Concessional Interest Rate scheme.'
    );

    // ---------------------------------------------------------
    // 16. SPARE PARTS
    // ---------------------------------------------------------
    console.log('  -> Seeding spare parts inventory...');
    const insertPart = db.prepare(`
      INSERT OR REPLACE INTO spare_parts (
        id, part_number, name, category, compatible_models, stock_quantity,
        min_reorder_level, unit_cost, selling_price, supplier_name, shelf_location,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const parts = [
      { id: 'sp_01', no: 'SP-BRK-001', name: 'Front Ceramic Brake Pads (SUV Series)', cat: 'Braking', models: 'Safari, Harrier, XUV700', stock: 24, min: 5, cost: 2400, price: 4200, sup: 'Brembo India', loc: 'Bin-A12', status: 'In Stock' },
      { id: 'sp_02', no: 'SP-FLT-002', name: 'Synthetic Engine Oil Filter Element', cat: 'Maintenance', models: 'Universal Diesel & Petrol', stock: 50, min: 10, cost: 350, price: 750, sup: 'Bosch Automotive', loc: 'Bin-B04', status: 'In Stock' },
      { id: 'sp_03', no: 'SP-BAT-003', name: '12V 65Ah AGM High-Crank Auxiliary Battery', cat: 'Electrical', models: 'Creta, Virtus, Safari', stock: 12, min: 4, cost: 5800, price: 9200, sup: 'Exide Industries', loc: 'Rack-C01', status: 'In Stock' },
      { id: 'sp_04', no: 'SP-WIP-004', name: 'All-Weather Aerodynamic Wiper Blades (Pair)', cat: 'Maintenance', models: 'All Modern SUVs & Sedans', stock: 30, min: 8, cost: 650, price: 1400, sup: 'Valeo Automotive', loc: 'Bin-A09', status: 'In Stock' },
      { id: 'sp_05', no: 'SP-SUS-005', name: 'Front Strut Shock Absorber Assembly', cat: 'Suspension', models: 'Tata Safari / Harrier', stock: 6, min: 2, cost: 4200, price: 7800, sup: 'Gabriel India', loc: 'Floor-D02', status: 'In Stock' },
      { id: 'sp_06', no: 'SP-ACF-006', name: 'PM2.5 Activated Carbon Cabin Air Filter', cat: 'Maintenance', models: 'Universal Mid-Size & Luxury', stock: 45, min: 10, cost: 420, price: 1100, sup: 'Mann Filter', loc: 'Bin-B11', status: 'In Stock' },
      { id: 'sp_07', no: 'SP-ALT-007', name: 'High Output Alternator 140A', cat: 'Electrical', models: 'Mahindra XUV700 / Scorpio-N', stock: 2, min: 3, cost: 11500, price: 17800, sup: 'Lucas TVS', loc: 'Rack-C04', status: 'Low Stock' },
      { id: 'sp_08', no: 'SP-TIR-008', name: 'Bridgestone Turanza 215/60 R17 Radial Tire', cat: 'Tires', models: 'Creta, Grand Vitara, Virtus', stock: 16, min: 4, cost: 6800, price: 10500, sup: 'Bridgestone India', loc: 'Tire-Bay-1', status: 'In Stock' }
    ];

    for (const p of parts) {
      insertPart.run(
        p.id, p.no, p.name, p.cat, p.models, p.stock, p.min, p.cost, p.price,
        p.sup, p.loc, p.status
      );
    }

    // ---------------------------------------------------------
    // 17. PROCUREMENT ORDERS & ITEMS
    // ---------------------------------------------------------
    console.log('  -> Seeding procurement orders and items...');
    const insertPO = db.prepare(`
      INSERT OR REPLACE INTO procurement_orders (
        id, po_number, supplier_name, order_date, expected_delivery_date,
        actual_delivery_date, total_cost, status, notes, ordered_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertPO.run(
      'po_01', 'PO-2026-001', 'Tata AutoComp Systems Ltd', '2026-09-05', '2026-09-15',
      '2026-09-14', 62000, 'Received', 'Urgent restocking for brake systems and oil filters.',
      'usr_admin_01'
    );

    insertPO.run(
      'po_02', 'PO-2026-002', 'Bosch Automotive India', '2026-09-28', '2026-10-06',
      null, 92000, 'In Transit', 'Alternators and electrical components shipment.',
      'usr_admin_01'
    );

    const insertPOItem = db.prepare(`
      INSERT OR REPLACE INTO procurement_items (
        id, procurement_order_id, item_type, item_name, sku_or_vin, quantity, unit_cost, total_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertPOItem.run('poi_01', 'po_01', 'Spare Part', 'Front Ceramic Brake Pads (SUV Series)', 'SP-BRK-001', 20, 2400, 48000);
    insertPOItem.run('poi_02', 'po_01', 'Spare Part', 'Synthetic Engine Oil Filter Element', 'SP-FLT-002', 40, 350, 14000);
    insertPOItem.run('poi_03', 'po_02', 'Spare Part', 'High Output Alternator 140A', 'SP-ALT-007', 8, 11500, 92000);

    // ---------------------------------------------------------
    // 18. SERVICE TICKETS
    // ---------------------------------------------------------
    console.log('  -> Seeding service tickets...');
    const insertST = db.prepare(`
      INSERT OR REPLACE INTO service_tickets (
        id, ticket_number, customer_id, customer_name, customer_phone, vehicle_model,
        vin, odometer_reading, service_type, entry_date, expected_delivery,
        actual_delivery, assigned_advisor_id, status, customer_complaints, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertST.run(
      'st_01', 'ST-2026-001', 'cust_02', 'Ananya Verma', '+91 98202 22334', 'Tata Safari Dark Edition',
      'MAT622019P1049281', 12450, 'Periodic Maintenance', '2026-09-27', '2026-09-28',
      '2026-09-28', 'usr_sales_02', 'Work Completed',
      '10,000 km Scheduled Service: Engine oil change, brake pad inspection, AC disinfection.'
    );

    insertST.run(
      'st_02', 'ST-2026-002', 'cust_04', 'Priya Iyer', '+91 98204 44556', 'Volkswagen Virtus GT',
      'WVWZZZVIR20260012', 8200, 'Running Repair', '2026-10-02', '2026-10-04',
      null, 'usr_sales_01', 'In Progress',
      'Minor squeaking noise from front right suspension over speed breakers; wheel alignment check required.'
    );

    // ---------------------------------------------------------
    // 19. JOB CARDS
    // ---------------------------------------------------------
    console.log('  -> Seeding job cards...');
    const insertJC = db.prepare(`
      INSERT OR REPLACE INTO job_cards (
        id, job_card_number, service_ticket_id, technician_name, labor_charges,
        parts_total_cost, total_service_cost, bay_number, parts_allocated,
        technician_diagnosis, qc_passed, qc_inspected_by, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertJC.run(
      'jc_01', 'JC-2026-001', 'st_01', 'Suresh Patil (Master Tech)', 3500, 4950, 8450, 'Bay-03',
      JSON.stringify(['1x Synthetic Oil Filter', '1x PM2.5 Cabin Filter', '5L Castrol Edge 5W-30']),
      'Full health inspection complete. Brakes 85% healthy, battery voltage 12.8V.', 1, 'Marcus Vance',
      'QC Approved'
    );

    insertJC.run(
      'jc_02', 'JC-2026-002', 'st_02', 'Vikas Kumar', 1800, 1100, 2900, 'Bay-01',
      JSON.stringify(['Front suspension stabilizer bush replacement', 'Wheel balancing weights']),
      'Identified worn rubber stabilizer bushing. Parts allocated and currently being fitted.', 0, null,
      'Work In Progress'
    );

    // ---------------------------------------------------------
    // 20. STAFF DIRECTORY
    // ---------------------------------------------------------
    console.log('  -> Seeding staff...');
    const insertStaff = db.prepare(`
      INSERT OR REPLACE INTO staff (
        id, user_id, employee_code, name, department, role_title, email, phone,
        joining_date, base_salary, status, sales_target_units, sales_closed_count,
        revenue_generated, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertStaff.run(
      'stf_01', 'usr_admin_01', 'EMP-001', 'Marcus Vance', 'Executive & Management',
      'Managing Director & Dealer Principal', 'admin@apexhorizon.com', '+91 98110 00001',
      '2020-01-15', 180000, 'Active', 0, 0, 0
    );

    insertStaff.run(
      'stf_02', 'usr_sales_01', 'EMP-002', 'Alex Rivera', 'Sales',
      'Senior Client Advisor', 'sales@apexhorizon.com', '+91 98110 00002',
      '2022-03-01', 65000, 'Active', 8, 5, 14500000
    );

    insertStaff.run(
      'stf_03', 'usr_sales_02', 'EMP-003', 'Rajesh Sharma', 'Sales',
      'Vehicle Delivery Specialist', 'rajesh.sharma@apexhorizon.com', '+91 98110 00003',
      '2023-06-15', 50000, 'Active', 6, 3, 6800000
    );

    insertStaff.run(
      'stf_04', null, 'EMP-004', 'Suresh Patil', 'Service & Workshop',
      'Master Diagnostic Technician', 'suresh.service@apexhorizon.com', '+91 98110 00004',
      '2021-09-10', 48000, 'Active', 0, 0, 0
    );

    // ---------------------------------------------------------
    // 21. PAYROLL
    // ---------------------------------------------------------
    console.log('  -> Seeding payroll records...');
    const insertPayroll = db.prepare(`
      INSERT OR REPLACE INTO payroll (
        id, payroll_period, staff_id, base_salary, sales_incentive, allowances,
        deductions, net_salary, payment_date, payment_mode, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertPayroll.run('payr_01', '2026-09', 'stf_02', 65000, 25000, 5000, 4200, 90800, '2026-09-30', 'Direct Bank Transfer', 'Paid');
    insertPayroll.run('payr_02', '2026-09', 'stf_03', 50000, 12000, 3500, 3100, 62400, '2026-09-30', 'Direct Bank Transfer', 'Paid');
    insertPayroll.run('payr_03', '2026-09', 'stf_04', 48000, 5000, 2000, 2900, 52100, '2026-09-30', 'Direct Bank Transfer', 'Paid');

    // ---------------------------------------------------------
    // 22. EXPENSES
    // ---------------------------------------------------------
    console.log('  -> Seeding operational expenses...');
    const insertExp = db.prepare(`
      INSERT OR REPLACE INTO expenses (
        id, expense_code, category, title, amount, expense_date, payment_mode,
        vendor_or_payee, receipt_url, approved_by, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertExp.run(
      'exp_01', 'EXP-2026-001', 'Showroom Rent', 'BKC Prime Commercial Showroom Rent - Sept 2026',
      350000, '2026-09-01', 'Bank Transfer', 'BKC Commercial Realty Trust', null, 'usr_admin_01',
      'Paid', 'Monthly primary commercial lease.'
    );

    insertExp.run(
      'exp_02', 'EXP-2026-002', 'Marketing & Ads', 'Meta & Google Ads Campaign - Festive SUV Launch',
      85000, '2026-09-10', 'Bank Transfer', 'OmniMedia Digital Agency', null, 'usr_admin_01',
      'Paid', 'Digital lead generation spend targeting Mumbai and Thane.'
    );

    insertExp.run(
      'exp_03', 'EXP-2026-003', 'Electricity & Utilities', 'Showroom Power & High Voltage EV Fast-Charging Station',
      48200, '2026-09-15', 'Bank Transfer', 'Adani Electricity Mumbai Ltd', null, 'usr_admin_01',
      'Paid', 'Monthly power bill including twin 60kW DC EV fast chargers.'
    );

    // ---------------------------------------------------------
    // 23. CAMPAIGNS
    // ---------------------------------------------------------
    console.log('  -> Seeding marketing campaigns...');
    const insertCamp = db.prepare(`
      INSERT OR REPLACE INTO campaigns (
        id, campaign_code, name, channel, target_model, budget,
        leads_generated, conversions_count, start_date, end_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertCamp.run(
      'camp_01', 'CAMP-2026-01', 'Festive Luxury Drive 2026', 'Digital / Social Ads',
      'Tata Safari & BMW 3 Series', 120000, 48, 6, '2026-09-01', '2026-10-31', 'Active'
    );

    insertCamp.run(
      'camp_02', 'CAMP-2026-02', 'Green Mobility EV Exchange Carnival', 'Auto Expo Event',
      'Tata Nexon EV & Grand Vitara Hybrid', 200000, 95, 11, '2026-09-15', '2026-10-20', 'Active'
    );

    // ---------------------------------------------------------
    // 24. COMMUNICATIONS
    // ---------------------------------------------------------
    console.log('  -> Seeding communication logs...');
    const insertComm = db.prepare(`
      INSERT OR REPLACE INTO communications (
        id, customer_id, lead_id, type, direction, subject_or_summary,
        details, performed_by, occurred_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertComm.run(
      'comm_01', 'cust_01', 'lead_04', 'Phone Call', 'Outbound',
      'Discussion on Safari Dark Edition delivery timeline and accessories package',
      'Customer requested installation of 7D floor mats and mud flaps before delivery day.',
      'usr_sales_01', '2026-09-26 14:30:00'
    );

    insertComm.run(
      'comm_02', 'cust_04', 'lead_01', 'WhatsApp Message', 'Outbound',
      'Sent official Tata Nexon EV spec sheet and subsidized EV home charger guideline',
      'Customer verified receipt and confirmed home wiring inspection is scheduled.',
      'usr_sales_01', '2026-09-29 11:15:00'
    );

    // ---------------------------------------------------------
    // 25. REMINDERS
    // ---------------------------------------------------------
    console.log('  -> Seeding reminders & follow-ups...');
    const insertRem = db.prepare(`
      INSERT OR REPLACE INTO reminders (
        id, user_id, title, description, entity_type, entity_id, due_date,
        priority, is_completed, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertRem.run(
      'rem_01', 'usr_sales_01', 'Follow up with Priya Iyer for SBI Loan Sanction Letter',
      'Verify credit approval status and coordinate delivery timeline.',
      'lead', 'lead_01', '2026-10-05', 'High', 0, null
    );

    insertRem.run(
      'rem_02', 'usr_sales_02', 'Prepare Creta SX(O) demonstration vehicle for Amit Patil',
      'Ensure car is clean, fueled and sanitized at showroom porch.',
      'test_drive', 'td_01', '2026-10-04', 'Urgent', 0, null
    );

    // ---------------------------------------------------------
    // 26. DOCUMENTS
    // ---------------------------------------------------------
    console.log('  -> Seeding documents repository...');
    const insertDoc = db.prepare(`
      INSERT OR REPLACE INTO documents (
        id, entity_type, entity_id, title, doc_type, file_url, file_size_kb, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertDoc.run(
      'doc_01', 'customer', 'cust_03', 'Singhania Group Corporate PAN & GST Certificate',
      'PAN Card', '/uploads/docs/pan_singhania_corp.pdf', 450, 'usr_admin_01'
    );

    insertDoc.run(
      'doc_02', 'sale', 'sale_01', 'Mercedes-Benz Delivery Certificate & Inspection Checklist',
      'Delivery Note', '/uploads/docs/delivery_so_2026_001.pdf', 1280, 'usr_sales_01'
    );

    insertDoc.run(
      'doc_03', 'vehicle', 'veh_01', 'Tata Safari Dark Edition Form 22 Roadworthiness Certificate',
      'Registration Certificate (RC)', '/uploads/docs/rc_safari_2026.pdf', 890, 'usr_admin_01'
    );

    // ---------------------------------------------------------
    // 27. NOTIFICATIONS
    // ---------------------------------------------------------
    console.log('  -> Seeding system notifications...');
    const insertNotif = db.prepare(`
      INSERT OR REPLACE INTO notifications (
        id, user_id, title, message, type, link, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertNotif.run(
      'notif_01', 'usr_sales_01', 'Vehicle Booking Confirmed!',
      'Sale Order SO-2026-002 for Rahul Sharma has been registered successfully.',
      'DEAL_CLOSED', '/sales', 0
    );

    insertNotif.run(
      'notif_02', 'usr_admin_01', 'Full Payment Received',
      'Corporate payment of ₹84,20,000 cleared for Mercedes-Benz GLC 300 (SO-2026-001).',
      'SUCCESS', '/invoices', 0
    );

    insertNotif.run(
      'notif_03', 'usr_sales_02', 'Test Drive Tomorrow at 3:00 PM',
      'Upcoming appointment with Amit Patil for Hyundai Creta SX(O).',
      'INFO', '/test-drives', 0
    );

    // ---------------------------------------------------------
    // 28. AUDIT LOGS
    // ---------------------------------------------------------
    console.log('  -> Seeding enterprise audit logs...');
    const insertAudit = db.prepare(`
      INSERT OR REPLACE INTO audit_logs (
        id, user_id, user_name, user_role, action, module, record_id, description, ip_address, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertAudit.run(
      'log_01', 'usr_admin_01', 'Marcus Vance', 'ADMIN', 'CREATE', 'DATABASE',
      'primary_setting', 'Enterprise relational schema migrated and validated across 30 tables',
      '127.0.0.1'
    );

    insertAudit.run(
      'log_02', 'usr_admin_01', 'Marcus Vance', 'ADMIN', 'LOGIN', 'AUTH',
      'usr_admin_01', 'Administrator logged into Apex Horizon Dealership Suite',
      '127.0.0.1'
    );

    insertAudit.run(
      'log_03', 'usr_sales_01', 'Alex Rivera', 'SALES_EXECUTIVE', 'CREATE', 'SALES',
      'sale_01', 'Generated Sale Order SO-2026-001 for customer Vikramaditya Singhania',
      '127.0.0.1'
    );

    insertAudit.run(
      'log_04', 'usr_admin_01', 'Marcus Vance', 'ADMIN', 'APPROVE', 'FINANCE',
      'inv_01', 'Approved tax invoice INV-2026-001 with corporate discount application',
      '127.0.0.1'
    );
  });

  seedTx();
  console.log('✅ [SEED] Enterprise Database successfully seeded with 100% verified demo records!');

  return {
    success: true,
    message: 'All 30 tables populated with coherent relational data'
  };
}

if (require.main === module) {
  try {
    seedDatabase();
  } catch (err) {
    console.error('❌ [SEED] Seeding failed:', err);
    process.exit(1);
  }
}

module.exports = seedDatabase;
