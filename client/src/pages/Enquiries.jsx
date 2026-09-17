import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Phone, Mail, Car, ArrowRight, MessageSquare } from 'lucide-react';

const STATUS_COLORS = {
  'New':       { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Follow-up': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Converted': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Cold':      { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
};

const SOURCE_ICONS = {
  'Walk-in': '🚪', 'Phone Call': '📞', 'Website': '🌐', 'Referral': '👥', 'Social Media': '📱',
};

export default function Enquiries({ enquiries = [], onAddEnquiry, onEditEnquiry, onDeleteEnquiry, onConvertTestDrive, searchQuery = '' }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const query = (searchQuery || localSearch).toLowerCase();
  const filtered = enquiries.filter(e => {
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchSearch = !query || e.customerName?.toLowerCase().includes(query) || e.vehicleInterest?.toLowerCase().includes(query) || e.phone?.includes(query);
    return matchStatus && matchSearch;
  });

  const counts = { All: enquiries.length };
  ['New', 'Follow-up', 'Converted', 'Cold'].forEach(s => { counts[s] = enquiries.filter(e => e.status === s).length; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Enquiries & Leads</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>Track walk-in, phone and online leads with follow-up reminders.</p>
        </div>
        <button onClick={onAddEnquiry} className="btn btn-primary">
          <Plus size={15} /> New Enquiry
        </button>
      </div>

      {/* Stats Row */}
      <div className="responsive-kpi-grid">
        {[
          { label: 'New Leads', key: 'New', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Follow-up', key: 'Follow-up', color: '#d97706', bg: '#fffbeb' },
          { label: 'Converted', key: 'Converted', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Cold', key: 'Cold', color: '#64748b', bg: '#f1f5f9' },
        ].map(({ label, key, color, bg }) => (
          <div key={key} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: statusFilter === key ? `2px solid ${color}` : '1px solid #e5e7eb' }}
            onClick={() => setStatusFilter(statusFilter === key ? 'All' : key)}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{counts[key]}</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} color={color} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 160px', minWidth: '140px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input className="form-input" placeholder="Search name, vehicle, phone..."
            value={localSearch} onChange={e => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px' }} />
        </div>
        <div className="filter-chip-row">
          {['All', 'New', 'Follow-up', 'Converted', 'Cold'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: statusFilter === s ? '#ef4444' : '#f8fafc',
                color: statusFilter === s ? '#fff' : '#475569',
                borderColor: statusFilter === s ? '#ef4444' : '#e5e7eb',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>{s} {s !== 'All' && <span>({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="glass-card" style={{ padding: '0' }}>
        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: '12px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle Interest</th>
                <th>Source</th>
                <th>Follow-up Date</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No enquiries found.</td></tr>
              ) : filtered.map(enq => {
                const sc = STATUS_COLORS[enq.status] || STATUS_COLORS['New'];
                return (
                  <tr key={enq.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{enq.customerName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <Phone size={11} color="#94a3b8" />
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{enq.phone}</span>
                      </div>
                      {enq.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Mail size={11} color="#94a3b8" />
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{enq.email}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Car size={14} color="#ef4444" />
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{enq.vehicleInterest || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{SOURCE_ICONS[enq.source] || '📋'} {enq.source}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: enq.followUpDate && new Date(enq.followUpDate) < new Date() && enq.status !== 'Converted' ? '#ef4444' : '#475569', fontWeight: 500 }}>
                        {enq.followUpDate || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {enq.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '160px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enq.notes || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => onEditEnquiry(enq)} className="btn btn-secondary btn-sm btn-icon" title="Edit">
                          <Edit2 size={13} />
                        </button>
                        {enq.status !== 'Converted' && (
                          <button onClick={() => onConvertTestDrive && onConvertTestDrive(enq)} className="btn btn-secondary btn-sm" title="Convert to Test Drive" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                            <ArrowRight size={12} /> Drive
                          </button>
                        )}
                        <button onClick={() => onDeleteEnquiry(enq.id)} className="btn btn-danger btn-sm btn-icon" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
