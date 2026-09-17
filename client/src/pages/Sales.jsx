import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  FileText, 
  Trash2,
  CreditCard
} from 'lucide-react';

export default function Sales({ 
  sales = [], 
  onAddSale, 
  onDeleteSale, 
  onViewInvoice 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = sales.filter(s => {
    const matchSearch = 
      `${s.invoiceNo} ${s.customerName} ${s.vehicleName} ${s.salesAgent || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalGross = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const avgDeal = sales.length > 0 ? totalGross / sales.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sales Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Total Sales Revenue
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
            ₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            {sales.length} Deals closed
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Average Deal Size
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            ₹{avgDeal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Per vehicle invoice
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Delivered Vehicles
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            {sales.filter(s => s.status === 'Delivered').length} Units
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Completed handovers
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <div style={{ position: 'relative', flex: '1 1 160px', minWidth: '140px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search invoice, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ flex: '0 1 140px', minWidth: '120px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="All">All Invoices</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <button onClick={onAddSale} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem', flexShrink: 0 }}>
            <Plus size={15} />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Vehicle & VIN</th>
                <th>Total Price</th>
                <th>Payment Mode</th>
                <th>Sales Rep</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <div 
                        onClick={() => onViewInvoice(sale)}
                        style={{
                          fontWeight: 600,
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <FileText size={14} />
                        <span>{sale.invoiceNo}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {sale.saleDate}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {sale.customerName}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: '#0f172a', fontWeight: 500 }}>
                        {sale.vehicleName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {sale.vin}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.92rem' }}>
                        ₹{Number(sale.totalAmount).toLocaleString('en-IN')}
                      </div>
                      {Number(sale.discount || 0) > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                          Disc: -₹{Number(sale.discount).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.75rem',
                        color: '#475569',
                        background: '#f8fafc',
                        padding: '3px 7px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <CreditCard size={12} color="#2563eb" />
                        <span>{sale.paymentMethod || 'Wire Transfer'}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {sale.salesAgent || 'Julian Vance'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${sale.status === 'Delivered' ? 'badge-available' : sale.status === 'Confirmed' ? 'badge-blue' : 'badge-reserved'}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          onClick={() => onViewInvoice(sale)} 
                          className="btn btn-secondary btn-sm"
                          title="View Bill of Sale"
                        >
                          <Eye size={13} />
                          <span>Invoice</span>
                        </button>
                        <button 
                          onClick={() => onDeleteSale(sale.id)} 
                          className="btn btn-danger btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="Delete Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
