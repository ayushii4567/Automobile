import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, 
  Wrench, 
  ArrowLeftRight, 
  Wallet, 
  FileSpreadsheet, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Settings, 
  X,
  ChevronDown,
  Search,
  UserPlus,
  Users,
  FileText,
  CheckSquare,
  Receipt,
  ShoppingBag,
  Tag,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calculator,
  Package,
  Clock,
  DollarSign,
  BarChart3,
  Building2,
  Landmark,
  AlertCircle,
  Percent,
  ShieldAlert,
  ShoppingCart,
  BarChart2,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  activeSubTab,
  onSelectSubTab,
  counts = {}, 
  currentUser = { role: 'ADMIN', name: 'Admin' }, 
  onLogout,
  onOpenSettings,
  mobileOpen = false,
  onCloseMobile
}) {
  const role = (currentUser?.role || 'ADMIN').toUpperCase();
  const isAdmin = role === 'ADMIN';

  // Search filter inside sidebar for quick submodule navigation
  const [filterSearch, setFilterSearch] = useState('');

  // Accordion state: Active section is expanded by default
  const [expandedSections, setExpandedSections] = useState({
    [activeTab || 'sales_management']: true
  });

  // Whenever activeTab changes, auto-expand that section
  useEffect(() => {
    if (activeTab) {
      setExpandedSections(prev => ({
        ...prev,
        [activeTab]: true
      }));
    }
  }, [activeTab]);

  const toggleSection = (sectionId, e) => {
    if (e) e.stopPropagation();
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const expandAll = () => {
    setExpandedSections({
      sales_management: true,
      service_management: true,
      exchange_management: true,
      accounts_management: true,
      reports_management: true
    });
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  // =========================================================================
  // 5 CORE BUSINESS SECTIONS REGISTRY
  // =========================================================================
  const businessSections = useMemo(() => [
    { 
      id: 'sales_management', 
      label: 'Sales Management', 
      icon: Car, 
      accentColor: '#ef4444',
      badge: '9',
      subItems: [
        { id: 'enquiry', label: 'Enquiry', icon: UserPlus },
        { id: 'quotation', label: 'Quotation', icon: FileText },
        { id: 'challan', label: 'Delivery Challan', icon: CheckSquare },
        { id: 'invoice', label: 'Tax Invoice', icon: Receipt },
        { id: 'agreement', label: 'Agreement', icon: FileCheck },
        { id: 'imp_purchase', label: 'Implement Purchase', icon: ShoppingBag },
        { id: 'imp_sales', label: 'Implement Sales', icon: Tag },
        { id: 'profit', label: 'Vehicle Profit', icon: TrendingUp },
        { id: 'reports', label: 'Sales Demographics', icon: PieChart }
      ]
    },
    { 
      id: 'service_management', 
      label: 'Service Management', 
      icon: Wrench, 
      accentColor: '#0ea5e9',
      badge: '10',
      subItems: [
        { id: 'spare_invoice', label: 'Spare Invoice', icon: Receipt },
        { id: 'job_card', label: 'Job Card', icon: Wrench },
        { id: 'job_estimate', label: 'Job Estimate', icon: Calculator },
        { id: 'service_invoice', label: 'Service Invoice', icon: FileText },
        { id: 'accessories_invoice', label: 'Accessories Invoice', icon: Sparkles },
        { id: 'spare_stock', label: 'Spare Stock', icon: Package },
        { id: 'service_history', label: 'Service History', icon: Clock },
        { id: 'parts_ledger', label: 'Parts Ledger', icon: Layers },
        { id: 'spare_sales', label: 'Spare Sales', icon: DollarSign },
        { id: 'reports', label: 'Daily Service & Mechanic Reports', icon: BarChart3 }
      ]
    },
    { 
      id: 'exchange_management', 
      label: 'Exchange Management', 
      icon: ArrowLeftRight, 
      accentColor: '#f59e0b',
      badge: '5',
      subItems: [
        { id: 'purchase', label: 'Exchange Purchase', icon: ShoppingBag },
        { id: 'sales', label: 'Exchange Sales', icon: Tag },
        { id: 'stock', label: 'Exchange Stock', icon: Package },
        { id: 'profit', label: 'Vehicle Profit', icon: TrendingUp },
        { id: 'reports', label: 'Exchange Sales Reports', icon: PieChart }
      ]
    },
    { 
      id: 'accounts_management', 
      label: 'Accounts Management', 
      icon: Wallet, 
      accentColor: '#10b981',
      badge: '15',
      subItems: [
        { id: 'payment_voucher', label: 'Payment Voucher', icon: Receipt },
        { id: 'receipt_voucher', label: 'Receipt Voucher', icon: Receipt },
        { id: 'expenses', label: 'Expenses', icon: TrendingDown },
        { id: 'customer_ledger', label: 'Customer Ledger', icon: Users },
        { id: 'supplier_ledger', label: 'Supplier Ledger', icon: Building2 },
        { id: 'employee_ledger', label: 'Employee Ledger', icon: UserCheck },
        { id: 'cash_book', label: 'Cash Book', icon: Landmark },
        { id: 'bank_book', label: 'Bank Book', icon: Landmark },
        { id: 'finance_summary', label: 'Finance Summary', icon: DollarSign },
        { id: 'rto_summary', label: 'RTO Summary', icon: FileText },
        { id: 'insurance_summary', label: 'Insurance Summary', icon: ShieldCheck },
        { id: 'customer_due', label: 'Customer Due', icon: AlertCircle },
        { id: 'margin_money', label: 'Margin Money Receipt', icon: Receipt },
        { id: 'finance_payout', label: 'Finance Payout', icon: Percent },
        { id: 'insurance_payout', label: 'Insurance Payout', icon: ShieldAlert }
      ]
    },
    { 
      id: 'reports_management', 
      label: 'Reports Management', 
      icon: FileSpreadsheet, 
      accentColor: '#8b5cf6',
      badge: '32',
      subItems: [
        { id: 'STOCK', label: 'Stock Reports (Vehicle & Spares)', icon: Package },
        { id: 'SALES', label: 'Sales Performance Reports', icon: TrendingUp },
        { id: 'PURCHASE', label: 'Procurement & Purchase Reports', icon: ShoppingCart },
        { id: 'ACCOUNTS', label: 'Financial Ledgers & Statements', icon: Landmark },
        { id: 'SERVICE', label: 'Workshop Service Reports', icon: Wrench },
        { id: 'ALL', label: 'Master Dealership Audit (32 Reports)', icon: BarChart2 }
      ]
    }
  ], []);

  // Filtered subitems when user searches inside the sidebar
  const searchResults = useMemo(() => {
    if (!filterSearch.trim()) return null;
    const q = filterSearch.toLowerCase().trim();
    const matches = [];

    businessSections.forEach(sec => {
      sec.subItems.forEach(sub => {
        if (sub.label.toLowerCase().includes(q) || sec.label.toLowerCase().includes(q)) {
          matches.push({
            sectionId: sec.id,
            sectionLabel: sec.label,
            accentColor: sec.accentColor,
            subId: sub.id,
            subLabel: sub.label,
            icon: sub.icon
          });
        }
      });
    });

    return matches;
  }, [filterSearch, businessSections]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 998,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      {/* Main Professional Sidebar Container */}
      <aside 
        className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`} 
        style={{
          width: '290px',
          minWidth: '290px',
          height: '100vh',
          background: '#0d131f',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          position: 'relative',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* ===================================================================
            1. BRANDING HEADER
            =================================================================== */}
        <div style={{
          padding: '18px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              flexShrink: 0
            }}>
              <Car size={22} />
            </div>

            <div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.03em',
                lineHeight: 1.15
              }}>
                APEX HORIZON
              </div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: '#ef4444',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop: '2px'
              }}>
                Dealership ERP
              </div>
            </div>
          </div>

          {/* Close button for mobile screens */}
          <button 
            onClick={onCloseMobile}
            className="mobile-close-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ===================================================================
            2. QUICK JUMP SEARCH & ACCORDION CONTROLS
            =================================================================== */}
        <div style={{
          padding: '10px 14px 6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Quick Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={13} 
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                pointerEvents: 'none'
              }} 
            />
            <input 
              type="text"
              placeholder="Search module..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 26px 6px 28px',
                fontSize: '0.78rem',
                color: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {filterSearch && (
              <button 
                onClick={() => setFilterSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Section label and expand/collapse */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2px'
          }}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b'
            }}>
              Business Modules
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={expandAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                Expand
              </button>
              <span style={{ color: '#334155', fontSize: '0.6rem' }}>•</span>
              <button
                type="button"
                onClick={collapseAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                Collapse
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================
            3. SECTION NAVIGATION TREE (CLEAN & NON-TRUNCATED)
            =================================================================== */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {searchResults ? (
            /* SEARCH RESULTS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '4px 6px', fontWeight: 600 }}>
                Matches ({searchResults.length}):
              </div>
              {searchResults.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                  No submodules found
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const ItemIcon = item.icon;
                  const isItemActive = activeTab === item.sectionId && activeSubTab === item.subId;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.sectionId);
                        if (onSelectSubTab) onSelectSubTab(item.sectionId, item.subId);
                        setFilterSearch('');
                        if (onCloseMobile) onCloseMobile();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: isItemActive ? `1px solid ${item.accentColor}` : '1px solid transparent',
                        background: isItemActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <ItemIcon size={14} style={{ color: item.accentColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>
                          {item.subLabel}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                          in {item.sectionLabel}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* 5 BUSINESS SECTIONS */
            businessSections.map((sec) => {
              const isSectionActive = activeTab === sec.id;
              // Expand active section by default or when toggled
              const isExpanded = expandedSections[sec.id] !== undefined ? expandedSections[sec.id] : isSectionActive;
              const SectionIcon = sec.icon;

              return (
                <div 
                  key={sec.id} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '8px',
                    border: isSectionActive ? `1px solid ${sec.accentColor}55` : '1px solid rgba(255, 255, 255, 0.04)',
                    background: isSectionActive ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    overflow: 'hidden'
                  }}
                >
                  {/* Section Title Header */}
                  <div
                    onClick={() => {
                      if (isSectionActive) {
                        toggleSection(sec.id);
                      } else {
                        setActiveTab(sec.id);
                        setExpandedSections(prev => ({ ...prev, [sec.id]: true }));
                      }
                      if (onCloseMobile) onCloseMobile();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: isSectionActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: isSectionActive ? `${sec.accentColor}25` : 'rgba(255, 255, 255, 0.05)',
                        color: isSectionActive ? '#ffffff' : sec.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <SectionIcon size={16} />
                      </div>

                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: isSectionActive ? 700 : 600,
                        color: isSectionActive ? '#ffffff' : '#e2e8f0',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap'
                      }}>
                        {sec.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isSectionActive ? `${sec.accentColor}33` : 'rgba(255, 255, 255, 0.06)',
                        color: isSectionActive ? '#ffffff' : '#94a3b8'
                      }}>
                        {sec.badge}
                      </span>
                      
                      <button
                        type="button"
                        onClick={(e) => toggleSection(sec.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isSectionActive ? sec.accentColor : '#64748b',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ChevronDown 
                          size={14} 
                          style={{
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s ease'
                          }} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Submodules List (Expanded) */}
                  {isExpanded && sec.subItems && sec.subItems.length > 0 && (
                    <div style={{
                      padding: '4px 6px 8px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)'
                    }}>
                      {sec.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = isSectionActive && (
                          activeSubTab === sub.id || 
                          (!activeSubTab && sub.id === sec.subItems[0].id)
                        );

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab(sec.id);
                              if (onSelectSubTab) onSelectSubTab(sec.id, sub.id);
                              if (onCloseMobile) onCloseMobile();
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: isSubActive ? `1px solid ${sec.accentColor}55` : '1px solid transparent',
                              background: isSubActive ? `${sec.accentColor}20` : 'transparent',
                              color: isSubActive ? '#ffffff' : '#94a3b8',
                              fontSize: '0.78rem',
                              fontWeight: isSubActive ? 600 : 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                e.currentTarget.style.color = '#f1f5f9';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                              }
                            }}
                          >
                            <SubIcon 
                              size={13} 
                              style={{ 
                                color: isSubActive ? '#ffffff' : sec.accentColor,
                                flexShrink: 0 
                              }} 
                            />
                            
                            <span style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1
                            }}>
                              {sub.label}
                            </span>

                            {isSubActive && (
                              <div style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: sec.accentColor,
                                boxShadow: `0 0 6px ${sec.accentColor}`,
                                flexShrink: 0
                              }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ===================================================================
            4. USER ACCOUNT CARD & LOGOUT
            =================================================================== */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 12, 20, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* User Account Info Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isAdmin ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #10b981, #047857)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.84rem',
                flexShrink: 0
              }}>
                {(currentUser?.name || 'A')[0]}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentUser?.name || 'Administrator'}
                </div>
                <div style={{
                  fontSize: '0.64rem',
                  fontWeight: 600,
                  color: isAdmin ? '#60a5fa' : '#34d399',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '1px'
                }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />
                  <span>{isAdmin ? 'Administrator' : 'Sales Floor Exec'}</span>
                </div>
              </div>
            </div>

            {isAdmin && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Dealership System Configuration & DB Backup"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Settings size={14} />
              </button>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '7px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogOut size={13} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
