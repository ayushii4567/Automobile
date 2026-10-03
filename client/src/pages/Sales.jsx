import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  FileText, 
  Trash2,
  CreditCard,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react';

export default function Sales({ 
  sales = [], 
  onAddSale, 
  onDeleteSale, 
  onViewInvoice,
  onRecordPayment
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = 
      `${s.invoiceNo || s.invoice_number || ''} ${s.saleOrderNumber || s.sale_order_number || ''} ${s.customerName || s.customer_name || ''} ${s.vehicleName || s.vehicle_name || ''} ${s.vin || ''}`
        .toLowerCase()
        .includes(q);
    
    if (!matchSearch) return false;
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Paid') return (s.balanceDue ?? s.balance_due) <= 0;
    if (statusFilter === 'Pending') return (s.balanceDue ?? s.balance_due) > 0;
    return s.status === statusFilter || s.invoiceStatus === statusFilter;
  });

  const totalGross = sales.reduce((sum, s) => sum + Number(s.totalAmount || s.total_amount || 0), 0);
  const totalCollected = sales.reduce((sum, s) => sum + Number(s.paidAmount || s.paid_amount || 0), 0);
  const totalOutstanding = sales.reduce((sum, s) => sum + Math.max(0, Number(s.balanceDue ?? s.balance_due ?? (Number(s.totalAmount || 0) - Number(s.paidAmount || 0)))), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sales Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Total Contracted Sales
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            ₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px' }}>
            {sales.length} Deals closed
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Total Inflow Collected
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
            ₹{totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Realized cash & loan receipts
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Outstanding Balance Due
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: totalOutstanding > 0 ? '#f97316' : '#22c55e', marginTop: '4px' }}>
            ₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Pending customer collections
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
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search SO#, invoice, customer, VIN..."
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
              style={{ flex: '0 1 150px', minWidth: '130px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Fully Paid</option>
              <option value="Pending">Pending Balance</option>
              <option value="Booked">Order Booked</option>
              <option value="Processing">In Processing</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <button onClick={onAddSale} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem', flexShrink: 0 }}>
            <Plus size={15} />
            <span>Create New Sale</span>
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto', maxWidth: '100%' }}>
        <div className="data-table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order & Invoice #</th>
                <th>Customer</th>
                <th>Vehicle & VIN</th>
                <th>Total Value</th>
                <th>Paid / Balance</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '35px', color: '#64748b' }}>
                    No sales orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => {
                  const total = Number(sale.totalAmount || sale.total_amount || 0);
                  const paid = Number(sale.paidAmount || sale.paid_amount || 0);
                  const balance = Number(sale.balanceDue ?? sale.balance_due ?? (total - paid));
                  const isPaid = balance <= 0.01;
                  const isPartiallyPaid = paid > 0 && balance > 0.01;

                  return (
                    <tr key={sale.id}>
                      <td>
                        <div 
                          onClick={() => onViewInvoice(sale)}
                          style={{
                            fontWeight: 700,
                            color: '#38bdf8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <FileText size={14} />
                          <span>{sale.invoiceNo || sale.invoice_number || 'INV'}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          SO: {sale.saleOrderNumber || sale.sale_order_number} • {sale.saleDate || sale.booking_date}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {sale.customerName || sale.customer_name}
                        </div>
                        {sale.customerPhone && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {sale.customerPhone}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ color: '#f8fafc', fontWeight: 500 }}>
                          {sale.vehicleName || sale.vehicle_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {sale.vin || 'VIN-TBD'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>
                          ₹{total.toLocaleString('en-IN')}
                        </div>
                        {Number(sale.discount || 0) > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>
                            Disc: -₹{Number(sale.discount).toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 700 }}>
                          Paid: ₹{paid.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: balance <= 0 ? '#94a3b8' : '#f97316', fontWeight: 600 }}>
                          Due: ₹{balance.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${isPaid ? 'status-delivered' : isPartiallyPaid ? 'status-pending' : 'status-lost'}`} style={{ fontSize: '0.72rem' }}>
                          {isPaid ? 'Paid In Full' : isPartiallyPaid ? 'Partially Paid' : 'Unpaid / Issued'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                          {sale.status || 'Booked'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button 
                            onClick={() => onViewInvoice(sale)} 
                            className="btn btn-secondary btn-sm"
                            title="View Formal Bill of Sale & Invoice"
                          >
                            <Eye size={13} />
                            <span>Invoice</span>
                          </button>

                          {balance > 0 && onRecordPayment && (
                            <button
                              onClick={() => onRecordPayment(sale)}
                              className="btn btn-primary btn-sm"
                              style={{ background: '#16a34a', borderColor: '#16a34a' }}
                              title="Record Customer Payment"
                            >
                              <CreditCard size={13} />
                              <span>Pay</span>
                            </button>
                          )}

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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
