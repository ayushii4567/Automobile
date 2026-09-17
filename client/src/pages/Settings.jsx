import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Building2, 
  Percent, 
  MapPin, 
  CheckCircle2
} from 'lucide-react';

export default function Settings({ settings = {}, onSaveSettings }) {
  const [formData, setFormData] = useState({
    showroomName: '',
    tagline: '',
    dealerLicense: '',
    currency: '₹',
    defaultTaxRate: 18.0,
    email: '',
    phone: '',
    address: '',
    operatingHours: ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        showroomName: settings.showroomName || 'AutoCore MotorHub',
        tagline: settings.tagline || 'Authorized Automobile Dealership & Showroom',
        dealerLicense: settings.dealerLicense || 'DL-MH-02-SHOWROOM-2024',
        currency: settings.currency || '₹',
        defaultTaxRate: settings.defaultTaxRate || 18.0,
        email: settings.email || 'info@autocore-motors.in',
        phone: settings.phone || '+91 98200 12345',
        address: settings.address || 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051',
        operatingHours: settings.operatingHours || 'Mon - Sat: 9:30 AM - 7:30 PM'
      });
    }
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Dealership Info */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Building2 size={18} color="#2563eb" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Showroom Details
            </h3>
          </div>

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
              <label className="form-label">Tagline</label>
              <input
                type="text"
                className="form-input"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
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

            <div className="form-group">
              <label className="form-label">Operating Hours</label>
              <input
                type="text"
                className="form-input"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
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

        {/* Currency & Tax */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Percent size={18} color="#d97706" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Currency & Tax Settings
            </h3>
          </div>

          <div className="responsive-grid-equal">
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
              <label className="form-label">Default Sales Tax (%)</label>
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
