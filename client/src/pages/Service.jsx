import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function Service({ 
  services = [], 
  onAddService, 
  onUpdateStatus, 
  onDeleteService 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = services.filter(s => {
    const matchSearch = 
      `${s.ticketNo} ${s.customerName} ${s.vehicleModel} ${s.serviceType} ${s.technician || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const inProgressCount = services.filter(s => s.status === 'In Progress').length;
  const waitingCount = services.filter(s => s.status === 'Waiting on Parts').length;
  const totalCost = services.reduce((sum, s) => sum + Number(s.estimatedCost || 0), 0);

  const getStatusBadge = (status) => {
    if (status === 'Completed') return 'badge badge-available';
    if (status === 'Waiting on Parts') return 'badge badge-reserved';
    return 'badge badge-blue';
  };

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
            Active Jobs
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            {inProgressCount} In Workshop
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Undergoing service
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Awaiting Parts
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>
            {waitingCount} Tickets
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            OEM parts shipment pending
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Service Billings
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
            ₹{totalCost.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Estimated maintenance costs
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
                placeholder="Search ticket, customer, car..."
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
              style={{ flex: '0 1 150px', minWidth: '120px', height: '36px', fontSize: '0.85rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on Parts">Waiting on Parts</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <button onClick={onAddService} className="btn btn-primary" style={{ height: '36px', fontSize: '0.85rem', flexShrink: 0 }}>
            <Plus size={15} />
            <span>Open Service Ticket</span>
          </button>
        </div>
      </div>

      {/* Service Tickets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
        gap: '18px'
      }}>
        {filtered.map((srv) => (
          <div 
            key={srv.id}
            className="glass-card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.88rem' }}>
                  {srv.ticketNo}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {srv.date}
                </span>
              </div>

              <span className={getStatusBadge(srv.status)}>
                {srv.status}
              </span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {srv.vehicleModel}
              </h3>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', marginTop: '1px' }}>
                VIN: {srv.vin || 'On file'}
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Job Description
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                {srv.serviceType}
              </div>
              {srv.notes && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                  "{srv.notes}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '14px' }}>
              <div>
                <span>Customer: </span>
                <strong style={{ color: '#0f172a' }}>{srv.customerName}</strong>
              </div>
              <div>
                <span>Cost: </span>
                <strong style={{ color: '#16a34a' }}>₹{Number(srv.estimatedCost || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '14px' }}>
              Technician: <strong style={{ color: '#0f172a' }}>{srv.technician}</strong>
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
                onClick={() => onDeleteService(srv.id)} 
                className="btn btn-danger btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Delete Ticket"
              >
                <Trash2 size={12} />
              </button>

              <div style={{ display: 'flex', gap: '5px' }}>
                {srv.status !== 'Completed' ? (
                  <>
                    <button 
                      onClick={() => onUpdateStatus(srv.id, 'Completed')} 
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle2 size={12} />
                      <span>Done</span>
                    </button>
                    {srv.status !== 'Waiting on Parts' && (
                      <button 
                        onClick={() => onUpdateStatus(srv.id, 'Waiting on Parts')} 
                        className="btn btn-secondary btn-sm"
                      >
                        Wait Parts
                      </button>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                    Completed ✓
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
