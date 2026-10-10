const express = require('express');
const db = require('../db/connection');
const { authenticateToken, requireRole, recordAudit } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// 1. SALES MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/delivery-challans
router.get('/delivery-challans', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT dc.*, s.sale_order_number, c.name as customer_name_rel
      FROM delivery_challans dc
      LEFT JOIN sales s ON dc.sale_id = s.id
      LEFT JOIN customers c ON dc.customer_id = c.id
      ORDER BY dc.handover_date DESC, dc.created_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/delivery-challans
router.post('/delivery-challans', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM delivery_challans').get().c + 1;
    const challanNumber = b.challan_number || `DC-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `dc_${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO delivery_challans (
        id, challan_number, sale_id, invoice_number, customer_id, customer_name, customer_phone,
        customer_village, customer_tehsil, vehicle_name, chassis_number, engine_number, color,
        key_number, battery_make, toolkit_included, handover_date, delivered_by, recipient_name, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, challanNumber, b.sale_id || null, b.invoice_number || null, b.customer_id || null,
      b.customer_name, b.customer_phone || '', b.customer_village || 'Baramati', b.customer_tehsil || 'Baramati',
      b.vehicle_name, b.chassis_number || 'CHAS-' + Date.now(), b.engine_number || 'ENG-' + Date.now(),
      b.color || 'Standard', b.key_number || 'KEY-01 & KEY-02', b.battery_make || 'Exide OEM',
      b.toolkit_included !== undefined ? (b.toolkit_included ? 1 : 0) : 1,
      b.handover_date || new Date().toISOString().split('T')[0],
      b.delivered_by || (req.user ? req.user.name : 'Authorized Sales Executive'),
      b.recipient_name || b.customer_name, b.status || 'Delivered', b.notes || ''
    );

    recordAudit(db, req.user, 'CREATE', 'SALES', `Created delivery challan ${challanNumber} for ${b.customer_name}`, id);
    const created = db.prepare('SELECT * FROM delivery_challans WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/delivery-challans/:id
router.put('/delivery-challans/:id', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const current = db.prepare('SELECT * FROM delivery_challans WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Delivery challan not found' });

    db.prepare(`
      UPDATE delivery_challans SET
        customer_name = COALESCE(?, customer_name),
        customer_phone = COALESCE(?, customer_phone),
        customer_village = COALESCE(?, customer_village),
        customer_tehsil = COALESCE(?, customer_tehsil),
        vehicle_name = COALESCE(?, vehicle_name),
        chassis_number = COALESCE(?, chassis_number),
        color = COALESCE(?, color),
        key_number = COALESCE(?, key_number),
        battery_make = COALESCE(?, battery_make),
        toolkit_included = COALESCE(?, toolkit_included),
        handover_date = COALESCE(?, handover_date),
        delivered_by = COALESCE(?, delivered_by),
        recipient_name = COALESCE(?, recipient_name),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      b.customer_name, b.customer_phone, b.customer_village, b.customer_tehsil,
      b.vehicle_name, b.chassis_number, b.color, b.key_number, b.battery_make,
      b.toolkit_included !== undefined ? (b.toolkit_included ? 1 : 0) : null,
      b.handover_date, b.delivered_by, b.recipient_name, b.status, b.notes,
      req.params.id
    );

    recordAudit(db, req.user, 'UPDATE', 'SALES', `Updated delivery challan ${current.challan_number}`, req.params.id);
    const updated = db.prepare('SELECT * FROM delivery_challans WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/delivery-challans/:id
router.delete('/delivery-challans/:id', authenticateToken, (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM delivery_challans WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Delivery challan not found' });

    db.prepare('DELETE FROM delivery_challans WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'SALES', `Deleted delivery challan ${current.challan_number}`, req.params.id);
    res.json({ success: true, message: `Delivery challan ${current.challan_number} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agreements
router.get('/agreements', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, s.sale_order_number
      FROM sale_agreements a
      LEFT JOIN sales s ON a.sale_id = s.id
      ORDER BY a.agreement_date DESC, a.created_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agreements
router.post('/agreements', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM sale_agreements').get().c + 1;
    const agreementNumber = b.agreement_number || `AGR-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `agr_${Date.now()}`;

    db.prepare(`
      INSERT INTO sale_agreements (
        id, agreement_number, sale_id, invoice_number, customer_name, customer_phone, customer_village,
        vehicle_name, chassis_number, deal_value, hypothecation_bank, terms_accepted, agreement_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, agreementNumber, b.sale_id || null, b.invoice_number || null,
      b.customer_name, b.customer_phone || '', b.customer_village || 'Baramati',
      b.vehicle_name, b.chassis_number || 'CHAS-' + Date.now(),
      Number(b.deal_value || 0), b.hypothecation_bank || 'State Bank of India',
      1, b.agreement_date || new Date().toISOString().split('T')[0], b.status || 'Executed'
    );

    recordAudit(db, req.user, 'CREATE', 'SALES', `Created sale agreement ${agreementNumber} for ${b.customer_name}`, id);
    const created = db.prepare('SELECT * FROM sale_agreements WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/agreements/:id
router.put('/agreements/:id', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const current = db.prepare('SELECT * FROM sale_agreements WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Sale agreement not found' });

    db.prepare(`
      UPDATE sale_agreements SET
        customer_name = COALESCE(?, customer_name),
        customer_phone = COALESCE(?, customer_phone),
        customer_village = COALESCE(?, customer_village),
        vehicle_name = COALESCE(?, vehicle_name),
        chassis_number = COALESCE(?, chassis_number),
        deal_value = COALESCE(?, deal_value),
        hypothecation_bank = COALESCE(?, hypothecation_bank),
        agreement_date = COALESCE(?, agreement_date),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      b.customer_name, b.customer_phone, b.customer_village, b.vehicle_name, b.chassis_number,
      b.deal_value !== undefined ? Number(b.deal_value) : null,
      b.hypothecation_bank, b.agreement_date, b.status, req.params.id
    );

    recordAudit(db, req.user, 'UPDATE', 'SALES', `Updated sale agreement ${current.agreement_number}`, req.params.id);
    const updated = db.prepare('SELECT * FROM sale_agreements WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/agreements/:id
router.delete('/agreements/:id', authenticateToken, (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM sale_agreements WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Sale agreement not found' });

    db.prepare('DELETE FROM sale_agreements WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'SALES', `Deleted sale agreement ${current.agreement_number}`, req.params.id);
    res.json({ success: true, message: `Sale agreement ${current.agreement_number} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/implements
router.get('/implements', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM implements ORDER BY category ASC, name ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/implements
router.post('/implements', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM implements').get().c + 1;
    const code = b.implement_code || `IMP-${String(count).padStart(3, '0')}`;
    const id = b.id || `imp_${Date.now()}`;

    db.prepare(`
      INSERT INTO implements (
        id, implement_code, name, category, compatible_hp_min, compatible_hp_max,
        purchase_cost, selling_price, stock_quantity, status, supplier_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, code, b.name, b.category || 'Tillage',
      Number(b.compatible_hp_min || 40), Number(b.compatible_hp_max || 75),
      Number(b.purchase_cost || 0), Number(b.selling_price || 0),
      Number(b.stock_quantity || 1), b.status || 'In Stock', b.supplier_name || ''
    );

    recordAudit(db, req.user, 'CREATE', 'IMPLEMENTS', `Added implement: ${b.name} (${code})`, id);
    const created = db.prepare('SELECT * FROM implements WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/implements/:id
router.put('/implements/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE implements SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        compatible_hp_min = COALESCE(?, compatible_hp_min),
        compatible_hp_max = COALESCE(?, compatible_hp_max),
        purchase_cost = COALESCE(?, purchase_cost),
        selling_price = COALESCE(?, selling_price),
        stock_quantity = COALESCE(?, stock_quantity),
        status = COALESCE(?, status),
        supplier_name = COALESCE(?, supplier_name)
      WHERE id = ?
    `).run(
      b.name, b.category,
      b.compatible_hp_min !== undefined ? Number(b.compatible_hp_min) : null,
      b.compatible_hp_max !== undefined ? Number(b.compatible_hp_max) : null,
      b.purchase_cost !== undefined ? Number(b.purchase_cost) : null,
      b.selling_price !== undefined ? Number(b.selling_price) : null,
      b.stock_quantity !== undefined ? Number(b.stock_quantity) : null,
      b.status, b.supplier_name, req.params.id
    );
    const updated = db.prepare('SELECT * FROM implements WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/implements/:id
router.delete('/implements/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    db.prepare('DELETE FROM implements WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Implement record deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/implements/purchases
router.get('/implements/purchases', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM implement_purchases ORDER BY purchase_date DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/implements/purchases
router.post('/implements/purchases', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM implement_purchases').get().c + 1;
    const poNumber = b.po_number || `IMP-PO-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `imppo_${Date.now()}`;
    const qty = Number(b.quantity || 1);
    const unitCost = Number(b.unit_cost || 0);
    const totalCost = Number(b.total_cost || (qty * unitCost));

    db.transaction(() => {
      db.prepare(`
        INSERT INTO implement_purchases (
          id, po_number, supplier_name, implement_id, implement_name, quantity, unit_cost, total_cost, purchase_date, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, poNumber, b.supplier_name, b.implement_id || null, b.implement_name,
        qty, unitCost, totalCost, b.purchase_date || new Date().toISOString().split('T')[0],
        b.status || 'Received', b.notes || ''
      );

      // Increment implement stock if implement_id exists
      if (b.implement_id) {
        db.prepare('UPDATE implements SET stock_quantity = stock_quantity + ? WHERE id = ?').run(qty, b.implement_id);
      }
    })();

    recordAudit(db, req.user, 'CREATE', 'IMPLEMENTS', `Purchased implement consignment: ${poNumber}`, id);
    res.status(201).json({ success: true, message: 'Implement purchase recorded successfully', id, poNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/implements/purchases/:id
router.delete('/implements/purchases/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM implement_purchases WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Purchase record not found' });

    db.transaction(() => {
      if (current.implement_id) {
        db.prepare('UPDATE implements SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?').run(current.quantity, current.implement_id);
      }
      db.prepare('DELETE FROM implement_purchases WHERE id = ?').run(req.params.id);
    })();

    recordAudit(db, req.user, 'DELETE', 'IMPLEMENTS', `Cancelled implement PO ${current.po_number}`, req.params.id);
    res.json({ success: true, message: `Implement PO ${current.po_number} cancelled and stock updated.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/implements/sales
router.get('/implements/sales', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM implement_sales ORDER BY sale_date DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/implements/sales
router.post('/implements/sales', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM implement_sales').get().c + 1;
    const invNumber = b.invoice_number || `IMP-INV-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `impsale_${Date.now()}`;
    const qty = Number(b.quantity || 1);
    const salePrice = Number(b.sale_price || 0);
    const discount = Number(b.discount || 0);
    const taxable = (salePrice * qty) - discount;
    const taxRate = Number(b.tax_rate || 12.0);
    const taxAmount = Math.round(taxable * (taxRate / 100));
    const totalAmount = taxable + taxAmount;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO implement_sales (
          id, invoice_number, customer_id, customer_name, customer_phone, village, tehsil,
          implement_id, implement_name, quantity, sale_price, discount, tax_rate, tax_amount, total_amount,
          payment_mode, sale_date, sales_agent_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, invNumber, b.customer_id || null, b.customer_name, b.customer_phone || '',
        b.village || 'Baramati', b.tehsil || 'Baramati', b.implement_id || null, b.implement_name,
        qty, salePrice, discount, taxRate, taxAmount, totalAmount,
        b.payment_mode || 'Cash', b.sale_date || new Date().toISOString().split('T')[0],
        req.user ? req.user.id : null, b.status || 'Completed'
      );

      // Decrement stock if implement_id exists
      if (b.implement_id) {
        db.prepare('UPDATE implements SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?').run(qty, b.implement_id);
      }
    })();

    recordAudit(db, req.user, 'CREATE', 'IMPLEMENTS', `Sold implement invoice ${invNumber} to ${b.customer_name}`, id);
    res.status(201).json({ success: true, message: 'Implement sale invoiced successfully', id, invNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/implements/sales/:id
router.delete('/implements/sales/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM implement_sales WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Implement sale record not found' });

    db.transaction(() => {
      if (current.implement_id) {
        db.prepare('UPDATE implements SET stock_quantity = stock_quantity + ? WHERE id = ?').run(current.quantity, current.implement_id);
      }
      db.prepare('DELETE FROM implement_sales WHERE id = ?').run(req.params.id);
    })();

    recordAudit(db, req.user, 'DELETE', 'IMPLEMENTS', `Voided implement sale ${current.invoice_number}`, req.params.id);
    res.json({ success: true, message: `Implement sale ${current.invoice_number} voided and stock restored.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales/convert-quotation
router.post('/sales/convert-quotation', authenticateToken, (req, res) => {
  try {
    const { quotation_id, notes } = req.body;
    const quote = db.prepare('SELECT * FROM quotations WHERE id = ?').get(quotation_id);
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(quote.vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'Sold') return res.status(400).json({ error: `Vehicle ${vehicle.brand} ${vehicle.model} has already been sold.` });

    const saleId = `sale_${Date.now()}`;
    const count = db.prepare('SELECT count(*) as c FROM sales').get().c + 1;
    const saleOrderNo = `SO-2026-${String(count).padStart(3, '0')}`;
    const invNumber = `INV-2026-${String(count).padStart(3, '0')}`;
    const invId = `inv_${Date.now()}`;
    const basePrice = Number(quote.ex_showroom_price || vehicle.ex_showroom_price || 0);
    const discount = Number(quote.discount_amount || 0);
    const taxable = basePrice - discount;
    const gstRate = 18.0;
    const gstAmount = Math.round(taxable * (gstRate / 100));
    const totalAmount = Number(quote.total_amount || (taxable + gstAmount));

    const result = db.transaction(() => {
      db.prepare(`
        INSERT INTO sales (
          id, sale_order_number, quotation_id, customer_id, vehicle_id, base_price, discount,
          tax_rate, tax_amount, total_amount, booking_date, sales_agent_id, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
      `).run(
        saleId, saleOrderNo, quote.id, quote.customer_id, quote.vehicle_id, basePrice, discount,
        gstRate, gstAmount, totalAmount, new Date().toISOString().split('T')[0],
        req.user?.id || null, notes || `Converted from quotation ${quote.quotation_number}`
      );

      db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, sale_id, customer_id, vehicle_id, subtotal,
          gst_rate, gst_amount, total_amount, paid_amount, balance_due, invoice_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Pending')
      `).run(
        invId, invNumber, saleId, quote.customer_id, quote.vehicle_id,
        taxable, gstRate, gstAmount, totalAmount, totalAmount,
        new Date().toISOString().split('T')[0]
      );

      db.prepare("UPDATE vehicles SET status = 'Sold', stock_quantity = 0, updated_at = datetime('now') WHERE id = ?").run(quote.vehicle_id);
      db.prepare("UPDATE quotations SET status = 'Accepted', updated_at = datetime('now') WHERE id = ?").run(quote.id);

      recordAudit(db, req.user, 'CONVERT', 'SALES', `Converted quotation ${quote.quotation_number} into Sale ${saleOrderNo} & Invoice ${invNumber}`, saleId);

      return { saleId, saleOrderNo, invNumber, totalAmount };
    })();

    res.status(201).json({ success: true, message: 'Quotation successfully converted to Sale Order & Tax Invoice', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/vehicle-profit
router.get('/sales/vehicle-profit', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        s.id as sale_id,
        s.sale_order_number,
        s.booking_date,
        c.name as customer_name,
        c.village as customer_village,
        c.tehsil as customer_tehsil,
        c.district as customer_district,
        v.brand,
        v.model,
        v.variant,
        v.horsepower,
        v.vin,
        s.base_price,
        s.discount,
        s.total_amount as invoice_total,
        COALESCE(v.procurement_cost, ROUND(v.ex_showroom_price * 0.82)) as cost_price,
        (s.base_price - s.discount) as net_realized_price,
        ((s.base_price - s.discount) - COALESCE(v.procurement_cost, ROUND(v.ex_showroom_price * 0.82))) as gross_profit,
        ROUND((((s.base_price - s.discount) - COALESCE(v.procurement_cost, ROUND(v.ex_showroom_price * 0.82))) * 100.0) / (s.base_price - s.discount), 1) as profit_margin_pct,
        u.name as sales_agent_name
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN users u ON s.sales_agent_id = u.id
      WHERE s.status != 'Cancelled'
      ORDER BY s.booking_date DESC
    `).all();

    const totalRevenue = rows.reduce((acc, r) => acc + Number(r.net_realized_price || 0), 0);
    const totalCost = rows.reduce((acc, r) => acc + Number(r.cost_price || 0), 0);
    const totalProfit = rows.reduce((acc, r) => acc + Number(r.gross_profit || 0), 0);
    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    res.json({
      summary: {
        totalUnitsSold: rows.length,
        totalRevenue,
        totalCost,
        totalProfit,
        avgMargin
      },
      records: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/reports/demographics
router.get('/sales/reports/demographics', authenticateToken, (req, res) => {
  try {
    // 1. Salesman-wise
    const salesmanWise = db.prepare(`
      SELECT 
        COALESCE(u.name, 'Unassigned Floor Agent') as salesman,
        COUNT(s.id) as units_sold,
        SUM(s.total_amount) as total_sales_value,
        SUM((s.base_price - s.discount) - COALESCE(v.procurement_cost, ROUND(v.ex_showroom_price * 0.82))) as total_profit
      FROM sales s
      JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN users u ON s.sales_agent_id = u.id
      WHERE s.status != 'Cancelled'
      GROUP BY u.name
      ORDER BY total_sales_value DESC
    `).all();

    // 2. Village-wise
    const villageWise = db.prepare(`
      SELECT 
        COALESCE(c.village, 'General Urban') as village,
        COALESCE(c.tehsil, 'Haveli') as tehsil,
        COUNT(s.id) as units_sold,
        SUM(s.total_amount) as total_sales_value
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status != 'Cancelled'
      GROUP BY c.village
      ORDER BY units_sold DESC, total_sales_value DESC
    `).all();

    // 3. Tehsil-wise
    const tehsilWise = db.prepare(`
      SELECT 
        COALESCE(c.tehsil, 'Haveli') as tehsil,
        COALESCE(c.district, 'Pune') as district,
        COUNT(s.id) as units_sold,
        SUM(s.total_amount) as total_sales_value
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status != 'Cancelled'
      GROUP BY c.tehsil
      ORDER BY units_sold DESC
    `).all();

    // 4. Model-wise
    const modelWise = db.prepare(`
      SELECT 
        v.brand || ' ' || v.model as model_name,
        v.category,
        COUNT(s.id) as units_sold,
        SUM(s.total_amount) as total_sales_value,
        AVG(s.total_amount) as avg_unit_price
      FROM sales s
      JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.status != 'Cancelled'
      GROUP BY v.brand, v.model
      ORDER BY units_sold DESC
    `).all();

    // 5. HP-wise
    const hpWise = db.prepare(`
      SELECT 
        CASE 
          WHEN v.horsepower <= 45 THEN 'Under 45 HP'
          WHEN v.horsepower BETWEEN 46 AND 55 THEN '46 - 55 HP'
          WHEN v.horsepower BETWEEN 56 AND 75 THEN '56 - 75 HP'
          WHEN v.horsepower BETWEEN 76 AND 100 THEN '76 - 100 HP'
          ELSE 'Above 100 HP'
        END as hp_range,
        COUNT(s.id) as units_sold,
        SUM(s.total_amount) as total_sales_value
      FROM sales s
      JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.status != 'Cancelled'
      GROUP BY hp_range
      ORDER BY units_sold DESC
    `).all();

    res.json({
      salesmanWise,
      villageWise,
      tehsilWise,
      modelWise,
      hpWise
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// 2. SERVICE MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/services/job-estimates
router.get('/services/job-estimates', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM job_estimates ORDER BY estimate_date DESC, created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/job-estimates
router.post('/services/job-estimates', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM job_estimates').get().c + 1;
    const estNumber = b.estimate_number || `JEST-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `je_${Date.now()}`;
    const labor = Number(b.estimated_labor || 0);
    const parts = Number(b.estimated_parts || 0);
    const sub = labor + parts;
    const taxRate = Number(b.tax_rate || 18.0);
    const taxAmount = Math.round(sub * (taxRate / 100));
    const totalAmount = sub + taxAmount;

    db.prepare(`
      INSERT INTO job_estimates (
        id, estimate_number, customer_name, customer_phone, vehicle_model, vin,
        estimated_labor, estimated_parts, tax_rate, tax_amount, total_amount, complaints, status, estimate_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, estNumber, b.customer_name, b.customer_phone || '', b.vehicle_model || 'Vehicle',
      b.vin || 'VIN-' + Date.now().toString().slice(-8), labor, parts, taxRate, taxAmount, totalAmount,
      b.complaints || 'Routine health check & maintenance', b.status || 'Pending',
      b.estimate_date || new Date().toISOString().split('T')[0]
    );

    recordAudit(db, req.user, 'CREATE', 'SERVICE', `Created Job Estimate ${estNumber} for ${b.customer_name}`, id);
    const created = db.prepare('SELECT * FROM job_estimates WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/services/job-estimates/:id
router.put('/services/job-estimates/:id', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE job_estimates SET
        customer_name = COALESCE(?, customer_name),
        customer_phone = COALESCE(?, customer_phone),
        vehicle_model = COALESCE(?, vehicle_model),
        estimated_labor = COALESCE(?, estimated_labor),
        estimated_parts = COALESCE(?, estimated_parts),
        total_amount = COALESCE(?, total_amount),
        complaints = COALESCE(?, complaints),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      b.customer_name, b.customer_phone, b.vehicle_model,
      b.estimated_labor !== undefined ? Number(b.estimated_labor) : null,
      b.estimated_parts !== undefined ? Number(b.estimated_parts) : null,
      b.total_amount !== undefined ? Number(b.total_amount) : null,
      b.complaints, b.status, req.params.id
    );
    const updated = db.prepare('SELECT * FROM job_estimates WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/job-estimates/:id
router.delete('/services/job-estimates/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM job_estimates WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Job estimate deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/job-estimates/:id/convert-to-job-card
router.post('/services/job-estimates/:id/convert-to-job-card', authenticateToken, (req, res) => {
  try {
    const je = db.prepare('SELECT * FROM job_estimates WHERE id = ?').get(req.params.id);
    if (!je) return res.status(404).json({ error: 'Job estimate not found' });

    const totalCount = db.prepare('SELECT count(*) as c FROM service_tickets').get().c + 1;
    const stId = `st_${Date.now()}`;
    const ticketNo = `ST-2026-${String(totalCount).padStart(3, '0')}`;
    const jcId = `jc_${Date.now()}`;
    const jcNo = `JC-2026-${String(totalCount).padStart(3, '0')}`;
    const tech = req.body.technician_name || 'Suresh Patil (Master Tech)';

    const result = db.transaction(() => {
      db.prepare(`
        INSERT INTO service_tickets (
          id, ticket_number, customer_name, customer_phone, vehicle_model,
          vin, service_type, entry_date, status, customer_complaints
        ) VALUES (?, ?, ?, ?, ?, ?, 'Running Repair', ?, 'In Progress', ?)
      `).run(
        stId, ticketNo, je.customer_name, je.customer_phone, je.vehicle_model,
        je.vin || `VIN${Date.now().toString().slice(-8)}`,
        new Date().toISOString().split('T')[0],
        je.complaints || 'Approved repair estimate works'
      );

      db.prepare(`
        INSERT INTO job_cards (
          id, job_card_number, service_ticket_id, technician_name,
          labor_charges, parts_total_cost, total_service_cost, bay_number, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Bay-1', 'Work In Progress')
      `).run(
        jcId, jcNo, stId, tech,
        Number(je.estimated_labor || 3500), Number(je.estimated_parts || 0),
        Number(je.estimated_labor || 3500) + Number(je.estimated_parts || 0)
      );

      db.prepare("UPDATE job_estimates SET status = 'Converted' WHERE id = ?").run(je.id);

      recordAudit(db, req.user, 'CONVERT', 'SERVICE', `Converted Job Estimate ${je.estimate_number} to Job Card ${jcNo}`, jcId);

      return { ticketNo, jcNo, jcId, stId };
    })();

    res.status(201).json({ success: true, message: 'Job estimate successfully converted to Job Card', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/service-invoices
router.get('/services/service-invoices', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM service_invoices ORDER BY invoice_date DESC, created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/service-invoices
router.post('/services/service-invoices', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM service_invoices').get().c + 1;
    const invNumber = b.invoice_number || `SRV-INV-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `sinv_${Date.now()}`;
    const labor = Number(b.labor_charges || 0);
    const parts = Number(b.parts_charges || 0);
    const sub = labor + parts;
    const taxRate = Number(b.tax_rate || 18.0);
    const taxAmount = Math.round(sub * (taxRate / 100));
    const totalAmount = sub + taxAmount;

    db.prepare(`
      INSERT INTO service_invoices (
        id, invoice_number, job_card_id, service_ticket_id, customer_name, customer_phone,
        vehicle_model, vin, technician_name, labor_charges, parts_charges, subtotal,
        tax_rate, tax_amount, total_amount, payment_mode, invoice_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, invNumber, b.job_card_id || null, b.service_ticket_id || null,
      b.customer_name, b.customer_phone || '', b.vehicle_model || 'Vehicle',
      b.vin || '', b.technician_name || 'Suresh Patil',
      labor, parts, sub, taxRate, taxAmount, totalAmount,
      b.payment_mode || 'Cash', b.invoice_date || new Date().toISOString().split('T')[0],
      b.status || 'Paid'
    );

    recordAudit(db, req.user, 'CREATE', 'SERVICE', `Issued Service Invoice ${invNumber} for ${b.customer_name}`, id);
    const created = db.prepare('SELECT * FROM service_invoices WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/job-cards/:id/invoice (convert job card into service invoice)
router.post('/job-cards/:id/invoice', authenticateToken, (req, res) => {
  try {
    const jc = db.prepare(`
      SELECT jc.*, st.customer_name, st.customer_phone, st.vehicle_model, st.vin
      FROM job_cards jc
      JOIN service_tickets st ON jc.service_ticket_id = st.id
      WHERE jc.id = ?
    `).get(req.params.id);
    if (!jc) return res.status(404).json({ error: 'Job Card not found' });

    const count = db.prepare('SELECT count(*) as c FROM service_invoices').get().c + 1;
    const invNumber = `SRV-INV-2026-${String(count).padStart(3, '0')}`;
    const id = `sinv_${Date.now()}`;
    const labor = Number(jc.labor_charges || 0);
    const parts = Number(jc.parts_total_cost || 0);
    const sub = labor + parts;
    const taxRate = 18.0;
    const taxAmount = Math.round(sub * (taxRate / 100));
    const totalAmount = sub + taxAmount;

    const result = db.transaction(() => {
      db.prepare(`
        INSERT INTO service_invoices (
          id, invoice_number, job_card_id, service_ticket_id, customer_name, customer_phone,
          vehicle_model, vin, technician_name, labor_charges, parts_charges, subtotal,
          tax_rate, tax_amount, total_amount, payment_mode, invoice_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Cash', ?, 'Paid')
      `).run(
        id, invNumber, jc.id, jc.service_ticket_id, jc.customer_name, jc.customer_phone,
        jc.vehicle_model, jc.vin, jc.technician_name, labor, parts, sub, taxRate, taxAmount, totalAmount,
        new Date().toISOString().split('T')[0]
      );

      db.prepare("UPDATE job_cards SET status = 'Invoiced', updated_at = datetime('now') WHERE id = ?").run(jc.id);
      db.prepare("UPDATE service_tickets SET status = 'Work Completed', updated_at = datetime('now') WHERE id = ?").run(jc.service_ticket_id);

      recordAudit(db, req.user, 'INVOICE', 'SERVICE', `Generated Service Bill ${invNumber} from Job Card ${jc.job_card_number}`, id);
      return { id, invoice_number: invNumber, totalAmount };
    })();

    res.status(201).json({ success: true, message: 'Service Invoice generated successfully', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/job-cards/:id/allocate-parts
router.post('/job-cards/:id/allocate-parts', authenticateToken, (req, res) => {
  try {
    const { part_id, quantity = 1 } = req.body;
    if (!part_id) return res.status(400).json({ error: 'Part ID is required' });

    const jc = db.prepare(`
      SELECT jc.*, st.customer_name, st.ticket_number
      FROM job_cards jc
      JOIN service_tickets st ON jc.service_ticket_id = st.id
      WHERE jc.id = ?
    `).get(req.params.id);
    if (!jc) return res.status(404).json({ error: 'Job Card not found' });

    const part = db.prepare('SELECT * FROM spare_parts WHERE id = ? OR part_number = ?').get(part_id, part_id);
    if (!part) return res.status(404).json({ error: 'Part not found in inventory' });

    const qty = Number(quantity);
    if (part.stock_quantity < qty) {
      return res.status(400).json({ error: `Insufficient inventory stock. Only ${part.stock_quantity} available.` });
    }

    const partCost = Math.round(qty * Number(part.selling_price || part.unit_cost));

    const result = db.transaction(() => {
      // 1. Deduct part inventory stock
      db.prepare('UPDATE spare_parts SET stock_quantity = stock_quantity - ? WHERE id = ?').run(qty, part.id);

      // 2. Add entry to parts ledger
      db.prepare(`
        INSERT INTO parts_ledger (
          id, part_id, part_number, part_name, transaction_type, reference_no, quantity, unit_price, balance_stock, transaction_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        part.id, part.part_number, part.name, 'OUTWARD_JOB_CARD', jc.job_card_number,
        -qty, Number(part.selling_price), part.stock_quantity - qty,
        new Date().toISOString().split('T')[0], `Allocated to Job Card ${jc.job_card_number} (${jc.customer_name})`
      );

      // 3. Update Job Card parts cost
      const newPartsCost = Number(jc.parts_total_cost || 0) + partCost;
      const newTotal = Number(jc.labor_charges || 0) + newPartsCost;
      db.prepare(`
        UPDATE job_cards 
        SET parts_total_cost = ?, total_service_cost = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newPartsCost, newTotal, jc.id);

      recordAudit(db, req.user, 'ALLOCATE', 'SERVICE', `Allocated ${qty}x ${part.name} to Job Card ${jc.job_card_number}`, jc.id);

      return {
        job_card_id: jc.id,
        part_name: part.name,
        quantity: qty,
        partCost,
        newPartsCost,
        newTotal
      };
    })();

    res.status(200).json({ success: true, message: 'Parts allocated successfully to Job Card', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/spare-sales (sales analytics for spare parts)
router.get('/services/spare-sales', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.id,
        p.part_number,
        p.name,
        p.category,
        p.unit_cost,
        p.selling_price,
        p.stock_quantity,
        COALESCE(SUM(ABS(pl.quantity)), 0) as units_sold,
        COALESCE(SUM(ABS(pl.quantity) * pl.unit_price), 0) as total_revenue,
        COALESCE(SUM(ABS(pl.quantity) * (pl.unit_price - p.unit_cost)), 0) as gross_profit
      FROM spare_parts p
      LEFT JOIN parts_ledger pl ON pl.part_id = p.id AND pl.transaction_type IN ('OUTWARD_COUNTER_SALE', 'OUTWARD_JOB_CARD')
      GROUP BY p.id
      ORDER BY units_sold DESC, total_revenue DESC
    `).all();

    const totalRevenue = rows.reduce((acc, r) => acc + Number(r.total_revenue || 0), 0);
    const totalProfit = rows.reduce((acc, r) => acc + Number(r.gross_profit || 0), 0);
    const totalUnits = rows.reduce((acc, r) => acc + Number(r.units_sold || 0), 0);

    res.json({
      summary: { totalRevenue, totalProfit, totalUnits },
      records: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/spare-invoices
router.get('/services/spare-invoices', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM spare_invoices ORDER BY invoice_date DESC, created_at DESC').all();
    res.json(rows.map(r => ({
      ...r,
      items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : (r.items_json || [])
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/spare-invoices
router.post('/services/spare-invoices', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM spare_invoices').get().c + 1;
    const invNumber = b.invoice_number || `${b.invoice_type === 'Accessories' ? 'ACC' : 'SPI'}-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `spinv_${Date.now()}`;
    const subtotal = Number(b.subtotal || 0);
    const taxRate = Number(b.tax_rate || 18.0);
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const totalAmount = subtotal + taxAmount;
    const items = Array.isArray(b.items) ? b.items : [];

    db.transaction(() => {
      db.prepare(`
        INSERT INTO spare_invoices (
          id, invoice_number, customer_name, customer_phone, vehicle_number,
          items_json, subtotal, tax_rate, tax_amount, total_amount, payment_mode, invoice_type, invoice_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, invNumber, b.customer_name, b.customer_phone || '', b.vehicle_number || '',
        JSON.stringify(items), subtotal, taxRate, taxAmount, totalAmount,
        b.payment_mode || 'Cash', b.invoice_type || 'Spare',
        b.invoice_date || new Date().toISOString().split('T')[0], b.status || 'Paid'
      );

      // Decrement stock & record in parts ledger for each line item
      items.forEach(it => {
        if (it.part_id || it.code) {
          const part = it.part_id 
            ? db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(it.part_id)
            : db.prepare('SELECT * FROM spare_parts WHERE part_number = ?').get(it.code);
          
          if (part) {
            const qty = Number(it.qty || 1);
            db.prepare('UPDATE spare_parts SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?').run(qty, part.id);
            db.prepare(`
              INSERT INTO parts_ledger (
                id, part_id, part_number, part_name, transaction_type, reference_no, quantity, unit_price, balance_stock, transaction_date, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              part.id, part.part_number, part.name, 'OUTWARD_COUNTER_SALE', invNumber,
              -qty, Number(it.price || part.selling_price), Math.max(0, part.stock_quantity - qty),
              b.invoice_date || new Date().toISOString().split('T')[0], `Counter sale invoice: ${invNumber}`
            );
          }
        }
      });
    })();

    recordAudit(db, req.user, 'CREATE', 'SERVICE', `Issued spare/accessories invoice: ${invNumber}`, id);
    res.status(201).json({ success: true, message: 'Spare invoice generated successfully', id, invoice_number: invNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/spare-invoices/:id
router.delete('/services/spare-invoices/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM spare_invoices WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Invoice not found' });

    db.transaction(() => {
      const items = typeof current.items_json === 'string' ? JSON.parse(current.items_json) : (current.items_json || []);
      items.forEach(it => {
        const part = it.part_id 
          ? db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(it.part_id)
          : db.prepare('SELECT * FROM spare_parts WHERE part_number = ?').get(it.code);
        if (part) {
          const qty = Number(it.qty || 1);
          db.prepare('UPDATE spare_parts SET stock_quantity = stock_quantity + ? WHERE id = ?').run(qty, part.id);
          db.prepare(`
            INSERT INTO parts_ledger (
              id, part_id, part_number, part_name, transaction_type, reference_no, quantity, unit_price, balance_stock, transaction_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            part.id, part.part_number, part.name, 'ADJUSTMENT', current.invoice_number,
            qty, Number(it.price || part.selling_price), part.stock_quantity + qty,
            new Date().toISOString().split('T')[0], `Voided counter sale invoice: ${current.invoice_number}`
          );
        }
      });
      db.prepare('DELETE FROM spare_invoices WHERE id = ?').run(req.params.id);
    })();

    recordAudit(db, req.user, 'DELETE', 'SERVICE', `Voided spare invoice ${current.invoice_number} and reversed inventory stock`, req.params.id);
    res.json({ success: true, message: `Invoice ${current.invoice_number} voided and parts stock reversed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/service-invoices/:id
router.delete('/services/service-invoices/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM service_invoices WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Service invoice not found' });

    db.prepare('DELETE FROM service_invoices WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'SERVICE', `Deleted service bill ${current.invoice_number}`, req.params.id);
    res.json({ success: true, message: `Service bill ${current.invoice_number} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/parts/ledger
router.get('/parts/ledger', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM parts_ledger ORDER BY transaction_date DESC, created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/reports/summary
router.get('/services/reports/summary', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let stDateFilter = '';
    const stParams = [];
    if (startDate && endDate) {
      stDateFilter = 'WHERE st.entry_date BETWEEN ? AND ?';
      stParams.push(startDate, endDate);
    } else if (startDate) {
      stDateFilter = 'WHERE st.entry_date >= ?';
      stParams.push(startDate);
    } else if (endDate) {
      stDateFilter = 'WHERE st.entry_date <= ?';
      stParams.push(endDate);
    }

    // 1. Mechanic-wise
    const mwQuery = `
      SELECT 
        jc.technician_name as mechanic,
        COUNT(jc.id) as job_cards_handled,
        SUM(jc.labor_charges) as total_labor_billed,
        SUM(jc.parts_total_cost) as total_parts_fitted,
        SUM(jc.total_service_cost) as total_revenue_generated
      FROM job_cards jc
      LEFT JOIN service_tickets st ON jc.service_ticket_id = st.id
      ${stDateFilter}
      GROUP BY jc.technician_name
      ORDER BY total_revenue_generated DESC
    `;
    const mechanicWise = db.prepare(mwQuery).all(...stParams);

    // 2. Daily Service Center
    const dsQuery = `
      SELECT 
        st.entry_date as service_date,
        COUNT(st.id) as vehicles_received,
        SUM(CASE WHEN st.status = 'Work Completed' OR st.status = 'Delivered' THEN 1 ELSE 0 END) as vehicles_completed,
        SUM(COALESCE(jc.total_service_cost, 0)) as total_billed
      FROM service_tickets st
      LEFT JOIN job_cards jc ON jc.service_ticket_id = st.id
      ${stDateFilter}
      GROUP BY st.entry_date
      ORDER BY st.entry_date DESC
      LIMIT 30
    `;
    const dailyService = db.prepare(dsQuery).all(...stParams);

    res.json({
      mechanicWise,
      dailyService
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// 3. EXCHANGE MANAGEMENT ENDPOINTS
// ============================================================================

// POST /api/tradeins
router.post('/tradeins', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM trade_ins').get().c + 1;
    const exchNumber = b.exchange_number || `EXCH-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `ti_${Date.now()}`;
    const val = Number(b.estimated_valuation || 0);
    const refurb = Number(b.refurbishment_cost || 0);
    const expected = Number(b.expected_resale_price || (val + refurb + 25000));

    db.prepare(`
      INSERT INTO trade_ins (
        id, exchange_number, customer_name, customer_phone, customer_village, customer_tehsil, customer_district,
        salesman_name, old_brand, old_model, old_year, horsepower, registration_no, odometer_km, condition_rating,
        estimated_valuation, refurbishment_cost, expected_resale_price, approved_adjustment_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, exchNumber, b.customer_name, b.customer_phone || '',
      b.customer_village || 'Baramati', b.customer_tehsil || 'Baramati', b.customer_district || 'Pune',
      b.salesman_name || (req.user ? req.user.name : 'Alex Rivera'),
      b.old_brand || 'Mahindra', b.old_model || 'Tractor Model', Number(b.old_year || 2019),
      Number(b.horsepower || 45), b.registration_no || 'MH-12-EX-' + Date.now().toString().slice(-4),
      Number(b.odometer_km || 25000), b.condition_rating || 'Good',
      val, refurb, expected, Number(b.approved_adjustment_amount || val),
      b.status || 'In Stock', b.notes || 'Inward trade-in tractor purchase'
    );

    recordAudit(db, req.user, 'CREATE', 'EXCHANGE', `Registered exchange vehicle purchase ${exchNumber} from ${b.customer_name}`, id);
    const created = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tradeins/:id
router.put('/tradeins/:id', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const current = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Trade-in record not found' });

    db.prepare(`
      UPDATE trade_ins SET
        customer_name = COALESCE(?, customer_name),
        customer_phone = COALESCE(?, customer_phone),
        customer_village = COALESCE(?, customer_village),
        customer_tehsil = COALESCE(?, customer_tehsil),
        customer_district = COALESCE(?, customer_district),
        old_brand = COALESCE(?, old_brand),
        old_model = COALESCE(?, old_model),
        old_year = COALESCE(?, old_year),
        horsepower = COALESCE(?, horsepower),
        registration_no = COALESCE(?, registration_no),
        odometer_km = COALESCE(?, odometer_km),
        condition_rating = COALESCE(?, condition_rating),
        estimated_valuation = COALESCE(?, estimated_valuation),
        refurbishment_cost = COALESCE(?, refurbishment_cost),
        expected_resale_price = COALESCE(?, expected_resale_price),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      b.customer_name, b.customer_phone, b.customer_village, b.customer_tehsil, b.customer_district,
      b.old_brand, b.old_model, b.old_year !== undefined ? Number(b.old_year) : null,
      b.horsepower !== undefined ? Number(b.horsepower) : null,
      b.registration_no, b.odometer_km !== undefined ? Number(b.odometer_km) : null,
      b.condition_rating, b.estimated_valuation !== undefined ? Number(b.estimated_valuation) : null,
      b.refurbishment_cost !== undefined ? Number(b.refurbishment_cost) : null,
      b.expected_resale_price !== undefined ? Number(b.expected_resale_price) : null,
      b.status, b.notes, req.params.id
    );

    recordAudit(db, req.user, 'UPDATE', 'EXCHANGE', `Updated exchange vehicle ${current.exchange_number}`, req.params.id);
    const updated = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tradeins/:id
router.delete('/tradeins/:id', authenticateToken, (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM trade_ins WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Trade-in record not found' });

    db.prepare('DELETE FROM trade_ins WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'EXCHANGE', `Deleted trade-in record ${current.exchange_number}`, req.params.id);
    res.json({ success: true, message: `Trade-in record ${current.exchange_number} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tradeins/stock
router.get('/tradeins/stock', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM trade_ins 
      WHERE status IN ('In Stock', 'Evaluated')
      ORDER BY created_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tradeins/resale
router.post('/tradeins/resale', authenticateToken, (req, res) => {
  try {
    const { id, actual_resale_price, resale_customer_name, resale_date, notes } = req.body;
    if (!id || !actual_resale_price) {
      return res.status(400).json({ error: 'Trade-in ID and actual resale price are required.' });
    }

    db.prepare(`
      UPDATE trade_ins 
      SET status = 'Sold',
          actual_resale_price = ?,
          resale_customer_name = ?,
          resale_date = ?,
          notes = COALESCE(notes || '', '') || ' ' || ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      Number(actual_resale_price),
      resale_customer_name || 'Buyer',
      resale_date || new Date().toISOString().split('T')[0],
      notes || 'Sold from pre-owned exchange lot',
      id
    );

    recordAudit(db, req.user, 'UPDATE', 'EXCHANGE', `Completed exchange vehicle resale for trade-in: ${id}`, id);
    res.json({ success: true, message: 'Exchange vehicle marked as Sold.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tradeins/profit
router.get('/tradeins/profit', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        id,
        exchange_number,
        old_brand,
        old_model,
        old_year,
        horsepower,
        registration_no,
        customer_name as seller_customer,
        customer_village,
        customer_tehsil,
        customer_district,
        salesman_name,
        estimated_valuation as purchase_price,
        refurbishment_cost,
        (estimated_valuation + refurbishment_cost) as total_cost,
        actual_resale_price,
        resale_customer_name,
        resale_date,
        (actual_resale_price - (estimated_valuation + refurbishment_cost)) as exchange_profit,
        status
      FROM trade_ins
      WHERE status = 'Sold' AND actual_resale_price > 0
      ORDER BY resale_date DESC
    `).all();

    const totalSoldValue = rows.reduce((acc, r) => acc + Number(r.actual_resale_price || 0), 0);
    const totalCost = rows.reduce((acc, r) => acc + Number(r.total_cost || 0), 0);
    const totalProfit = rows.reduce((acc, r) => acc + Number(r.exchange_profit || 0), 0);

    res.json({
      summary: {
        totalExchangeSold: rows.length,
        totalSoldValue,
        totalCost,
        totalProfit
      },
      records: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tradeins/reports
router.get('/tradeins/reports', authenticateToken, (req, res) => {
  try {
    // Model-wise Exchange
    const modelWise = db.prepare(`
      SELECT old_brand || ' ' || old_model as model_name, COUNT(*) as count, SUM(actual_resale_price) as total_val
      FROM trade_ins
      GROUP BY old_brand, old_model
    `).all();

    // HP-wise Exchange
    const hpWise = db.prepare(`
      SELECT 
        CASE 
          WHEN horsepower <= 45 THEN 'Under 45 HP'
          WHEN horsepower BETWEEN 46 AND 55 THEN '46 - 55 HP'
          ELSE 'Above 55 HP'
        END as hp_range,
        COUNT(*) as count,
        SUM(estimated_valuation) as valuation_sum
      FROM trade_ins
      GROUP BY hp_range
    `).all();

    // Salesman-wise Exchange
    const salesmanWise = db.prepare(`
      SELECT salesman_name, COUNT(*) as count, SUM(estimated_valuation) as total_procured
      FROM trade_ins
      GROUP BY salesman_name
    `).all();

    // Village-wise
    const villageWise = db.prepare(`
      SELECT customer_village, customer_tehsil, customer_district, COUNT(*) as count, SUM(actual_resale_price) as total_val
      FROM trade_ins
      GROUP BY customer_village
      ORDER BY count DESC
    `).all();

    // Tehsil-wise
    const tehsilWise = db.prepare(`
      SELECT COALESCE(customer_tehsil, 'Baramati') as tehsil, COUNT(*) as count, SUM(actual_resale_price) as total_val
      FROM trade_ins
      GROUP BY customer_tehsil
      ORDER BY count DESC
    `).all();

    // District-wise
    const districtWise = db.prepare(`
      SELECT COALESCE(customer_district, 'Pune') as district, COUNT(*) as count, SUM(actual_resale_price) as total_val
      FROM trade_ins
      GROUP BY customer_district
      ORDER BY count DESC
    `).all();

    res.json({
      modelWise,
      hpWise,
      salesmanWise,
      villageWise,
      tehsilWise,
      districtWise
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// 4. ACCOUNTS MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/accounts/vouchers
router.get('/accounts/vouchers', authenticateToken, (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM account_vouchers';
    const params = [];
    if (type) {
      sql += ' WHERE voucher_type = ?';
      params.push(type.toUpperCase());
    }
    sql += ' ORDER BY voucher_date DESC, created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/vouchers
router.post('/accounts/vouchers', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const vType = (b.voucher_type || 'PAYMENT').toUpperCase();
    const count = db.prepare('SELECT count(*) as c FROM account_vouchers WHERE voucher_type = ?').get(vType).c + 1;
    const prefix = vType === 'PAYMENT' ? 'PV' : 'RV';
    const voucherNumber = b.voucher_number || `${prefix}-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `vch_${Date.now()}`;

    db.prepare(`
      INSERT INTO account_vouchers (
        id, voucher_number, voucher_type, category, party_type, party_name, party_id,
        amount, payment_mode, bank_name, cheque_or_ref_no, voucher_date, narration, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, voucherNumber, vType, b.category || 'General',
      b.party_type || 'customer', b.party_name, b.party_id || null,
      Number(b.amount || 0), b.payment_mode || 'Cash', b.bank_name || '',
      b.cheque_or_ref_no || '', b.voucher_date || new Date().toISOString().split('T')[0],
      b.narration || '', req.user ? req.user.username : 'admin'
    );

    recordAudit(db, req.user, 'CREATE', 'ACCOUNTS', `Recorded ${vType} voucher: ${voucherNumber} for ₹${b.amount}`, id);
    res.status(201).json({ success: true, message: `${vType} Voucher created successfully`, id, voucher_number: voucherNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/vouchers/:id
router.put('/accounts/vouchers/:id', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const current = db.prepare('SELECT * FROM account_vouchers WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Voucher not found' });

    db.prepare(`
      UPDATE account_vouchers SET
        category = COALESCE(?, category),
        party_name = COALESCE(?, party_name),
        party_type = COALESCE(?, party_type),
        amount = COALESCE(?, amount),
        payment_mode = COALESCE(?, payment_mode),
        bank_name = COALESCE(?, bank_name),
        cheque_or_ref_no = COALESCE(?, cheque_or_ref_no),
        voucher_date = COALESCE(?, voucher_date),
        narration = COALESCE(?, narration)
      WHERE id = ?
    `).run(
      b.category, b.party_name, b.party_type,
      b.amount !== undefined ? Number(b.amount) : null,
      b.payment_mode, b.bank_name, b.cheque_or_ref_no,
      b.voucher_date, b.narration, req.params.id
    );

    recordAudit(db, req.user, 'UPDATE', 'ACCOUNTS', `Updated voucher ${current.voucher_number}`, req.params.id);
    const updated = db.prepare('SELECT * FROM account_vouchers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/vouchers/:id
router.delete('/accounts/vouchers/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM account_vouchers WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Voucher not found' });

    db.prepare('DELETE FROM account_vouchers WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'ACCOUNTS', `Voided voucher ${current.voucher_number}`, req.params.id);
    res.json({ success: true, message: `Voucher ${current.voucher_number} voided.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/cash-book
router.get('/accounts/cash-book', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let vWhere = "voucher_type = 'RECEIPT' AND payment_mode = 'Cash'";
    let rWhere = "payment_mode = 'Cash'";
    let pWhere = "voucher_type = 'PAYMENT' AND payment_mode = 'Cash'";
    let eWhere = "payment_mode = 'Cash'";
    const vParams = [];
    const rParams = [];
    const pParams = [];
    const eParams = [];

    if (startDate && endDate) {
      vWhere += ' AND voucher_date BETWEEN ? AND ?';
      vParams.push(startDate, endDate);
      rWhere += ' AND receipt_date BETWEEN ? AND ?';
      rParams.push(startDate, endDate);
      pWhere += ' AND voucher_date BETWEEN ? AND ?';
      pParams.push(startDate, endDate);
      eWhere += ' AND expense_date BETWEEN ? AND ?';
      eParams.push(startDate, endDate);
    } else if (startDate) {
      vWhere += ' AND voucher_date >= ?';
      vParams.push(startDate);
      rWhere += ' AND receipt_date >= ?';
      rParams.push(startDate);
      pWhere += ' AND voucher_date >= ?';
      pParams.push(startDate);
      eWhere += ' AND expense_date >= ?';
      eParams.push(startDate);
    } else if (endDate) {
      vWhere += ' AND voucher_date <= ?';
      vParams.push(endDate);
      rWhere += ' AND receipt_date <= ?';
      rParams.push(endDate);
      pWhere += ' AND voucher_date <= ?';
      pParams.push(endDate);
      eWhere += ' AND expense_date <= ?';
      eParams.push(endDate);
    }

    // 1. Cash Receipts
    const vReceipts = db.prepare(`
      SELECT 
        id, voucher_number as ref_no, voucher_date as date, party_name as particulars,
        category, amount, 'RECEIPT' as type
      FROM account_vouchers
      WHERE ${vWhere}
    `).all(...vParams);

    const rReceipts = db.prepare(`
      SELECT 
        id, receipt_number as ref_no, receipt_date as date, customer_name as particulars,
        'Car Advance / Payment' as category, amount, 'RECEIPT' as type
      FROM receipts
      WHERE ${rWhere}
    `).all(...rParams);

    const cashReceipts = [...vReceipts, ...rReceipts].sort((a, b) => new Date(b.date) - new Date(a.date));

    // 2. Cash Payments
    const vPayments = db.prepare(`
      SELECT 
        id, voucher_number as ref_no, voucher_date as date, party_name as particulars,
        category, amount, 'PAYMENT' as type
      FROM account_vouchers
      WHERE ${pWhere}
    `).all(...pParams);

    const ePayments = db.prepare(`
      SELECT 
        id, expense_code as ref_no, expense_date as date, vendor_or_payee as particulars,
        category, amount, 'PAYMENT' as type
      FROM expenses
      WHERE ${eWhere}
    `).all(...eParams);

    const cashPayments = [...vPayments, ...ePayments].sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalCashIn = cashReceipts.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const totalCashOut = cashPayments.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const closingBalance = totalCashIn - totalCashOut;

    res.json({
      summary: {
        totalCashIn,
        totalCashOut,
        closingBalance
      },
      cashReceipts,
      cashPayments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/bank-book
router.get('/accounts/bank-book', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let vWhere = "payment_mode IN ('Bank Transfer', 'RTGS / NEFT', 'Cheque', 'UPI')";
    let pWhere = "payment_mode != 'Cash' AND status = 'Cleared'";
    const vParams = [];
    const pParams = [];

    if (startDate && endDate) {
      vWhere += ' AND voucher_date BETWEEN ? AND ?';
      vParams.push(startDate, endDate);
      pWhere += ' AND payment_date BETWEEN ? AND ?';
      pParams.push(startDate, endDate);
    } else if (startDate) {
      vWhere += ' AND voucher_date >= ?';
      vParams.push(startDate);
      pWhere += ' AND payment_date >= ?';
      pParams.push(startDate);
    } else if (endDate) {
      vWhere += ' AND voucher_date <= ?';
      vParams.push(endDate);
      pWhere += ' AND payment_date <= ?';
      pParams.push(endDate);
    }

    const bankEntries = [
      ...db.prepare(`
        SELECT 
          id, voucher_number as ref_no, voucher_date as date, party_name as particulars,
          bank_name, cheque_or_ref_no as utr_no, payment_mode, category,
          CASE WHEN voucher_type = 'RECEIPT' THEN amount ELSE 0 END as debit_inflow,
          CASE WHEN voucher_type = 'PAYMENT' THEN amount ELSE 0 END as credit_outflow
        FROM account_vouchers
        WHERE ${vWhere}
      `).all(...vParams),
      ...db.prepare(`
        SELECT 
          id, payment_reference as ref_no, payment_date as date, customer_id as particulars,
          'HDFC Main Operating' as bank_name, transaction_id as utr_no, payment_mode, payment_type as category,
          amount as debit_inflow,
          0 as credit_outflow
        FROM payments
        WHERE ${pWhere}
      `).all(...pParams)
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalDebit = bankEntries.reduce((acc, r) => acc + Number(r.debit_inflow || 0), 0);
    const totalCredit = bankEntries.reduce((acc, r) => acc + Number(r.credit_outflow || 0), 0);
    const bankBalance = totalDebit - totalCredit;

    res.json({
      summary: {
        totalDebit,
        totalCredit,
        bankBalance
      },
      records: bankEntries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/employee-ledger
router.get('/accounts/employee-ledger', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        s.id as staff_id,
        s.employee_code,
        s.name,
        s.role_title,
        s.department,
        s.base_salary,
        p.payroll_period,
        p.sales_incentive,
        p.allowances,
        p.deductions,
        p.net_salary,
        p.status as payment_status,
        p.payment_date,
        p.payment_mode
      FROM staff s
      LEFT JOIN payroll p ON p.staff_id = s.id
      ORDER BY s.name ASC, p.payroll_period DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/finance-summary
router.get('/accounts/finance-summary', authenticateToken, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT f.*, c.name as customer_name, c.phone as customer_phone, v.brand || ' ' || v.model as vehicle_name
      FROM finance_records f
      JOIN customers c ON f.customer_id = c.id
      JOIN vehicles v ON f.vehicle_id = v.id
      ORDER BY f.created_at DESC
    `).all();

    const bankWise = db.prepare(`
      SELECT bank_name, COUNT(*) as files_count, SUM(loan_amount) as total_loan_val, SUM(CASE WHEN status = 'Disbursed' THEN loan_amount ELSE 0 END) as disbursed_val
      FROM finance_records
      GROUP BY bank_name
    `).all();

    res.json({
      records,
      bankWise
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/rto-summary
router.get('/accounts/rto-summary', authenticateToken, (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM rto_records ORDER BY application_date DESC').all();
    const totalCollected = records.reduce((acc, r) => acc + Number(r.tax_collected || 0), 0);
    const totalPaid = records.reduce((acc, r) => acc + Number(r.govt_tax_paid || 0), 0);
    const balanceWithDealer = totalCollected - totalPaid;

    res.json({
      summary: {
        totalCases: records.length,
        totalCollected,
        totalPaid,
        balanceWithDealer
      },
      records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/insurance-summary
router.get('/accounts/insurance-summary', authenticateToken, (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM insurance_policies ORDER BY expiry_date ASC').all();
    const providerWise = db.prepare(`
      SELECT provider, COUNT(*) as policies_count, SUM(premium_amount) as total_premium, SUM(idv_amount) as total_idv
      FROM insurance_policies
      GROUP BY provider
    `).all();

    res.json({
      records,
      providerWise
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/customer-due
router.get('/accounts/customer-due', authenticateToken, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT 
        i.id as invoice_id,
        i.invoice_number,
        i.invoice_date,
        i.due_date,
        i.customer_name,
        c.phone as customer_phone,
        c.village as customer_village,
        c.tehsil as customer_tehsil,
        v.brand || ' ' || v.model as vehicle_name,
        i.total_amount,
        i.paid_amount,
        i.balance_due,
        i.status
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.balance_due > 0 AND i.status != 'Cancelled'
      ORDER BY i.balance_due DESC
    `).all();

    const totalDue = records.reduce((acc, r) => acc + Number(r.balance_due || 0), 0);

    res.json({
      summary: {
        totalOverdueAccounts: records.length,
        totalOutstandingReceivable: totalDue
      },
      records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/margin-money-receipts
router.get('/accounts/margin-money-receipts', authenticateToken, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT * FROM account_vouchers
      WHERE voucher_type = 'RECEIPT' AND category = 'Margin Money'
      ORDER BY voucher_date DESC
    `).all();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET & POST /api/accounts/finance-payouts
router.get('/accounts/finance-payouts', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM finance_payouts ORDER BY payout_date DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/accounts/finance-payouts', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM finance_payouts').get().c + 1;
    const ref = b.payout_ref || `FP-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `fp_${Date.now()}`;

    db.prepare(`
      INSERT INTO finance_payouts (
        id, payout_ref, bank_name, customer_name, loan_amount, commission_rate_pct, payout_amount, payout_date, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, ref, b.bank_name, b.customer_name,
      Number(b.loan_amount || 0), Number(b.commission_rate_pct || 1.8),
      Number(b.payout_amount || 0), b.payout_date || new Date().toISOString().split('T')[0],
      b.status || 'Received', b.notes || ''
    );

    recordAudit(db, req.user, 'CREATE', 'ACCOUNTS', `Logged finance payout: ${ref} for ₹${b.payout_amount}`, id);
    res.status(201).json({ success: true, id, payout_ref: ref });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET & POST /api/accounts/insurance-payouts
router.get('/accounts/insurance-payouts', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM insurance_payouts ORDER BY payout_date DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/accounts/insurance-payouts', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const count = db.prepare('SELECT count(*) as c FROM insurance_payouts').get().c + 1;
    const ref = b.payout_ref || `IP-2026-${String(count).padStart(3, '0')}`;
    const id = b.id || `ip_${Date.now()}`;

    db.prepare(`
      INSERT INTO insurance_payouts (
        id, payout_ref, insurer_name, policy_number, customer_name, premium_amount, commission_rate_pct, payout_amount, payout_date, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, ref, b.insurer_name, b.policy_number || '', b.customer_name,
      Number(b.premium_amount || 0), Number(b.commission_rate_pct || 15.0),
      Number(b.payout_amount || 0), b.payout_date || new Date().toISOString().split('T')[0],
      b.status || 'Received', b.notes || ''
    );

    recordAudit(db, req.user, 'CREATE', 'ACCOUNTS', `Logged insurance payout: ${ref} for ₹${b.payout_amount}`, id);
    res.status(201).json({ success: true, id, payout_ref: ref });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/finance-payouts/:id
router.delete('/accounts/finance-payouts/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM finance_payouts WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Finance payout not found' });
    db.prepare('DELETE FROM finance_payouts WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'ACCOUNTS', `Deleted finance payout ${current.payout_ref}`, req.params.id);
    res.json({ success: true, message: `Finance payout ${current.payout_ref} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/insurance-payouts/:id
router.delete('/accounts/insurance-payouts/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM insurance_payouts WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Insurance payout not found' });
    db.prepare('DELETE FROM insurance_payouts WHERE id = ?').run(req.params.id);
    recordAudit(db, req.user, 'DELETE', 'ACCOUNTS', `Deleted insurance payout ${current.payout_ref}`, req.params.id);
    res.json({ success: true, message: `Insurance payout ${current.payout_ref} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. MASTER REPORTS MANAGEMENT ENDPOINT (ALL 32 SPECIALIZED DEALERSHIP REPORTS)
// ============================================================================
router.get('/reports/dealership-master', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Vehicle Stock
    const vehicleStock = db.prepare(`
      SELECT id, brand, model, variant, horsepower, vin, color, fuel_type, ex_showroom_price,
             COALESCE(procurement_cost, ROUND(ex_showroom_price * 0.82)) as procurement_cost,
             stock_quantity, status
      FROM vehicles
      ORDER BY brand ASC, model ASC
    `).all();

    // 2. Implement Stock
    const implementStock = db.prepare('SELECT * FROM implements ORDER BY category ASC, name ASC').all();

    // 3. Spare Parts Stock
    const spareStock = db.prepare("SELECT * FROM spare_parts WHERE category != 'Accessories' ORDER BY category ASC, name ASC").all();

    // 4. Accessories Stock
    const accessoriesStock = db.prepare("SELECT * FROM spare_parts WHERE category = 'Accessories' OR name LIKE '%Mat%' OR name LIKE '%Cover%' OR name LIKE '%Film%'").all();

    // 5. Vehicle Purchases
    const vehiclePurchases = db.prepare(`
      SELECT po.id, po.po_number, po.supplier_name, po.order_date, po.total_cost, po.status, pi.item_name, pi.quantity, pi.unit_cost
      FROM procurement_orders po
      JOIN procurement_items pi ON pi.procurement_order_id = po.id
      WHERE pi.item_type = 'Vehicle'
      ORDER BY po.order_date DESC
    `).all();

    // 6. Spare Parts Purchases
    const sparePurchases = db.prepare(`
      SELECT po.po_number, po.supplier_name, po.order_date, pi.item_name, pi.quantity, pi.unit_cost, pi.total_cost
      FROM procurement_orders po
      JOIN procurement_items pi ON pi.procurement_order_id = po.id
      WHERE pi.item_type = 'Spare Part'
      ORDER BY po.order_date DESC
    `).all();

    // 7. Accessories Purchases
    const accessoriesPurchases = db.prepare(`
      SELECT po.po_number, po.supplier_name, po.order_date, pi.item_name, pi.quantity, pi.unit_cost, pi.total_cost
      FROM procurement_orders po
      JOIN procurement_items pi ON pi.procurement_order_id = po.id
      WHERE pi.item_type = 'Accessory' OR pi.item_name LIKE '%Mat%' OR pi.item_name LIKE '%Cover%'
      ORDER BY po.order_date DESC
    `).all();

    // 8. Accessories Sales
    const accessoriesSales = db.prepare("SELECT * FROM spare_invoices WHERE invoice_type = 'Accessories' ORDER BY invoice_date DESC").all();

    // 9. Spare Parts Sales
    const sparePartsSales = db.prepare("SELECT * FROM spare_invoices WHERE invoice_type = 'Spare' ORDER BY invoice_date DESC").all();

    // 10. Vehicle Sales
    const vehicleSales = db.prepare(`
      SELECT s.id, s.sale_order_number, s.booking_date, s.base_price, s.discount, s.total_amount, s.status,
             c.name as customer_name, c.village, c.tehsil,
             v.brand || ' ' || v.model as vehicle_name, v.vin, v.horsepower,
             u.name as salesman
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN users u ON s.sales_agent_id = u.id
      WHERE s.status != 'Cancelled'
      ORDER BY s.booking_date DESC
    `).all();

    // 11. Vehicle Profit
    const vehicleProfit = db.prepare(`
      SELECT 
        s.sale_order_number,
        c.name as customer_name,
        v.brand || ' ' || v.model as vehicle_model,
        v.vin,
        s.base_price,
        s.discount,
        (s.base_price - s.discount) as net_selling_price,
        COALESCE(v.procurement_cost, ROUND(v.ex_showroom_price * 0.82)) as cost_price,
        ((s.base_price - s.discount) - COALESCE(v.procurement_cost, ROUND(v.ex_showroom_price * 0.82))) as gross_profit,
        ROUND((((s.base_price - s.discount) - COALESCE(v.procurement_cost, ROUND(v.ex_showroom_price * 0.82))) * 100.0) / (s.base_price - s.discount), 1) as margin_pct
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.status != 'Cancelled'
      ORDER BY s.booking_date DESC
    `).all();

    // 12. Salesman-wise Sales
    const salesmanSales = db.prepare(`
      SELECT COALESCE(u.name, 'Sales Representative') as salesman, COUNT(s.id) as units_sold, SUM(s.total_amount) as total_sales_value
      FROM sales s
      LEFT JOIN users u ON s.sales_agent_id = u.id
      WHERE s.status != 'Cancelled'
      GROUP BY u.name
      ORDER BY total_sales_value DESC
    `).all();

    // 13. Village-wise Sales
    const villageSales = db.prepare(`
      SELECT COALESCE(c.village, 'General Urban') as village, COALESCE(c.tehsil, 'Haveli') as tehsil, COUNT(s.id) as units_sold, SUM(s.total_amount) as total_sales_value
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status != 'Cancelled'
      GROUP BY c.village
      ORDER BY units_sold DESC
    `).all();

    // 14. Tehsil-wise Sales
    const tehsilSales = db.prepare(`
      SELECT COALESCE(c.tehsil, 'Haveli') as tehsil, COALESCE(c.district, 'Pune') as district, COUNT(s.id) as units_sold, SUM(s.total_amount) as total_sales_value
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status != 'Cancelled'
      GROUP BY c.tehsil
      ORDER BY units_sold DESC
    `).all();

    // 15. Mechanic Reports
    const mechanicReports = db.prepare(`
      SELECT jc.technician_name as mechanic, COUNT(jc.id) as job_cards_handled, SUM(jc.labor_charges) as total_labor_billed, SUM(jc.parts_total_cost) as total_parts_fitted, SUM(jc.total_service_cost) as total_revenue_generated
      FROM job_cards jc
      GROUP BY jc.technician_name
      ORDER BY total_revenue_generated DESC
    `).all();

    // 16. Daily Service
    const dailyService = db.prepare(`
      SELECT st.entry_date as service_date, COUNT(st.id) as vehicles_received, SUM(CASE WHEN st.status = 'Work Completed' OR st.status = 'Delivered' THEN 1 ELSE 0 END) as vehicles_completed, SUM(COALESCE(jc.total_service_cost, 0)) as total_billed
      FROM service_tickets st
      LEFT JOIN job_cards jc ON jc.service_ticket_id = st.id
      GROUP BY st.entry_date
      ORDER BY st.entry_date DESC
      LIMIT 30
    `).all();

    // 17. Next Servicing Alerts
    const nextServicing = db.prepare(`
      SELECT st.ticket_number, st.customer_name, st.customer_phone, st.vehicle_model, st.vin, st.entry_date as last_service_date,
             date(st.entry_date, '+90 day') as next_due_date, 'Periodic Maintenance 10,000 KM' as service_recommendation
      FROM service_tickets st
      ORDER BY st.entry_date DESC
      LIMIT 25
    `).all();

    // 18. Service History
    const serviceHistory = db.prepare(`
      SELECT st.ticket_number, st.customer_name, st.vehicle_model, st.vin, st.service_type, st.entry_date, st.status,
             jc.technician_name, jc.total_service_cost
      FROM service_tickets st
      LEFT JOIN job_cards jc ON jc.service_ticket_id = st.id
      ORDER BY st.entry_date DESC
    `).all();

    // 19. Parts Ledger
    const partsLedger = db.prepare('SELECT * FROM parts_ledger ORDER BY transaction_date DESC LIMIT 50').all();

    // 20. RTO Reports
    const rtoReports = db.prepare('SELECT * FROM rto_records ORDER BY application_date DESC').all();

    // 21. Finance Reports
    const financeReports = db.prepare(`
      SELECT f.*, c.name as customer_name, c.phone as customer_phone, v.brand || ' ' || v.model as vehicle_name
      FROM finance_records f
      JOIN customers c ON f.customer_id = c.id
      JOIN vehicles v ON f.vehicle_id = v.id
      ORDER BY f.created_at DESC
    `).all();

    // 22. Insurance Reports
    const insuranceReports = db.prepare('SELECT * FROM insurance_policies ORDER BY expiry_date ASC').all();

    // 23. Customer Due
    const customerDue = db.prepare(`
      SELECT i.invoice_number, i.invoice_date, i.due_date, i.customer_name, c.phone as customer_phone, c.village,
             v.brand || ' ' || v.model as vehicle_name, i.total_amount, i.paid_amount, i.balance_due
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.balance_due > 0 AND i.status != 'Cancelled'
      ORDER BY i.balance_due DESC
    `).all();

    // 24. GST Reports (Accurate Outward vs Inward GST)
    const vehOutGst = db.prepare("SELECT COALESCE(SUM(ROUND(base_price * 0.18)), 0) as gst FROM sales WHERE status != 'Cancelled'").get().gst;
    const spareOutGst = db.prepare("SELECT COALESCE(SUM(tax_amount), 0) as gst FROM spare_invoices WHERE status != 'Cancelled'").get().gst;
    const srvOutGst = db.prepare("SELECT COALESCE(SUM(tax_amount), 0) as gst FROM service_invoices WHERE status != 'Cancelled'").get().gst;
    const totalOutwardGst = vehOutGst + spareOutGst + srvOutGst;

    const procInGst = db.prepare("SELECT COALESCE(SUM(ROUND(total_cost * 0.18)), 0) as gst FROM procurement_orders WHERE status != 'Cancelled'").get().gst;
    const impInGst = db.prepare("SELECT COALESCE(SUM(ROUND(total_cost * 0.12)), 0) as gst FROM implement_purchases").get().gst;
    const totalInwardGst = procInGst + impInGst;
    const netGstPayable = Math.max(0, totalOutwardGst - totalInwardGst);

    const gstReports = {
      totalOutwardGst,
      totalInwardGst,
      netGstPayable,
      breakdown: [
        { type: 'Outward (Vehicles Sale 18%)', taxable: vehOutGst * 5.55, gst: vehOutGst },
        { type: 'Outward (Counter Spare & Accessories 18%)', taxable: spareOutGst * 5.55, gst: spareOutGst },
        { type: 'Outward (Workshop Service Labor & Parts 18%)', taxable: srvOutGst * 5.55, gst: srvOutGst },
        { type: 'Inward (Vehicle OEM Purchases 18%)', taxable: procInGst * 5.55, gst: procInGst },
        { type: 'Inward (Implement Procurement 12%)', taxable: impInGst * 8.33, gst: impInGst }
      ]
    };

    // 25. Day Book
    const dayBook = db.prepare(`
      SELECT voucher_date as tx_date, voucher_number as ref_no, party_name as entity, category, voucher_type as mode, amount, payment_mode
      FROM account_vouchers
      ORDER BY voucher_date DESC
      LIMIT 60
    `).all();

    // 26. Expenses Reports
    const expensesReports = db.prepare(`
      SELECT category, COUNT(*) as vouchers_count, SUM(amount) as total_spent
      FROM expenses
      GROUP BY category
      ORDER BY total_spent DESC
    `).all();

    // 27. Outstanding Reports
    const totalCustomerDue = customerDue.reduce((acc, r) => acc + Number(r.balance_due || 0), 0);
    const totalVendorPayables = db.prepare("SELECT COALESCE(SUM(total_cost), 0) as total FROM procurement_orders WHERE status = 'Pending'").get().total;
    const outstandingReports = {
      totalCustomerDue,
      totalVendorPayables,
      netReceivable: totalCustomerDue - totalVendorPayables,
      customerCount: customerDue.length
    };

    // 28. Company Ledger / Financial Health
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE status != 'Cancelled'").get().total;
    const totalExpenses = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses').get().total;
    const totalProcurement = db.prepare("SELECT COALESCE(SUM(total_cost), 0) as total FROM procurement_orders WHERE status != 'Cancelled'").get().total;
    const companyLedger = {
      grossTurnover: totalRevenue,
      procurementExpenditure: totalProcurement,
      operationalExpenses: totalExpenses,
      operatingSurplus: totalRevenue - (totalProcurement + totalExpenses)
    };

    res.json({
      vehicleStock,
      implementStock,
      spareStock,
      accessoriesStock,
      vehiclePurchases,
      sparePurchases,
      accessoriesPurchases,
      accessoriesSales,
      sparePartsSales,
      vehicleSales,
      vehicleProfit,
      salesmanSales,
      villageSales,
      tehsilSales,
      mechanicReports,
      dailyService,
      nextServicing,
      serviceHistory,
      partsLedger,
      rtoReports,
      financeReports,
      insuranceReports,
      customerDue,
      gstReports,
      dayBook,
      expensesReports,
      outstandingReports,
      companyLedger
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// PARTY LEDGER (CUSTOMER & SUPPLIER)
// ============================================================================
const handlePartyLedger = (partyTypeParam) => (req, res) => {
  try {
    const partyType = (partyTypeParam || req.query.partyType || 'customer').toLowerCase();
    let transactions = [];
    let partyList = [];

    if (partyType === 'customer') {
      partyList = db.prepare('SELECT id, name, phone, city FROM customers ORDER BY name ASC').all();
      const invs = db.prepare(`
        SELECT invoice_date as date, invoice_number as reference, 'Vehicle Tax Invoice' as description,
               total_amount as debit, 0 as credit
        FROM invoices WHERE status != 'Cancelled'
      `).all();

      const rcpts = db.prepare(`
        SELECT receipt_date as date, receipt_number as reference, 'Customer Payment Receipt' as description,
               0 as debit, amount as credit
        FROM receipts
      `).all();

      const vchs = db.prepare(`
        SELECT voucher_date as date, voucher_number as reference, narration as description,
               0 as debit, amount as credit
        FROM account_vouchers WHERE voucher_type = 'RECEIPT' AND party_type = 'customer'
      `).all();

      transactions = [...invs, ...rcpts, ...vchs].sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      partyList = db.prepare("SELECT DISTINCT supplier_name as id, supplier_name as name, 'OEM Factory Supplier' as category FROM procurement_orders WHERE supplier_name IS NOT NULL").all();
      const pos = db.prepare(`
        SELECT order_date as date, po_number as reference, 'Procurement Consignment Order' as description,
               0 as debit, total_cost as credit
        FROM procurement_orders WHERE status != 'Cancelled'
      `).all();

      const vchs = db.prepare(`
        SELECT voucher_date as date, voucher_number as reference, narration as description,
               amount as debit, 0 as credit
        FROM account_vouchers WHERE voucher_type = 'PAYMENT' AND party_type = 'vendor'
      `).all();

      transactions = [...pos, ...vchs].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    let running = 0;
    const computedTx = transactions.map(t => {
      running += (Number(t.debit || 0) - Number(t.credit || 0));
      return {
        ...t,
        balance: running
      };
    });

    res.json({
      party: partyList[0] || null,
      partyList,
      transactions: computedTx,
      summary: {
        totalDebit: computedTx.reduce((acc, t) => acc + Number(t.debit || 0), 0),
        totalCredit: computedTx.reduce((acc, t) => acc + Number(t.credit || 0), 0),
        closingBalance: running
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/accounts/party-ledger', authenticateToken, handlePartyLedger());
router.get('/accounts/customer-ledger', authenticateToken, handlePartyLedger('customer'));
router.get('/accounts/supplier-ledger', authenticateToken, handlePartyLedger('vendor'));

// Section URL Aliases & Specialized Sub-endpoints
router.get('/sales/delivery-challans', authenticateToken, (req, res, next) => { req.url = '/delivery-challans'; router.handle(req, res, next); });
router.get('/sales/agreements', authenticateToken, (req, res, next) => { req.url = '/agreements'; router.handle(req, res, next); });
router.get('/sales/implements', authenticateToken, (req, res, next) => { req.url = '/implements'; router.handle(req, res, next); });
router.get('/sales/implement-purchases', authenticateToken, (req, res, next) => { req.url = '/implements/purchases'; router.handle(req, res, next); });
router.get('/sales/implement-sales', authenticateToken, (req, res, next) => { req.url = '/implements/sales'; router.handle(req, res, next); });
router.get('/sales/demographics', authenticateToken, (req, res, next) => { req.url = '/sales/reports/demographics'; router.handle(req, res, next); });

router.get('/services/reports/mechanic-wise', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT jc.technician_name as mechanic, COUNT(jc.id) as job_cards_handled, SUM(jc.labor_charges) as total_labor_billed, SUM(jc.parts_total_cost) as total_parts_fitted, SUM(jc.total_service_cost) as total_revenue_generated
      FROM job_cards jc GROUP BY jc.technician_name ORDER BY total_revenue_generated DESC
    `).all();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/services/reports/daily', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT st.entry_date as service_date, COUNT(st.id) as vehicles_received, SUM(CASE WHEN st.status = 'Work Completed' OR st.status = 'Delivered' THEN 1 ELSE 0 END) as vehicles_completed, SUM(COALESCE(jc.total_service_cost, 0)) as total_billed
      FROM service_tickets st LEFT JOIN job_cards jc ON jc.service_ticket_id = st.id GROUP BY st.entry_date ORDER BY st.entry_date DESC LIMIT 15
    `).all();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/exchange/stock', authenticateToken, (req, res, next) => { req.url = '/tradeins/stock'; router.handle(req, res, next); });
router.get('/exchange/profit', authenticateToken, (req, res, next) => { req.url = '/tradeins/profit'; router.handle(req, res, next); });
router.get('/exchange/reports', authenticateToken, (req, res, next) => { req.url = '/tradeins/reports'; router.handle(req, res, next); });

router.get('/dealership-reports/master', authenticateToken, (req, res, next) => { req.url = '/reports/dealership-master'; router.handle(req, res, next); });
router.get('/dealership-reports/day-book', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT voucher_date as tx_date, voucher_number as ref_no, party_name as entity, category, voucher_type as mode, amount
      FROM account_vouchers ORDER BY voucher_date DESC LIMIT 50
    `).all();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
