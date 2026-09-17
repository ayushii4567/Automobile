import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Receipt, 
  CalendarClock, 
  Wrench, 
  UserCheck, 
  FileSpreadsheet, 
  Settings,
  Calculator,
  MessageSquare,
  FileText,
  Package,
  Truck,
  LogOut,
  ShieldCheck,
  Award,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  counts = {}, 
  currentUser = { role: 'admin', name: 'Admin' }, 
  onLogout,
  mobileOpen = false,
  onCloseMobile
}) {
  const isAdmin = currentUser?.role === 'admin';

  // Master menu items logically grouped
  const coreMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sales'] },
    { id: 'inventory', label: 'Vehicle / Inventory', icon: Car, badge: counts.vehicles, roles: ['admin', 'sales'] },
    { id: 'customers', label: 'Customers / CRM', icon: Users, badge: counts.customers, roles: ['admin', 'sales'] },
    { id: 'enquiries', label: 'Enquiries & Leads', icon: MessageSquare, badge: counts.enquiries, roles: ['admin', 'sales'] },
    { id: 'quotations', label: 'Quotations / Pro-Forma', icon: FileText, badge: counts.quotations, roles: ['admin', 'sales'] },
    { id: 'sales', label: 'Sales & Invoices', icon: Receipt, badge: counts.sales, roles: ['admin', 'sales'] },
    { id: 'testdrives', label: 'Test Drives', icon: CalendarClock, badge: counts.testdrives, roles: ['admin', 'sales'] },
    { id: 'finance', label: 'EMI / Finance', icon: Calculator, roles: ['admin', 'sales'] },
  ];

  const adminMenuItems = [
    { id: 'parts', label: 'Spare Parts & Aero', icon: Package, badge: counts.parts, roles: ['admin'] },
    { id: 'procurement', label: 'Factory Orders', icon: Truck, badge: counts.procurement, roles: ['admin'] },
    { id: 'service', label: 'Service & Workshop', icon: Wrench, badge: counts.services, roles: ['admin'] },
    { id: 'staff', label: 'Staff Management', icon: UserCheck, roles: ['admin'] },
    { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet, roles: ['admin'] },
    { id: 'settings', label: 'Showroom Settings', icon: Settings, roles: ['admin'] },
  ];

  const visibleCore = coreMenuItems.filter(item => item.roles.includes(currentUser?.role || 'admin'));
  const visibleAdmin = isAdmin ? adminMenuItems : [];

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
            }}>
              <Car size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1.2
              }}>
                AUTO<span style={{ color: '#ef4444' }}>CORE</span>
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px'
              }}>
                {isAdmin ? (
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>👑 Admin Portal</span>
                ) : (
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>🚗 Sales Floor Portal</span>
                )}
              </div>
            </div>
          </div>

          {/* Close button visible only on mobile/tablet */}
          <button
            onClick={onCloseMobile}
            className="show-on-mobile"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              color: '#9ca3af',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            title="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

      {/* Navigation Links */}
      <div style={{
        flex: 1,
        padding: '14px 10px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px'
      }}>
        {/* Core Showroom Flow Group */}
        <div style={{
          fontSize: '0.67rem',
          fontWeight: 700,
          color: '#64748b',
          padding: '4px 10px 6px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Core Showroom Flow</span>
          <span style={{ fontSize: '0.62rem', background: '#1f2937', padding: '1px 5px', borderRadius: '4px', color: '#9ca3af' }}>
            {visibleCore.length}
          </span>
        </div>

        {visibleCore.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#ef4444' : 'transparent',
                color: isActive ? '#ffffff' : '#d1d5db',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#1f2937';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#d1d5db';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} color={isActive ? '#ffffff' : '#9ca3af'} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#374151',
                  color: isActive ? '#ffffff' : '#d1d5db'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Back-office / Admin Flow Group (Visible to Admin only) */}
        {visibleAdmin.length > 0 && (
          <>
            <div style={{
              fontSize: '0.67rem',
              fontWeight: 700,
              color: '#64748b',
              padding: '14px 10px 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #1f2937',
              marginTop: '8px'
            }}>
              <span>Back-Office / Admin</span>
              <span style={{ fontSize: '0.62rem', background: '#1f2937', padding: '1px 5px', borderRadius: '4px', color: '#9ca3af' }}>
                {visibleAdmin.length}
              </span>
            </div>

            {visibleAdmin.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#ef4444' : 'transparent',
                    color: isActive ? '#ffffff' : '#d1d5db',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#1f2937';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#d1d5db';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isActive ? '#ffffff' : '#9ca3af'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#374151',
                      color: isActive ? '#ffffff' : '#d1d5db'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* User Info & Logout Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #1f2937',
        background: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isAdmin ? '#ef4444' : '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentUser?.name || 'Authorized User'}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: isAdmin ? '#fca5a5' : '#7dd3fc',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {isAdmin ? 'Administrator' : 'Sales Executive'}
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                if (onLogout) onLogout();
                if (onCloseMobile) onCloseMobile();
              }}
              title="Sign Out"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>

        {/* Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-dot active"></span>
            <span style={{ color: '#94a3b8' }}>Live Session Active</span>
          </div>
          <span>v2.2</span>
        </div>
      </div>
    </aside>
    </>
  );
}
