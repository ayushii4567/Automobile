-- ============================================================================
-- APEX HORIZON MOTORS — ENTERPRISE DATABASE SCHEMA
-- Engine: SQLite 3 with Foreign Keys, Check Constraints, and Indexes
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK(name IN ('ADMIN', 'SALES_EXECUTIVE')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  phone TEXT,
  title TEXT,
  avatar TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. SHOWROOM_SETTINGS
CREATE TABLE IF NOT EXISTS showroom_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary_setting',
  showroom_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  currency_symbol TEXT DEFAULT '₹',
  currency_code TEXT DEFAULT 'INR',
  dealer_license TEXT,
  gstin TEXT,
  tax_rate REAL DEFAULT 10.0,
  business_hours TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  year INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('SUV', 'Sedan', 'Hatchback', 'Luxury', 'Electric', 'Commercial')),
  color TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK(fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG')),
  transmission TEXT NOT NULL CHECK(transmission IN ('Manual', 'Automatic', 'CVT', 'Dual-Clutch')),
  engine TEXT,
  horsepower INTEGER,
  mileage_kmpl REAL,
  ex_showroom_price REAL NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 1 CHECK(stock_quantity >= 0),
  status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available', 'Reserved', 'In Transit', 'Sold', 'Maintenance')),
  image_url TEXT,
  features TEXT, -- JSON Array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Mumbai',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT,
  pan_number TEXT,
  aadhaar_number TEXT,
  type TEXT NOT NULL DEFAULT 'Individual' CHECK(type IN ('Individual', 'Corporate')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Lead', 'Active', 'VIP', 'Inactive')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. LEADS
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vehicle_interest_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_interest_text TEXT,
  budget_min REAL,
  budget_max REAL,
  source TEXT NOT NULL DEFAULT 'Walk-in' CHECK(source IN ('Walk-in', 'Website', 'Phone', 'Referral', 'Social Media', 'Campaign')),
  status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'Contacted', 'Test Drive Scheduled', 'Hot Lead', 'Warm Lead', 'Cold', 'Converted', 'Lost')),
  assigned_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. ESTIMATES
CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  estimate_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT NOT NULL,
  ex_showroom_price REAL NOT NULL,
  rto_charges REAL NOT NULL DEFAULT 0,
  insurance_amount REAL NOT NULL DEFAULT 0,
  accessories_cost REAL NOT NULL DEFAULT 0,
  warranty_cost REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  total_estimated_amount REAL NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Draft', 'Active', 'Converted', 'Expired')),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. QUOTATIONS
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  quotation_number TEXT UNIQUE NOT NULL,
  estimate_id TEXT REFERENCES estimates(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT NOT NULL,
  ex_showroom_price REAL NOT NULL,
  rto_tax REAL NOT NULL DEFAULT 0,
  insurance REAL NOT NULL DEFAULT 0,
  warranty_pack REAL NOT NULL DEFAULT 0,
  accessories REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Converted_To_Sale')),
  notes TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. SALES
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  sale_order_number TEXT UNIQUE NOT NULL,
  quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  sales_agent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  base_price REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 10,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Car Loan / Bank' CHECK(payment_method IN ('Net Banking / RTGS', 'Car Loan / Bank', 'UPI / Card', 'Cheque', 'Cash')),
  booking_date TEXT NOT NULL,
  expected_delivery_date TEXT,
  actual_delivery_date TEXT,
  status TEXT NOT NULL DEFAULT 'Booked' CHECK(status IN ('Booked', 'Processing', 'Delivered', 'Cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  sale_id TEXT UNIQUE NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_gstin TEXT,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  vin TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  taxable_amount REAL NOT NULL,
  cgst_amount REAL NOT NULL DEFAULT 0,
  sgst_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  balance_due REAL NOT NULL DEFAULT 0,
  invoice_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Issued' CHECK(status IN ('Draft', 'Issued', 'Partially Paid', 'Paid In Full', 'Cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 13. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  payment_reference TEXT UNIQUE NOT NULL,
  sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL CHECK(payment_mode IN ('RTGS / NEFT', 'Car Loan / Bank', 'UPI / Card', 'Cheque', 'Cash')),
  transaction_id TEXT,
  payment_type TEXT NOT NULL DEFAULT 'Down Payment' CHECK(payment_type IN ('Booking Advance', 'Down Payment', 'Full Settlement', 'Service Bill', 'Exchange Adjustment')),
  payment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Cleared' CHECK(status IN ('Pending', 'Cleared', 'Failed', 'Bounced', 'Refunded')),
  notes TEXT,
  received_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. RECEIPTS
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  payment_id TEXT UNIQUE NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL,
  transaction_reference TEXT,
  receipt_date TEXT NOT NULL,
  authorized_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 15. TEST_DRIVES
CREATE TABLE IF NOT EXISTS test_drives (
  id TEXT PRIMARY KEY,
  booking_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  scheduled_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  driving_license_number TEXT NOT NULL,
  assigned_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
  customer_feedback TEXT,
  route_taken TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 16. FINANCE_RECORDS
CREATE TABLE IF NOT EXISTS finance_records (
  id TEXT PRIMARY KEY,
  application_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  bank_name TEXT NOT NULL,
  loan_amount REAL NOT NULL,
  down_payment REAL NOT NULL DEFAULT 0,
  tenure_months INTEGER NOT NULL,
  interest_rate_pct REAL NOT NULL,
  monthly_emi REAL NOT NULL,
  disbursement_reference TEXT,
  approval_date TEXT,
  disbursement_date TEXT,
  status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'In Review', 'Approved', 'Disbursed', 'Rejected')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 17. SPARE_PARTS
CREATE TABLE IF NOT EXISTS spare_parts (
  id TEXT PRIMARY KEY,
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Braking', 'Maintenance', 'Electrical', 'Engine', 'Suspension', 'Body & Glass', 'Accessories', 'Tires')),
  compatible_models TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
  min_reorder_level INTEGER NOT NULL DEFAULT 3,
  unit_cost REAL NOT NULL,
  selling_price REAL NOT NULL,
  supplier_name TEXT,
  shelf_location TEXT,
  status TEXT NOT NULL DEFAULT 'In Stock' CHECK(status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Discontinued')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 18. PROCUREMENT_ORDERS
CREATE TABLE IF NOT EXISTS procurement_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_name TEXT NOT NULL,
  order_date TEXT NOT NULL,
  expected_delivery_date TEXT,
  actual_delivery_date TEXT,
  total_cost REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Ordered', 'In Transit', 'Received', 'Cancelled')),
  notes TEXT,
  ordered_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 19. PROCUREMENT_ITEMS
CREATE TABLE IF NOT EXISTS procurement_items (
  id TEXT PRIMARY KEY,
  procurement_order_id TEXT NOT NULL REFERENCES procurement_orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('Vehicle', 'Spare Part')),
  item_name TEXT NOT NULL,
  sku_or_vin TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 20. SERVICE_TICKETS
CREATE TABLE IF NOT EXISTS service_tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vin TEXT,
  odometer_reading INTEGER,
  service_type TEXT NOT NULL CHECK(service_type IN ('First Free Service', 'Periodic Maintenance', 'Running Repair', 'Accidental Repair', 'Warranty Claim', 'Detailing & Polish')),
  entry_date TEXT NOT NULL,
  expected_delivery TEXT,
  actual_delivery TEXT,
  assigned_advisor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'Job Card Issued', 'In Progress', 'Awaiting Parts', 'Work Completed', 'Invoiced', 'Delivered', 'Cancelled')),
  customer_complaints TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 21. JOB_CARDS
CREATE TABLE IF NOT EXISTS job_cards (
  id TEXT PRIMARY KEY,
  job_card_number TEXT UNIQUE NOT NULL,
  service_ticket_id TEXT UNIQUE NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  technician_name TEXT NOT NULL,
  labor_charges REAL NOT NULL DEFAULT 0,
  parts_total_cost REAL NOT NULL DEFAULT 0,
  total_service_cost REAL NOT NULL DEFAULT 0,
  bay_number TEXT DEFAULT 'Bay-1',
  parts_allocated TEXT, -- JSON array of part items used
  technician_diagnosis TEXT,
  qc_passed INTEGER NOT NULL DEFAULT 0 CHECK(qc_passed IN (0, 1)),
  qc_inspected_by TEXT,
  status TEXT NOT NULL DEFAULT 'Work In Progress' CHECK(status IN ('Assigned', 'Work In Progress', 'QC Pending', 'QC Approved', 'Completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 22. STAFF
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  employee_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL CHECK(department IN ('Sales', 'Service & Workshop', 'Finance & Insurance', 'Parts & Inventory', 'Executive & Management')),
  role_title TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  joining_date TEXT NOT NULL,
  base_salary REAL NOT NULL DEFAULT 40000,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'On Leave', 'Resigned', 'Terminated')),
  sales_target_units INTEGER DEFAULT 5,
  sales_closed_count INTEGER DEFAULT 0,
  revenue_generated REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 23. PAYROLL
CREATE TABLE IF NOT EXISTS payroll (
  id TEXT PRIMARY KEY,
  payroll_period TEXT NOT NULL, -- e.g. '2026-09'
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  base_salary REAL NOT NULL,
  sales_incentive REAL NOT NULL DEFAULT 0,
  allowances REAL NOT NULL DEFAULT 0,
  deductions REAL NOT NULL DEFAULT 0,
  net_salary REAL NOT NULL,
  payment_date TEXT,
  payment_mode TEXT DEFAULT 'Direct Bank Transfer',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Approved', 'Processed', 'Paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 24. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  expense_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Showroom Rent', 'Electricity & Utilities', 'Marketing & Ads', 'Logistics & Fuel', 'Workshop Consumables', 'Office & IT Supplies', 'Staff Welfare', 'Miscellaneous')),
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  expense_date TEXT NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'Bank Transfer',
  vendor_or_payee TEXT,
  receipt_url TEXT,
  approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Approved' CHECK(status IN ('Pending', 'Approved', 'Paid', 'Rejected')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 25. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  campaign_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('Digital / Social Ads', 'Print Media', 'Outdoor Hoarding', 'SMS & WhatsApp Broadcast', 'Auto Expo Event')),
  target_model TEXT,
  budget REAL NOT NULL DEFAULT 50000,
  leads_generated INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Planned', 'Active', 'Paused', 'Completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 26. COMMUNICATIONS
CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN ('Phone Call', 'WhatsApp Message', 'Email', 'Showroom Visit Note', 'SMS')),
  direction TEXT NOT NULL DEFAULT 'Outbound' CHECK(direction IN ('Inbound', 'Outbound')),
  subject_or_summary TEXT NOT NULL,
  details TEXT,
  performed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 27. REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT, -- 'lead', 'test_drive', 'insurance_renewal', 'service_followup'
  entity_id TEXT,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 28. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'customer', 'vehicle', 'sale', 'insurance', 'staff'
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('Aadhaar', 'PAN Card', 'Driving License', 'Registration Certificate (RC)', 'Insurance Policy Doc', 'Delivery Note', 'Invoice PDF', 'Form 20 / RTO Application')),
  file_url TEXT NOT NULL,
  file_size_kb INTEGER DEFAULT 0,
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 29. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO' CHECK(type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT', 'DEAL_CLOSED')),
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 30. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'EXPORT', 'APPROVE')),
  module TEXT NOT NULL,
  record_id TEXT,
  description TEXT NOT NULL,
  ip_address TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- INDEXES FOR FAST QUERIES & RELATIONAL LOOKUPS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand, model);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_staff ON leads(assigned_staff_id);

CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_estimates_vehicle_id ON estimates(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_vehicle_id ON quotations(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicle_id ON sales(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_agent_id ON sales(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE INDEX IF NOT EXISTS idx_invoices_sale_id ON invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON receipts(customer_id);

CREATE INDEX IF NOT EXISTS idx_test_drives_customer_id ON test_drives(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_vehicle_id ON test_drives(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_date ON test_drives(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_finance_records_customer_id ON finance_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_finance_records_sale_id ON finance_records(sale_id);

CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON spare_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_status ON spare_parts(status);

CREATE INDEX IF NOT EXISTS idx_procurement_items_po_id ON procurement_items(procurement_order_id);

CREATE INDEX IF NOT EXISTS idx_service_tickets_customer_id ON service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);

CREATE INDEX IF NOT EXISTS idx_job_cards_ticket_id ON job_cards(service_ticket_id);

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);

CREATE INDEX IF NOT EXISTS idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(payroll_period);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications(customer_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
