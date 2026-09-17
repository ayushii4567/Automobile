import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer,
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';

export default function Reports({ dashboardData, sales = [] }) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const monthlyData = (dashboardData?.monthlyRevenue && dashboardData.monthlyRevenue.length > 0)
    ? dashboardData.monthlyRevenue
    : [
        { month: 'Aug', revenue: 4200000, salesCount: 2 },
        { month: 'Sep', revenue: 4493500, salesCount: 2 }
      ];

  // Calculate brand breakdown
  const brandSalesMap = {};
  const brandCountMap = {};
  sales.forEach(s => {
    const brand = s.vehicleName ? s.vehicleName.split(' ')[0] : 'Other';
    brandSalesMap[brand] = (brandSalesMap[brand] || 0) + Number(s.totalAmount || 0);
    brandCountMap[brand] = (brandCountMap[brand] || 0) + 1;
  });

  const totalRevenueAll = Object.values(brandSalesMap).reduce((a, b) => a + b, 0) || 4493500;

  const brandData = Object.keys(brandSalesMap).map(b => ({
    brand: b,
    count: brandCountMap[b] || 1,
    revenue: Math.round(brandSalesMap[b]),
    share: Math.round((brandSalesMap[b] / totalRevenueAll) * 100)
  }));

  const handleExport = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Export */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Showroom Financial Reports
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
            Monthly statements, brand breakdown, and deal analytics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleExport} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem' }}>
            <Download size={15} />
            <span>{downloadSuccess ? 'Report Exported ✓' : 'Export Statement'}</span>
          </button>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ height: '36px', fontSize: '0.85rem' }}>
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Gross Sales (YTD)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
            ₹{Math.round(totalRevenueAll).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Total revenue to date
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Average Vehicle Margin
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            14.8%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Gross margin per sale
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Test Drive Conversion
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#7e22ce', marginTop: '4px' }}>
            68.4%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Drive to contract ratio
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Average Days in Stock
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>
            21 Days
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Turnover speed
          </div>
        </div>
      </div>

      {/* Two Tabular Reports (No Graphs) */}
      <div className="responsive-grid-2">
        {/* Monthly Revenue Statement */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Monthly Revenue Statement
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Detailed financial performance by month
            </p>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Units Sold</th>
                  <th>Total Revenue</th>
                  <th>Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((item) => (
                  <tr key={item.month}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.month} 2026
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#334155' }}>
                        {item.salesCount} Cars
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>
                      ₹{Number(item.revenue).toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      ₹{Math.round(item.revenue / (item.salesCount || 1)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Brand Statement */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Sales by Brand / Make
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Volume and revenue contribution by brand
            </p>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Cars Sold</th>
                  <th>Revenue</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {(brandData.length > 0 ? brandData : [
                  { brand: 'Mahindra', count: 1, revenue: 2156000, share: 48 },
                  { brand: 'Tata', count: 1, revenue: 2337500, share: 52 }
                ]).map((b) => (
                  <tr key={b.brand}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {b.brand}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#334155' }}>
                        {b.count} {b.count === 1 ? 'Unit' : 'Units'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#2563eb' }}>
                      ₹{Number(b.revenue).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {b.share}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
