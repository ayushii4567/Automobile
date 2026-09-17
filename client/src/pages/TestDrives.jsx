import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Search, 
  User, 
  Phone, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Trash2 
} from 'lucide-react';

export default function TestDrives({ 
  testdrives = [], 
  onAddTestDrive, 
  onUpdateStatus, 
  onDeleteTestDrive 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = testdrives.filter(td => {
    const matchSearch = 
      `${td.customerName} ${td.vehicleName} ${td.assignedStaff || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || td.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const scheduledCount = testdrives.filter(t => t.status === 'Scheduled').length;
  const completedCount = testdrives.filter(t => t.status === 'Completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Scheduled Drives
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            {scheduledCount} Upcoming
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Pending appointments
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Completed Drives
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
            {completedCount} Completed
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Concluded sessions
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search drive by client, car, staff..."
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
              style={{ width: '140px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button onClick={onAddTestDrive} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem' }}>
            <Plus size={15} />
            <span>Book Test Drive</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
        gap: '18px'
      }}>
        {filtered.map((td) => (
          <div 
            key={td.id}
            className="glass-card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #bfdbfe'
              }}>
                <Calendar size={13} />
                <span>{td.date}</span>
                <span>•</span>
                <Clock size={13} />
                <span>{td.timeSlot}</span>
              </div>

              <span className={`badge ${td.status === 'Completed' ? 'badge-available' : td.status === 'Scheduled' ? 'badge-blue' : 'badge-sold'}`}>
                {td.status}
              </span>
            </div>

            {/* Car Name */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Vehicle
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                {td.vehicleName}
              </h3>
            </div>

            {/* Client Info */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.78rem',
              color: '#475569'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} color="#2563eb" />
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{td.customerName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} color="#64748b" />
                <span>{td.customerPhone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} color="#16a34a" />
                <span>DL: {td.drivingLicense || 'Verified on file'}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '14px' }}>
              Assigned Staff: <strong style={{ color: '#334155' }}>{td.assignedStaff || 'Julian Vance'}</strong>
              {td.notes && (
                <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: '3px' }}>
                  "{td.notes}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9'
            }}>
              <button 
                onClick={() => onDeleteTestDrive(td.id)} 
                className="btn btn-danger btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                {td.status === 'Scheduled' && (
                  <>
                    <button 
                      onClick={() => onUpdateStatus(td.id, 'Completed')} 
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle2 size={13} />
                      <span>Complete</span>
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(td.id, 'Cancelled')} 
                      className="btn btn-secondary btn-sm"
                    >
                      <XCircle size={13} />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
                {td.status === 'Completed' && (
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                    Drive Completed ✓
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
