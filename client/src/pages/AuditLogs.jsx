import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  User, 
  Layers, 
  Filter, 
  Key, 
  FileText 
} from 'lucide-react';

export default function AuditLogs({ auditLogs = [] }) {
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');

  const filtered = auditLogs.filter(log => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (log.description || '').toLowerCase().includes(s) ||
      (log.userName || '').toLowerCase().includes(s) ||
      (log.action || '').toLowerCase().includes(s) ||
      (log.module || '').toLowerCase().includes(s)
    );
    const matchesMod = filterModule === 'ALL' || log.module === filterModule;
    const matchesAct = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesMod && matchesAct;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <span className="status-badge status-delivered">CREATE</span>;
      case 'UPDATE':
        return <span className="status-badge status-processing">UPDATE</span>;
      case 'DELETE':
        return <span className="status-badge status-pending">DELETE</span>;
      case 'LOGIN':
        return <span className="status-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>LOGIN</span>;
      default:
        return <span className="status-badge status-processing">{action}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total System Events</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Layers size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {auditLogs.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Tamper-proof audit entries logged
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Modifications / Edits</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', marginTop: '8px' }}>
            {auditLogs.filter(l => l.action === 'UPDATE').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Record status & value adjustments
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Deletions Recorded</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '8px' }}>
            {auditLogs.filter(l => l.action === 'DELETE').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Protected records purged
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card control-bar" style={{ padding: '16px 20px', gap: '14px' }}>
        <div className="control-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px', minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px', minWidth: '160px', flex: '1 1 180px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search audit trail by description or user..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(act => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`filter-btn ${filterAction === act ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="glass-card data-table-wrapper table-container" style={{ padding: '0px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Module</th>
              <th>Operated By</th>
              <th>User Role</th>
              <th>Description / Payload Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No security audit records match your query.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    {getActionBadge(log.action)}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.82rem' }}>
                      {log.module}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{log.userName}</div>
                  </td>
                  <td>
                    <span className="status-badge" style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                      {log.userRole}
                    </span>
                  </td>
                  <td>
                    <div style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>
                      {log.description}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
