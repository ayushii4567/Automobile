import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  Layers, 
  CheckCircle2,
  MinusCircle,
  PlusCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Parts({ 
  parts = [], 
  onAddPart, 
  onEditPart, 
  onDeletePart,
  onUpdateStock
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Maintenance', 'Braking', 'Exterior & Aero', 'Exhaust & Engine', 'Wheels & Tires', 'Electronics'];

  // Filtered parts
  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchSearch = (
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.partNo || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.compatibleModel || '').toLowerCase().includes(search.toLowerCase())
      );
      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [parts, search, categoryFilter]);

  // Inventory stats (No charts, pure metrics)
  const totalStockUnits = parts.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const totalAssetValue = parts.reduce((sum, p) => sum + (Number(p.unitCost || 0) * Number(p.stock || 0)), 0);
  const lowStockItems = parts.filter(p => Number(p.stock) <= Number(p.minStock || 3));

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
            Spare Parts & Accessories Inventory
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
            Manage OEM genuine components, high-performance tuning accessories, and workshop maintenance supplies.
          </p>
        </div>

        <button onClick={onAddPart} className="btn btn-primary" style={{ padding: '10px 18px' }}>
          <Plus size={16} />
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* KPI Cards (Zero charts) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Total Catalog SKUs"
          value={parts.length}
          subtitle="Registered component types"
          icon={Package}
          accent="blue"
        />
        <StatCard
          title="Total Units in Stock"
          value={totalStockUnits}
          subtitle="Physical inventory count"
          icon={Layers}
          accent="emerald"
        />
        <StatCard
          title="Inventory Cost Value"
          value={`₹${totalAssetValue.toLocaleString('en-IN')}`}
          subtitle="Capital tied in spare parts"
          icon={DollarSign}
          accent="purple"
        />
        <StatCard
          title="Low Stock Reorder Items"
          value={lowStockItems.length}
          subtitle="At or below minimum threshold"
          trend={lowStockItems.length > 0 ? "Action Required" : "Optimal"}
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }} className="animate-fade-in">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={18} color="#be123c" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#9f1239' }}>
              Reorder Warning: {lowStockItems.length} spare part(s) running low on inventory
            </div>
            <div style={{ fontSize: '0.8rem', color: '#be123c', marginTop: '2px' }}>
              {lowStockItems.map(p => `${p.name} (${p.stock} left)`).join(' • ')}
            </div>
          </div>
        </div>
      )}

      {/* Parts Table Card */}
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
              placeholder="Search by part #, name, car model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: categoryFilter === cat ? '#ef4444' : 'transparent',
                  color: categoryFilter === cat ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Part SKU</th>
                <th>Description & Category</th>
                <th>Compatible Vehicles</th>
                <th>Stock Level</th>
                <th>Unit Cost</th>
                <th>Selling Price</th>
                <th>Supplier & Shelf</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No spare parts found matching current filters. Click "+ Add Spare Part" to add new inventory.
                  </td>
                </tr>
              ) : (
                filteredParts.map((p) => {
                  const isLow = Number(p.stock) <= Number(p.minStock || 3);
                  const isOut = Number(p.stock) <= 0;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        <code>{p.partNo}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 600 }}>{p.category}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {p.compatibleModel}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: isOut ? '#b91c1c' : isLow ? '#d97706' : '#15803d'
                          }}>
                            {p.stock}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            (Min: {p.minStock})
                          </span>
                          {isOut ? (
                            <span className="badge badge-sold">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge badge-lowstock">Low Stock</span>
                          ) : (
                            <span className="badge badge-available">In Stock</span>
                          )}
                        </div>
                      </td>
                      <td>
                        ₹{Number(p.unitCost || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>
                          ₹{Number(p.sellingPrice || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#334155' }}>{p.supplier || 'OEM Direct'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.location || 'Warehouse'}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Quick Adjust buttons */}
                          {onUpdateStock && (
                            <>
                              <button
                                onClick={() => onUpdateStock(p.id, Math.max(0, Number(p.stock) - 1))}
                                className="btn btn-secondary btn-icon"
                                title="Decrease Stock by 1"
                                style={{ padding: '4px' }}
                              >
                                <MinusCircle size={14} />
                              </button>
                              <button
                                onClick={() => onUpdateStock(p.id, Number(p.stock) + 1)}
                                className="btn btn-secondary btn-icon"
                                title="Increase Stock by 1"
                                style={{ padding: '4px' }}
                              >
                                <PlusCircle size={14} />
                              </button>
                            </>
                          )}

                          {/* Edit */}
                          <button 
                            onClick={() => onEditPart(p)}
                            className="btn btn-secondary btn-icon"
                            title="Edit Part Details"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete */}
                          <button 
                            onClick={() => onDeletePart(p.id)}
                            className="btn btn-secondary btn-icon"
                            title="Remove from Inventory"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
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
