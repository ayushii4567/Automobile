/**
 * Apex Horizon Motors — Sales, Invoice, Payments & Receipts Workflow Integration Test
 *
 * Verifies End-to-End Sales Execution:
 * Quotation -> Sale -> Invoice -> Payments (Advance/Partial/Balance) -> Receipts
 *
 * Verifies:
 * - Real atomic database transactions
 * - Automatic vehicle status change: Available -> Sold
 * - Prevent invalid transactions (cannot double-sell sold vehicles, cannot overpay balance)
 * - Dynamic GST calculation using showroom settings
 * - Advance payment, partial payment, balance payment
 * - Automatic receipt generation for every payment
 * - Clean teardown and vehicle state restoration
 */

const assert = require('assert');
const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runSalesInvoicingWorkflowTests() {
  console.log('\n============================================================');
  console.log('🚗 [TEST] Sales, Invoices, Payments & Receipts Workflow Test Suite');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function pass(desc) {
    total++;
    passed++;
    console.log(`  ✅ [PASS] ${desc}`);
  }

  function fail(desc, err) {
    total++;
    console.error(`  ❌ [FAIL] ${desc}`, err ? (err.message || err) : '');
  }

  try {
    // -------------------------------------------------------------
    // Step 0: Sales Executive Authentication
    // -------------------------------------------------------------
    console.log('📌 Phase 0: Authentication & Session Verification');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { username: 'sales', password: 'sales123' }
    });
    assert.strictEqual(loginRes.status, 200, 'Sales login failed');
    const token = loginRes.body.token;
    assert.ok(token, 'Missing JWT token');
    const authHeaders = { Authorization: `Bearer ${token}` };
    pass('Sales Executive authenticated with valid session token');

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    });
    const adminHeaders = { Authorization: `Bearer ${adminLogin.body.token}` };

    // Verify Dealership Profile / Showroom Settings
    const profileRes = await request('/dealership-profile', { headers: authHeaders });
    assert.strictEqual(profileRes.status, 200, 'Profile fetch failed');
    assert.ok(profileRes.body.showroom_name, 'Showroom name missing');
    assert.ok(profileRes.body.gstin, 'GSTIN missing');
    const currentTaxRate = Number(profileRes.body.tax_rate || 18.0);
    pass(`Retrieved dynamic showroom profile (${profileRes.body.showroom_name}, GSTIN: ${profileRes.body.gstin}, Tax Rate: ${currentTaxRate}%)`);

    // -------------------------------------------------------------
    // Step 1: Create a Test Vehicle & Customer
    // -------------------------------------------------------------
    console.log('\n📌 Phase 1: Setup Inventory Vehicle & Prospective Customer');
    const vehRes = await request('/vehicles', {
      method: 'POST',
      headers: authHeaders,
      body: {
        brand: 'BMW',
        model: 'M8 Competition Gran Coupe',
        year: 2026,
        category: 'Luxury',
        color: 'Isle of Man Green',
        fuel: 'Petrol',
        transmission: 'Automatic',
        horsepower: 617,
        price: 24500000,
        stock: 1,
        status: 'Available'
      }
    });
    assert.strictEqual(vehRes.status, 201);
    const testVehicle = vehRes.body;
    assert.strictEqual(testVehicle.status, 'Available');
    pass(`Created test vehicle in inventory: ${testVehicle.brand} ${testVehicle.model} (VIN: ${testVehicle.vin}, Status: Available, Stock: 1)`);

    const custRes = await request('/customers', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Kabir Oberoi',
        phone: '+91 98' + Date.now().toString().slice(-8),
        email: 'kabir.oberoi@oberoienterprises.com',
        city: 'Mumbai',
        address: 'Worli Sea Face, Mumbai 400030',
        panNumber: 'ABCDE1234F',
        gstin: '27ABCDE1234F1Z5'
      }
    });
    assert.strictEqual(custRes.status, 201);
    const testCustomer = custRes.body;
    pass(`Registered VIP Customer: ${testCustomer.name} (PAN: ${testCustomer.pan_number || testCustomer.panNumber})`);

    // -------------------------------------------------------------
    // Step 2: Quotation Generation (Quotation -> Sale)
    // -------------------------------------------------------------
    console.log('\n📌 Phase 2: Workflow Step 1 — Quotation Generation');
    const quoteRes = await request('/quotations', {
      method: 'POST',
      headers: authHeaders,
      body: {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        customer_phone: testCustomer.phone,
        customer_email: testCustomer.email,
        vehicle_id: testVehicle.id,
        vehicle_name: `${testVehicle.brand} ${testVehicle.model}`,
        ex_showroom_price: 24500000,
        rto_tax: 2450000,
        insurance: 750000,
        warranty_pack: 300000,
        accessories: 200000,
        discount: 500000,
        total_amount: 27700000,
        valid_until: '2026-11-30',
        status: 'Accepted'
      }
    });
    assert.strictEqual(quoteRes.status, 201);
    const testQuotation = quoteRes.body;
    pass(`Generated official Quotation #${testQuotation.quotation_number || testQuotation.quotationNo} for ₹2,77,00,000`);

    // -------------------------------------------------------------
    // Step 3: Workflow Step 2 & 3 — Sale Order Creation & Auto-Invoice
    // -------------------------------------------------------------
    console.log('\n📌 Phase 3: Workflow Step 2 & 3 — Sale Creation & Automatic Invoice Generation');
    const basePrice = 24500000;
    const discount = 500000;
    const taxable = basePrice - discount; // 24000000
    const expectedTax = Math.round(((taxable * currentTaxRate) / 100) * 100) / 100; // 4320000 at 18%
    const expectedCgst = Math.round((expectedTax / 2) * 100) / 100;
    const expectedSgst = Math.round((expectedTax / 2) * 100) / 100;
    const expectedTotal = taxable + expectedTax; // 28320000

    const saleRes = await request('/sales', {
      method: 'POST',
      headers: authHeaders,
      body: {
        quotation_id: testQuotation.id,
        customer_id: testCustomer.id,
        vehicle_id: testVehicle.id,
        base_price: basePrice,
        discount: discount,
        tax_rate: currentTaxRate,
        payment_method: 'RTGS / NEFT',
        booking_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '2026-11-15'
      }
    });
    if (saleRes.status !== 201) {
      console.error('Sale creation error response:', saleRes.body);
    }
    assert.strictEqual(saleRes.status, 201, 'Sale creation failed');
    const testSale = saleRes.body;
    assert.ok(testSale.id, 'Sale ID missing');
    assert.ok(testSale.sale_order_number || testSale.saleOrderNumber, 'SO number missing');
    assert.ok(testSale.invoice_number || testSale.invoiceNo, 'Invoice number missing');
    assert.strictEqual(Number(testSale.total_amount || testSale.totalAmount), expectedTotal, 'Total amount mismatch');
    pass(`Created Sale Order ${testSale.sale_order_number || testSale.saleOrderNumber} with auto-generated Invoice ${testSale.invoice_number || testSale.invoiceNo}`);
    pass(`Dynamic GST verified: Base ₹${basePrice.toLocaleString('en-IN')} - Disc ₹${discount.toLocaleString('en-IN')} = Taxable ₹${taxable.toLocaleString('en-IN')} + ${currentTaxRate}% GST (CGST: ₹${expectedCgst.toLocaleString('en-IN')}, SGST: ₹${expectedSgst.toLocaleString('en-IN')}) = Total ₹${expectedTotal.toLocaleString('en-IN')}`);

    // -------------------------------------------------------------
    // Step 4: Verification of Automatic Vehicle Status Transition
    // -------------------------------------------------------------
    console.log('\n📌 Phase 4: Automatic Vehicle Status Transition (AVAILABLE -> SOLD)');
    const checkVehRes = await request(`/vehicles/${testVehicle.id}`, { headers: authHeaders });
    assert.strictEqual(checkVehRes.status, 200);
    assert.strictEqual(checkVehRes.body.status, 'Sold', 'Vehicle status was not automatically changed to Sold');
    assert.strictEqual(checkVehRes.body.stock_quantity, 0, 'Vehicle stock was not decremented');
    pass(`AUTOMATIC TRANSITION CONFIRMED: Vehicle ${testVehicle.vin} status automatically changed to 'Sold' and stock decremented to 0`);

    // Verify linked Quotation updated to Converted_To_Sale
    const checkQuoteRes = await request(`/quotations`, { headers: authHeaders });
    const updatedQuote = checkQuoteRes.body.find(q => q.id === testQuotation.id);
    assert.ok(updatedQuote, 'Quotation not found');
    assert.strictEqual(updatedQuote.status, 'Converted_To_Sale', 'Quotation status was not updated to Converted_To_Sale');
    pass(`Quotation #${testQuotation.quotation_number || testQuotation.quotationNo} status automatically updated to 'Converted_To_Sale'`);

    // -------------------------------------------------------------
    // Step 5: Prevent Invalid Transactions (Double-Selling Sold Vehicles)
    // -------------------------------------------------------------
    console.log('\n📌 Phase 5: Prevent Invalid Transactions (Anti-Double-Selling Protection)');
    const invalidDoubleSaleRes = await request('/sales', {
      method: 'POST',
      headers: authHeaders,
      body: {
        customer_id: testCustomer.id,
        vehicle_id: testVehicle.id,
        base_price: 24500000,
        payment_method: 'RTGS / NEFT'
      }
    });
    assert.strictEqual(invalidDoubleSaleRes.status, 400, 'Double-selling was not prevented!');
    assert.ok(invalidDoubleSaleRes.body.error && invalidDoubleSaleRes.body.error.includes('SOLD'), 'Missing SOLD error message');
    pass('Double-selling successfully BLOCKED by backend validation with 400 Bad Request');

    // -------------------------------------------------------------
    // Step 6: Verify Invoice Record & Pending Status
    // -------------------------------------------------------------
    console.log('\n📌 Phase 6: Invoices & Pending Receivables Tracking');
    const invoiceId = testSale.invoice_id || testSale.invoiceId;
    const invoiceDetailRes = await request(`/invoices/${invoiceId}`, { headers: authHeaders });
    assert.strictEqual(invoiceDetailRes.status, 200);
    const invoice = invoiceDetailRes.body;
    assert.strictEqual(invoice.status, 'Issued');
    assert.strictEqual(Number(invoice.paid_amount || invoice.paidAmount), 0);
    assert.strictEqual(Number(invoice.balance_due || invoice.balanceDue), expectedTotal);
    assert.strictEqual(Number(invoice.cgst_amount || invoice.cgstAmount), expectedCgst);
    assert.strictEqual(Number(invoice.sgst_amount || invoice.sgstAmount), expectedSgst);
    pass(`Invoice ${invoice.invoice_number || invoice.invoiceNo} verified in SQLite: Status 'Issued', Paid ₹0, Balance Due ₹${expectedTotal.toLocaleString('en-IN')}`);

    // Verify Pending Invoices list includes this invoice
    const pendingInvoicesRes = await request('/invoices/pending', { headers: authHeaders });
    assert.strictEqual(pendingInvoicesRes.status, 200);
    assert.ok(pendingInvoicesRes.body.some(i => i.id === invoice.id || (i.invoice_number || i.invoiceNo) === (invoice.invoice_number || invoice.invoiceNo)));
    pass('Invoice correctly listed under /invoices/pending receivables');

    // -------------------------------------------------------------
    // Step 7: Payment 1 — Booking Advance & Automatic Receipt
    // -------------------------------------------------------------
    console.log('\n📌 Phase 7: Workflow Step 4 & 5 — Advance Payment & Receipt Generation');
    const advanceAmount = 5000000; // 50 Lakhs advance
    const advancePaymentRes = await request('/payments', {
      method: 'POST',
      headers: authHeaders,
      body: {
        invoice_id: invoice.id,
        customer_id: testCustomer.id,
        amount: advanceAmount,
        payment_mode: 'RTGS / NEFT',
        payment_type: 'Booking Advance',
        transaction_id: 'UTR-HDFC-ADV-998811',
        payment_date: new Date().toISOString().split('T')[0],
        notes: 'Initial booking advance via HDFC corporate RTGS'
      }
    });
    assert.strictEqual(advancePaymentRes.status, 201, 'Advance payment registration failed');
    const advancePayment = advancePaymentRes.body;
    assert.ok(advancePayment.id, 'Payment ID missing');
    assert.ok(advancePayment.receiptNo, 'Receipt number missing');
    assert.ok(advancePayment.receiptNo.startsWith('RCPT-'), 'Receipt number format invalid');
    pass(`Advance payment registered: ${advancePayment.payment_reference || advancePayment.receiptNo} of ₹${advanceAmount.toLocaleString('en-IN')} via RTGS / NEFT`);
    pass(`RECEIPT AUTO-GENERATED: Linked Receipt #${advancePayment.receiptNo} created automatically in SQLite database`);

    // Verify Invoice balance updated to Partially Paid
    const invAfterAdv = await request(`/invoices/${invoice.id}`, { headers: authHeaders });
    assert.strictEqual(invAfterAdv.status, 200);
    assert.strictEqual(invAfterAdv.body.status, 'Partially Paid');
    assert.strictEqual(Number(invAfterAdv.body.paid_amount || invAfterAdv.body.paidAmount), advanceAmount);
    const remainingAfterAdv = expectedTotal - advanceAmount;
    assert.strictEqual(Number(invAfterAdv.body.balance_due || invAfterAdv.body.balanceDue), remainingAfterAdv);
    pass(`Invoice status transitioned to 'Partially Paid': Paid ₹${advanceAmount.toLocaleString('en-IN')}, Remaining Balance Due ₹${remainingAfterAdv.toLocaleString('en-IN')}`);

    // -------------------------------------------------------------
    // Step 8: Prevent Invalid Overpayment
    // -------------------------------------------------------------
    console.log('\n📌 Phase 8: Prevent Invalid Overpayment');
    const overpaymentAmount = remainingAfterAdv + 100000; // 1 Lakh more than due
    const overpaymentRes = await request('/payments', {
      method: 'POST',
      headers: authHeaders,
      body: {
        invoice_id: invoice.id,
        amount: overpaymentAmount,
        payment_mode: 'RTGS / NEFT',
        payment_type: 'Down Payment'
      }
    });
    assert.strictEqual(overpaymentRes.status, 400, 'Overpayment was not prevented!');
    assert.ok(overpaymentRes.body.error && overpaymentRes.body.error.includes('exceeds'), 'Missing overpayment error message');
    pass('Overpayment successfully BLOCKED by backend validation with 400 Bad Request');

    // -------------------------------------------------------------
    // Step 9: Payment 2 — Balance Settlement & Paid in Full
    // -------------------------------------------------------------
    console.log('\n📌 Phase 9: Workflow Step 4 & 5 — Final Balance Settlement & Paid In Full');
    const balancePaymentRes = await request('/payments', {
      method: 'POST',
      headers: authHeaders,
      body: {
        invoice_id: invoice.id,
        customer_id: testCustomer.id,
        amount: remainingAfterAdv,
        payment_mode: 'Car Loan / Bank',
        payment_type: 'Full Settlement',
        transaction_id: 'UTR-ICICI-FIN-442200',
        payment_date: new Date().toISOString().split('T')[0],
        notes: 'Final loan disbursement settlement from ICICI Bank Auto Finance'
      }
    });
    assert.strictEqual(balancePaymentRes.status, 201, 'Balance payment registration failed');
    const balancePayment = balancePaymentRes.body;
    assert.ok(balancePayment.receiptNo, 'Second receipt number missing');
    pass(`Final balance settlement registered: ₹${remainingAfterAdv.toLocaleString('en-IN')} via Car Loan / Bank`);
    pass(`SECOND RECEIPT AUTO-GENERATED: Receipt #${balancePayment.receiptNo}`);

    // Verify Invoice is now Paid In Full with ₹0 balance
    const invFinalRes = await request(`/invoices/${invoice.id}`, { headers: authHeaders });
    assert.strictEqual(invFinalRes.status, 200);
    assert.strictEqual(invFinalRes.body.status, 'Paid In Full');
    assert.strictEqual(Number(invFinalRes.body.paid_amount || invFinalRes.body.paidAmount), expectedTotal);
    assert.strictEqual(Number(invFinalRes.body.balance_due || invFinalRes.body.balanceDue), 0);
    assert.strictEqual(invFinalRes.body.payments.length, 2, 'Invoice should have 2 payments linked in history');
    pass(`Invoice status transitioned to 'Paid In Full' with Balance Due = ₹0 and 2 verified payment entries`);

    // Verify Invoice is NO LONGER listed under pending receivables
    const pendingAfterSettlement = await request('/invoices/pending', { headers: authHeaders });
    const isStillPending = pendingAfterSettlement.body.some(i => i.id === invoice.id);
    assert.strictEqual(isStillPending, false, 'Fully paid invoice should not appear in pending receivables');
    pass('Fully settled invoice cleanly cleared from pending receivables list');

    // -------------------------------------------------------------
    // Step 10: Receipt Detail & Showroom Settings Verification
    // -------------------------------------------------------------
    console.log('\n📌 Phase 10: Official Receipt & Showroom Branding Retrieval');
    const receiptRes = await request(`/receipts/${advancePayment.receiptId || advancePayment.receiptNo}`, { headers: authHeaders });
    assert.strictEqual(receiptRes.status, 200);
    const receipt = receiptRes.body;
    assert.strictEqual(receipt.customerName, testCustomer.name);
    assert.strictEqual(Number(receipt.amount), advanceAmount);
    assert.ok(receipt.settings, 'Receipt missing showroom settings');
    assert.ok(receipt.settings.showroom_name, 'Showroom name missing from receipt');
    pass(`Retrieved printable official receipt #${receipt.receiptNo} for ${receipt.customerName} with dynamic dealership branding: ${receipt.settings.showroom_name}`);

    // -------------------------------------------------------------
    // Step 11: Cleanup & Vehicle Status Reversion Verification
    // -------------------------------------------------------------
    console.log('\n📌 Phase 11: Deletion & Atomic State Reversion');
    const delSaleRes = await request(`/sales/${testSale.id}`, { method: 'DELETE', headers: adminHeaders });
    assert.strictEqual(delSaleRes.status, 200, 'Sale deletion failed');
    pass('Deleted test sale order (atomic transaction cascaded invoices & payments cleanup)');

    // Verify vehicle status reverted back to Available
    const checkRevertedVeh = await request(`/vehicles/${testVehicle.id}`, { headers: authHeaders });
    assert.strictEqual(checkRevertedVeh.status, 200);
    assert.strictEqual(checkRevertedVeh.body.status, 'Available', 'Vehicle status should revert to Available');
    assert.strictEqual(checkRevertedVeh.body.stock_quantity, 1, 'Vehicle stock should be restored');
    pass('CONFIRMED: Vehicle status automatically reverted to Available and stock restored to 1');

    // Clean up test customer and vehicle
    await request(`/quotations/${testQuotation.id}`, { method: 'DELETE', headers: adminHeaders });
    await request(`/customers/${testCustomer.id}`, { method: 'DELETE', headers: adminHeaders });
    await request(`/vehicles/${testVehicle.id}`, { method: 'DELETE', headers: adminHeaders });
    pass('Cleaned up test fixtures from SQLite database');

    console.log('\n============================================================');
    console.log(`🎉 [SUCCESS] All ${passed}/${total} Sales, Invoicing & Payments tests PASSED!`);
    console.log('============================================================\n');

  } catch (err) {
    fail('Unexpected exception during sales & invoicing workflow test execution', err);
    console.error(err);
    process.exit(1);
  }
}

runSalesInvoicingWorkflowTests();
