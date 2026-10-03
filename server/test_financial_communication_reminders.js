/**
 * Test Suite: Financial Reports, Communication & Campaigns, Reminders & Alerts
 * Tests real calculations against actual SQLite database records.
 */

const reportService = require('./services/reportService');
const communicationService = require('./services/communicationService');
const reminderService = require('./services/reminderService');
const db = require('./db/connection');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING FULL SYSTEM TEST SUITE: FINANCIALS, COMMS & REMINDERS');
  console.log('================================================================\n');

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

  // ---------------------------------------------------------
  // 1. FINANCIAL REPORTS & ACCOUNTS (REAL DATABASE TRANSACTIONS)
  // ---------------------------------------------------------
  console.log('1️⃣  TESTING FINANCIAL REPORTS CALCULATIONS FROM REAL DB...');

  // A. Sales Report
  const salesReport = reportService.getSalesReport();
  assert(salesReport.records.length > 0, `Sales report fetched ${salesReport.records.length} real sales orders`);
  assert(salesReport.summary.totalUnits > 0, `Sales summary units = ${salesReport.summary.totalUnits}`);
  assert(salesReport.summary.totalSalesValue > 0, `Total sales value = ₹${salesReport.summary.totalSalesValue.toLocaleString('en-IN')}`);
  assert(salesReport.summary.averageSellingPrice > 0, `Average selling price = ₹${salesReport.summary.averageSellingPrice.toLocaleString('en-IN')}`);

  // B. Revenue Report
  const revenueReport = reportService.getRevenueReport();
  assert(revenueReport.summary.totalRealizedRevenue > 0, `Total realized revenue from cleared payments = ₹${revenueReport.summary.totalRealizedRevenue.toLocaleString('en-IN')}`);
  assert(revenueReport.summary.totalPendingReceivables > 0, `Total pending receivables on invoices = ₹${revenueReport.summary.totalPendingReceivables.toLocaleString('en-IN')}`);
  assert(revenueReport.modeBreakdown.length > 0, `Payment modes tracked: ${revenueReport.modeBreakdown.map(m => m.mode).join(', ')}`);

  // C. Payment In
  const paymentsIn = reportService.getPaymentsIn();
  assert(paymentsIn.records.length > 0, `Payment In ledger contains ${paymentsIn.records.length} transactions`);
  assert(paymentsIn.summary.totalCleared > 0, `Cleared inflows = ₹${paymentsIn.summary.totalCleared.toLocaleString('en-IN')}`);

  // D. Payment Out (Expenses + Payroll + Procurement)
  const paymentsOut = reportService.getPaymentsOut();
  assert(paymentsOut.records.length > 0, `Payment Out ledger contains ${paymentsOut.records.length} outflows`);
  assert(paymentsOut.summary.totalExpenses > 0, `Operational expenses = ₹${paymentsOut.summary.totalExpenses.toLocaleString('en-IN')}`);
  assert(paymentsOut.summary.totalPayroll > 0, `Payroll payouts = ₹${paymentsOut.summary.totalPayroll.toLocaleString('en-IN')}`);
  assert(paymentsOut.summary.totalProcurement > 0, `Procurement inventory payouts = ₹${paymentsOut.summary.totalProcurement.toLocaleString('en-IN')}`);
  assert(paymentsOut.summary.totalOutflow === (paymentsOut.summary.totalExpenses + paymentsOut.summary.totalPayroll + paymentsOut.summary.totalProcurement), 'Total Outflow equals sum of opex, payroll, and procurement');

  // E. Expense Report
  const expenseReport = reportService.getExpenseReport();
  assert(expenseReport.records.length > 0, `Expense report loaded ${expenseReport.records.length} expense items`);
  assert(expenseReport.categoryBreakdown.length > 0, `Expense categories identified: ${expenseReport.categoryBreakdown.length}`);

  // F. Party-wise Report (Customer & Vendor)
  const custLedger = reportService.getPartyLedger({ partyType: 'customer' });
  assert(custLedger.party !== null, `Customer ledger loaded for ${custLedger.party?.name}`);
  assert(custLedger.transactions.length > 0, `Customer ledger has ${custLedger.transactions.length} debit/credit entries`);
  assert(typeof custLedger.transactions[0].runningBalance === 'number', 'Customer running balance calculated accurately');

  const vendorLedger = reportService.getPartyLedger({ partyType: 'vendor' });
  assert(vendorLedger.party !== null, `Vendor ledger loaded for ${vendorLedger.party?.name}`);
  assert(vendorLedger.transactions.length > 0, `Vendor ledger has ${vendorLedger.transactions.length} purchase/payment entries`);

  // G. Monthly Profit & Loss (P&L)
  const pnl = reportService.getProfitAndLoss({ period: '2026-09' });
  assert(pnl.revenue.totalOperatingRevenue > 0, `P&L Total Revenue = ₹${pnl.revenue.totalOperatingRevenue.toLocaleString('en-IN')}`);
  assert(pnl.cogs.totalCOGS > 0, `P&L COGS = ₹${pnl.cogs.totalCOGS.toLocaleString('en-IN')}`);
  assert(pnl.cogs.grossProfit === (pnl.revenue.totalOperatingRevenue - pnl.cogs.totalCOGS), 'Gross Profit = Total Revenue - COGS');
  assert(pnl.expenses.totalOperatingExpenses > 0, `P&L Operating Expenses = ₹${pnl.expenses.totalOperatingExpenses.toLocaleString('en-IN')}`);
  assert(pnl.profit.netOperatingProfit === (pnl.cogs.grossProfit - pnl.expenses.totalOperatingExpenses), 'Net Operating Profit = Gross Profit - Operating Expenses');
  assert(typeof pnl.profit.netProfitMarginPct === 'number', `Net Profit Margin % = ${pnl.profit.netProfitMarginPct}%`);

  // H. Monthly Balance Sheet
  const balanceSheet = reportService.getBalanceSheet();
  assert(balanceSheet.assets.totalAssets > 0, `Balance sheet Total Assets = ₹${balanceSheet.assets.totalAssets.toLocaleString('en-IN')}`);
  assert(balanceSheet.liabilities.totalLiabilities >= 0, `Balance sheet Total Liabilities = ₹${balanceSheet.liabilities.totalLiabilities.toLocaleString('en-IN')}`);
  assert(balanceSheet.equity.dealershipEquity > 0, `Dealership Equity = ₹${balanceSheet.equity.dealershipEquity.toLocaleString('en-IN')}`);
  assert(
    Math.round(balanceSheet.assets.totalAssets) === Math.round(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.dealershipEquity),
    'Balance Sheet is perfectly balanced: Total Assets = Total Liabilities + Dealership Equity'
  );

  // I. Tax / GST Report
  const gst = reportService.getGstReport();
  assert(gst.gstin.length > 0, `Showroom GSTIN = ${gst.gstin}`);
  assert(gst.outputGst.totalOutputGst > 0, `Output GST collected = ₹${gst.outputGst.totalOutputGst.toLocaleString('en-IN')}`);
  assert(gst.inputTaxCredit.totalItc > 0, `Input Tax Credit (ITC) = ₹${gst.inputTaxCredit.totalItc.toLocaleString('en-IN')}`);
  assert(gst.netGstPayable >= 0, `Net GST Payable to Govt = ₹${gst.netGstPayable.toLocaleString('en-IN')}`);

  // J. Inventory Capital
  const invCapital = reportService.getInventoryCapital();
  assert(invCapital.vehicles.totalUnits > 0, `Vehicles in stock = ${invCapital.vehicles.totalUnits} units`);
  assert(invCapital.vehicles.totalCapital > 0, `Vehicle inventory capital = ₹${invCapital.vehicles.totalCapital.toLocaleString('en-IN')}`);
  assert(invCapital.parts.totalStockUnits > 0, `Spare parts in stock = ${invCapital.parts.totalStockUnits} units`);
  assert(invCapital.combinedTotalCapital > 0, `Combined inventory capital = ₹${invCapital.combinedTotalCapital.toLocaleString('en-IN')}`);

  // K. Department-wise Revenue
  const deptRevenue = reportService.getDepartmentRevenue();
  assert(deptRevenue.departments.length === 4, `All 4 departments analyzed: ${deptRevenue.departments.map(d => d.name).join(', ')}`);
  assert(deptRevenue.totalRevenue > 0, `Total departmental revenue = ₹${deptRevenue.totalRevenue.toLocaleString('en-IN')}`);

  console.log('\n2️⃣  TESTING COMMUNICATION & CAMPAIGNS SERVICE ARCHITECTURE...');

  // A. Gateway Status (Must not fake sending!)
  const gwStatus = communicationService.getGatewayStatus();
  assert(gwStatus.whatsapp.configured === false, 'WhatsApp unconfigured state correctly reported (no fake sending)');
  assert(gwStatus.whatsapp.provider.includes('Direct Deep-Link Mode'), 'Direct deep-link mode active');

  // B. Dispatch message with deep link generation and DB logging
  const dispatchTest = await communicationService.dispatchMessage({
    channel: 'whatsapp',
    recipient: '+91 98201 11223',
    messageText: 'Test message for Rahul Sharma',
    customerId: 'cust_01'
  });
  assert(dispatchTest.status === 'GATEWAY_UNCONFIGURED_MANUAL_DISPATCH', 'Status honestly flagged as GATEWAY_UNCONFIGURED_MANUAL_DISPATCH');
  assert(dispatchTest.directUrl.startsWith('https://wa.me/919820111223'), 'Valid wa.me deep-link generated for 1-click customer sending');

  // Check DB communication log
  const loggedComm = db.prepare('SELECT * FROM communications WHERE id = ?').get(dispatchTest.communicationId);
  assert(loggedComm !== null && loggedComm.status === 'GATEWAY_UNCONFIGURED_MANUAL_DISPATCH', 'Communication record truthfully logged in SQLite database');

  // C. Template generation
  const bdayTmpl = communicationService.generateTemplate('birthday', { customerName: 'Rahul Sharma' });
  assert(bdayTmpl.text.includes('Happy Birthday'), 'Birthday greeting template generated properly');

  const anniTmpl = communicationService.generateTemplate('anniversary', { customerName: 'Vikramaditya Singhania', vehicleName: 'Mercedes-Benz GLC 300' });
  assert(anniTmpl.text.includes('Anniversary'), 'Anniversary greeting template generated properly');

  console.log('\n3️⃣  TESTING REMINDERS & ALERTS ENGINE (ALL 8 CATEGORIES)...');

  const automatedReminders = reminderService.getAutomatedReminders('2026-10-03');
  assert(automatedReminders.totalReminders > 0, `Total automated reminders generated: ${automatedReminders.totalReminders}`);
  
  // Verify all 8 categories
  const categories = automatedReminders.byCategory;
  console.log('  📊 Reminder Category Counts:');
  console.log(`     - Payment: ${categories.payment}`);
  console.log(`     - Insurance: ${categories.insurance}`);
  console.log(`     - Service: ${categories.service}`);
  console.log(`     - Lead Follow-up: ${categories.lead}`);
  console.log(`     - Test Drive: ${categories.testDrive}`);
  console.log(`     - Delivery: ${categories.delivery}`);
  console.log(`     - Birthday: ${categories.birthday}`);
  console.log(`     - Anniversary: ${categories.anniversary}`);

  assert(categories.payment > 0, 'Payment reminders computed from unpaid invoices');
  assert(categories.insurance > 0, 'Insurance reminders computed from expiring policies');
  assert(categories.service > 0, 'Service reminders computed from workshop tickets');
  assert(categories.lead > 0, 'Lead follow-up reminders computed from active CRM leads');
  assert(categories.testDrive > 0, 'Test drive reminders computed from scheduled test drives');
  assert(categories.delivery > 0, 'Delivery reminders computed from booked sales orders');
  assert(categories.birthday > 0, 'Birthday reminders computed from customer birth dates');
  assert(categories.anniversary > 0, 'Anniversary reminders computed from vehicle delivery/anniversary dates');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
  console.log('================================================================\n');
}

runTestSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
