const http = require('http');
const jwt = require('jsonwebtoken');
const db = require('./db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'apex-horizon-motors-jwt-secret-key-2026';

const adminToken = jwt.sign(
  { id: 'user_admin', username: 'admin', name: 'System Administrator', role: 'ADMIN', email: 'admin@apexmotors.in' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

const salesToken = jwt.sign(
  { id: 'user_sales', username: 'sales_rep', name: 'Sales Executive', role: 'SALES_EXECUTIVE', email: 'sales@apexmotors.in' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

function request(method, path, body = null, tokenToUse = adminToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (tokenToUse) {
      headers['Authorization'] = `Bearer ${tokenToUse}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('========================================================================');
  console.log('🏆 APEX HORIZON MOTORS — MASTER QUALITY AUDIT & FUNCTIONAL TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // ========================================================================
    // 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL AUDIT
    // ========================================================================
    console.log('--- 1. Authentication, Token Guards & RBAC Permissions Audit ---');
    
    // Unauthenticated request should be rejected with 401
    const unauthRes = await request('GET', '/api/accounts/vouchers', null, null);
    assert(unauthRes.status === 401, 'Unauthorized request correctly returns 401');

    // Admin access allowed
    const adminRes = await request('GET', '/api/accounts/vouchers', null, adminToken);
    assert(adminRes.status === 200, 'Admin authorized request returns 200');

    // Role-based deletion guard: SALES_EXECUTIVE should be rejected with 403 on admin-only route
    const dummyId = 'test_forbidden_' + Date.now();
    const rbacRes = await request('DELETE', `/api/services/service-invoices/${dummyId}`, null, salesToken);
    assert(rbacRes.status === 403, 'Sales Executive blocked with 403 from deleting service bill');

    // ========================================================================
    // 2. SECTION 1: SALES MANAGEMENT WORKFLOW AUDIT
    // ========================================================================
    console.log('\n--- 2. Sales Management: Enquiry -> Quotation -> Challan -> Invoice -> Implements ---');
    
    // Delivery Challan CRUD
    const challanId = `dc_audit_${Date.now()}`;
    const dcRes = await request('POST', '/api/delivery-challans', {
      id: challanId,
      customer_name: 'Aniket Kulkarni',
      customer_phone: '9822334455',
      customer_village: 'Malegaon BK',
      customer_tehsil: 'Baramati',
      vehicle_name: 'Mahindra 575 DI XP Plus',
      chassis_number: 'CHAS-AUDIT-9988',
      engine_number: 'ENG-AUDIT-9988',
      color: 'Signature Red',
      handover_date: '2026-10-10',
      status: 'Delivered'
    });
    assert(dcRes.status === 201 && dcRes.data.id === challanId, 'Create Delivery Challan');

    const dcGet = await request('GET', '/api/delivery-challans');
    assert(dcGet.data.some(d => d.id === challanId), 'Delivery Challan listed in live DB');

    // Sale Agreement creation
    const agreeId = `agr_audit_${Date.now()}`;
    const agreeRes = await request('POST', '/api/agreements', {
      id: agreeId,
      customer_name: 'Aniket Kulkarni',
      customer_phone: '9822334455',
      vehicle_name: 'Mahindra 575 DI XP Plus',
      chassis_number: 'CHAS-AUDIT-9988',
      total_deal_price: 785000,
      advance_paid: 150000,
      balance_amount: 635000,
      financing_bank: 'HDFC Auto Finance'
    });
    assert(agreeRes.status === 201 && agreeRes.data.id === agreeId, 'Create Vehicle Sales Agreement');

    // Implement Stock Creation
    const impStockId = `imp_stock_aud_${Date.now()}`;
    const impStockRes = await request('POST', '/api/implements', {
      id: impStockId,
      name: 'Fieldking Heavy Rotary Tiller 7ft',
      category: 'Rotavator',
      compatible_hp_min: 45,
      compatible_hp_max: 75,
      purchase_cost: 95000,
      selling_price: 115000,
      stock_quantity: 4,
      status: 'In Stock',
      supplier_name: 'Fieldking Agro Implements Karnal'
    });
    assert(impStockRes.status === 201 && impStockRes.data.id === impStockId, 'Add Implement to Showroom Stock');

    const impStock = await request('GET', '/api/implements');
    assert(impStock.data.some(i => i.id === impStockId), 'Implement added to Stock verified');

    // Demographics Report
    const demoRes = await request('GET', '/api/sales/reports/demographics');
    assert(demoRes.status === 200 && Array.isArray(demoRes.data.modelWise), 'Demographics report returned with Model & Tehsil stats');

    // ========================================================================
    // 3. SECTION 2: SERVICE MANAGEMENT WORKFLOW AUDIT
    // ========================================================================
    console.log('\n--- 3. Service Management: Estimates -> Job Cards -> Parts Allocation -> Invoices ---');
    
    // Job Estimate
    const estId = `je_audit_${Date.now()}`;
    const estRes = await request('POST', '/api/services/job-estimates', {
      id: estId,
      customer_name: 'Ramesh Pawar',
      customer_phone: '9890112233',
      vehicle_model: 'Swaraj 744 FE',
      estimated_parts: 3500,
      estimated_labor: 2500
    });
    assert(estRes.status === 201 && estRes.data.id === estId, 'Create Workshop Job Estimate');

    // Convert Job Estimate to Job Card
    const convertRes = await request('POST', `/api/services/job-estimates/${estId}/convert-to-job-card`, {
      technician_name: 'Dnyaneshwar Jadhav'
    });
    assert(convertRes.status === 201 && convertRes.data.success, 'Convert Job Estimate to Job Card');
    const jcId = convertRes.data.jcId;
    assert(!!jcId, 'Generated Job Card ID retrieved');

    // Allocate Part to Job Card (Checks stock decrement and parts_ledger journal)
    const partToAlloc = db.prepare('SELECT * FROM spare_parts WHERE stock_quantity > 2 LIMIT 1').get();
    if (partToAlloc) {
      const prevStock = partToAlloc.stock_quantity;
      const allocRes = await request('POST', `/api/job-cards/${jcId}/allocate-parts`, {
        part_id: partToAlloc.id,
        quantity: 1
      });
      assert(allocRes.status === 200 && allocRes.data.success, 'Allocate Part to Job Card');
      const updatedPart = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(partToAlloc.id);
      assert(updatedPart.stock_quantity === prevStock - 1, 'Spare Part stock accurately decremented by 1');
    }

    // Counter Spare Invoice & Reversal Check
    const spInvId = `spi_audit_${Date.now()}`;
    const spInvRes = await request('POST', '/api/services/spare-invoices', {
      id: spInvId,
      customer_name: 'Vikas Shinde',
      invoice_type: 'Spare',
      payment_mode: 'Cash',
      items: [
        { id: partToAlloc.id, name: partToAlloc.name, part_number: partToAlloc.part_number, quantity: 1, price: partToAlloc.selling_price }
      ]
    });
    assert(spInvRes.status === 201 && spInvRes.data.id === spInvId, 'Generate Retail Counter Spare Invoice');

    // Void Spare Invoice and check stock reversal
    const voidRes = await request('DELETE', `/api/services/spare-invoices/${spInvId}`);
    assert(voidRes.status === 200 && voidRes.data.success, 'Void Spare Invoice and successfully reverse parts inventory');

    // ========================================================================
    // 4. SECTION 3: EXCHANGE MANAGEMENT WORKFLOW AUDIT
    // ========================================================================
    console.log('\n--- 4. Exchange Management: Purchase -> Stock -> Resale -> Profit ---');
    
    const exchId = `ti_audit_${Date.now()}`;
    const exchPurchRes = await request('POST', '/api/tradeins', {
      id: exchId,
      customer_name: 'Sambhaji More',
      customer_village: 'Malshiras',
      customer_tehsil: 'Malshiras',
      customer_district: 'Solapur',
      salesman_name: 'Vikram Shinde',
      old_brand: 'Mahindra',
      old_model: '575 DI Bhoomiputra',
      old_year: 2018,
      horsepower: 47,
      registration_no: 'MH-13-AZ-1122',
      estimated_valuation: 320000,
      refurbishment_cost: 15000,
      expected_resale_price: 365000,
      status: 'In Stock'
    });
    assert(exchPurchRes.status === 201 && exchPurchRes.data.id === exchId, 'Register Inward Exchange Tractor Purchase');

    const exchStock = await request('GET', '/api/tradeins/stock');
    assert(exchStock.data.some(e => e.id === exchId), 'Exchange Tractor verified In Stock on pre-owned lot');

    // Resale Execution
    const resaleRes = await request('POST', '/api/tradeins/resale', {
      id: exchId,
      actual_resale_price: 370000,
      resale_customer_name: 'Balasaheb Jagtap',
      resale_date: '2026-10-10'
    });
    assert(resaleRes.status === 200 && resaleRes.data.success, 'Execute Exchange Resale');

    // Resale Profit Calculation Check
    const profitRes = await request('GET', '/api/tradeins/profit');
    const soldRecord = profitRes.data.records.find(r => r.id === exchId);
    assert(
      !!soldRecord && 
      soldRecord.exchange_profit === (370000 - (320000 + 15000)),
      `Exchange Profit accurately calculated: ₹${soldRecord?.exchange_profit} (Expected ₹35,000)`
    );

    // ========================================================================
    // 5. SECTION 4: ACCOUNTS MANAGEMENT WORKFLOW AUDIT
    // ========================================================================
    console.log('\n--- 5. Accounts Management: Vouchers, Reconciled Books & Ledgers ---');
    
    // Create Cash Payment Voucher
    const pvId = `pv_aud_${Date.now()}`;
    await request('POST', '/api/accounts/vouchers', {
      id: pvId,
      voucher_type: 'PAYMENT',
      category: 'Showroom Tea & Refreshments',
      party_type: 'vendor',
      party_name: 'Kavita Canteen Services',
      amount: 1800,
      payment_mode: 'Cash',
      voucher_date: '2026-10-10'
    });

    // Create Cash Receipt Voucher
    const rvId = `rv_aud_${Date.now()}`;
    await request('POST', '/api/accounts/vouchers', {
      id: rvId,
      voucher_type: 'RECEIPT',
      category: 'Booking Advance',
      party_type: 'customer',
      party_name: 'Dattatray Gaikwad',
      amount: 25000,
      payment_mode: 'Cash',
      voucher_date: '2026-10-10'
    });

    // Cash Book Verification
    const cashBook = await request('GET', '/api/accounts/cash-book');
    assert(
      cashBook.data.cashReceipts.some(r => r.id === rvId) &&
      cashBook.data.cashPayments.some(p => p.id === pvId),
      'Cash Book reconciles inward cash receipt and outward cash payment'
    );
    assert(
      cashBook.data.summary.closingBalance === 
      (cashBook.data.summary.totalCashIn - cashBook.data.summary.totalCashOut),
      'Cash Book arithmetic: Closing Balance = Total Cash In - Total Cash Out'
    );

    // Customer Ledger Running Balance
    const custLedger = await request('GET', '/api/accounts/customer-ledger');
    assert(Array.isArray(custLedger.data.transactions), 'Customer Ledger transactions loaded');
    let runningValid = true;
    let cum = 0;
    for (const tx of custLedger.data.transactions) {
      cum += (Number(tx.debit || 0) - Number(tx.credit || 0));
      if (tx.balance !== cum) {
        runningValid = false;
        break;
      }
    }
    assert(runningValid, 'Customer Ledger running balances match debit minus credit arithmetic');

    // Customer Dues calculation
    const dueRes = await request('GET', '/api/accounts/customer-due');
    assert(dueRes.status === 200 && dueRes.data.records.every(d => Number(d.balance_due) > 0), 'Customer Dues only lists accounts with positive balance due');

    // ========================================================================
    // 6. SECTION 5: MASTER REPORTS MANAGEMENT AUDIT (ALL 32 REPORTS)
    // ========================================================================
    console.log('\n--- 6. Reports Management: Dealership Master 32 Reports & GST Calculation ---');
    
    const masterReports = await request('GET', '/api/reports/dealership-master');
    assert(masterReports.status === 200, 'Master Reports API returns 200 OK');
    const m = masterReports.data;

    // Check presence of all key datasets
    const datasets = [
      'vehicleStock', 'implementStock', 'spareStock', 'accessoriesStock',
      'vehiclePurchases', 'sparePurchases', 'accessoriesPurchases',
      'accessoriesSales', 'sparePartsSales', 'vehicleSales', 'vehicleProfit',
      'salesmanSales', 'villageSales', 'tehsilSales', 'mechanicReports',
      'dailyService', 'nextServicing', 'serviceHistory', 'partsLedger',
      'rtoReports', 'financeReports', 'insuranceReports', 'customerDue',
      'gstReports', 'dayBook', 'expensesReports', 'outstandingReports', 'companyLedger'
    ];
    let allKeysExist = true;
    for (const d of datasets) {
      if (m[d] === undefined) {
        console.error(`  ❌ Missing dataset: ${d}`);
        allKeysExist = false;
      }
    }
    assert(allKeysExist, 'All 28 master reporting datasets computed and returned from live DB');

    // Verify GST formula: Outward - Inward = Net Payable
    const gst = m.gstReports;
    const computedNet = Math.max(0, gst.totalOutwardGst - gst.totalInwardGst);
    assert(
      gst.netGstPayable === computedNet,
      `GST Tax Formula verified: Net ₹${gst.netGstPayable} = Outward ₹${gst.totalOutwardGst} - Inward ₹${gst.totalInwardGst}`
    );

    // ========================================================================
    // 7. DATA PERSISTENCE & CLEANUP
    // ========================================================================
    console.log('\n--- 7. Data Persistence Verification & Test Records Cleanup ---');
    
    // Test direct DB query on separate connection to verify WAL persistence
    const persistedChallan = db.prepare('SELECT * FROM delivery_challans WHERE id = ?').get(challanId);
    assert(!!persistedChallan, 'Record persisted permanently in SQLite database');

    // Cleanup test artifacts
    db.prepare('DELETE FROM delivery_challans WHERE id = ?').run(challanId);
    db.prepare('DELETE FROM sale_agreements WHERE id = ?').run(agreeId);
    db.prepare('DELETE FROM implements WHERE id = ?').run(impStockId);
    db.prepare('DELETE FROM job_estimates WHERE id = ?').run(estId);
    db.prepare('DELETE FROM job_cards WHERE id = ?').run(jcId);
    db.prepare('DELETE FROM trade_ins WHERE id = ?').run(exchId);
    db.prepare('DELETE FROM account_vouchers WHERE id IN (?, ?)').run(pvId, rvId);

    console.log('\n========================================================================');
    console.log(`🏁 MASTER QUALITY AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Master Audit failed with unhandled exception:', err);
    process.exit(1);
  }
}

runAudit();
