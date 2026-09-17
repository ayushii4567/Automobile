import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign, 
  Car, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Procurement({ 
  procurement = [], 
  onAddOrder, 
  onEditOrder, 
  onDeleteOrder,
  onUpdateStatus,
  onAddToInventory
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return procurement.filter(o => {
      const matchSearch = (
        (o.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.model || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.poNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.vin || '').toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [procurement, search, statusFilter]);

  // Financial & inventory analytics (No charts, pure metrics)
  const totalPurchaseValue = procurement.reduce((sum, o) => sum + Number(o.purchaseCost || 0), 0);
  const inTransitOrders = procurement.filter(o => o.status === 'In Transit');
  const orderedOrders = procurement.filter(o => o.status === 'Ordered');
  const deliveredOrders = procurement.filter(o => o.status === 'Delivered');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return <span className="badge badge-delivered">Delivered & Checked</span>;
      case 'In Transit':
        return <span className="badge badge-transit">In Transit / Shipping</span>;
      case 'Ordered':
        return <span className="badge badge-ordered">Ordered at Factory</span>;
      case 'Cancelled':
        return <span className="badge badge-expired">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      
      {/* Top Banner */}
      <div className="glass-card hover-elevate glow-accent" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Vehicle Procurement & Factory Orders
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
            Direct manufacturer allocations, transatlantic logistics, pre-delivery inspections (PDI), and wholesale inventory intake.
          </p>
        </div>

        <button onClick={onAddOrder} className="btn btn-primary" style={{ padding: '10px 18px' }}>
          <Plus size={16} />
          <span>New Factory Order</span>
        </button>
      </div>

      {/* KPI Cards (Zero charts) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Total Factory Orders"
          value={procurement.length}
          subtitle="All active procurement POs"
          icon={Truck}
          accent="blue"
        />
        <StatCard
          title="Procurement Capital"
          value={`₹${totalPurchaseValue.toLocaleString('en-IN')}`}
          subtitle="Wholesale factory commitments"
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          title="Units In Transit"
          value={inTransitOrders.length}
          subtitle="Air & maritime freight en-route"
          trend="Arriving this month"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Delivered & In Stock"
          value={deliveredOrders.length}
          subtitle="Successfully added to showroom"
          trend="PDI Cleared"
          icon={CheckCircle2}
          accent="purple"
        />
      </div>

      {/* Table Card */}
      <div className="glass-card" style={{ padding: '20px' }}>
        
        {/* Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search PO #, supplier, vehicle, VIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {['All', 'Ordered', 'In Transit', 'Delivered'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === st ? '#ef4444' : 'transparent',
                  color: statusFilter === st ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Manufacturer / Supplier</th>
                <th>Vehicle & Trim</th>
                <th>VIN / Chassis</th>
                <th>Wholesale Cost</th>
                <th>Target Retail</th>
                <th>Expected Delivery</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No vehicle procurement orders found matching filter. Click "+ New Factory Order" to initiate a purchase.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {order.poNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.supplier}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ordered: {order.orderDate}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ef4444' }}>
                        {order.brand} {order.model}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {order.year} • {order.exteriorColor || order.category}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#334155' }}>
                      <code>{order.vin || 'Pending Assignment'}</code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        ₹{Number(order.purchaseCost || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{Number(order.suggestedRetailPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                        {order.expectedDelivery}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(order.status)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Status Toggle Button: Ordered -> In Transit -> Delivered */}
                        {onUpdateStatus && order.status !== 'Delivered' && (
                          <button
                            onClick={() => {
                              const nextStatus = order.status === 'Ordered' ? 'In Transit' : 'Delivered';
                              onUpdateStatus(order.id, nextStatus);
                            }}
                            className="btn btn-secondary btn-sm"
                            title={`Advance Status to ${order.status === 'Ordered' ? 'In Transit' : 'Delivered'}`}
                            style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                          >
                            <span>➔ {order.status === 'Ordered' ? 'In Transit' : 'Delivered'}</span>
                          </button>
                        )}

                        {/* If Delivered, offer One-Click Add to Showroom Stock */}
                        {order.status === 'Delivered' && onAddToInventory && (
                          <button
                            onClick={() => onAddToInventory(order)}
                            className="btn btn-primary btn-sm"
                            title="Add vehicle to live showroom inventory"
                            style={{ padding: '5px 9px', background: '#16a34a', borderColor: '#16a34a', fontSize: '0.75rem' }}
                          >
                            <Car size={13} />
                            <span>Add to Fleet</span>
                          </button>
                        )}

                        {/* Edit */}
                        <button 
                          onClick={() => onEditOrder(order)}
                          className="btn btn-secondary btn-icon"
                          title="Edit Order Details"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Delete */}
                        <button 
                          onClick={() => onDeleteOrder(order.id)}
                          className="btn btn-secondary btn-icon"
                          title="Cancel / Delete Order"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
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
