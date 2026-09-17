import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  Edit2, 
  Trash2, 
  CalendarClock 
} from 'lucide-react';

export default function Customers({ 
  customers = [], 
  onAddCustomer, 
  onEditCustomer, 
  onDeleteCustomer,
  onBookTestDrive 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = customers.filter(c => {
    const matchSearch = 
      `${c.name} ${c.email} ${c.phone} ${c.interestedVehicle || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'VIP') return 'badge badge-vip';
    if (status === 'Active Buyer') return 'badge badge-available';
    if (status === 'Hot Lead') return 'badge badge-blue';
    return 'badge badge-purple';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search and Action Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search customers by name, phone..."
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
              style={{ width: '150px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="All">All Customers</option>
              <option value="VIP">VIP</option>
              <option value="Active Buyer">Active Buyer</option>
              <option value="Hot Lead">Hot Lead</option>
              <option value="Warm Lead">Warm Lead</option>
            </select>
          </div>

          <button onClick={onAddCustomer} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem' }}>
            <Plus size={15} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
        gap: '20px'
      }}>
        {filtered.map((customer) => (
          <div 
            key={customer.id} 
            className="glass-card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                    {customer.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.75rem', marginTop: '1px' }}>
                    <MapPin size={12} />
                    <span>{customer.city || 'Verified Location'}</span>
                  </div>
                </div>
              </div>

              <span className={getStatusBadge(customer.status)}>
                {customer.status}
              </span>
            </div>

            {/* Inquiry & Budget */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Interested In
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2563eb', marginTop: '2px' }}>
                {customer.interestedVehicle || 'General Inquiry'}
              </div>
              {customer.budget && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Budget: <strong style={{ color: '#16a34a' }}>₹{Number(customer.budget).toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem', color: '#475569', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} color="#94a3b8" />
                <span>{customer.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} color="#94a3b8" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {customer.email}
                </span>
              </div>
            </div>

            {customer.notes && (
              <p style={{
                fontSize: '0.75rem',
                color: '#64748b',
                background: '#f8fafc',
                padding: '6px 8px',
                borderRadius: '4px',
                marginBottom: '14px',
                lineHeight: 1.4
              }}>
                "{customer.notes}"
              </p>
            )}

            {/* Footer buttons */}
            <div style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  onClick={() => onEditCustomer(customer)} 
                  className="btn btn-secondary btn-icon"
                  style={{ width: '28px', height: '28px' }}
                  title="Edit"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => onDeleteCustomer(customer.id)} 
                  className="btn btn-danger btn-icon"
                  style={{ width: '28px', height: '28px' }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <button 
                onClick={() => onBookTestDrive({ customerName: customer.name, customerPhone: customer.phone, interestedVehicle: customer.interestedVehicle })} 
                className="btn btn-secondary btn-sm"
              >
                <CalendarClock size={12} />
                <span>Test Drive</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
