// server/services/settingsService.js
// Enhanced Showroom Settings service.
// Reads from and writes to the `showroom_settings` table with extended fields.
// Provides dynamic lookup for Invoice, Receipt, Estimate, Quotation, and Reports.

const db = require('../db/connection');

class SettingsService {
  /**
   * Apply schema extensions for enhanced settings fields.
   * Called once on server startup.
   */
  static applyExtensions() {
    const columns = db.prepare("PRAGMA table_info(showroom_settings)").all();
    const existingCols = columns.map(c => c.name);

    const newColumns = [
      { name: 'tagline', type: 'TEXT', default: "'Authorized Automobile Dealership & Showroom'" },
      { name: 'logo_url', type: 'TEXT', default: "NULL" },
      { name: 'authorized_signatory', type: 'TEXT', default: "'Managing Director'" },
      { name: 'signatory_name', type: 'TEXT', default: "NULL" },
      { name: 'invoice_prefix', type: 'TEXT', default: "'INV'" },
      { name: 'invoice_terms', type: 'TEXT', default: "'Payment due within 7 days of invoice date. All disputes subject to Mumbai jurisdiction.'" },
      { name: 'invoice_footer', type: 'TEXT', default: "'Thank you for your business!'" },
      { name: 'quotation_prefix', type: 'TEXT', default: "'QUOT'" },
      { name: 'quotation_validity_days', type: 'INTEGER', default: "30" },
      { name: 'quotation_terms', type: 'TEXT', default: "'This quotation is valid for 30 days from the date of issue. Prices are subject to change without notice.'" },
      { name: 'estimate_prefix', type: 'TEXT', default: "'EST'" },
      { name: 'receipt_prefix', type: 'TEXT', default: "'RCP'" },
      { name: 'cgst_rate', type: 'REAL', default: "9.0" },
      { name: 'sgst_rate', type: 'REAL', default: "9.0" },
      { name: 'cess_rate', type: 'REAL', default: "0" },
      { name: 'state_code', type: 'TEXT', default: "'27'" },
      { name: 'state_name', type: 'TEXT', default: "'Maharashtra'" },
      { name: 'pan_number', type: 'TEXT', default: "NULL" },
      { name: 'cin_number', type: 'TEXT', default: "NULL" },
      { name: 'bank_name', type: 'TEXT', default: "NULL" },
      { name: 'bank_account_no', type: 'TEXT', default: "NULL" },
      { name: 'bank_ifsc', type: 'TEXT', default: "NULL" },
      { name: 'bank_branch', type: 'TEXT', default: "NULL" },
      { name: 'website', type: 'TEXT', default: "NULL" },
    ];

    for (const col of newColumns) {
      if (!existingCols.includes(col.name)) {
        try {
          db.exec(`ALTER TABLE showroom_settings ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`);
        } catch (e) {
          // Column may already exist — ignore duplicate column errors
        }
      }
    }
  }

  /**
   * Get the full settings object.
   */
  static getSettings() {
    const row = db.prepare('SELECT * FROM showroom_settings LIMIT 1').get();
    if (!row) {
      return this.getDefaults();
    }
    return {
      ...row,
      // Computed convenience fields for frontend
      showroomName: row.showroom_name,
      dealerLicense: row.dealer_license,
      currencySymbol: row.currency_symbol || '₹',
      currencyCode: row.currency_code || 'INR',
      taxRate: row.tax_rate,
      businessHours: row.business_hours,
      authorizedSignatory: row.authorized_signatory,
      signatoryName: row.signatory_name,
      invoicePrefix: row.invoice_prefix,
      invoiceTerms: row.invoice_terms,
      invoiceFooter: row.invoice_footer,
      quotationPrefix: row.quotation_prefix,
      quotationValidityDays: row.quotation_validity_days,
      quotationTerms: row.quotation_terms,
      estimatePrefix: row.estimate_prefix,
      receiptPrefix: row.receipt_prefix,
      cgstRate: row.cgst_rate,
      sgstRate: row.sgst_rate,
      cessRate: row.cess_rate,
      stateCode: row.state_code,
      stateName: row.state_name,
      panNumber: row.pan_number,
      cinNumber: row.cin_number,
      bankName: row.bank_name,
      bankAccountNo: row.bank_account_no,
      bankIfsc: row.bank_ifsc,
      bankBranch: row.bank_branch,
      logoUrl: row.logo_url,
    };
  }

  /**
   * Update settings — merges with existing values.
   */
  static updateSettings(data) {
    const current = db.prepare('SELECT * FROM showroom_settings LIMIT 1').get();
    if (!current) {
      throw new Error('Settings row not found. Database may need re-seeding.');
    }

    const updates = {
      showroom_name: data.showroom_name || data.showroomName || current.showroom_name,
      address: data.address || current.address,
      phone: data.phone || current.phone,
      email: data.email || current.email,
      currency_symbol: data.currency_symbol || data.currency || data.currencySymbol || current.currency_symbol,
      currency_code: data.currency_code || data.currencyCode || current.currency_code,
      dealer_license: data.dealer_license || data.dealerLicense || current.dealer_license,
      gstin: data.gstin || current.gstin,
      tax_rate: data.tax_rate !== undefined ? Number(data.tax_rate) : (data.taxRate !== undefined ? Number(data.taxRate) : (data.defaultTaxRate !== undefined ? Number(data.defaultTaxRate) : current.tax_rate)),
      business_hours: data.business_hours || data.businessHours || data.operatingHours || current.business_hours,
      tagline: data.tagline || current.tagline,
      logo_url: data.logo_url || data.logoUrl || current.logo_url,
      authorized_signatory: data.authorized_signatory || data.authorizedSignatory || current.authorized_signatory,
      signatory_name: data.signatory_name || data.signatoryName || current.signatory_name,
      invoice_prefix: data.invoice_prefix || data.invoicePrefix || current.invoice_prefix,
      invoice_terms: data.invoice_terms || data.invoiceTerms || current.invoice_terms,
      invoice_footer: data.invoice_footer || data.invoiceFooter || current.invoice_footer,
      quotation_prefix: data.quotation_prefix || data.quotationPrefix || current.quotation_prefix,
      quotation_validity_days: data.quotation_validity_days !== undefined ? Number(data.quotation_validity_days) : (data.quotationValidityDays !== undefined ? Number(data.quotationValidityDays) : current.quotation_validity_days),
      quotation_terms: data.quotation_terms || data.quotationTerms || current.quotation_terms,
      estimate_prefix: data.estimate_prefix || data.estimatePrefix || current.estimate_prefix,
      receipt_prefix: data.receipt_prefix || data.receiptPrefix || current.receipt_prefix,
      cgst_rate: data.cgst_rate !== undefined ? Number(data.cgst_rate) : (data.cgstRate !== undefined ? Number(data.cgstRate) : current.cgst_rate),
      sgst_rate: data.sgst_rate !== undefined ? Number(data.sgst_rate) : (data.sgstRate !== undefined ? Number(data.sgstRate) : current.sgst_rate),
      cess_rate: data.cess_rate !== undefined ? Number(data.cess_rate) : (data.cessRate !== undefined ? Number(data.cessRate) : current.cess_rate),
      state_code: data.state_code || data.stateCode || current.state_code,
      state_name: data.state_name || data.stateName || current.state_name,
      pan_number: data.pan_number || data.panNumber || current.pan_number,
      cin_number: data.cin_number || data.cinNumber || current.cin_number,
      bank_name: data.bank_name || data.bankName || current.bank_name,
      bank_account_no: data.bank_account_no || data.bankAccountNo || current.bank_account_no,
      bank_ifsc: data.bank_ifsc || data.bankIfsc || current.bank_ifsc,
      bank_branch: data.bank_branch || data.bankBranch || current.bank_branch,
      website: data.website || current.website,
    };

    db.prepare(`
      UPDATE showroom_settings SET
        showroom_name = ?, address = ?, phone = ?, email = ?,
        currency_symbol = ?, currency_code = ?, dealer_license = ?,
        gstin = ?, tax_rate = ?, business_hours = ?,
        tagline = ?, logo_url = ?,
        authorized_signatory = ?, signatory_name = ?,
        invoice_prefix = ?, invoice_terms = ?, invoice_footer = ?,
        quotation_prefix = ?, quotation_validity_days = ?, quotation_terms = ?,
        estimate_prefix = ?, receipt_prefix = ?,
        cgst_rate = ?, sgst_rate = ?, cess_rate = ?,
        state_code = ?, state_name = ?,
        pan_number = ?, cin_number = ?,
        bank_name = ?, bank_account_no = ?, bank_ifsc = ?, bank_branch = ?,
        website = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      updates.showroom_name, updates.address, updates.phone, updates.email,
      updates.currency_symbol, updates.currency_code, updates.dealer_license,
      updates.gstin, updates.tax_rate, updates.business_hours,
      updates.tagline, updates.logo_url,
      updates.authorized_signatory, updates.signatory_name,
      updates.invoice_prefix, updates.invoice_terms, updates.invoice_footer,
      updates.quotation_prefix, updates.quotation_validity_days, updates.quotation_terms,
      updates.estimate_prefix, updates.receipt_prefix,
      updates.cgst_rate, updates.sgst_rate, updates.cess_rate,
      updates.state_code, updates.state_name,
      updates.pan_number, updates.cin_number,
      updates.bank_name, updates.bank_account_no, updates.bank_ifsc, updates.bank_branch,
      updates.website,
      current.id
    );

    return this.getSettings();
  }

  static getDefaults() {
    return {
      id: 'primary_setting',
      showroom_name: 'Apex Horizon Motors',
      showroomName: 'Apex Horizon Motors',
      address: 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051',
      phone: '+91 98200 12345',
      email: 'info@apexhorizonmotors.in',
      gstin: '27AAACA9928P1Z8',
      currency_symbol: '₹',
      currencySymbol: '₹',
      currency_code: 'INR',
      dealer_license: 'DL-MH-02-SHOWROOM-2026',
      tax_rate: 18.0,
      taxRate: 18.0,
      business_hours: 'Mon - Sat: 9:30 AM - 7:30 PM',
    };
  }
}

module.exports = SettingsService;
