import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Bell,
  AlertTriangle,
  CalendarClock,
  Wrench,
  LogOut,
  Car,
  Users,
  FileText,
  Receipt,
  ArrowRight,
  X,
  Menu
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  onQuickAction, 
  searchQuery, 
  setSearchQuery, 
  settings = {},
  alerts = [],
  currentUser = { role: 'admin', name: 'Marcus Vance' },
  onLogout,
  onNavigate,
  vehicles = [],
  customers = [],
  quotations = [],
  sales = [],
  onToggleMobileMenu
}) {
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const bellRef = useRef(null);
  const searchRef = useRef(null);

  // Close popups on click outside
  useEffect(() => {
    const handler = (e) => { 
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); 
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tabTitles = {
    dashboard: { title: 'Dashboard', sub: 'Overview of sales, inventory, and showroom activity' },
    inventory: { title: 'Car Inventory', sub: 'Manage cars, prices, stock, and specifications' },
    customers: { title: 'Customer Management', sub: 'Client profiles, contact details, and vehicle inquiries' },
    sales: { title: 'Sales & Invoices', sub: 'Recorded deals, bills of sale, and payment tracking' },
    testdrives: { title: 'Test Drive Bookings', sub: 'Schedule and track customer test drives' },
    service: { title: 'Service Center', sub: 'Maintenance requests, repairs, and technician jobs' },
    staff: { title: 'Staff Management', sub: 'Showroom team members and sales performance' },
    reports: { title: 'Financial Reports', sub: 'Monthly sales numbers, brand revenue, and showroom summaries' },
    settings: { title: 'Settings', sub: 'Showroom details, tax rates, and contact information' },
    finance: { title: 'EMI Calculator', sub: 'Calculate monthly installments and loan amortization for any vehicle' },
    enquiries: { title: 'Enquiries & Leads', sub: 'Walk-in, phone, and online leads with follow-up management' },
    quotations: { title: 'Pro-Forma Quotations', sub: 'Generate on-road price estimates, tax breakdowns, and pro-forma documents' },
    parts: { title: 'Spare Parts & Accessories', sub: 'Manage genuine OEM components, tuning accessories, and stock levels' },
    procurement: { title: 'Vehicle Procurement', sub: 'Track manufacturer factory purchase orders, VINs, and transit status' },
  };

  const current = tabTitles[activeTab] || { title: 'AUTOCORE', sub: 'Showroom Management Platform' };

  // Live cross-module search calculation
  const searchResults = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q || q.length < 2) return null;

    const matchedVehicles = vehicles.filter(v => 
      (v.brand && v.brand.toLowerCase().includes(q)) || 
      (v.model && v.model.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedCustomers = customers.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) || 
      (c.phone && c.phone.includes(q)) || 
      (c.city && c.city.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedQuotations = quotations.filter(quot => 
      (quot.quotationNo && quot.quotationNo.toLowerCase().includes(q)) || 
      (quot.customerName && quot.customerName.toLowerCase().includes(q)) || 
      (quot.vehicleName && quot.vehicleName.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedSales = sales.filter(s => 
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) || 
      (s.customerName && s.customerName.toLowerCase().includes(q)) || 
      (s.vehicleName && s.vehicleName.toLowerCase().includes(q))
    ).slice(0, 3);

    const totalMatches = matchedVehicles.length + matchedCustomers.length + matchedQuotations.length + matchedSales.length;

    return {
      totalMatches,
      vehicles: matchedVehicles,
      customers: matchedCustomers,
      quotations: matchedQuotations,
      sales: matchedSales
    };
  }, [searchQuery, vehicles, customers, quotations, sales]);

  const handleSelectSearchResult = (targetTab) => {
    if (onNavigate) onNavigate(targetTab);
    setSearchOpen(false);
  };

  const handleAlertClick = (alertType) => {
    setBellOpen(false);
    if (!onNavigate) return;
    if (alertType === 'stock') onNavigate('inventory');
    else if (alertType === 'testdrive') onNavigate('testdrives');
    else if (alertType === 'service') onNavigate('service');
    else onNavigate('dashboard');
  };

  return (
    <header className="header-container" style={{
      height: '64px',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      borderBottom: '1px solid #e2e8f0',
      background: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Left: Hamburger Menu (Mobile) & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 0', overflow: 'hidden' }}>
        <button
          onClick={onToggleMobileMenu}
          className="show-on-mobile btn btn-secondary btn-icon"
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            borderRadius: '8px',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 className="header-title-text" style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {current.title}
          </h1>
          <p className="header-sub-text" style={{
            fontSize: '0.78rem',
            color: '#64748b',
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {current.sub}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        
        {/* Global Search Bar (Fluid & Responsive) */}
        <div ref={searchRef} style={{ position: 'relative', width: 'clamp(100px, 14vw, 230px)', flexShrink: 1 }}>
          <Search 
            size={15} 
            color="#94a3b8" 
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2
            }} 
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery || ''}
            onChange={(e) => {
              if (setSearchQuery) setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            className="form-input"
            style={{
              paddingLeft: '32px',
              paddingRight: searchQuery ? '26px' : '10px',
              height: '36px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              background: '#f8fafc',
              borderColor: '#e2e8f0'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                if (setSearchQuery) setSearchQuery('');
                setSearchOpen(false);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '4px'
              }}
            >
              <X size={14} />
            </button>
          )}

          {/* Global Search Dropdown Overlay */}
          {searchOpen && searchResults && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: 'min(380px, calc(100vw - 32px))',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
              zIndex: 150,
              overflow: 'hidden'
            }} className="animate-slide-up">
              <div style={{
                padding: '10px 14px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748b',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>CROSS-SHOWROOM SEARCH</span>
                <span>{searchResults.totalMatches} result(s)</span>
              </div>

              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {searchResults.totalMatches === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>
                    No matching records found for "{searchQuery}".
                  </div>
                ) : (
                  <>
                    {/* Vehicles Matches */}
                    {searchResults.vehicles.length > 0 && (
                      <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ padding: '6px 14px', fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
                          🚗 Vehicles
                        </div>
                        {searchResults.vehicles.map(v => (
                          <div
                            key={v.id}
                            onClick={() => handleSelectSearchResult('inventory')}
                            style={{
                              padding: '8px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f8fafc'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fff5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{v.brand} {v.model}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{v.year} • ₹{Number(v.price).toLocaleString('en-IN')}</div>
                            </div>
                            <span className="badge badge-available">In Fleet</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Customers Matches */}
                    {searchResults.customers.length > 0 && (
                      <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ padding: '6px 14px', fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                          👤 Customers / Leads
                        </div>
                        {searchResults.customers.map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectSearchResult('customers')}
                            style={{
                              padding: '8px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f8fafc'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#faf5ff'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.phone || c.email}</div>
                            </div>
                            <ArrowRight size={14} color="#94a3b8" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quotations Matches */}
                    {searchResults.quotations.length > 0 && (
                      <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ padding: '6px 14px', fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                          📑 Quotations
                        </div>
                        {searchResults.quotations.map(q => (
                          <div
                            key={q.id}
                            onClick={() => handleSelectSearchResult('quotations')}
                            style={{
                              padding: '8px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f8fafc'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{q.quotationNo} — {q.customerName}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{q.vehicleName} • ₹{Number(q.totalAmount).toLocaleString('en-IN')}</div>
                            </div>
                            <span className="badge badge-sent">{q.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sales Matches */}
                    {searchResults.sales.length > 0 && (
                      <div>
                        <div style={{ padding: '6px 14px', fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                          💰 Sales & Invoices
                        </div>
                        {searchResults.sales.map(s => (
                          <div
                            key={s.id}
                            onClick={() => handleSelectSearchResult('sales')}
                            style={{
                              padding: '8px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>#{s.invoiceNo} — {s.customerName}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>₹{Number(s.totalAmount).toLocaleString('en-IN')}</div>
                            </div>
                            <span className="badge badge-available">Settled</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setBellOpen(o => !o)}
            title="Notifications"
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
          >
            <Bell size={16} color="#475569" />
            {alerts.length > 0 && (
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#ef4444', color: '#fff',
                fontSize: '0.62rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)'
              }}>{alerts.length}</span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {bellOpen && (
            <div style={{
              position: 'absolute', top: '46px', right: 0,
              width: 'min(340px, calc(100vw - 32px))', background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.14)', zIndex: 100, overflow: 'hidden'
            }} className="animate-slide-up">
              <div style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
                fontWeight: 700,
                fontSize: '0.86rem',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>🔔 Live Showroom Alerts</span>
                <span className="badge badge-lowstock" style={{ fontSize: '0.7rem' }}>
                  {alerts.length} Active
                </span>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No pending alerts right now.
                  </div>
                ) : alerts.map((a, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleAlertClick(a.type)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      borderBottom: '1px solid #f8fafc',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>
                      {a.type === 'stock' && <AlertTriangle size={16} color="#d97706" />}
                      {a.type === 'testdrive' && <CalendarClock size={16} color="#0284c7" />}
                      {a.type === 'service' && <Wrench size={16} color="#ef4444" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{a.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '1px' }}>{a.body}</div>
                    </div>
                    <ArrowRight size={13} color="#94a3b8" style={{ marginTop: '4px' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subtle Divider */}
        <div style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 2px' }} />

        {/* User Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px 4px 6px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '20px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: currentUser?.role === 'admin' ? '#ef4444' : '#0284c7',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div className="hide-on-phone" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.1 }}>
              {currentUser?.name || 'User'}
            </span>
            <span style={{
              fontSize: '0.66rem',
              color: currentUser?.role === 'admin' ? '#ef4444' : '#0284c7',
              fontWeight: 600
            }}>
              {currentUser?.role === 'admin' ? 'Admin' : 'Sales'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                marginLeft: '4px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
