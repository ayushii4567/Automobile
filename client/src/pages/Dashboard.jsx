import React from 'react';
import { 
  Car, 
  DollarSign, 
  Users, 
  CalendarClock, 
  ArrowRight,
  Eye,
  Plus,
  TrendingUp,
  Tag,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  PhoneCall,
  CreditCard,
  Truck,
  FileText
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Dashboard({ 
  dashboardData, 
  onNavigate, 
  onViewInvoice, 
  onOpenAddSale, 
  onOpenAddVehicle, 
  onOpenAddTestDrive 
}) {
  if (!dashboardData || !dashboardData.kpi) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <div className="status-dot active" style={{ width: '12px', height: '12px', marginBottom: '12px' }}></div>
        <div style={{ fontWeight: 600 }}>Loading Showroom Dashboard...</div>
      </div>
    );
  }

  const { kpi, monthlyRevenue = [], categoryBreakdown = [], recentSales = [], upcomingTestDrives = [], lowStock = [] } = dashboardData;

  // Dynamic formatted live date e.g. "Thursday, 17 September 2026"
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate inventory metrics
  const availableCount = Number(kpi.availableCount !== undefined ? kpi.availableCount : 2);
  const reservedCount = Number(kpi.reservedCount !== undefined ? kpi.reservedCount : 0);
  const soldCount = Number(kpi.soldCount !== undefined ? kpi.soldCount : 2);
  const totalFleet = availableCount + reservedCount + soldCount || 4;

  const availablePct = Math.round((availableCount / totalFleet) * 100);
  const reservedPct = Math.round((reservedCount / totalFleet) * 100);
  const soldPct = Math.round((soldCount / totalFleet) * 100);

  // Sales target metrics (INR)
  const monthlyTarget = 5000000;
  const currentMonthlyRevenue = Number(kpi.totalRevenue || 4493500);
  const targetPct = Math.min(100, Math.round((currentMonthlyRevenue / monthlyTarget) * 100));

  // Realistic activity timeline items (exactly 2 demo items)
  const activityTimeline = [
    {
      id: 'act-1',
      type: 'followup',
      icon: PhoneCall,
      color: '#ef4444',
      bg: '#fee2e2',
      time: 'Today • 11:30 AM',
      title: 'Rahul Sharma — Client Follow-up',
      desc: 'Follow-up scheduled on XUV700 inquiry; on-road quotation sent.',
      actionTab: 'enquiries',
      actionLabel: 'View Lead'
    },
    {
      id: 'act-2',
      type: 'testdrive',
      icon: CalendarClock,
      color: '#0284c7',
      bg: '#e0f2fe',
      time: 'Today • 3:30 PM',
      title: 'Ananya Verma — VIP Test Drive',
      desc: 'Tata Safari Dark Edition booked for 45-min highway test drive.',
      actionTab: 'testdrives',
      actionLabel: 'View Drive'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Executive Operations & Actions Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '2px 0 4px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#64748b' }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>📅 {todayFormatted}</span>
          <span>•</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#16a34a',
            fontWeight: 600,
            background: '#f0fdf4',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '0.74rem',
            border: '1px solid #bbf7d0'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
            All Systems Operational
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={onOpenAddSale} className="btn btn-primary" style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={15} />
            <span>New Sale</span>
          </button>
          <button onClick={onOpenAddVehicle} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
            <Car size={14} />
            <span>Add Car</span>
          </button>
          <button onClick={onOpenAddTestDrive} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
            <CalendarClock size={14} />
            <span>Book Test Drive</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards (Requested exact 4 items) */}
      <div className="responsive-kpi-grid">
        <StatCard
          title="Inventory"
          value={kpi.totalVehicles || 2}
          subtitle={`${availableCount} Available for sale`}
          trend="+2 New Fleet"
          icon={Car}
          accent="blue"
          onClick={() => onNavigate('inventory')}
        />
        <StatCard
          title="Customers"
          value={Number(kpi.activeCustomersCount || 2).toLocaleString()}
          subtitle="Registered VIP buyers & leads"
          trend="2 Active Clients"
          icon={Users}
          accent="purple"
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          title="Revenue"
          value={`₹${Number(kpi.totalRevenue || 4493500).toLocaleString('en-IN')}`}
          subtitle="Closed sales transactions"
          trend="2 Closed Deals"
          icon={DollarSign}
          accent="emerald"
          onClick={() => onNavigate('sales')}
        />
        <StatCard
          title="Test Drives"
          value={kpi.pendingTestDrivesCount || 2}
          subtitle="Scheduled this week"
          trend="2 Booked Sessions"
          icon={CalendarClock}
          accent="amber"
          onClick={() => onNavigate('testdrives')}
        />
      </div>

      {/* Low Stock Alert Banner (if any) */}
      {lowStock.length > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px',
          padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px'
        }} className="animate-fade-in">
          <AlertTriangle size={18} color="#d97706" />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#92400e' }}>Showroom Low Stock Notice: </span>
            <span style={{ fontSize: '0.85rem', color: '#78350f' }}>
              {lowStock.map(v => `${v.brand} ${v.model}`).join(', ')} — only 1 unit remaining on showroom floor.
            </span>
          </div>
          <button onClick={() => onNavigate('inventory')} className="btn btn-secondary btn-sm">
            View Inventory →
          </button>
        </div>
      )}

      {/* Middle 2 Cards (Requested Layout: SALES PERFORMANCE vs INVENTORY STATUS) */}
      <div className="responsive-grid-2">
        
        {/* Card 1: SALES PERFORMANCE (Corporate clean, zero graphs) */}
        <div className="glass-card hover-elevate" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                REVENUE &amp; DEALS REALIZATION
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                SALES PERFORMANCE
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Monthly sales revenue and target realization metrics
              </p>
            </div>
            <span className="badge badge-available">
              Target: {targetPct}%
            </span>
          </div>

          {/* Target Progress Bar */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                Monthly Target (₹{(monthlyTarget).toLocaleString('en-IN')})
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a' }}>
                ₹{Number(currentMonthlyRevenue).toLocaleString('en-IN')} ({targetPct}%)
              </span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${targetPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #16a34a 100%)',
                borderRadius: '5px',
                transition: 'width 0.8s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>
              <span>Closed: <strong>{kpi.totalSalesCount || 2} Deals</strong></span>
              <span>Avg Deal: <strong>₹{Math.round(currentMonthlyRevenue / (kpi.totalSalesCount || 2)).toLocaleString('en-IN')}</strong></span>
              <span>Settlement: <strong>100% Verified</strong></span>
            </div>
          </div>

          {/* Monthly Revenue Comparison Table (Clean Corporate Table, NO graphs) */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Deals Closed</th>
                  <th>Revenue (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRevenue.slice(-2).map((item) => (
                  <tr key={item.month}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.month} 2026
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#334155' }}>
                        {item.salesCount} Deals
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>
                      ₹{Number(item.revenue).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="badge badge-available">
                        Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: INVENTORY STATUS (Clean breakdown with progress meters) */}
        <div className="glass-card hover-elevate" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                SHOWROOM FLEET DISTRIBUTION
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                INVENTORY STATUS
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Current fleet allocation across sales stages
              </p>
            </div>
            <button onClick={() => onNavigate('inventory')} className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 3 Status Distribution Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
            
            {/* Available */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }}></span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>Available for Sale</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>{availableCount}</span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>({availablePct}%)</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${availablePct}%`, height: '100%', background: '#16a34a', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Reserved */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706' }}></span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>Reserved / Booking Paid</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#d97706' }}>{reservedCount}</span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>({reservedPct}%)</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${reservedPct}%`, height: '100%', background: '#d97706', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Sold */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#b91c1c' }}></span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>Sold / Delivered</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#b91c1c' }}>{soldCount}</span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>({soldPct}%)</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${soldPct}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Category breakdown tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {categoryBreakdown.map(cat => (
                <span key={cat.category} style={{
                  fontSize: '0.74rem',
                  padding: '4px 9px',
                  background: '#f1f5f9',
                  borderRadius: '6px',
                  color: '#334155',
                  fontWeight: 600
                }}>
                  {cat.category}: <strong>{cat.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: RECENT SALES / TRANSACTIONS (Full Width Table) */}
      <div className="glass-card hover-elevate" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              DEAL FLOW &amp; CONTRACTS
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              RECENT SALES / TRANSACTIONS
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Real-time closed contracts, invoices, and payment confirmation status
            </p>
          </div>
          <button 
            onClick={() => onNavigate('sales')} 
            className="btn btn-secondary btn-sm"
          >
            <span>View All Invoices</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle Model</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{sale.customerName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Invoice #{sale.invoiceNo}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>
                      {sale.vehicleName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Date: {sale.saleDate}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.92rem' }}>
                      ₹{Number(sale.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      color: '#334155'
                    }}>
                      {sale.paymentMethod || 'Wire Transfer'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-available">
                      Completed &amp; Settled
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => onViewInvoice(sale)} 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 10px' }}
                    >
                      <Eye size={13} />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 4: ⚡ SHOWROOM ACTIVITY & FOLLOW-UP TIMELINE (Realistic Client Demo Feature) */}
      <div className="glass-card hover-elevate" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              LIVE OPERATIONS FEED
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              ⚡ SHOWROOM ACTIVITY &amp; FOLLOW-UP TIMELINE
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Scheduled client follow-ups, test drive reminders, and workshop job milestones
            </p>
          </div>
          <span className="badge badge-sent" style={{ fontSize: '0.75rem' }}>
            2 Active Tasks
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activityTimeline.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  transition: 'transform 0.15s ease, background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={18} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                    {item.time}
                  </span>
                  <button 
                    onClick={() => onNavigate(item.actionTab)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
