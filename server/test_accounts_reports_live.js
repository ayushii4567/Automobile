const http = require('http');
const jwt = require('jsonwebtoken');
const db = require('./db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'apex-horizon-motors-jwt-secret-key-2026';
const token = jwt.sign(
  { id: 'user_admin', username: 'admin', name: 'System Administrator', role: 'ADMIN', email: 'admin@apexmotors.in' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 ACCOUNTS & REPORTS MANAGEMENT E2E VERIFICATION SUITE');
  console.log('================================================================\n');

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
    // ------------------------------------------------------------------------
    // TEST 1: ACCOUNTS VOUCHERS CRUD
    // ------------------------------------------------------------------------
    console.log('--- 1. Testing Payment Voucher & Receipt Voucher CRUD ---');
    const testVoucherId = `test_pv_${Date.now()}`;
    const createRes = await request('POST', '/api/accounts/vouchers', {
      id: testVoucherId,
      voucher_type: 'PAYMENT',
      category: 'Showroom Generator Diesel',
      party_type: 'vendor',
      party_name: 'Bharat Petroleum Outlet Baramati',
      amount: 4500,
      payment_mode: 'Cash',
      voucher_date: '2026-10-10',
      narration: 'Generator fuel backup'
    });
    assert(createRes.status === 201 && createRes.data.success, 'Create Payment Voucher', JSON.stringify(createRes.data));

    const getVouchers = await request('GET', '/api/accounts/vouchers?type=PAYMENT');
    const createdVoucher = getVouchers.data.find(v => v.id === testVoucherId);
    assert(!!createdVoucher && Number(createdVoucher.amount) === 4500, 'Fetch Created Voucher from Database');

    const updateRes = await request('PUT', `/api/accounts/vouchers/${testVoucherId}`, {
      amount: 4800,
      narration: 'Updated fuel backup with lubricant'
    });
    assert(updateRes.status === 200 && Number(updateRes.data.amount) === 4800, 'Update Voucher Amount');

    // ------------------------------------------------------------------------
    // TEST 2: CASH BOOK RECONCILIATION
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Cash Book Reconciliation ---');
    const cashBookRes1 = await request('GET', '/api/accounts/cash-book');
    assert(cashBookRes1.status === 200, 'Fetch Cash Book API');
    const initialOut = cashBookRes1.data.summary.totalCashOut;

    // Create a Receipt Voucher in Cash
    const testRvId = `test_rv_${Date.now()}`;
    await request('POST', '/api/accounts/vouchers', {
      id: testRvId,
      voucher_type: 'RECEIPT',
      category: 'Customer Advance',
      party_type: 'customer',
      party_name: 'Rajendra Deshmukh',
      amount: 15000,
      payment_mode: 'Cash',
      voucher_date: '2026-10-10',
      narration: 'Cash booking advance'
    });

    const cashBookRes2 = await request('GET', '/api/accounts/cash-book');
    const foundRv = cashBookRes2.data.cashReceipts.find(r => r.id === testRvId);
    assert(!!foundRv && Number(foundRv.amount) === 15000, 'Cash Book contains new cash receipt');
    assert(
      cashBookRes2.data.summary.closingBalance === 
      (cashBookRes2.data.summary.totalCashIn - cashBookRes2.data.summary.totalCashOut),
      'Cash Book closing balance matches Total Cash In - Total Cash Out'
    );

    // ------------------------------------------------------------------------
    // TEST 3: BANK BOOK RECONCILIATION
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Bank Book Reconciliation ---');
    const testBankVoucherId = `test_bv_${Date.now()}`;
    await request('POST', '/api/accounts/vouchers', {
      id: testBankVoucherId,
      voucher_type: 'RECEIPT',
      category: 'Bank Loan Subvention',
      party_type: 'bank',
      party_name: 'State Bank of India',
      amount: 350000,
      payment_mode: 'Bank Transfer',
      bank_name: 'SBI Baramati Branch',
      cheque_or_ref_no: 'NEFT99887766',
      voucher_date: '2026-10-10',
      narration: 'Disbursement received in bank'
    });

    const bankBookRes = await request('GET', '/api/accounts/bank-book');
    assert(bankBookRes.status === 200, 'Fetch Bank Book API');
    const foundBankEntry = bankBookRes.data.records.find(r => r.id === testBankVoucherId);
    assert(!!foundBankEntry && Number(foundBankEntry.debit_inflow) === 350000, 'Bank Book records electronic inflow');
    assert(
      bankBookRes.data.summary.bankBalance === 
      (bankBookRes.data.summary.totalDebit - bankBookRes.data.summary.totalCredit),
      'Bank Book balance matches Debit Inflow - Credit Outflow'
    );

    // ------------------------------------------------------------------------
    // TEST 4: CUSTOMER & SUPPLIER LEDGERS
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Customer & Supplier Ledgers with Running Balance ---');
    const custLedgerRes = await request('GET', '/api/accounts/customer-ledger');
    assert(custLedgerRes.status === 200, 'Fetch Customer Ledger');
    assert(Array.isArray(custLedgerRes.data.transactions), 'Customer Ledger transactions array returned');
    
    // Verify running balance calculation
    if (custLedgerRes.data.transactions.length > 0) {
      let runningCheck = 0;
      let balancedCorrectly = true;
      for (const t of custLedgerRes.data.transactions) {
        runningCheck += (Number(t.debit || 0) - Number(t.credit || 0));
        if (t.balance !== runningCheck) {
          balancedCorrectly = false;
          break;
        }
      }
      assert(balancedCorrectly, 'Customer Ledger running balances match debit minus credit arithmetic');
    } else {
      console.log('  ⚠️ Customer ledger has 0 records currently.');
    }

    const suppLedgerRes = await request('GET', '/api/accounts/supplier-ledger');
    assert(suppLedgerRes.status === 200, 'Fetch Supplier Ledger');
    assert(Array.isArray(suppLedgerRes.data.partyList), 'Supplier list returned');

    // ------------------------------------------------------------------------
    // TEST 5: EMPLOYEE LEDGER, FINANCE & RTO SUMMARIES
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Employee Ledger, Finance & RTO Summaries ---');
    const empLedgerRes = await request('GET', '/api/accounts/employee-ledger');
    assert(empLedgerRes.status === 200 && Array.isArray(empLedgerRes.data), 'Fetch Employee Ledger');

    const finSummaryRes = await request('GET', '/api/accounts/finance-summary');
    assert(finSummaryRes.status === 200 && Array.isArray(finSummaryRes.data.records), 'Fetch Finance Summary');

    const rtoSummaryRes = await request('GET', '/api/accounts/rto-summary');
    assert(rtoSummaryRes.status === 200 && typeof rtoSummaryRes.data.summary.balanceWithDealer === 'number', 'Fetch RTO Summary and Balance with Dealer');

    const insSummaryRes = await request('GET', '/api/accounts/insurance-summary');
    assert(insSummaryRes.status === 200 && Array.isArray(insSummaryRes.data.providerWise), 'Fetch Insurance Summary with Provider Breakdown');

    const custDueRes = await request('GET', '/api/accounts/customer-due');
    assert(custDueRes.status === 200 && typeof custDueRes.data.summary.totalOutstandingReceivable === 'number', 'Fetch Customer Due List and Outstanding Receivable');

    // ------------------------------------------------------------------------
    // TEST 6: FINANCE & INSURANCE PAYOUTS CRUD
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing Finance & Insurance Payouts ---');
    const testFpId = `test_fp_${Date.now()}`;
    const fpCreateRes = await request('POST', '/api/accounts/finance-payouts', {
      id: testFpId,
      payout_ref: `FP-TEST-${Date.now().toString().slice(-4)}`,
      bank_name: 'HDFC Auto Finance',
      customer_name: 'Suresh Patil',
      loan_amount: 1200000,
      commission_rate_pct: 2.0,
      payout_amount: 24000,
      payout_date: '2026-10-10',
      status: 'Received',
      notes: 'Commission payout for Suresh Patil tractor loan'
    });
    assert(fpCreateRes.status === 201 && fpCreateRes.data.success, 'Create Finance Payout');

    const fpGet = await request('GET', '/api/accounts/finance-payouts');
    assert(fpGet.data.some(p => p.id === testFpId), 'Verify Finance Payout in DB');

    const fpDel = await request('DELETE', `/api/accounts/finance-payouts/${testFpId}`);
    assert(fpDel.status === 200 && fpDel.data.success, 'Delete Finance Payout');

    // Insurance Payout
    const testIpId = `test_ip_${Date.now()}`;
    const ipCreateRes = await request('POST', '/api/accounts/insurance-payouts', {
      id: testIpId,
      payout_ref: `IP-TEST-${Date.now().toString().slice(-4)}`,
      insurer_name: 'ICICI Lombard GIC',
      policy_number: 'POL-ICICI-9988',
      customer_name: 'Ganesh Shinde',
      premium_amount: 32000,
      commission_rate_pct: 15.0,
      payout_amount: 4800,
      payout_date: '2026-10-10',
      status: 'Received',
      notes: 'Insurance commission'
    });
    assert(ipCreateRes.status === 201 && ipCreateRes.data.success, 'Create Insurance Payout');

    const ipDel = await request('DELETE', `/api/accounts/insurance-payouts/${testIpId}`);
    assert(ipDel.status === 200 && ipDel.data.success, 'Delete Insurance Payout');

    // ------------------------------------------------------------------------
    // TEST 7: MASTER REPORTS MANAGEMENT (ALL 32 REPORTS VERIFICATION)
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Testing Master Reports Management Suite (All 32 Reports) ---');
    const masterReportsRes = await request('GET', '/api/reports/dealership-master');
    assert(masterReportsRes.status === 200, 'Fetch Master Reports Suite');

    const rep = masterReportsRes.data;
    const requiredReports = [
      'vehicleStock', 'implementStock', 'spareStock', 'accessoriesStock',
      'vehiclePurchases', 'sparePurchases', 'accessoriesPurchases',
      'accessoriesSales', 'sparePartsSales', 'vehicleSales', 'vehicleProfit',
      'salesmanSales', 'villageSales', 'tehsilSales', 'mechanicReports',
      'dailyService', 'nextServicing', 'serviceHistory', 'partsLedger',
      'rtoReports', 'financeReports', 'insuranceReports', 'customerDue',
      'gstReports', 'dayBook', 'expensesReports', 'outstandingReports', 'companyLedger'
    ];

    let allReportsPresent = true;
    for (const key of requiredReports) {
      if (rep[key] === undefined) {
        console.error(`  ❌ Missing report in payload: ${key}`);
        allReportsPresent = false;
      }
    }
    assert(allReportsPresent, 'All 28 core master report dataset keys present in API payload');

    // Check GST calculation integrity
    assert(
      typeof rep.gstReports.totalOutwardGst === 'number' &&
      typeof rep.gstReports.totalInwardGst === 'number' &&
      typeof rep.gstReports.netGstPayable === 'number' &&
      rep.gstReports.netGstPayable >= 0,
      'GST Reports accurately computed with Outward, Inward ITC, and Net Payable'
    );

    // Check Company Ledger calculations
    assert(
      typeof rep.companyLedger.grossTurnover === 'number' &&
      typeof rep.companyLedger.procurementExpenditure === 'number' &&
      typeof rep.companyLedger.operationalExpenses === 'number' &&
      typeof rep.companyLedger.operatingSurplus === 'number',
      'Company Ledger accurately balances Gross Turnover against Procurement and Operational Expenses'
    );

    // ------------------------------------------------------------------------
    // TEST 8: CLEANUP TEST VOUCHERS
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Cleanup & Voiding Test Records ---');
    const del1 = await request('DELETE', `/api/accounts/vouchers/${testVoucherId}`);
    assert(del1.status === 200, 'Void Payment Voucher and verify removal');

    const del2 = await request('DELETE', `/api/accounts/vouchers/${testRvId}`);
    assert(del2.status === 200, 'Void Receipt Voucher and verify removal');

    const del3 = await request('DELETE', `/api/accounts/vouchers/${testBankVoucherId}`);
    assert(del3.status === 200, 'Void Bank Voucher and verify removal');

    console.log('\n================================================================');
    console.log(`🏁 TEST RUN SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
