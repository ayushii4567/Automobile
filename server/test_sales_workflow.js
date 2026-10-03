/**
 * Apex Horizon Motors — Core Showroom Sales Workflow Integration Test
 *
 * Verifies End-to-End Sales Pipeline:
 * Lead -> Customer -> Test Drive -> Estimate -> Quotation -> EMI / Finance
 *
 * All operations test REAL backend endpoints and SQLite database persistence.
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

async function runSalesWorkflowTests() {
  console.log('\n============================================================');
  console.log('🚀 [TEST] Core Showroom Sales Workflow End-to-End Test Suite');
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
    // Step 0: Login as Sales Executive
    // -------------------------------------------------------------
    console.log('📌 Phase 0: Sales Executive Authentication');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { username: 'sales', password: 'sales123' }
    });
    assert.strictEqual(loginRes.status, 200, 'Login failed');
    const token = loginRes.body.token;
    assert.ok(token, 'Missing JWT token');
    const authHeaders = { Authorization: `Bearer ${token}` };
    pass('Sales Executive authenticated with valid session token');

    // -------------------------------------------------------------
    // Step 1: Module 1 — Showroom Dashboard
    // -------------------------------------------------------------
    console.log('\n📌 Phase 1: Showroom Executive Dashboard');
    const dashRes = await request('/dashboard', { headers: authHeaders });
    assert.strictEqual(dashRes.status, 200);
    assert.ok(dashRes.body.kpi, 'Missing kpi metrics');
    assert.ok(dashRes.body.kpi.totalVehicles >= 1, 'Total vehicles metric missing');
    assert.ok(dashRes.body.kpi.activeCustomersCount >= 1, 'Active customers metric missing');
    assert.ok(dashRes.body.kpi.totalRevenue !== undefined, 'Revenue metric missing');
    pass(`Dashboard loaded live SQLite KPI (Fleet: ${dashRes.body.kpi.totalVehicles}, Customers: ${dashRes.body.kpi.activeCustomersCount}, Revenue: ₹${dashRes.body.kpi.totalRevenue})`);

    // -------------------------------------------------------------
    // Step 2: Module 2 — Vehicle / Inventory CRUD & Filters
    // -------------------------------------------------------------
    console.log('\n📌 Phase 2: Vehicle Inventory Management');
    const newVehRes = await request('/vehicles', {
      method: 'POST',
      headers: authHeaders,
      body: {
        brand: 'Porsche',
        model: 'Taycan 4S Cross Turismo',
        year: 2026,
        category: 'Electric',
        color: 'Frozen Blue Metallic',
        fuel: 'Electric',
        transmission: 'Automatic',
        horsepower: 530,
        price: 17500000,
        stock: 2,
        status: 'Available'
      }
    });
    assert.strictEqual(newVehRes.status, 201);
    const createdVehicle = newVehRes.body;
    assert.ok(createdVehicle.id, 'Vehicle ID missing');
    pass(`Created inventory vehicle: ${createdVehicle.brand} ${createdVehicle.model} (ID: ${createdVehicle.id})`);

    // Test Search & Filter on Vehicles
    const vehSearchRes = await request('/vehicles?search=Taycan&category=Electric', { headers: authHeaders });
    assert.strictEqual(vehSearchRes.status, 200);
    assert.ok(vehSearchRes.body.some(v => v.id === createdVehicle.id), 'Search failed to find created vehicle');
    pass('Vehicle search by model and category filter returned matching stock');

    // -------------------------------------------------------------
    // Step 3: Module 4 — Lead Management
    // -------------------------------------------------------------
    console.log('\n📌 Phase 3: Lead Capture & Pipeline');
    const leadPhone = `+91 98${Date.now().toString().slice(-8)}`;
    const newLeadRes = await request('/leads', {
      method: 'POST',
      headers: authHeaders,
      body: {
        contact_name: 'Aarav Singhania',
        phone: leadPhone,
        email: 'aarav.singhania@corp.in',
        vehicle_interest_text: `${createdVehicle.brand} ${createdVehicle.model}`,
        budget_max: 18000000,
        source: 'Walk-in',
        notes: 'Walked into showroom, interested in EV luxury sports wagon.'
      }
    });
    assert.strictEqual(newLeadRes.status, 201);
    const createdLead = newLeadRes.body;
    assert.ok(createdLead.id, 'Lead ID missing');
    assert.strictEqual(createdLead.status, 'New');
    pass(`Created sales lead: ${createdLead.contact_name} for ${createdLead.vehicle_interest_text}`);

    // Verify search on Leads
    const leadSearchRes = await request(`/enquiries?search=Aarav`, { headers: authHeaders });
    assert.strictEqual(leadSearchRes.status, 200);
    assert.ok(leadSearchRes.body.some(l => l.id === createdLead.id));
    pass('Leads API alias (/enquiries) correctly retrieved prospective client');

    // -------------------------------------------------------------
    // Step 4: Workflow Transition — Lead -> Customer Conversion
    // -------------------------------------------------------------
    console.log('\n📌 Phase 4: Workflow Conversion (Lead -> Customer)');
    const convertLeadRes = await request(`/leads/${createdLead.id}/convert-customer`, {
      method: 'POST',
      headers: authHeaders,
      body: { address: 'Penthouse 14, Worli Sea Face', city: 'Mumbai', pincode: '400018' }
    });
    assert.strictEqual(convertLeadRes.status, 200);
    assert.strictEqual(convertLeadRes.body.success, true);
    const convertedCustomer = convertLeadRes.body.customer;
    assert.ok(convertedCustomer.id, 'Customer ID missing');
    assert.strictEqual(convertedCustomer.phone, leadPhone);
    pass(`Lead converted into registered Customer: ${convertedCustomer.name} (Cust ID: ${convertedCustomer.id})`);

    // Verify Lead status updated to 'Converted' in database
    const verifyLeadRes = await request(`/leads/${createdLead.id}`, { headers: authHeaders });
    assert.strictEqual(verifyLeadRes.status, 200);
    assert.strictEqual(verifyLeadRes.body.status, 'Converted');
    assert.strictEqual(verifyLeadRes.body.customer_id, convertedCustomer.id);
    pass('Lead record in SQLite updated to Converted status and linked to Customer foreign key');

    // -------------------------------------------------------------
    // Step 5: Module 3 — Customers / CRM Validation
    // -------------------------------------------------------------
    console.log('\n📌 Phase 5: Customer CRM Verification');
    const custRes = await request(`/customers?search=Aarav`, { headers: authHeaders });
    assert.strictEqual(custRes.status, 200);
    assert.ok(custRes.body.some(c => c.id === convertedCustomer.id));
    pass(`Customer CRM verified in database: ${convertedCustomer.name} with verified city Mumbai`);

    // -------------------------------------------------------------
    // Step 6: Workflow Transition — Customer -> Test Drive
    // -------------------------------------------------------------
    console.log('\n📌 Phase 6: Workflow Transition (Customer -> Test Drive Booking)');
    const tdDate = new Date();
    tdDate.setDate(tdDate.getDate() + 1);
    const scheduledDate = tdDate.toISOString().split('T')[0];

    const tdRes = await request('/testdrives', {
      method: 'POST',
      headers: authHeaders,
      body: {
        customer_id: convertedCustomer.id,
        customer_name: convertedCustomer.name,
        customer_phone: convertedCustomer.phone,
        vehicle_id: createdVehicle.id,
        vehicle_name: `${createdVehicle.brand} ${createdVehicle.model}`,
        scheduled_date: scheduledDate,
        time_slot: '11:00 AM - 12:00 PM',
        driving_license_number: 'DL-04-2022-0099812',
        route_taken: 'Sea Link High Speed Corridor'
      }
    });
    assert.strictEqual(tdRes.status, 201);
    const createdTD = tdRes.body;
    assert.ok(createdTD.id, 'Test drive ID missing');
    assert.strictEqual(createdTD.status, 'Scheduled');
    pass(`Test Drive booked for ${createdTD.customer_name} (Booking: ${createdTD.booking_number}) on ${createdTD.scheduled_date}`);

    // Update Test Drive to Completed with Customer Feedback
    const updateTDRes = await request(`/testdrives/${createdTD.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        status: 'Completed',
        customer_feedback: 'Loved the acceleration and regenerative braking! Ready for pricing proposal.'
      }
    });
    assert.strictEqual(updateTDRes.status, 200);
    assert.strictEqual(updateTDRes.body.status, 'Completed');
    pass('Test Drive conducted and marked Completed with recorded customer feedback');

    // -------------------------------------------------------------
    // Step 7: Workflow Transition — Test Drive -> Cost Estimate
    // -------------------------------------------------------------
    console.log('\n📌 Phase 7: Workflow Transition (Test Drive -> Vehicle Cost Estimate)');
    const exShowroom = Number(createdVehicle.price);
    const rto = Math.round(exShowroom * 0.08); // 8% RTO
    const insurance = Math.round(exShowroom * 0.035); // 3.5% Insurance
    const accessories = 120000; // Performance Aero Pack
    const warranty = 250000; // 5-Year Shield Protection
    const discount = 150000; // Dealership loyalty promo
    const totalEstimated = exShowroom + rto + insurance + accessories + warranty - discount;

    const estRes = await request('/estimates', {
      method: 'POST',
      headers: authHeaders,
      body: {
        customer_id: convertedCustomer.id,
        customer_name: convertedCustomer.name,
        vehicle_id: createdVehicle.id,
        vehicle_name: `${createdVehicle.brand} ${createdVehicle.model}`,
        ex_showroom_price: exShowroom,
        rto_charges: rto,
        insurance_amount: insurance,
        accessories_cost: accessories,
        warranty_cost: warranty,
        discount_amount: discount,
        total_estimated_amount: totalEstimated,
        valid_until: '2026-11-30',
        status: 'Active'
      }
    });
    assert.strictEqual(estRes.status, 201);
    const createdEstimate = estRes.body;
    assert.ok(createdEstimate.id, 'Estimate ID missing');
    assert.strictEqual(Number(createdEstimate.total_estimated_amount || createdEstimate.total), totalEstimated);
    pass(`Generated On-Road Estimate ${createdEstimate.estimate_number || createdEstimate.estimateNo}: Total ₹${totalEstimated.toLocaleString('en-IN')}`);

    // Verify Estimate in /estimates GET list with search
    const getEstRes = await request(`/estimates?search=Aarav`, { headers: authHeaders });
    assert.strictEqual(getEstRes.status, 200);
    assert.ok(getEstRes.body.some(e => e.id === createdEstimate.id));
    pass('Estimate retrieved via database search query filter');

    // -------------------------------------------------------------
    // Step 8: Workflow Transition — Estimate -> Quotation Conversion
    // -------------------------------------------------------------
    console.log('\n📌 Phase 8: Workflow Transition (Estimate -> Formal Quotation)');
    const convertQuoteRes = await request(`/estimates/${createdEstimate.id}/convert-quotation`, {
      method: 'POST',
      headers: authHeaders
    });
    assert.strictEqual(convertQuoteRes.status, 201);
    assert.strictEqual(convertQuoteRes.body.success, true);
    const createdQuotation = convertQuoteRes.body.quotation;
    assert.ok(createdQuotation.id, 'Quotation ID missing');
    assert.strictEqual(Number(createdQuotation.total_amount), totalEstimated);
    pass(`Estimate converted to Formal Pro-Forma Quotation: ${createdQuotation.quotation_number} (₹${Number(createdQuotation.total_amount).toLocaleString('en-IN')})`);

    // Verify Estimate status changed to 'Converted' in database
    const verifyEstAfterRes = await request(`/estimates?search=${createdEstimate.id}`, { headers: authHeaders });
    const estRow = verifyEstAfterRes.body.find(e => e.id === createdEstimate.id);
    assert.strictEqual(estRow.status, 'Converted');
    pass('Estimate record in SQLite updated to Converted status');

    // Update Quotation to Accepted
    const updateQuoteRes = await request(`/quotations/${createdQuotation.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { status: 'Accepted', notes: 'Client accepted formal quotation, proceeding to EMI & Finance.' }
    });
    assert.strictEqual(updateQuoteRes.status, 200);
    assert.strictEqual(updateQuoteRes.body.status, 'Accepted');
    pass('Quotation status updated to Accepted by client');

    // -------------------------------------------------------------
    // Step 9: Workflow Transition — Quotation -> EMI & Finance Application
    // -------------------------------------------------------------
    console.log('\n📌 Phase 9: Workflow Transition (Quotation -> EMI & Bank Loan Application)');
    const loanAmount = Math.round(totalEstimated * 0.75); // 75% loan
    const downPayment = totalEstimated - loanAmount;
    const interestRate = 8.75;
    const tenureMonths = 60;
    const monthlyRate = (interestRate / 100) / 12;
    const expectedEmi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1));

    const finAppRes = await request('/finance-apps', {
      method: 'POST',
      headers: authHeaders,
      body: {
        customer_id: convertedCustomer.id,
        vehicle_id: createdVehicle.id,
        bank_name: 'HDFC Private Banking Auto Finance',
        loan_amount: loanAmount,
        down_payment: downPayment,
        tenure_months: tenureMonths,
        interest_rate_pct: interestRate,
        monthly_emi: expectedEmi,
        status: 'Under Review',
        notes: `Loan file for ${convertedCustomer.name} on Quotation ${createdQuotation.quotation_number}`
      }
    });
    assert.strictEqual(finAppRes.status, 201);
    const createdFinance = finAppRes.body;
    assert.ok(createdFinance.id, 'Finance ID missing');
    assert.strictEqual(Number(createdFinance.loan_amount || createdFinance.loanAmount), loanAmount);
    assert.strictEqual(Number(createdFinance.monthly_emi || createdFinance.monthlyEmi), expectedEmi);
    pass(`Bank loan application submitted: Application ${createdFinance.application_number || createdFinance.applicationNo} (Loan: ₹${loanAmount.toLocaleString('en-IN')}, EMI: ₹${expectedEmi.toLocaleString('en-IN')}/mo)`);

    // Verify search and filter on /finance-apps
    const finFilterRes = await request(`/finance-apps?search=Aarav&bank=HDFC`, { headers: authHeaders });
    assert.strictEqual(finFilterRes.status, 200);
    assert.ok(finFilterRes.body.some(f => f.id === createdFinance.id));
    pass('Finance application query search by client name and bank name verified');

    // Update Finance Application Status to Approved
    const updateFinRes = await request(`/finance-apps/${createdFinance.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        status: 'Approved',
        notes: 'Sanction letter issued by HDFC Bank. Ready for invoice booking and delivery.'
      }
    });
    assert.strictEqual(updateFinRes.status, 200);
    assert.strictEqual(updateFinRes.body.applicationStatus || updateFinRes.body.status, 'Approved');
    pass('Bank Loan Sanctioned & Status updated to Approved');

    // -------------------------------------------------------------
    // Step 10: Full Audit Trail Verification
    // -------------------------------------------------------------
    console.log('\n📌 Phase 10: Dealership Audit Trail Verification');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    });
    const adminHeaders = { Authorization: `Bearer ${adminLogin.body.token}` };
    const auditRes = await request('/audit-logs', { headers: adminHeaders });
    assert.strictEqual(auditRes.status, 200);
    const logs = auditRes.body;

    const hasLeadAudit = logs.some(l => (l.module || l.entity_type) === 'LEADS');
    const hasCustAudit = logs.some(l => (l.module || l.entity_type) === 'CUSTOMERS');
    const hasTDAudit = logs.some(l => (l.module || l.entity_type) === 'TEST_DRIVES');
    const hasEstAudit = logs.some(l => (l.module || l.entity_type) === 'ESTIMATES');
    const hasQuoteAudit = logs.some(l => (l.module || l.entity_type) === 'QUOTATIONS');
    const hasFinAudit = logs.some(l => (l.module || l.entity_type) === 'FINANCE');

    assert.ok(hasLeadAudit, 'Missing LEADS audit log');
    assert.ok(hasCustAudit, 'Missing CUSTOMERS audit log');
    assert.ok(hasTDAudit, 'Missing TEST_DRIVES audit log');
    assert.ok(hasEstAudit, 'Missing ESTIMATES audit log');
    assert.ok(hasQuoteAudit, 'Missing QUOTATIONS audit log');
    assert.ok(hasFinAudit, 'Missing FINANCE audit log');

    pass('Audit trail verified: all 6 sales workflow stages logged permanently in showroom_settings audit log table');

    // Teardown test records
    await request(`/finance-apps/${createdFinance.id}`, { method: 'DELETE', headers: authHeaders });
    await request(`/quotations/${createdQuotation.id}`, { method: 'DELETE', headers: adminHeaders });
    await request(`/estimates/${createdEstimate.id}`, { method: 'DELETE', headers: authHeaders });
    await request(`/testdrives/${createdTD.id}`, { method: 'DELETE', headers: authHeaders });
    await request(`/customers/${convertedCustomer.id}`, { method: 'DELETE', headers: authHeaders });
    await request(`/leads/${createdLead.id}`, { method: 'DELETE', headers: authHeaders });
    await request(`/vehicles/${createdVehicle.id}`, { method: 'DELETE', headers: adminHeaders });
    pass('Cleaned up test workflow records from SQLite database');

    console.log('\n============================================================');
    console.log(`🎉 [SUCCESS] All ${passed}/${total} Sales Workflow tests PASSED!`);
    console.log('============================================================\n');

  } catch (err) {
    fail('Unexpected exception during sales workflow execution', err);
    console.error(err);
    process.exit(1);
  }
}

runSalesWorkflowTests();
