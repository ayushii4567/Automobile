import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Building2, 
  Percent, 
  MapPin, 
  CheckCircle2,
  FileText,
  Landmark,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../api';

export default function Settings({ settings = {}, onSaveSettings }) {
  const [formData, setFormData] = useState({
    showroomName: '',
    tagline: '',
    dealerLicense: '',
    gstin: '',
    currency: '₹',
    defaultTaxRate: 18.0,
    email: '',
    phone: '',
    address: '',
    operatingHours: '',
    invoicePrefix: 'INV',
    invoiceTerms: '',
    invoiceFooter: '',
    quotationPrefix: 'QUOT',
    quotationValidityDays: 30,
    quotationTerms: '',
    estimatePrefix: 'EST',
    receiptPrefix: 'RCP',
    cgstRate: 9.0,
    sgstRate: 9.0,
    cessRate: 0,
    stateCode: '27',
    stateName: 'Maharashtra',
    panNumber: '',
    cinNumber: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankBranch: '',
    authorizedSignatory: '',
    signatoryName: ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState(settings?.logoUrl ? `/${settings.logoUrl}` : null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        showroomName: settings.showroomName || settings.showroom_name || 'Apex Horizon Motors',
        tagline: settings.tagline || 'Authorized Automobile Dealership & Showroom',
        dealerLicense: settings.dealerLicense || settings.dealer_license || 'DL-MH-02-SHOWROOM-2026',
        gstin: settings.gstin || settings.GSTIN || '27AAACA9928P1Z8',
        currency: settings.currency || settings.currency_symbol || '₹',
        defaultTaxRate: settings.defaultTaxRate || settings.tax_rate || 18.0,

        email: settings.email || 'info@autocore-motors.in',
        phone: settings.phone || '+91 98200 12345',
        address: settings.address || 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051',
        operatingHours: settings.operatingHours || settings.business_hours || 'Mon - Sat: 9:30 AM - 7:30 PM',
        invoicePrefix: settings.invoicePrefix || settings.invoice_prefix || 'INV',
        invoiceTerms: settings.invoiceTerms || settings.invoice_terms || '',
        invoiceFooter: settings.invoiceFooter || settings.invoice_footer || '',
        quotationPrefix: settings.quotationPrefix || settings.quotation_prefix || 'QUOT',
        quotationValidityDays: settings.quotationValidityDays || settings.quotation_validity_days || 30,
        quotationTerms: settings.quotationTerms || settings.quotation_terms || '',
        estimatePrefix: settings.estimatePrefix || settings.estimate_prefix || 'EST',
        receiptPrefix: settings.receiptPrefix || settings.receipt_prefix || 'RCP',
        cgstRate: settings.cgstRate || settings.cgst_rate || 9.0,
        sgstRate: settings.sgstRate || settings.sgst_rate || 9.0,
        cessRate: settings.cessRate || settings.cess_rate || 0,
        stateCode: settings.stateCode || settings.state_code || '27',
        stateName: settings.stateName || settings.state_name || 'Maharashtra',
        panNumber: settings.panNumber || settings.pan_number || '',
        cinNumber: settings.cinNumber || settings.cin_number || '',
        bankName: settings.bankName || settings.bank_name || '',
        bankAccountNo: settings.bankAccountNo || settings.bank_account_no || '',
        bankIfsc: settings.bankIfsc || settings.bank_ifsc || '',
        bankBranch: settings.bankBranch || settings.bank_branch || '',
        authorizedSignatory: settings.authorizedSignatory || settings.authorized_signatory || '',
        signatoryName: settings.signatoryName || settings.signatory_name || ''
      });
      if (settings.logo_url || settings.logoUrl) {
        setLogoPreview(`/${settings.logo_url || settings.logoUrl}`);
      }
    }
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.uploadLogo(file);
      setLogoPreview(`/${res.logoUrl}`);
      // Also save main settings so we have the updated URL
      onSaveSettings({ ...formData, logoUrl: res.logoUrl });
    } catch (err) {
      alert('Failed to upload logo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Dealership Info */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Building2 size={18} color="#2563eb" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Showroom Identity & Details
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '12px', border: '2px dashed #cbd5e1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', backgroundColor: '#f8fafc', position: 'relative'
              }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <ImageIcon size={32} color="#94a3b8" />
                )}
                {isUploading && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  </div>
                )}
              </div>
              <label className="btn btn-outline" style={{ textAlign: 'center', padding: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                Upload Logo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </label>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="responsive-grid-equal">
                <div className="form-group">
                  <label className="form-label">Showroom Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.showroomName}
                    onChange={(e) => setFormData({ ...formData, showroomName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dealer License / Registration</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.dealerLicense}
                    onChange={(e) => setFormData({ ...formData, dealerLicense: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tagline (Used in Invoices/Quotes)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="responsive-grid-equal">
            <div className="form-group">
              <label className="form-label">Operating Hours</label>
              <input
                type="text"
                className="form-input"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Authorized Signatory Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Managing Director"
                value={formData.authorizedSignatory}
                onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Signatory Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={formData.signatoryName}
                onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MapPin size={18} color="#16a34a" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Contact & Address
            </h3>
          </div>

          <div className="responsive-grid-equal">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">Physical Address</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Financial & Tax Details */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Percent size={18} color="#d97706" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Tax & Registration Information
            </h3>
          </div>

          <div className="responsive-grid-equal">
            <div className="form-group">
              <label className="form-label">GSTIN (Goods & Services Tax ID)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 27AAACA9928P1Z8"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input
                type="text"
                className="form-input"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">CIN Number (Corporate)</label>
              <input
                type="text"
                className="form-input"
                value={formData.cinNumber}
                onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="responsive-grid-equal" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label className="form-label">State Code</label>
              <input
                type="text"
                className="form-input"
                value={formData.stateCode}
                onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.stateName}
                onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="responsive-grid-equal" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label className="form-label">CGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.cgstRate}
                onChange={(e) => setFormData({ ...formData, cgstRate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.sgstRate}
                onChange={(e) => setFormData({ ...formData, sgstRate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">CESS Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.cessRate}
                onChange={(e) => setFormData({ ...formData, cessRate: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Landmark size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Bank Account Details (Printed on Invoices)
            </h3>
          </div>

          <div className="responsive-grid-equal">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.bankAccountNo}
                onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
              />
            </div>
          </div>
          <div className="responsive-grid-equal" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input
                type="text"
                className="form-input"
                value={formData.bankIfsc}
                onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <input
                type="text"
                className="form-input"
                value={formData.bankBranch}
                onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Invoice & Document Settings */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={18} color="#ec4899" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Document Prefixes & Terms
            </h3>
          </div>

          <div className="responsive-grid-equal">
            <div className="form-group">
              <label className="form-label">Invoice Prefix</label>
              <input
                type="text"
                className="form-input"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quotation Prefix</label>
              <input
                type="text"
                className="form-input"
                value={formData.quotationPrefix}
                onChange={(e) => setFormData({ ...formData, quotationPrefix: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estimate Prefix</label>
              <input
                type="text"
                className="form-input"
                value={formData.estimatePrefix}
                onChange={(e) => setFormData({ ...formData, estimatePrefix: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Receipt Prefix</label>
              <input
                type="text"
                className="form-input"
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">Invoice Terms & Conditions</label>
            <textarea
              className="form-input"
              rows="2"
              value={formData.invoiceTerms}
              onChange={(e) => setFormData({ ...formData, invoiceTerms: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">Quotation Terms & Conditions</label>
            <textarea
              className="form-input"
              rows="2"
              value={formData.quotationTerms}
              onChange={(e) => setFormData({ ...formData, quotationTerms: e.target.value })}
            ></textarea>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          {savedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontSize: '0.85rem', fontWeight: 500 }}>
              <CheckCircle2 size={16} />
              <span>Settings saved!</span>
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
