import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Car, 
  Package, 
  Wrench, 
  Users, 
  DollarSign, 
  Receipt, 
  Clock, 
  ShieldAlert, 
  Landmark, 
  TrendingUp, 
  AlertCircle, 
  BookOpen, 
  Sparkles,
  RotateCcw,
  Calendar,
  Building,
  Compass,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { api } from '../api';

export default function ReportsManagement({ 
  currentUser, 
  subTab,
  onSubTabChange,
  settings = {} 
}) {
  const [selectedReportId, setSelectedReportId] = useState('vehicle_stock');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL, STOCK, SALES, PURCHASE, ACCOUNTS, SERVICE
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subTab) {
      if (['STOCK', 'SALES', 'PURCHASE', 'ACCOUNTS', 'SERVICE', 'ALL'].includes(subTab)) {
        setCategoryFilter(subTab);
      } else {
        setSelectedReportId(subTab);
      }
    }
  }, [subTab]);

  // Master Database Reports State
  const [masterData, setMasterData] = useState({
    vehicleStock: [],
    implementStock: [],
    spareStock: [],
    accessoriesStock: [],
    vehiclePurchases: [],
    sparePurchases: [],
    accessoriesPurchases: [],
    accessoriesSales: [],
    sparePartsSales: [],
    vehicleSales: [],
    vehicleProfit: [],
    salesmanSales: [],
    villageSales: [],
    tehsilSales: [],
    mechanicReports: [],
    dailyService: [],
    nextServicing: [],
    serviceHistory: [],
    partsLedger: [],
    rtoReports: [],
    financeReports: [],
    insuranceReports: [],
    customerDue: [],
    gstReports: { breakdown: [] },
    dayBook: [],
    expensesReports: [],
    outstandingReports: {},
    companyLedger: {}
  });

  // Additional Supporting States
  const [cashBookData, setCashBookData] = useState({ summary: {}, cashReceipts: [], cashPayments: [] });
  const [bankBookData, setBankBookData] = useState({ summary: {}, records: [] });
  const [customerLedgerData, setCustomerLedgerData] = useState({ partyList: [], transactions: [], summary: {} });

  const loadReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (dateRange.startDate) queryParams.set('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.set('endDate', dateRange.endDate);
      const pStr = queryParams.toString();

      const [mMaster, cBook, bBook, cLedger] = await Promise.all([
        api.getDealershipMasterReports(pStr).catch(() => ({})),
        api.getCashBook(pStr).catch(() => ({ summary: {}, cashReceipts: [], cashPayments: [] })),
        api.getBankBook(pStr).catch(() => ({ summary: {}, records: [] })),
        api.getPartyLedger({ partyType: 'customer' }).catch(() => ({ partyList: [], transactions: [], summary: {} }))
      ]);

      setMasterData(mMaster || {});
      setCashBookData(cBook || { summary: {}, cashReceipts: [], cashPayments: [] });
      setBankBookData(bBook || { summary: {}, records: [] });
      setCustomerLedgerData(cLedger || { partyList: [], transactions: [], summary: {} });
    } catch (err) {
      console.error('Failed to load master report suite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleApplyDateFilter = (e) => {
    e?.preventDefault();
    loadReports();
  };

  const handleResetDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setTimeout(() => loadReports(), 50);
  };

  // 32 Exact Approved Reports Registry
  const reportsList = [
    // 1. Stock Reports
    { id: 'vehicle_stock', name: 'Vehicle Stock', category: 'STOCK', icon: Car, count: masterData.vehicleStock?.length },
    { id: 'implement_stock', name: 'Implement Stock', category: 'STOCK', icon: Package, count: masterData.implementStock?.length },
    { id: 'spare_stock', name: 'Spare Parts Stock', category: 'STOCK', icon: Wrench, count: masterData.spareStock?.length },
    { id: 'accessories_stock', name: 'Accessories Stock', category: 'STOCK', icon: Sparkles, count: masterData.accessoriesStock?.length },

    // 2. Sales Reports
    { id: 'salesman_sales', name: 'Salesman-wise Sales', category: 'SALES', icon: Users, count: masterData.salesmanSales?.length },
    { id: 'village_sales', name: 'Village-wise Sales', category: 'SALES', icon: Users, count: masterData.villageSales?.length },
    { id: 'tehsil_sales', name: 'Tehsil-wise Sales', category: 'SALES', icon: Users, count: masterData.tehsilSales?.length },
    { id: 'vehicle_profit', name: 'Vehicle Profit', category: 'SALES', icon: TrendingUp, count: masterData.vehicleProfit?.length },
    { id: 'vehicle_sales', name: 'Vehicle Sales', category: 'SALES', icon: Car, count: masterData.vehicleSales?.length },
    { id: 'spare_parts_sales', name: 'Spare Parts Sales', category: 'SALES', icon: Receipt, count: masterData.sparePartsSales?.length },
    { id: 'accessories_sales', name: 'Accessories Sales', category: 'SALES', icon: Sparkles, count: masterData.accessoriesSales?.length },

    // 3. Purchase Reports
    { id: 'vehicle_purchase', name: 'Vehicle Purchase', category: 'PURCHASE', icon: Car, count: masterData.vehiclePurchases?.length },
    { id: 'spare_purchase', name: 'Spare Parts Purchase', category: 'PURCHASE', icon: Wrench, count: masterData.sparePurchases?.length },
    { id: 'accessories_purchase', name: 'Accessories Purchase', category: 'PURCHASE', icon: Sparkles, count: masterData.accessoriesPurchases?.length },

    // 4. Institutional & Regional Reports
    { id: 'rto_reports', name: 'RTO Reports', category: 'ACCOUNTS', icon: FileSpreadsheet, count: masterData.rtoReports?.length },
    { id: 'finance_reports', name: 'Finance Reports', category: 'ACCOUNTS', icon: DollarSign, count: masterData.financeReports?.length },
    { id: 'insurance_reports', name: 'Insurance Reports', category: 'ACCOUNTS', icon: ShieldAlert, count: masterData.insuranceReports?.length },

    // 5. Service & Workshop Reports
    { id: 'mechanic_reports', name: 'Mechanic-wise Reports', category: 'SERVICE', icon: Wrench, count: masterData.mechanicReports?.length },
    { id: 'next_servicing', name: 'Next Servicing Reports', category: 'SERVICE', icon: Clock, count: masterData.nextServicing?.length },
    { id: 'parts_ledger', name: 'Parts Ledger', category: 'SERVICE', icon: Wrench, count: masterData.partsLedger?.length },
    { id: 'daily_service', name: 'Daily Service Center Reports', category: 'SERVICE', icon: Clock, count: masterData.dailyService?.length },
    { id: 'service_history', name: 'Service History', category: 'SERVICE', icon: Clock, count: masterData.serviceHistory?.length },

    // 6. Accounts & Financial Statements
    { id: 'customer_ledger', name: 'Customer Ledger', category: 'ACCOUNTS', icon: BookOpen, count: customerLedgerData.partyList?.length },
    { id: 'company_ledger', name: 'Company Ledger', category: 'ACCOUNTS', icon: Landmark },
    { id: 'cash_book', name: 'Cash Book', category: 'ACCOUNTS', icon: Landmark, count: cashBookData.cashReceipts?.length + cashBookData.cashPayments?.length },
    { id: 'bank_book', name: 'Bank Book', category: 'ACCOUNTS', icon: Landmark, count: bankBookData.records?.length },
    { id: 'customer_due', name: 'Customer Due List', category: 'ACCOUNTS', icon: AlertCircle, count: masterData.customerDue?.length },
    { id: 'gst_reports', name: 'GST Reports', category: 'ACCOUNTS', icon: Receipt },
    { id: 'day_book', name: 'Day Book', category: 'ACCOUNTS', icon: BookOpen, count: masterData.dayBook?.length },
    { id: 'salesman_reports', name: 'Salesman-wise Reports', category: 'SALES', icon: Users, count: masterData.salesmanSales?.length },
    { id: 'outstanding_reports', name: 'Outstanding Reports', category: 'ACCOUNTS', icon: AlertCircle },
    { id: 'expenses_reports', name: 'Expenses Reports', category: 'ACCOUNTS', icon: Receipt, count: masterData.expensesReports?.length }
  ];

  const filteredReports = reportsList.filter(r => {
    const matchCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchSearch = r.name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeReport = reportsList.find(r => r.id === selectedReportId) || reportsList[0];

  // Universal CSV Exporter
  const handleExportCSV = () => {
    let dataToExport = [];
    switch (selectedReportId) {
      case 'vehicle_stock': dataToExport = masterData.vehicleStock; break;
      case 'implement_stock': dataToExport = masterData.implementStock; break;
      case 'spare_stock': dataToExport = masterData.spareStock; break;
      case 'accessories_stock': dataToExport = masterData.accessoriesStock; break;
      case 'salesman_sales': dataToExport = masterData.salesmanSales; break;
      case 'village_sales': dataToExport = masterData.villageSales; break;
      case 'tehsil_sales': dataToExport = masterData.tehsilSales; break;
      case 'vehicle_profit': dataToExport = masterData.vehicleProfit; break;
      case 'vehicle_sales': dataToExport = masterData.vehicleSales; break;
      case 'spare_parts_sales': dataToExport = masterData.sparePartsSales; break;
      case 'accessories_sales': dataToExport = masterData.accessoriesSales; break;
      case 'vehicle_purchase': dataToExport = masterData.vehiclePurchases; break;
      case 'spare_purchase': dataToExport = masterData.sparePurchases; break;
      case 'accessories_purchase': dataToExport = masterData.accessoriesPurchases; break;
      case 'rto_reports': dataToExport = masterData.rtoReports; break;
      case 'finance_reports': dataToExport = masterData.financeReports; break;
      case 'insurance_reports': dataToExport = masterData.insuranceReports; break;
      case 'mechanic_reports': dataToExport = masterData.mechanicReports; break;
      case 'next_servicing': dataToExport = masterData.nextServicing; break;
      case 'parts_ledger': dataToExport = masterData.partsLedger; break;
      case 'daily_service': dataToExport = masterData.dailyService; break;
      case 'service_history': dataToExport = masterData.serviceHistory; break;
      case 'customer_ledger': dataToExport = customerLedgerData.partyList; break;
      case 'cash_book': dataToExport = [...(cashBookData.cashReceipts || []), ...(cashBookData.cashPayments || [])]; break;
      case 'bank_book': dataToExport = bankBookData.records; break;
      case 'customer_due': dataToExport = masterData.customerDue; break;
      case 'gst_reports': dataToExport = masterData.gstReports?.breakdown; break;
      case 'day_book': dataToExport = masterData.dayBook; break;
      case 'expenses_reports': dataToExport = masterData.expensesReports; break;
      default: dataToExport = [];
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert(`No records found to export for ${activeReport.name}.`);
      return;
    }

    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => 
      Object.values(row).map(val => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReportId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="module-container" style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
          }}>
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Reports Management
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: '2px 0 0' }}>
              Complete 32 Specialized Dealership Audit Reports, Ledgers, GST Statements & Demographics
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print Report
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date-Range Filter Header */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <form onSubmit={handleApplyDateFilter} style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#6366f1" />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>Audit Date Range:</span>
          </div>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '155px', height: '34px' }} 
            value={dateRange.startDate} 
            onChange={e => setDateRange({...dateRange, startDate: e.target.value})} 
          />
          <span style={{ color: '#64748b', fontWeight: 600 }}>to</span>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '155px', height: '34px' }} 
            value={dateRange.endDate} 
            onChange={e => setDateRange({...dateRange, endDate: e.target.value})} 
          />
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}>
            <Filter size={14} /> Apply Filter
          </button>
          {(dateRange.startDate || dateRange.endDate) && (
            <button type="button" onClick={handleResetDateFilter} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}>
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </form>
      </div>

      {/* Category Pills & Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['ALL', 'STOCK', 'SALES', 'PURCHASE', 'ACCOUNTS', 'SERVICE'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: categoryFilter === cat ? '1px solid #6366f1' : '1px solid #cbd5e1',
                background: categoryFilter === cat ? '#6366f1' : '#ffffff',
                color: categoryFilter === cat ? '#ffffff' : '#334155',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: categoryFilter === cat ? '0 4px 12px rgba(99, 102, 241, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              {cat === 'ALL' ? 'All 32 Reports' : cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text"
              placeholder="Search in 32 reports..."
              className="form-input"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              style={{ paddingLeft: '32px', width: '240px', height: '36px', fontSize: '0.82rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#64748b' }} />
          </div>
        </div>
      </div>

      {/* Two-Column Layout (Catalog Selector + Master Report Content) */}
      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: 32 Reports Catalog */}
        <div className="card" style={{ padding: '12px', maxHeight: '78vh', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', padding: '6px 8px 10px', letterSpacing: '0.05em' }}>
            Report Catalog ({filteredReports.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {filteredReports.map(r => {
              const isSelected = selectedReportId === r.id;
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                    background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Icon size={14} style={{ color: isSelected ? '#818cf8' : '#64748b', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  </div>
                  {r.count !== undefined && (
                    <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                      {r.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Report View */}
        <div className="card" style={{ padding: '20px', minHeight: '68vh' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
            marginBottom: '16px'
          }}>
            <div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#6366f1',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(99, 102, 241, 0.12)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {activeReport.category} REPORT
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '6px 0 0' }}>
                {activeReport.name}
              </h2>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Generated: {new Date().toLocaleDateString('en-IN')} • Dealership SQLite Engine
            </div>
          </div>

          {/* =================================================================
              ALL 32 SPECIALIZED REPORT TABLES
              ================================================================= */}

          {/* 1. Vehicle Stock */}
          {selectedReportId === 'vehicle_stock' && (
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Model</th><th>Variant</th><th>Horsepower</th><th>VIN</th><th>Ex-Showroom</th><th>Procurement Cost</th><th>Stock</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {masterData.vehicleStock?.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600 }}>{v.brand} {v.model}</td>
                      <td>{v.variant}</td>
                      <td>{v.horsepower || 55} HP</td>
                      <td style={{ fontFamily: 'monospace' }}>{v.vin}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(v.ex_showroom_price).toLocaleString('en-IN')}</td>
                      <td>₹{Number(v.procurement_cost || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: v.stock_quantity > 0 ? '#10b981' : '#ef4444' }}>{v.stock_quantity}</td>
                      <td><span className="badge badge-success">{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Implement Stock */}
          {selectedReportId === 'implement_stock' && (
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Equipment Description</th><th>Category</th><th>HP Compatibility</th><th>Purchase Cost</th><th>Selling Price</th><th>Stock In Hand</th></tr>
                </thead>
                <tbody>
                  {masterData.implementStock?.map(im => (
                    <tr key={im.id}>
                      <td style={{ fontWeight: 600 }}>{im.name}</td>
                      <td>{im.category}</td>
                      <td>{im.compatible_hp_min} - {im.compatible_hp_max} HP</td>
                      <td>₹{Number(im.purchase_cost).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(im.selling_price).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700 }}>{im.stock_quantity} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Salesman-wise Sales */}
          {selectedReportId === 'salesman_sales' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Sales Representative</th><th>Units Sold</th><th>Sales Turnover (₹)</th><th>Avg Deal Value</th></tr>
              </thead>
              <tbody>
                {masterData.salesmanSales?.map((sw, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{sw.salesman}</td>
                    <td>{sw.units_sold} units</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(sw.total_sales_value).toLocaleString('en-IN')}</td>
                    <td>₹{Math.round(Number(sw.total_sales_value) / (sw.units_sold || 1)).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 4. Village-wise Sales */}
          {selectedReportId === 'village_sales' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Village</th><th>Tehsil</th><th>Units Sold</th><th>Total Turnover (₹)</th></tr>
              </thead>
              <tbody>
                {masterData.villageSales?.map((v, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{v.village}</td>
                    <td>{v.tehsil}</td>
                    <td>{v.units_sold} units</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(v.total_sales_value).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 5. Tehsil-wise Sales */}
          {selectedReportId === 'tehsil_sales' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Tehsil</th><th>District</th><th>Units Sold</th><th>Total Turnover (₹)</th></tr>
              </thead>
              <tbody>
                {masterData.tehsilSales?.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#38bdf8' }}>{t.tehsil}</td>
                    <td>{t.district}</td>
                    <td>{t.units_sold} units</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(t.total_sales_value).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 6. Vehicle Profit */}
          {selectedReportId === 'vehicle_profit' && (
            <div>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '14px', fontSize: '0.88rem' }}>
                <div>Total Realized Deals: <strong style={{ color: '#38bdf8' }}>{masterData.vehicleProfit?.length || 0} Units</strong></div>
                <div>Total Realized Profit: <strong style={{ color: '#10b981' }}>₹{masterData.vehicleProfit?.reduce((acc, r) => acc + Number(r.gross_profit || 0), 0).toLocaleString('en-IN')}</strong></div>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Sale Order #</th><th>Customer</th><th>Vehicle</th><th>Realized Price</th><th>Cost Price</th><th>Gross Profit</th><th>Margin %</th></tr>
                </thead>
                <tbody>
                  {masterData.vehicleProfit?.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#f59e0b' }}>{r.sale_order_number}</td>
                      <td>{r.customer_name}</td>
                      <td style={{ fontWeight: 600 }}>{r.vehicle_model}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(r.net_selling_price).toLocaleString('en-IN')}</td>
                      <td>₹{Number(r.cost_price).toLocaleString('en-IN')}</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>₹{Number(r.gross_profit).toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-success">{r.margin_pct}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. Spare Parts Stock */}
          {selectedReportId === 'spare_stock' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Part #</th><th>Description</th><th>Category</th><th>Stock In Hand</th><th>Unit Cost</th><th>Selling Price</th><th>Inventory Value</th></tr>
              </thead>
              <tbody>
                {masterData.spareStock?.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{p.part_number}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td style={{ fontWeight: 700, color: p.stock_quantity <= 3 ? '#ef4444' : '#10b981' }}>{p.stock_quantity} units</td>
                    <td>₹{Number(p.unit_cost).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(p.selling_price).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>₹{Number(p.stock_quantity * p.unit_cost).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 8. Accessories Stock */}
          {selectedReportId === 'accessories_stock' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Code</th><th>Accessory Item</th><th>Stock In Hand</th><th>Unit Cost</th><th>Selling Price</th><th>Inventory Value</th></tr>
              </thead>
              <tbody>
                {masterData.accessoriesStock?.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 700, color: '#a855f7' }}>{a.part_number}</td>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td style={{ fontWeight: 700 }}>{a.stock_quantity} units</td>
                    <td>₹{Number(a.unit_cost).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(a.selling_price).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(a.stock_quantity * a.unit_cost).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 9. Vehicle Purchases */}
          {selectedReportId === 'vehicle_purchase' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>PO #</th><th>OEM Factory Supplier</th><th>Vehicle Item</th><th>Qty</th><th>Unit Cost</th><th>Total Consignment</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.vehiclePurchases?.map((vp, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{vp.po_number}</td>
                    <td style={{ fontWeight: 600 }}>{vp.supplier_name}</td>
                    <td>{vp.item_name}</td>
                    <td>{vp.quantity} units</td>
                    <td>₹{Number(vp.unit_cost).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(vp.total_cost || vp.quantity * vp.unit_cost).toLocaleString('en-IN')}</td>
                    <td>{vp.order_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 10. Spare Parts Purchases */}
          {selectedReportId === 'spare_purchase' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>PO #</th><th>Supplier</th><th>Spare Item</th><th>Qty</th><th>Unit Cost</th><th>Total Inward Cost</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.sparePurchases?.map((sp, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{sp.po_number}</td>
                    <td style={{ fontWeight: 600 }}>{sp.supplier_name}</td>
                    <td>{sp.item_name}</td>
                    <td>{sp.quantity}</td>
                    <td>₹{Number(sp.unit_cost).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(sp.total_cost || sp.quantity * sp.unit_cost).toLocaleString('en-IN')}</td>
                    <td>{sp.order_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 11. Accessories Purchases */}
          {selectedReportId === 'accessories_purchase' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>PO #</th><th>Supplier</th><th>Accessory Item</th><th>Quantity</th><th>Unit Cost</th><th>Total Cost</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.accessoriesPurchases?.map((ap, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#a855f7' }}>{ap.po_number}</td>
                    <td style={{ fontWeight: 600 }}>{ap.supplier_name}</td>
                    <td>{ap.item_name}</td>
                    <td>{ap.quantity}</td>
                    <td>₹{Number(ap.unit_cost).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(ap.total_cost).toLocaleString('en-IN')}</td>
                    <td>{ap.order_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 12. Accessories Sales */}
          {selectedReportId === 'accessories_sales' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Invoice #</th><th>Customer Name</th><th>Vehicle Number</th><th>Subtotal</th><th>GST (18%)</th><th>Total Billed</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.accessoriesSales?.map(as => (
                  <tr key={as.id}>
                    <td style={{ fontWeight: 700, color: '#a855f7' }}>{as.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{as.customer_name}</td>
                    <td>{as.vehicle_number || 'Counter'}</td>
                    <td>₹{Number(as.subtotal).toLocaleString('en-IN')}</td>
                    <td>₹{Number(as.tax_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(as.total_amount).toLocaleString('en-IN')}</td>
                    <td>{as.invoice_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 13. RTO Reports */}
          {selectedReportId === 'rto_reports' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>RTO File #</th><th>Customer</th><th>Vehicle</th><th>Jurisdiction</th><th>Tax Collected</th><th>Govt Tax Paid</th><th>RC Status</th></tr>
              </thead>
              <tbody>
                {masterData.rtoReports?.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{r.rto_file_no}</td>
                    <td style={{ fontWeight: 600 }}>{r.customer_name}</td>
                    <td>{r.vehicle_name}</td>
                    <td>{r.rto_office}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(r.tax_collected).toLocaleString('en-IN')}</td>
                    <td>₹{Number(r.govt_tax_paid).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-success">{r.rc_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 14. Finance Reports */}
          {selectedReportId === 'finance_reports' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>App ID</th><th>Customer Name</th><th>Financier</th><th>Vehicle</th><th>Loan Sanctioned</th><th>Tenure</th><th>Status</th></tr>
              </thead>
              <tbody>
                {masterData.financeReports?.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{f.id}</td>
                    <td style={{ fontWeight: 600 }}>{f.customer_name}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{f.bank_name}</td>
                    <td>{f.vehicle_name}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(f.loan_amount).toLocaleString('en-IN')}</td>
                    <td>{f.tenure_months || 48} Mo</td>
                    <td><span className={`badge ${f.status === 'Disbursed' ? 'badge-success' : 'badge-warning'}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 15. Insurance Reports */}
          {selectedReportId === 'insurance_reports' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Policy #</th><th>Insurer</th><th>Policy Type</th><th>IDV Amount</th><th>Premium</th><th>Expiry Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {masterData.insuranceReports?.map(ins => (
                  <tr key={ins.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{ins.policy_number}</td>
                    <td style={{ fontWeight: 600 }}>{ins.provider}</td>
                    <td>{ins.policy_type}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(ins.idv_amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(ins.premium_amount || 0).toLocaleString('en-IN')}</td>
                    <td>{ins.expiry_date}</td>
                    <td><span className="badge badge-success">{ins.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 16. Mechanic-wise Reports */}
          {selectedReportId === 'mechanic_reports' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Technician</th><th>Job Cards Completed</th><th>Labor Billed</th><th>Parts Fitted</th><th>Total Workshop Turnover</th></tr>
              </thead>
              <tbody>
                {masterData.mechanicReports?.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#fbbf24' }}>{m.mechanic}</td>
                    <td>{m.job_cards_handled} jobs</td>
                    <td style={{ color: '#38bdf8', fontWeight: 700 }}>₹{Number(m.total_labor_billed).toLocaleString('en-IN')}</td>
                    <td>₹{Number(m.total_parts_fitted).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>₹{Number(m.total_revenue_generated).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 17. Next Servicing Reports */}
          {selectedReportId === 'next_servicing' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Ticket Ref</th><th>Customer Name</th><th>Phone</th><th>Vehicle Model</th><th>Last Serviced</th><th>Next Due Date</th><th>Service Scope</th></tr>
              </thead>
              <tbody>
                {masterData.nextServicing?.map((ns, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{ns.ticket_number}</td>
                    <td style={{ fontWeight: 600 }}>{ns.customer_name}</td>
                    <td>{ns.customer_phone}</td>
                    <td>{ns.vehicle_model}</td>
                    <td>{ns.last_service_date}</td>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{ns.next_due_date}</td>
                    <td><span className="badge badge-info">{ns.service_recommendation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 18. Parts Ledger */}
          {selectedReportId === 'parts_ledger' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Part #</th><th>Description</th><th>Transaction Type</th><th>Reference #</th><th>Quantity</th><th>Unit Price</th><th>Balance Stock</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.partsLedger?.map(pl => (
                  <tr key={pl.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{pl.part_number}</td>
                    <td style={{ fontWeight: 600 }}>{pl.part_name}</td>
                    <td><span className="badge badge-info">{pl.transaction_type}</span></td>
                    <td>{pl.reference_no}</td>
                    <td style={{ fontWeight: 700, color: pl.quantity > 0 ? '#10b981' : '#ef4444' }}>{pl.quantity}</td>
                    <td>₹{Number(pl.unit_price).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>{pl.balance_stock} units</td>
                    <td>{pl.transaction_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 19. Daily Service Center Reports */}
          {selectedReportId === 'daily_service' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Service Date</th><th>Vehicles Inward</th><th>Jobs Completed</th><th>Total Workshop Billed (₹)</th></tr>
              </thead>
              <tbody>
                {masterData.dailyService?.map((ds, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{ds.service_date}</td>
                    <td>{ds.vehicles_received} units</td>
                    <td>{ds.vehicles_completed} units</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(ds.total_billed).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 20. Service History */}
          {selectedReportId === 'service_history' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Ticket #</th><th>Customer</th><th>Vehicle Model</th><th>VIN</th><th>Technician</th><th>Service Type</th><th>Total Billed</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.serviceHistory?.map((sh, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{sh.ticket_number}</td>
                    <td style={{ fontWeight: 600 }}>{sh.customer_name}</td>
                    <td>{sh.vehicle_model}</td>
                    <td style={{ fontFamily: 'monospace' }}>{sh.vin}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{sh.technician_name}</td>
                    <td>{sh.service_type}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(sh.total_service_cost || 0).toLocaleString('en-IN')}</td>
                    <td>{sh.entry_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 21. Spare Parts Sales */}
          {selectedReportId === 'spare_parts_sales' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Invoice #</th><th>Customer</th><th>Vehicle Number</th><th>Subtotal</th><th>GST (18%)</th><th>Total Invoiced</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.sparePartsSales?.map(sp => (
                  <tr key={sp.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{sp.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{sp.customer_name}</td>
                    <td>{sp.vehicle_number || 'Walk-in'}</td>
                    <td>₹{Number(sp.subtotal).toLocaleString('en-IN')}</td>
                    <td>₹{Number(sp.tax_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(sp.total_amount).toLocaleString('en-IN')}</td>
                    <td>{sp.invoice_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 22. Vehicle Sales */}
          {selectedReportId === 'vehicle_sales' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Sale Order #</th><th>Customer Name</th><th>Village & Tehsil</th><th>Vehicle Model</th><th>VIN</th><th>Sales Consultant</th><th>Final Price</th><th>Date</th></tr>
              </thead>
              <tbody>
                {masterData.vehicleSales?.map(vs => (
                  <tr key={vs.id}>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{vs.sale_order_number}</td>
                    <td style={{ fontWeight: 600 }}>{vs.customer_name}</td>
                    <td>{vs.village} ({vs.tehsil})</td>
                    <td>{vs.vehicle_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{vs.vin}</td>
                    <td>{vs.salesman}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(vs.total_amount).toLocaleString('en-IN')}</td>
                    <td>{vs.booking_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 23. Customer Ledger */}
          {selectedReportId === 'customer_ledger' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Customer ID</th><th>Customer Name</th><th>Mobile</th><th>Region / City</th><th>Status</th></tr>
              </thead>
              <tbody>
                {customerLedgerData.partyList?.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.city || 'Baramati'}</td>
                    <td><span className="badge badge-success">Active Account</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 24. Company Ledger */}
          {selectedReportId === 'company_ledger' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Gross Sales Turnover</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    ₹{Number(masterData.companyLedger?.grossTurnover || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>OEM Purchases</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                    ₹{Number(masterData.companyLedger?.procurementExpenditure || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Operating Overhead</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                    ₹{Number(masterData.companyLedger?.operationalExpenses || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Operating Net Surplus</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    ₹{Number(masterData.companyLedger?.operatingSurplus || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 25. Cash Book */}
          {selectedReportId === 'cash_book' && (
            <div>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '14px', fontSize: '0.88rem' }}>
                <div>Total Cash Receipts: <strong style={{ color: '#10b981' }}>₹{Number(cashBookData.summary?.totalCashIn || 0).toLocaleString('en-IN')}</strong></div>
                <div>Total Cash Disbursed: <strong style={{ color: '#ef4444' }}>₹{Number(cashBookData.summary?.totalCashOut || 0).toLocaleString('en-IN')}</strong></div>
                <div>Closing Cash in Hand: <strong style={{ color: '#38bdf8' }}>₹{Number(cashBookData.summary?.closingBalance || 0).toLocaleString('en-IN')}</strong></div>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Date</th><th>Voucher / Ref #</th><th>Particulars</th><th>Category</th><th>Mode</th><th>Amount (₹)</th></tr>
                </thead>
                <tbody>
                  {[...(cashBookData.cashReceipts || []), ...(cashBookData.cashPayments || [])].sort((a,b) => new Date(b.date) - new Date(a.date)).map((c, i) => (
                    <tr key={i}>
                      <td>{c.date}</td>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{c.ref_no}</td>
                      <td style={{ fontWeight: 600 }}>{c.particulars}</td>
                      <td>{c.category}</td>
                      <td><span className={`badge ${c.type === 'RECEIPT' ? 'badge-success' : 'badge-danger'}`}>{c.type}</span></td>
                      <td style={{ fontWeight: 700, color: c.type === 'RECEIPT' ? '#10b981' : '#ef4444' }}>
                        ₹{Number(c.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 26. Bank Book */}
          {selectedReportId === 'bank_book' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Date</th><th>Voucher Ref</th><th>Operating Bank</th><th>UTR / Cheque #</th><th>Particulars</th><th>Debit Inflow (₹)</th><th>Credit Outflow (₹)</th></tr>
              </thead>
              <tbody>
                {bankBookData.records?.map((b, i) => (
                  <tr key={i}>
                    <td>{b.date}</td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{b.ref_no}</td>
                    <td style={{ fontWeight: 600 }}>{b.bank_name || 'HDFC Bank'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{b.utr_no || '-'}</td>
                    <td>{b.particulars}</td>
                    <td style={{ color: b.debit_inflow > 0 ? '#10b981' : '#94a3b8', fontWeight: b.debit_inflow > 0 ? 700 : 400 }}>
                      {b.debit_inflow > 0 ? `+₹${Number(b.debit_inflow).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ color: b.credit_outflow > 0 ? '#ef4444' : '#94a3b8', fontWeight: b.credit_outflow > 0 ? 700 : 400 }}>
                      {b.credit_outflow > 0 ? `-₹${Number(b.credit_outflow).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 27. Customer Due List */}
          {selectedReportId === 'customer_due' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Invoice #</th><th>Customer Name</th><th>Phone</th><th>Village</th><th>Vehicle</th><th>Total Amount</th><th>Paid Amount</th><th>Balance Due (₹)</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {masterData.customerDue?.map(cd => (
                  <tr key={cd.invoice_number}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{cd.invoice_number}</td>
                    <td style={{ fontWeight: 600 }}>{cd.customer_name}</td>
                    <td>{cd.customer_phone || '-'}</td>
                    <td>{cd.village}</td>
                    <td>{cd.vehicle_name}</td>
                    <td>₹{Number(cd.total_amount).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#10b981' }}>₹{Number(cd.paid_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 800, color: '#ef4444' }}>₹{Number(cd.balance_due).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-warning">{cd.due_date}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 28. GST Reports */}
          {selectedReportId === 'gst_reports' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Outward GST Collected</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    ₹{Number(masterData.gstReports?.totalOutwardGst || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Inward Input Tax Credit</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    ₹{Number(masterData.gstReports?.totalInwardGst || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Net GST Liability Payable</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                    ₹{Number(masterData.gstReports?.netGstPayable || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>GST Category / Classification</th><th>Estimated Taxable Turnover (₹)</th><th>Tax Amount (₹)</th></tr>
                </thead>
                <tbody>
                  {masterData.gstReports?.breakdown?.map((b, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{b.type}</td>
                      <td>₹{Math.round(b.taxable).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: b.type.includes('Outward') ? '#10b981' : '#38bdf8' }}>
                        ₹{Number(b.gst).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 29. Day Book */}
          {selectedReportId === 'day_book' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Date</th><th>Voucher #</th><th>Entity / Particulars</th><th>Category</th><th>Mode</th><th>Amount (₹)</th></tr>
              </thead>
              <tbody>
                {masterData.dayBook?.map((dbk, i) => (
                  <tr key={i}>
                    <td>{dbk.tx_date}</td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{dbk.ref_no}</td>
                    <td style={{ fontWeight: 600 }}>{dbk.entity}</td>
                    <td>{dbk.category}</td>
                    <td><span className={`badge ${dbk.mode === 'RECEIPT' ? 'badge-success' : 'badge-danger'}`}>{dbk.mode}</span></td>
                    <td style={{ fontWeight: 700 }}>₹{Number(dbk.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 30. Salesman-wise Reports (Sales Conversion) */}
          {selectedReportId === 'salesman_reports' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Sales Representative</th><th>Units Closed</th><th>Sales Turnover Realized (₹)</th><th>Performance Index</th></tr>
              </thead>
              <tbody>
                {masterData.salesmanSales?.map((sr, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{sr.salesman}</td>
                    <td style={{ fontWeight: 700 }}>{sr.units_sold} deals</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(sr.total_sales_value).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-success">Top Producer</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 31. Outstanding Reports */}
          {selectedReportId === 'outstanding_reports' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Customer Receivables</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                    ₹{Number(masterData.outstandingReports?.totalCustomerDue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Vendor Payables (Pending POs)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                    ₹{Number(masterData.outstandingReports?.totalVendorPayables || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Net Dealership Position</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    ₹{Number(masterData.outstandingReports?.netReceivable || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 32. Expenses Reports */}
          {selectedReportId === 'expenses_reports' && (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Overhead Expense Head</th><th>Total Vouchers</th><th>Total Spent (₹)</th><th>Disbursement Share</th></tr>
              </thead>
              <tbody>
                {masterData.expensesReports?.map((er, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{er.category}</td>
                    <td>{er.vouchers_count} vouchers</td>
                    <td style={{ fontWeight: 700, color: '#ef4444' }}>₹{Number(er.total_spent).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-warning">Tracked</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
}
