import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Receipt, 
  Banknote,
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
  ClipboardCheck,
  ArrowLeftRight,
  Building2,
  ShieldAlert,
  CalendarCheck,
  Building,
  CreditCard,
  MessageSquareHeart,
  Layers,
  X,
  Bell,
  Megaphone,
  FolderOpen,
  DatabaseBackup
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  counts = {}, 
  currentUser = { role: 'ADMIN', name: 'Admin' }, 
  onLogout,
  mobileOpen = false,
  onCloseMobile
}) {
  const role = (currentUser?.role || 'ADMIN').toUpperCase();
  const isAdmin = role === 'ADMIN';

  // Section 1: Sales & Showroom Floor
  const salesMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'reminders', label: 'Reminders & Alerts', icon: Bell, badge: counts.reminders, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'communications', label: 'Comms & Campaigns', icon: Megaphone, badge: counts.communications, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'documents', label: 'Document Center', icon: FolderOpen, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'inventory', label: 'Vehicle Inventory', icon: Car, badge: counts.vehicles, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'customers', label: 'Customers / CRM', icon: Users, badge: counts.customers, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'enquiries', label: 'Leads & Enquiries', icon: MessageSquare, badge: counts.enquiries, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'estimates', label: 'Vehicle Estimates', icon: Calculator, badge: counts.estimates, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'quotations', label: 'Quotations / Pro-Forma', icon: FileText, badge: counts.quotations, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'sales', label: 'Sales & Invoices', icon: Receipt, badge: counts.sales, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'testdrives', label: 'Test Drives', icon: CalendarClock, badge: counts.testdrives, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'pdi', label: 'PDI & Handover', icon: ClipboardCheck, badge: counts.pdi, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'tradeins', label: 'Used Car Exchange', icon: ArrowLeftRight, badge: counts.tradeins, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
  ];

  // Section 2: Finance & Protection
  const financeMenuItems = [
    { id: 'finance', label: 'EMI Calculator', icon: Calculator, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'finance-apps', label: 'Bank Loan Files', icon: Building2, badge: counts.financeApps, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'insurance', label: 'Insurance Policies', icon: ShieldAlert, badge: counts.insurance, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'warranties', label: 'Warranty & Shield', icon: Award, badge: counts.warranties, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'payments', label: 'Payment Receipts', icon: CreditCard, badge: counts.payments, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
  ];

  // Section 3: Workshop & Service
  const workshopMenuItems = [
    { id: 'service', label: 'Service & Job Cards', icon: Wrench, badge: counts.services, roles: ['ADMIN'] },
    { id: 'appointments', label: 'Bay Appointments', icon: CalendarCheck, badge: counts.appointments, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'parts', label: 'Spare Parts & Aero', icon: Package, badge: counts.parts, roles: ['ADMIN'] },
  ];

  // Section 4: Supply Chain, Intelligence & Admin
  const adminMenuItems = [
    { id: 'procurement', label: 'OEM Factory Orders', icon: Truck, badge: counts.procurement, roles: ['ADMIN'] },
    { id: 'vendors', label: 'Suppliers & Vendors', icon: Building, badge: counts.vendors, roles: ['ADMIN'] },
    { id: 'staff', label: 'Staff Management', icon: UserCheck, badge: counts.staff, roles: ['ADMIN'] },
    { id: 'payroll', label: 'Staff Payroll Ledger', icon: Banknote, roles: ['ADMIN'] },
    { id: 'expenses', label: 'Showroom Expenses', icon: Receipt, roles: ['ADMIN'] },
    { id: 'feedback', label: 'CSAT & Feedback', icon: MessageSquareHeart, badge: counts.feedback, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'reports', label: 'Financials & Accounts', icon: FileSpreadsheet, roles: ['ADMIN', 'SALES_EXECUTIVE'] },
    { id: 'auditlogs', label: 'Audit Trail Logs', icon: Layers, roles: ['ADMIN'] },
    { id: 'backup', label: 'Data Backup & Restore', icon: DatabaseBackup, roles: ['ADMIN'] },
    { id: 'settings', label: 'Showroom Settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const filterByRole = (items) => items.filter(item => {
    return item.roles.includes(role) || (role === 'SALES' && item.roles.includes('SALES_EXECUTIVE'));
  });

  const visibleSales = filterByRole(salesMenuItems);
  const visibleFinance = filterByRole(financeMenuItems);
  const visibleWorkshop = filterByRole(workshopMenuItems);
  const visibleAdmin = filterByRole(adminMenuItems);

  const renderNavGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '14px' }}>
        <div style={{
          fontSize: '0.66rem',
          fontWeight: 700,
          color: '#64748b',
          padding: '4px 10px 6px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{title}</span>
          <span style={{ fontSize: '0.62rem', background: '#1f2937', padding: '1px 5px', borderRadius: '4px', color: '#9ca3af' }}>
            {items.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {items.map(item => {
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
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#ef4444' : 'transparent',
                  color: isActive ? '#ffffff' : '#d1d5db',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.82rem',
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
                  <Icon size={15} color={isActive ? '#ffffff' : '#9ca3af'} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
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
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '16px 20px',
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
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              flexShrink: 0
            }}>
              <Car size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1.2
              }}>
                APEX <span style={{ color: '#ef4444' }}>HORIZON</span>
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
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>👑 Administrator</span>
                ) : (
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>🚗 Sales Floor Executive</span>
                )}
              </div>
            </div>
          </div>

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

        {/* Scrollable Navigation Groups */}
        <div style={{
          flex: 1,
          padding: '14px 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {renderNavGroup('Sales & Showroom Floor', visibleSales)}
          {renderNavGroup('Finance & Protection', visibleFinance)}
          {renderNavGroup('Workshop & Service', visibleWorkshop)}
          {renderNavGroup('Supply Chain & Admin', visibleAdmin)}
        </div>

        {/* User Card & Sign Out */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid #1f2937',
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <img 
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
              alt={currentUser?.name || 'User'} 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #374151',
                flexShrink: 0
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#f9fafb',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentUser?.name || 'User'}
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: '#9ca3af',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentUser?.title || (isAdmin ? 'Director' : 'Executive')}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Sign Out"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
