import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Trash2, 
  Edit2
} from 'lucide-react';

export default function Staff({ 
  staff = [], 
  onAddStaff, 
  onEditStaff, 
  onDeleteStaff 
}) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const departments = ['All', ...new Set(staff.map(s => s.department).filter(Boolean))];

  const filtered = staff.filter(s => {
    const matchSearch = 
      `${s.name} ${s.role} ${s.department} ${s.email}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '150px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search staff by name, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="form-select"
              style={{ flex: '1 1 150px', minWidth: '130px', height: '36px', fontSize: '0.85rem' }}
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>

          <button onClick={onAddStaff} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem', flexShrink: 0 }}>
            <Plus size={15} />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="responsive-card-grid">
        {filtered.map((member) => (
          <div 
            key={member.id}
            className="glass-card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header: Avatar & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <img
                src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={member.name}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #e2e8f0'
                }}
              />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                  {member.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 500, marginTop: '1px' }}>
                  {member.role}
                </div>
              </div>
            </div>

            {/* Department Pill */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 500,
                color: '#475569',
                background: '#f1f5f9',
                padding: '3px 8px',
                borderRadius: '4px'
              }}>
                {member.department}
              </span>
            </div>

            {/* Performance */}
            {member.revenueGenerated > 0 && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Deals Closed
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                    {member.salesClosed}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Revenue
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16a34a', marginTop: '1px' }}>
                    ₹{(member.revenueGenerated / 100000).toFixed(1)} Lakhs
                  </div>
                </div>
              </div>
            )}

            {/* Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem', color: '#475569', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} color="#94a3b8" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} color="#94a3b8" />
                <span>{member.phone}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '6px',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9'
            }}>
              <button 
                onClick={() => onEditStaff(member)} 
                className="btn btn-secondary btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Edit"
              >
                <Edit2 size={12} />
              </button>
              <button 
                onClick={() => onDeleteStaff(member.id)} 
                className="btn btn-danger btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
