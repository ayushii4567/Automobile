import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Gauge, 
  Fuel, 
  Zap, 
  Calendar, 
  Edit2, 
  Trash2, 
  DollarSign, 
  CalendarClock,
  Car,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function Inventory({ 
  vehicles = [], 
  onAddVehicle, 
  onEditVehicle, 
  onDeleteVehicle,
  onSellVehicle,
  onBookTestDrive 
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [sortBy, setSortBy] = useState('price-desc');

  const brands = useMemo(() => {
    return ['All', ...new Set(vehicles.map(v => v.brand).filter(Boolean))];
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = 
        `${v.brand} ${v.model} ${v.vin || ''} ${v.category || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      
      const matchBrand = selectedBrand === 'All' || v.brand === selectedBrand;
      const matchStatus = selectedStatus === 'All' || v.status === selectedStatus;
      const matchFuel = selectedFuel === 'All' || v.fuel?.toLowerCase().includes(selectedFuel.toLowerCase());

      return matchSearch && matchBrand && matchStatus && matchFuel;
    }).sort((a, b) => {
      if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
      if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'hp-desc') return (Number(b.horsepower) || 0) - (Number(a.horsepower) || 0);
      if (sortBy === 'year-desc') return Number(b.year) - Number(a.year);
      return 0;
    });
  }, [vehicles, search, selectedBrand, selectedStatus, selectedFuel, sortBy]);

  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const reservedCount = vehicles.filter(v => v.status === 'Reserved').length;
  const soldCount = vehicles.filter(v => v.status === 'Sold').length;
  const totalValuation = vehicles.reduce((sum, v) => sum + (Number(v.price) * (Number(v.stock) || 1)), 0);

  const getBadgeClass = (status) => {
    if (status === 'Available') return 'badge-available';
    if (status === 'Reserved') return 'badge-reserved';
    return 'badge-sold';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Inventory Summary Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Car size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Cars</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{vehicles.length} Units</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <CheckCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>In Stock</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>{availableCount} Available</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reserved</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>{reservedCount} Units</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7e22ce' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock Valuation</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>₹{(totalValuation / 100000).toFixed(1)} Lakhs</div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Left search & filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search car, VIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Brand Dropdown */}
            <select 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="form-select"
              style={{ width: '140px', height: '36px', fontSize: '0.85rem' }}
            >
              {brands.map(b => (
                <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select"
              style={{ width: '130px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>

            {/* Sort Dropdown */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ width: '150px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="hp-desc">Highest Horsepower</option>
              <option value="year-desc">Newest Year</option>
            </select>
          </div>

          {/* Right Buttons: Grid/Table toggle & Add Vehicle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                  border: 'none',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                }}
                title="Card View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  border: 'none',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                }}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>

            <button onClick={onAddVehicle} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem' }}>
              <Plus size={15} />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table Display */}
      {filteredVehicles.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
            No Vehicles Found
          </div>
          <p style={{ fontSize: '0.82rem' }}>
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '20px'
        }}>
          {filteredVehicles.map(vehicle => (
            <div 
              key={vehicle.id} 
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Photo */}
              <div style={{
                position: 'relative',
                height: '180px',
                width: '100%',
                background: '#e2e8f0',
                overflow: 'hidden'
              }}>
                <img
                  src={vehicle.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* Status Badge */}
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <span className={`badge ${getBadgeClass(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>

                {/* Category Pill */}
                <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 7px',
                    borderRadius: '4px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    color: '#ffffff'
                  }}>
                    {vehicle.category}
                  </span>
                </div>
              </div>

              {/* Details Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {vehicle.brand} • {vehicle.year}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {vehicle.model}
                    </h3>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2563eb' }}>
                    ₹{Number(vehicle.price).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Specs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  margin: '12px 0',
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  fontSize: '0.75rem',
                  color: '#475569'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Gauge size={13} color="#2563eb" />
                    <span>{vehicle.horsepower || '400+'} HP</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Fuel size={13} color="#d97706" />
                    <span>{vehicle.fuel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Zap size={13} color="#16a34a" />
                    <span>{vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString('en-IN')} km` : 'New'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} color="#7e22ce" />
                    <span>Stock: {vehicle.stock || 1}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '14px' }}>
                  VIN: {vehicle.vin}
                </div>

                {/* Actions */}
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => onEditVehicle(vehicle)} 
                      className="btn btn-secondary btn-icon"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => onDeleteVehicle(vehicle.id)} 
                      className="btn btn-danger btn-icon"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => onBookTestDrive(vehicle)} 
                      className="btn btn-secondary btn-sm"
                    >
                      <CalendarClock size={13} />
                      <span>Drive</span>
                    </button>
                    {vehicle.status !== 'Sold' && (
                      <button 
                        onClick={() => onSellVehicle(vehicle)} 
                        className="btn btn-primary btn-sm"
                      >
                        <DollarSign size={13} />
                        <span>Sell</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type & Year</th>
                  <th>Specifications</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={vehicle.image}
                          alt={vehicle.model}
                          style={{ width: '48px', height: '34px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {vehicle.vin}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{vehicle.year}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{vehicle.category}</div>
                    </td>
                    <td>
                      <div style={{ color: '#0f172a', fontWeight: 500 }}>{vehicle.horsepower} HP</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{vehicle.fuel} • {vehicle.transmission}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>
                      ₹{Number(vehicle.price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: '#0f172a', fontWeight: 500 }}>
                      {vehicle.stock}
                    </td>
                    <td>
                      <span className={`badge ${getBadgeClass(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => onEditVehicle(vehicle)} className="btn btn-secondary btn-icon" style={{ width: '28px', height: '28px' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => onDeleteVehicle(vehicle.id)} className="btn btn-danger btn-icon" style={{ width: '28px', height: '28px' }}>
                          <Trash2 size={12} />
                        </button>
                        {vehicle.status !== 'Sold' && (
                          <button onClick={() => onSellVehicle(vehicle)} className="btn btn-primary btn-sm" style={{ padding: '3px 8px' }}>
                            Sell
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
