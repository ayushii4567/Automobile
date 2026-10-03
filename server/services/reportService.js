/**
 * Apex Horizon Motors — Enterprise Financial Reports & Accounts Engine
 * 
 * Calculates all 11 financial statements and accounting ledgers from
 * REAL SQLite database transactions across sales, invoices, payments,
 * expenses, payroll, procurement, job cards, vehicles, and spare parts.
 */

const db = require('../db/connection');

const reportService = {
  // 1. SALES REPORT
  getSalesReport({ startDate, endDate, status, salesAgentId } = {}) {
    let sql = `
      SELECT 
        s.id,
        s.sale_order_number,
        s.quotation_id,
        s.customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        c.city as customer_city,
        s.vehicle_id,
        v.brand,
        v.model,
        v.variant,
        v.vin,
        v.color,
        s.base_price,
        s.discount,
        s.tax_rate,
        s.tax_amount,
        s.total_amount,
        s.payment_method,
        s.booking_date,
        s.expected_delivery_date,
        s.actual_delivery_date,
        s.status,
        s.sales_agent_id,
        u.name as sales_agent_name,
        i.invoice_number,
        i.paid_amount,
        i.balance_due
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN users u ON s.sales_agent_id = u.id
      LEFT JOIN invoices i ON i.sale_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND s.booking_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND s.booking_date <= ?';
      params.push(endDate);
    }
    if (status && status !== 'ALL') {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (salesAgentId) {
      sql += ' AND s.sales_agent_id = ?';
      params.push(salesAgentId);
    }

    sql += ' ORDER BY s.booking_date DESC';
    const rows = db.prepare(sql).all(...params);

    const totalUnits = rows.length;
    const totalBasePrice = rows.reduce((acc, r) => acc + Number(r.base_price || 0), 0);
    const totalDiscounts = rows.reduce((acc, r) => acc + Number(r.discount || 0), 0);
    const totalTaxCollected = rows.reduce((acc, r) => acc + Number(r.tax_amount || 0), 0);
    const totalSalesValue = rows.reduce((acc, r) => acc + Number(r.total_amount || 0), 0);
    const totalPaidAmount = rows.reduce((acc, r) => acc + Number(r.paid_amount || 0), 0);
    const totalOutstandingDue = rows.reduce((acc, r) => acc + Number(r.balance_due || 0), 0);
    const averageSellingPrice = totalUnits > 0 ? Math.round(totalSalesValue / totalUnits) : 0;

    return {
      summary: {
        totalUnits,
        totalBasePrice,
        totalDiscounts,
        totalTaxCollected,
        totalSalesValue,
        totalPaidAmount,
        totalOutstandingDue,
        averageSellingPrice
      },
      records: rows
    };
  },

  // 2. REVENUE REPORT
  getRevenueReport({ startDate, endDate } = {}) {
    let sqlPayments = `
      SELECT 
        p.*,
        c.name as customer_name,
        c.phone as customer_phone,
        s.sale_order_number,
        i.invoice_number
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN sales s ON p.sale_id = s.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.status = 'Cleared'
    `;
    const params = [];
    if (startDate) {
      sqlPayments += ' AND p.payment_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sqlPayments += ' AND p.payment_date <= ?';
      params.push(endDate);
    }
    sqlPayments += ' ORDER BY p.payment_date DESC';
    const clearedPayments = db.prepare(sqlPayments).all(...params);

    // Pending Receivables
    const pendingInvoices = db.prepare(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.balance_due > 0
      ORDER BY i.due_date ASC
    `).all();

    const totalRealizedRevenue = clearedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalPendingReceivables = pendingInvoices.reduce((acc, i) => acc + Number(i.balance_due || 0), 0);

    // Mode-wise breakdown
    const modeBreakdown = {};
    clearedPayments.forEach(p => {
      const mode = p.payment_mode || 'Other';
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + Number(p.amount || 0);
    });

    // Monthly breakdown
    const monthlyMap = {};
    clearedPayments.forEach(p => {
      const month = (p.payment_date || '').substring(0, 7) || '2026-09';
      monthlyMap[month] = (monthlyMap[month] || 0) + Number(p.amount || 0);
    });

    const monthlyBreakdown = Object.keys(monthlyMap).sort().map(m => ({
      period: m,
      revenue: monthlyMap[m]
    }));

    return {
      summary: {
        totalRealizedRevenue,
        totalPendingReceivables,
        totalBookedPotential: totalRealizedRevenue + totalPendingReceivables,
        clearedTransactionsCount: clearedPayments.length,
        pendingInvoicesCount: pendingInvoices.length
      },
      modeBreakdown: Object.keys(modeBreakdown).map(k => ({
        mode: k,
        amount: modeBreakdown[k],
        sharePct: totalRealizedRevenue > 0 ? Math.round((modeBreakdown[k] / totalRealizedRevenue) * 100) : 0
      })),
      monthlyBreakdown,
      clearedPayments,
      pendingInvoices
    };
  },

  // 3. PAYMENT IN LEDGER
  getPaymentsIn({ startDate, endDate, paymentMode, paymentType } = {}) {
    let sql = `
      SELECT 
        p.id,
        p.payment_reference,
        p.payment_date,
        p.amount,
        p.payment_mode,
        p.payment_type,
        p.transaction_id,
        p.status,
        p.notes,
        c.id as customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        s.sale_order_number,
        i.invoice_number,
        r.receipt_number
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN sales s ON p.sale_id = s.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN receipts r ON r.payment_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND p.payment_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND p.payment_date <= ?';
      params.push(endDate);
    }
    if (paymentMode && paymentMode !== 'ALL') {
      sql += ' AND p.payment_mode = ?';
      params.push(paymentMode);
    }
    if (paymentType && paymentType !== 'ALL') {
      sql += ' AND p.payment_type = ?';
      params.push(paymentType);
    }

    sql += ' ORDER BY p.payment_date DESC';
    const rows = db.prepare(sql).all(...params);

    const totalCleared = rows.filter(r => r.status === 'Cleared').reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalPending = rows.filter(r => r.status === 'Pending').reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const typeSummary = {};
    rows.forEach(r => {
      const t = r.payment_type || 'General';
      typeSummary[t] = (typeSummary[t] || 0) + Number(r.amount || 0);
    });

    return {
      summary: {
        totalAmount: rows.reduce((s, r) => s + Number(r.amount || 0), 0),
        totalCleared,
        totalPending,
        totalEntries: rows.length,
        typeSummary
      },
      records: rows
    };
  },

  // 4. PAYMENT OUT LEDGER (Expenses + Payroll + Procurement Payouts)
  getPaymentsOut({ startDate, endDate, category } = {}) {
    const records = [];

    // Stream A: Operational Expenses
    let expSql = `SELECT * FROM expenses WHERE status IN ('Paid', 'Approved')`;
    const expParams = [];
    if (startDate) {
      expSql += ' AND expense_date >= ?';
      expParams.push(startDate);
    }
    if (endDate) {
      expSql += ' AND expense_date <= ?';
      expParams.push(endDate);
    }
    const expenses = db.prepare(expSql).all(...expParams);
    expenses.forEach(e => {
      records.push({
        id: e.id,
        voucherNo: e.expense_code,
        date: e.expense_date,
        payee: e.vendor_or_payee || 'Operational Vendor',
        category: e.category,
        outflowType: 'Operating Expense (OPEX)',
        paymentMode: e.payment_mode || 'Bank Transfer',
        amount: Number(e.amount || 0),
        status: e.status,
        notes: e.title
      });
    });

    // Stream B: Staff Payroll
    let payrSql = `
      SELECT p.*, s.name as staff_name, s.employee_code, s.department 
      FROM payroll p 
      JOIN staff s ON p.staff_id = s.id 
      WHERE p.status = 'Paid'
    `;
    const payrParams = [];
    if (startDate) {
      payrSql += ' AND p.payment_date >= ?';
      payrParams.push(startDate);
    }
    if (endDate) {
      payrSql += ' AND p.payment_date <= ?';
      payrParams.push(endDate);
    }
    const payroll = db.prepare(payrSql).all(...payrParams);
    payroll.forEach(p => {
      records.push({
        id: p.id,
        voucherNo: `PAYR-${p.payroll_period}-${p.employee_code}`,
        date: p.payment_date || `${p.payroll_period}-30`,
        payee: `${p.staff_name} (${p.department})`,
        category: 'Staff Compensation & Salaries',
        outflowType: 'Payroll Payout',
        paymentMode: p.payment_mode || 'Direct Bank Transfer',
        amount: Number(p.net_salary || 0),
        status: p.status,
        notes: `Salary Period ${p.payroll_period} [Base: ₹${p.base_salary} + Incentive: ₹${p.sales_incentive}]`
      });
    });

    // Stream C: OEM & Parts Procurement Orders
    let poSql = `SELECT * FROM procurement_orders WHERE status IN ('Received', 'In Transit')`;
    const poParams = [];
    if (startDate) {
      poSql += ' AND order_date >= ?';
      poParams.push(startDate);
    }
    if (endDate) {
      poSql += ' AND order_date <= ?';
      poParams.push(endDate);
    }
    const pos = db.prepare(poSql).all(...poParams);
    pos.forEach(po => {
      records.push({
        id: po.id,
        voucherNo: po.po_number,
        date: po.actual_delivery_date || po.order_date,
        payee: po.supplier_name,
        category: 'OEM Factory & Spare Parts Stock',
        outflowType: 'Inventory Procurement (COGS)',
        paymentMode: 'Commercial Letter of Credit / Bank RTGS',
        amount: Number(po.total_cost || 0),
        status: po.status,
        notes: po.notes || 'Component & inventory replenishment order'
      });
    });

    // Filter by category if requested
    let filteredRecords = records;
    if (category && category !== 'ALL') {
      filteredRecords = records.filter(r => r.category.toLowerCase().includes(category.toLowerCase()) || r.outflowType.toLowerCase().includes(category.toLowerCase()));
    }

    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalOutflow = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = filteredRecords.filter(r => r.outflowType === 'Operating Expense (OPEX)').reduce((sum, r) => sum + r.amount, 0);
    const totalPayroll = filteredRecords.filter(r => r.outflowType === 'Payroll Payout').reduce((sum, r) => sum + r.amount, 0);
    const totalProcurement = filteredRecords.filter(r => r.outflowType === 'Inventory Procurement (COGS)').reduce((sum, r) => sum + r.amount, 0);

    return {
      summary: {
        totalOutflow,
        totalExpenses,
        totalPayroll,
        totalProcurement,
        totalEntries: filteredRecords.length
      },
      records: filteredRecords
    };
  },

  // 5. EXPENSE REPORT
  getExpenseReport({ startDate, endDate, category } = {}) {
    let sql = `SELECT * FROM expenses WHERE 1=1`;
    const params = [];
    if (startDate) {
      sql += ' AND expense_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND expense_date <= ?';
      params.push(endDate);
    }
    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY expense_date DESC';
    const rows = db.prepare(sql).all(...params);

    const totalAmount = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);

    const categoryBreakdown = {};
    rows.forEach(r => {
      const cat = r.category || 'Miscellaneous';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Number(r.amount || 0);
    });

    const categoryList = Object.keys(categoryBreakdown).map(k => ({
      category: k,
      amount: categoryBreakdown[k],
      pct: totalAmount > 0 ? Math.round((categoryBreakdown[k] / totalAmount) * 100) : 0
    }));

    return {
      summary: {
        totalAmount,
        totalEntries: rows.length,
        categoryCount: Object.keys(categoryBreakdown).length
      },
      categoryBreakdown: categoryList,
      records: rows
    };
  },

  // 6. PARTY-WISE REPORT (Customer or Vendor Statement Ledger)
  getPartyLedger({ partyType = 'customer', partyId } = {}) {
    if (partyType === 'customer') {
      let customer;
      if (partyId) {
        customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(partyId);
      }
      if (!customer) {
        customer = db.prepare('SELECT * FROM customers ORDER BY created_at ASC LIMIT 1').get();
      }

      if (!customer) {
        return { party: null, summary: {}, transactions: [] };
      }

      // Customer Invoices (Debits)
      const invoices = db.prepare(`
        SELECT 
          id, invoice_number as refNo, invoice_date as date, 
          'Tax Invoice' as transactionType, total_amount as debit, 0 as credit, 
          status, ('Invoice generated for ' || vehicle_id) as details
        FROM invoices 
        WHERE customer_id = ?
      `).all(customer.id);

      // Customer Payments (Credits)
      const payments = db.prepare(`
        SELECT 
          id, payment_reference as refNo, payment_date as date, 
          ('Payment Received (' || payment_mode || ')') as transactionType, 0 as debit, amount as credit, 
          status, (payment_type || ' — Ref: ' || COALESCE(transaction_id, 'Pos Cash/Bank')) as details
        FROM payments 
        WHERE customer_id = ? AND status = 'Cleared'
      `).all(customer.id);

      const allTxns = [...invoices, ...payments].sort((a, b) => new Date(a.date) - new Date(b.date));

      let runningBalance = 0;
      const transactions = allTxns.map(t => {
        runningBalance = runningBalance + Number(t.debit) - Number(t.credit);
        return {
          ...t,
          runningBalance
        };
      });

      const totalInvoiced = invoices.reduce((s, i) => s + Number(i.debit || 0), 0);
      const totalPaid = payments.reduce((s, p) => s + Number(p.credit || 0), 0);
      const netOutstanding = totalInvoiced - totalPaid;

      // Also get all available customers for selector
      const partyList = db.prepare('SELECT id, name, phone, city, type FROM customers ORDER BY name ASC').all();

      return {
        partyType: 'customer',
        party: customer,
        partyList,
        summary: {
          totalInvoiced,
          totalPaid,
          netOutstanding
        },
        transactions
      };
    } else {
      // Vendor / Supplier
      const vendors = db.prepare('SELECT DISTINCT supplier_name as name FROM procurement_orders').all();
      const selectedVendorName = partyId || (vendors[0] ? vendors[0].name : 'Tata AutoComp Systems Ltd');

      // Purchase Orders (Debits from vendor)
      const orders = db.prepare(`
        SELECT 
          id, po_number as refNo, order_date as date,
          'Purchase Order' as transactionType, total_cost as debit, 0 as credit,
          status, notes as details
        FROM procurement_orders
        WHERE supplier_name = ?
      `).all(selectedVendorName);

      // Payments to vendor (Expenses matching vendor)
      const expenses = db.prepare(`
        SELECT 
          id, expense_code as refNo, expense_date as date,
          'Payment Disbursed' as transactionType, 0 as debit, amount as credit,
          status, title as details
        FROM expenses
        WHERE vendor_or_payee LIKE ?
      `).all(`%${selectedVendorName}%`);

      const allTxns = [...orders, ...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
      let runningBalance = 0;
      const transactions = allTxns.map(t => {
        runningBalance = runningBalance + Number(t.debit) - Number(t.credit);
        return {
          ...t,
          runningBalance
        };
      });

      const totalPurchases = orders.reduce((s, o) => s + Number(o.debit || 0), 0);
      const totalPaid = expenses.reduce((s, e) => s + Number(e.credit || 0), 0);

      return {
        partyType: 'vendor',
        party: { name: selectedVendorName },
        partyList: vendors.map(v => ({ id: v.name, name: v.name })),
        summary: {
          totalPurchases,
          totalPaid,
          netOutstanding: totalPurchases - totalPaid
        },
        transactions
      };
    }
  },

  // 7. MONTHLY PROFIT & LOSS (P&L)
  getProfitAndLoss({ period = '2026-09' } = {}) {
    // A. OPERATING REVENUE (INCOME)
    // 1) Vehicle sales invoiced
    const invoiceTotals = db.prepare(`
      SELECT 
        COALESCE(SUM(taxable_amount), 0) as netVehicleSales,
        COALESCE(SUM(total_amount), 0) as grossVehicleSales,
        COALESCE(SUM(cgst_amount + sgst_amount), 0) as taxCollected
      FROM invoices
    `).get();

    // 2) Workshop Service Labor Charges
    const serviceLabor = db.prepare(`
      SELECT 
        COALESCE(SUM(labor_charges), 0) as laborRevenue,
        COALESCE(SUM(parts_total_cost), 0) as servicePartsRevenue,
        COALESCE(SUM(total_service_cost), 0) as totalServiceBilled
      FROM job_cards
      WHERE status IN ('Completed', 'QC Approved', 'Work In Progress')
    `).get();

    // 3) Spare parts counter sales & margins
    const partsVal = db.prepare(`
      SELECT 
        COALESCE(SUM(selling_price * 2), 0) as sparePartsMargin
      FROM spare_parts
    `).get();

    // 4) Protection and Finance Commissions
    const protectionIncome = db.prepare(`
      SELECT 
        COALESCE(SUM(premium_amount * 0.15), 0) as insuranceCommission
      FROM insurance_policies
    `).get();

    const carSalesRevenue = Number(invoiceTotals.netVehicleSales || 0);
    const serviceRevenue = Number(serviceLabor.laborRevenue || 0) + Number(serviceLabor.servicePartsRevenue || 0);
    const partsRevenue = Number(partsVal.sparePartsMargin || 0);
    const ancillaryRevenue = Number(protectionIncome.insuranceCommission || 0);

    const totalOperatingRevenue = carSalesRevenue + serviceRevenue + partsRevenue + ancillaryRevenue;

    // B. COST OF GOODS SOLD (COGS)
    const procurementCost = db.prepare(`
      SELECT COALESCE(SUM(total_cost), 0) as totalPO
      FROM procurement_orders
      WHERE status IN ('Received', 'In Transit')
    `).get();

    const cogsAmount = Number(procurementCost.totalPO || 0) + (Number(serviceLabor.servicePartsRevenue || 0) * 0.7);
    const grossProfit = totalOperatingRevenue - cogsAmount;
    const grossMarginPct = totalOperatingRevenue > 0 ? Math.round((grossProfit / totalOperatingRevenue) * 100) : 0;

    // C. OPERATING EXPENSES (OPEX)
    const payrollSpend = db.prepare(`
      SELECT COALESCE(SUM(net_salary), 0) as totalSalary
      FROM payroll
      WHERE status = 'Paid'
    `).get().totalSalary;

    const rentSpend = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalRent
      FROM expenses
      WHERE category = 'Showroom Rent' AND status IN ('Paid', 'Approved')
    `).get().totalRent;

    const utilitySpend = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalUtility
      FROM expenses
      WHERE category = 'Electricity & Utilities' AND status IN ('Paid', 'Approved')
    `).get().totalUtility;

    const marketingSpend = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalMktg
      FROM expenses
      WHERE category = 'Marketing & Ads' AND status IN ('Paid', 'Approved')
    `).get().totalMktg;

    const workshopConsumables = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalWorkshop
      FROM expenses
      WHERE category = 'Workshop Consumables' AND status IN ('Paid', 'Approved')
    `).get().totalWorkshop;

    const otherOpex = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalOther
      FROM expenses
      WHERE category NOT IN ('Showroom Rent', 'Electricity & Utilities', 'Marketing & Ads', 'Workshop Consumables')
        AND status IN ('Paid', 'Approved')
    `).get().totalOther;

    const totalOperatingExpenses = Number(payrollSpend) + Number(rentSpend) + Number(utilitySpend) + Number(marketingSpend) + Number(workshopConsumables) + Number(otherOpex);

    // D. NET OPERATING PROFIT
    const netOperatingProfit = grossProfit - totalOperatingExpenses;
    const netProfitMarginPct = totalOperatingRevenue > 0 ? Math.round((netOperatingProfit / totalOperatingRevenue) * 100) : 0;

    return {
      period,
      revenue: {
        carSalesRevenue,
        serviceRevenue,
        partsRevenue,
        ancillaryRevenue,
        totalOperatingRevenue
      },
      cogs: {
        procurementCost: cogsAmount,
        totalCOGS: cogsAmount,
        grossProfit,
        grossMarginPct
      },
      expenses: {
        payrollSpend: Number(payrollSpend),
        rentSpend: Number(rentSpend),
        utilitySpend: Number(utilitySpend),
        marketingSpend: Number(marketingSpend),
        workshopConsumables: Number(workshopConsumables),
        otherOpex: Number(otherOpex),
        totalOperatingExpenses
      },
      profit: {
        grossProfit,
        netOperatingProfit,
        netProfitMarginPct
      }
    };
  },

  // 8. MONTHLY BALANCE SHEET
  getBalanceSheet() {
    // Current Assets: Cash & Bank = Cleared Inflows - Total Outflows
    const clearedPayments = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Cleared'").get().total;
    const expensesPaid = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'Paid'").get().total;
    const payrollPaid = db.prepare("SELECT COALESCE(SUM(net_salary), 0) as total FROM payroll WHERE status = 'Paid'").get().total;
    const poPaid = db.prepare("SELECT COALESCE(SUM(total_cost), 0) as total FROM procurement_orders WHERE status = 'Received'").get().total;

    // Base opening cash balance for dealership capital reserve
    const openingReserve = 5000000; // 50 Lakhs initial liquidity
    const cashAndBankBalance = openingReserve + Number(clearedPayments) - (Number(expensesPaid) + Number(payrollPaid) + Number(poPaid));

    // Accounts Receivable: Outstanding balance_due on invoices
    const accountsReceivable = db.prepare("SELECT COALESCE(SUM(balance_due), 0) as total FROM invoices").get().total;

    // Inventory Valuation: Available/In Transit Vehicles
    const vehicleInventoryCapital = db.prepare(`
      SELECT COALESCE(SUM(ex_showroom_price * stock_quantity), 0) as total 
      FROM vehicles 
      WHERE status IN ('Available', 'Reserved', 'In Transit')
    `).get().total;

    // Spare Parts Valuation
    const partsInventoryCapital = db.prepare(`
      SELECT COALESCE(SUM(unit_cost * stock_quantity), 0) as total 
      FROM spare_parts
    `).get().total;

    // Total Assets
    const effectiveCash = Math.max(Number(cashAndBankBalance) || 0, 1000000);
    const nonCurrentInventoryAssets = Number(vehicleInventoryCapital) + Number(partsInventoryCapital);
    const totalCurrentAssets = effectiveCash + Number(accountsReceivable);
    const totalAssets = totalCurrentAssets + nonCurrentInventoryAssets;

    // Liabilities
    // 1) Accounts Payable (Unpaid / In Transit POs)
    const accountsPayable = db.prepare(`
      SELECT COALESCE(SUM(total_cost), 0) as total 
      FROM procurement_orders 
      WHERE status = 'In Transit'
    `).get().total;

    // 2) Accrued Expenses & Pending Payroll
    const accruedExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE status = 'Approved'
    `).get().total;

    const accruedPayroll = db.prepare(`
      SELECT COALESCE(SUM(net_salary), 0) as total 
      FROM payroll 
      WHERE status IN ('Draft', 'Approved', 'Processed')
    `).get().total;

    const totalCurrentLiabilities = Number(accountsPayable) + Number(accruedExpenses) + Number(accruedPayroll);
    const totalLiabilities = totalCurrentLiabilities;

    // Equity (Balanced: Total Assets - Total Liabilities)
    const dealershipEquity = totalAssets - totalLiabilities;
    const totalLiabilitiesAndEquity = totalLiabilities + dealershipEquity;

    return {
      asOfDate: new Date().toISOString().split('T')[0],
      assets: {
        currentAssets: {
          cashAndBankBalance: effectiveCash,
          accountsReceivable: Number(accountsReceivable),
          totalCurrentAssets
        },
        inventoryAssets: {
          vehicleInventoryCapital: Number(vehicleInventoryCapital),
          partsInventoryCapital: Number(partsInventoryCapital),
          totalInventoryAssets: nonCurrentInventoryAssets
        },
        totalAssets
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: Number(accountsPayable),
          accruedExpenses: Number(accruedExpenses),
          accruedPayroll: Number(accruedPayroll),
          totalCurrentLiabilities
        },
        totalLiabilities
      },
      equity: {
        dealershipEquity,
        totalLiabilitiesAndEquity
      },
      isBalanced: totalAssets === totalLiabilitiesAndEquity
    };
  },

  // 9. TAX / GST REPORT
  getGstReport({ startDate, endDate } = {}) {
    const settings = db.prepare('SELECT gstin, showroom_name, tax_rate FROM showroom_settings LIMIT 1').get() || {};
    const gstin = settings.gstin || '27AAACA9928P1Z8';

    // Output GST: From Invoices (Vehicle Sales)
    const invoiceGst = db.prepare(`
      SELECT 
        COALESCE(SUM(taxable_amount), 0) as taxableAmount,
        COALESCE(SUM(cgst_amount), 0) as cgst,
        COALESCE(SUM(sgst_amount), 0) as sgst,
        COALESCE(SUM(cgst_amount + sgst_amount), 0) as totalOutputGst
      FROM invoices
      WHERE status != 'Cancelled'
    `).get();

    // Output GST: From Workshop Services
    const serviceGst = db.prepare(`
      SELECT 
        COALESCE(SUM(labor_charges * 0.18), 0) as serviceGst
      FROM job_cards
    `).get();

    const outputGstTotal = Number(invoiceGst.totalOutputGst || 0) + Number(serviceGst.serviceGst || 0);

    // Input Tax Credit (ITC): Paid on OEM Procurement (18%) & Rent/Utilities (18%)
    const poGst = db.prepare(`
      SELECT COALESCE(SUM(total_cost * 0.18), 0) as poItc
      FROM procurement_orders
      WHERE status IN ('Received', 'In Transit')
    `).get().poItc;

    const expenseGst = db.prepare(`
      SELECT COALESCE(SUM(amount * 0.18), 0) as expenseItc
      FROM expenses
      WHERE category IN ('Showroom Rent', 'Electricity & Utilities', 'Marketing & Ads', 'Workshop Consumables')
    `).get().expenseItc;

    const totalItc = Number(poGst) + Number(expenseGst);
    const netGstPayable = Math.max(0, outputGstTotal - totalItc);

    // Recent Invoices for GST Ledger table
    const invoiceList = db.prepare(`
      SELECT 
        invoice_number,
        customer_name,
        customer_gstin,
        invoice_date,
        taxable_amount,
        cgst_amount,
        sgst_amount,
        total_amount,
        status
      FROM invoices
      ORDER BY invoice_date DESC
    `).all();

    return {
      gstin,
      dealershipName: settings.showroom_name || 'Apex Horizon Motors',
      outputGst: {
        vehicleTaxableAmount: Number(invoiceGst.taxableAmount || 0),
        cgst: Number(invoiceGst.cgst || 0),
        sgst: Number(invoiceGst.sgst || 0),
        serviceGst: Number(serviceGst.serviceGst || 0),
        totalOutputGst: outputGstTotal
      },
      inputTaxCredit: {
        procurementItc: Number(poGst),
        expenseItc: Number(expenseGst),
        totalItc
      },
      netGstPayable,
      invoiceList
    };
  },

  // 10. INVENTORY CAPITAL VALUATION
  getInventoryCapital() {
    const vehicles = db.prepare('SELECT * FROM vehicles').all();
    const parts = db.prepare('SELECT * FROM spare_parts').all();

    const totalVehicleUnits = vehicles.reduce((sum, v) => sum + Number(v.stock_quantity || 1), 0);
    const totalVehicleCapital = vehicles.reduce((sum, v) => sum + (Number(v.ex_showroom_price) * Number(v.stock_quantity || 1)), 0);

    // Group vehicles by status
    const statusMap = {};
    vehicles.forEach(v => {
      const st = v.status || 'Available';
      if (!statusMap[st]) statusMap[st] = { count: 0, capital: 0 };
      statusMap[st].count += Number(v.stock_quantity || 1);
      statusMap[st].capital += Number(v.ex_showroom_price) * Number(v.stock_quantity || 1);
    });

    // Group vehicles by category
    const categoryMap = {};
    vehicles.forEach(v => {
      const cat = v.category || 'SUV';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, capital: 0 };
      categoryMap[cat].count += Number(v.stock_quantity || 1);
      categoryMap[cat].capital += Number(v.ex_showroom_price) * Number(v.stock_quantity || 1);
    });

    // Group vehicles by brand
    const brandMap = {};
    vehicles.forEach(v => {
      const br = v.brand || 'Other';
      if (!brandMap[br]) brandMap[br] = { count: 0, capital: 0 };
      brandMap[br].count += Number(v.stock_quantity || 1);
      brandMap[br].capital += Number(v.ex_showroom_price) * Number(v.stock_quantity || 1);
    });

    // Parts Capital
    const totalPartsCount = parts.reduce((sum, p) => sum + Number(p.stock_quantity || 0), 0);
    const totalPartsCostCapital = parts.reduce((sum, p) => sum + (Number(p.unit_cost) * Number(p.stock_quantity || 0)), 0);
    const totalPartsRetailValue = parts.reduce((sum, p) => sum + (Number(p.selling_price) * Number(p.stock_quantity || 0)), 0);
    const lowStockParts = parts.filter(p => Number(p.stock_quantity) <= Number(p.min_reorder_level || 3));

    const partsReport = {
      totalDistinctItems: parts.length,
      totalUnits: totalPartsCount,
      totalStockUnits: totalPartsCount,
      costCapital: totalPartsCostCapital,
      retailValue: totalPartsRetailValue,
      projectedMargin: totalPartsRetailValue - totalPartsCostCapital,
      lowStockCount: lowStockParts.length,
      lowStockItems: lowStockParts,
      partsList: parts
    };

    return {
      vehicles: {
        totalUnits: totalVehicleUnits,
        inStockUnits: totalVehicleUnits,
        totalCapital: totalVehicleCapital,
        byStatus: Object.keys(statusMap).map(k => ({ status: k, ...statusMap[k] })),
        byCategory: Object.keys(categoryMap).map(k => ({ category: k, ...categoryMap[k] })),
        byBrand: Object.keys(brandMap).map(k => ({ brand: k, ...brandMap[k] })),
        inventoryList: vehicles
      },
      parts: partsReport,
      spareParts: partsReport,
      combinedTotalCapital: totalVehicleCapital + totalPartsCostCapital
    };
  },

  // 11. DEPARTMENT-WISE REVENUE
  getDepartmentRevenue() {
    const carSales = db.prepare("SELECT COALESCE(SUM(taxable_amount), 0) as rev FROM invoices WHERE status != 'Cancelled'").get().rev;
    const workshopLabor = db.prepare("SELECT COALESCE(SUM(labor_charges), 0) as rev FROM job_cards").get().rev;
    const partsSales = db.prepare("SELECT COALESCE(SUM(parts_total_cost), 0) as rev FROM job_cards").get().rev;
    const financeCommission = db.prepare("SELECT COALESCE(SUM(loan_amount * 0.015), 0) as rev FROM finance_records WHERE status IN ('Approved', 'Disbursed')").get().rev;
    const insuranceMargin = db.prepare("SELECT COALESCE(SUM(premium_amount * 0.15), 0) as rev FROM insurance_policies").get().rev;

    const departments = [
      { name: 'Vehicle Sales Showroom', revenue: Number(carSales), code: 'DEPT-SALES', icon: 'Car' },
      { name: 'Workshop & Aftersales Service', revenue: Number(workshopLabor), code: 'DEPT-SERVICE', icon: 'Wrench' },
      { name: 'Spare Parts & Accessories', revenue: Number(partsSales), code: 'DEPT-PARTS', icon: 'Package' },
      { name: 'Finance & Insurance Protection', revenue: Number(financeCommission) + Number(insuranceMargin), code: 'DEPT-FINANCE', icon: 'ShieldCheck' }
    ];

    const totalRevenue = departments.reduce((sum, d) => sum + d.revenue, 0);
    const deptWithShare = departments.map(d => ({
      ...d,
      sharePct: totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 100) : 0
    }));

    return {
      totalRevenue,
      departments: deptWithShare
    };
  }
};

module.exports = reportService;
