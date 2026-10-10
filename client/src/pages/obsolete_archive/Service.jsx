import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash2,
  CheckCircle2,
  Package,
  Clock,
  History,
  AlertTriangle,
  User,
  Car,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Service({ 
  services = [], 
  parts = [],
  customers = [],
  vehicles = [],
  onAddService, 
  onUpdateStatus, 
  onDeleteService,
  onAllocateParts
}) {
  const [activeSubTab, setActiveSubTab] = useState('tickets'); // 'tickets' | 'history'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Allocate Parts Modal
  const [selectedTicketForParts, setSelectedTicketForParts] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);
  const [allocating, setAllocating] = useState(false);

  // History search state
  const [historySearch, setHistorySearch] = useState('');

  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchSearch = 
        `${s.ticketNo || ''} ${s.customerName || ''} ${s.vehicleModel || ''} ${s.serviceType || ''} ${s.technician || ''} ${s.vin || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || s.status === statusFilter || (statusFilter === 'Completed' && s.status === 'Work Completed');
      return matchSearch && matchStatus;
    });
  }, [services, search, statusFilter]);

  // History list
  const historyList = useMemo(() => {
    return services.filter(s => {
      if (!historySearch.trim()) return true;
      const term = historySearch.toLowerCase();
      return (s.vin || '').toLowerCase().includes(term) ||
             (s.customerName || '').toLowerCase().includes(term) ||
             (s.vehicleModel || '').toLowerCase().includes(term) ||
             (s.ticketNo || '').toLowerCase().includes(term);
    });
  }, [services, historySearch]);

  const inProgressCount = services.filter(s => s.status === 'In Progress' || s.status === 'Open').length;
  const waitingCount = services.filter(s => s.status === 'Waiting on Parts' || s.status === 'Awaiting Parts').length;
  const completedCount = services.filter(s => s.status === 'Completed' || s.status === 'Work Completed').length;
  const totalCost = services.reduce((sum, s) => sum + Number(s.estimatedCost || s.total_service_cost || 0), 0);

  const getStatusBadge = (status) => {
    if (status === 'Completed' || status === 'Work Completed') return 'badge badge-available';
    if (status === 'Waiting on Parts' || status === 'Awaiting Parts') return 'badge badge-reserved';
    if (status === 'In Progress') return 'badge badge-blue';
    return 'badge';
  };

  const handleOpenAllocateParts = (ticket) => {
    setSelectedTicketForParts(ticket);
    const availablePart = parts.find(p => Number(p.stock || p.stock_quantity || 0) > 0);
    setSelectedPartId(availablePart ? availablePart.id : '');
    setPartQuantity(1);
  };

  const handleConfirmAllocateParts = async (e) => {
    e.preventDefault();
    if (!selectedTicketForParts || !selectedPartId) return;
    const targetPart = parts.find(p => p.id === selectedPartId);
    if (!targetPart) return;

    const jcId = selectedTicketForParts.job_card_id || selectedTicketForParts.jobCard?.id || selectedTicketForParts.id;

    try {
      setAllocating(true);
      await onAllocateParts(jcId, [
        {
          part_id: targetPart.id,
          quantity: Number(partQuantity),
          unit_price: Number(targetPart.sellingPrice || targetPart.selling_price || targetPart.unitCost || 2000)
        }
      ]);
      setSelectedTicketForParts(null);
    } finally {
      setAllocating(false);
    }
  };

  const chosenPart = parts.find(p => p.id === selectedPartId);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Confidential
            </span>
            <h2 style={{ fontSize: '1.28rem', fontWeight: 700, color: '#0f172a' }}>
              Workshop & Service Bay Operations
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
            Customer intake, Job Cards, genuine OEM parts allocation, diagnostics, and complete vehicle maintenance history.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sub-tab Switcher */}
          <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveSubTab('tickets')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSubTab === 'tickets' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'tickets' ? '#0f172a' : '#64748b',
                boxShadow: activeSubTab === 'tickets' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Active Tickets & Jobs
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSubTab === 'history' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'history' ? '#0f172a' : '#64748b',
                boxShadow: activeSubTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Vehicle Service History
            </button>
          </div>

          <button onClick={onAddService} className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
            <Plus size={16} />
            <span>Open Service Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Active Workshop Jobs"
          value={inProgressCount}
          subtitle="Currently assigned on bays"
          icon={Wrench}
          accent="blue"
        />
        <StatCard
          title="Awaiting Spare Parts"
          value={waitingCount}
          subtitle="Stock allocation pending"
          icon={AlertTriangle}
          accent="amber"
        />
        <StatCard
          title="Jobs Completed & QC Passed"
          value={completedCount}
          subtitle="Ready for vehicle handover"
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Service Billings Total"
          value={`₹${totalCost.toLocaleString('en-IN')}`}
          subtitle="Labor and allocated parts"
          icon={Package}
          accent="purple"
        />
      </div>

      {/* SUB-TAB 1: Active Tickets & Job Cards */}
      {activeSubTab === 'tickets' && (
        <>
          {/* Controls */}
          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search ticket #, customer, car model, VIN, technician..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px', height: '38px', fontSize: '0.84rem' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ flex: '0 1 180px', minWidth: '150px', height: '38px', fontSize: '0.84rem' }}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting on Parts">Waiting on Parts</option>
                <option value="Completed">Completed / Delivered</option>
              </select>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
            gap: '18px'
          }}>
            {filtered.length === 0 ? (
              <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No workshop service tickets match the selected filter. Click "+ Open Service Ticket" to initiate a new job.
              </div>
            ) : (
              filtered.map((srv) => {
                const isCompleted = srv.status === 'Completed' || srv.status === 'Work Completed';
                return (
                  <div
                    key={srv.id}
                    className="glass-card hover-elevate"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: isCompleted ? '4px solid #16a34a' : '4px solid #2563eb'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.9rem' }}>
                          {srv.ticketNo || srv.ticket_number}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {srv.date || srv.entry_date}
                        </span>
                      </div>
                      <span className={getStatusBadge(srv.status)}>
                        {srv.status}
                      </span>
                    </div>

                    {/* Vehicle & Customer */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                        <Car size={16} color="#64748b" />
                        <span>{srv.vehicleModel || srv.vehicle_model}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px', marginLeft: '22px' }}>
                        VIN: {srv.vin || 'VIN-ON-FILE'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', marginTop: '6px', marginLeft: '22px' }}>
                        <User size={13} color="#94a3b8" />
                        <span>Customer: <strong>{srv.customerName || srv.customer_name}</strong></span>
                      </div>
                    </div>

                    {/* Job Details Box */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                          Service Type
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                          {srv.serviceType || srv.service_type}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '4px', fontStyle: 'italic' }}>
                        "{srv.customer_complaints || srv.complaints || srv.notes || 'Routine check'}"
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', fontSize: '0.74rem' }}>
                        <span style={{ color: '#64748b' }}>Assigned Tech: <strong>{srv.technician || srv.technician_name || 'Master Tech'}</strong></span>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>₹{Number(srv.estimatedCost || srv.total_service_cost || 12000).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9',
                      gap: '6px'
                    }}>
                      <button
                        onClick={() => onDeleteService(srv.id)}
                        className="btn btn-secondary btn-icon"
                        title="Delete Ticket"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={13} />
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Allocate Parts Action (Workflow connection) */}
                        {onAllocateParts && !isCompleted && (
                          <button
                            onClick={() => handleOpenAllocateParts(srv)}
                            className="btn btn-secondary btn-sm"
                            title="Allocate genuine spare parts from inventory"
                            style={{ fontSize: '0.75rem', padding: '5px 9px', color: '#2563eb' }}
                          >
                            <Package size={13} />
                            <span>+ Parts</span>
                          </button>
                        )}

                        {!isCompleted ? (
                          <>
                            <button
                              onClick={() => onUpdateStatus(srv.id, 'Completed')}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '5px 10px', background: '#16a34a', borderColor: '#16a34a' }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Complete</span>
                            </button>
                            {srv.status !== 'Waiting on Parts' && (
                              <button
                                onClick={() => onUpdateStatus(srv.id, 'Waiting on Parts')}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                              >
                                Wait Parts
                              </button>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} />
                            <span>QC Passed ✓</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* SUB-TAB 2: Vehicle Service History (WORKFLOW: Customer -> Vehicle -> Job Card -> Parts -> Service -> Service History) */}
      {activeSubTab === 'history' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Vehicle Maintenance & Workshop Service History
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
              Search any vehicle VIN, customer name, or service ticket to review historical maintenance, replaced parts, and costs.
            </p>

            <div style={{ position: 'relative', maxWidth: '420px', marginTop: '14px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by VIN (e.g. VIN-PO-...), Customer, Model..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', height: '38px', fontSize: '0.84rem' }}
              />
            </div>
          </div>

          {/* Timeline / History Table */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Vehicle & VIN</th>
                  <th>Customer</th>
                  <th>Service Type</th>
                  <th>Job Diagnosis</th>
                  <th>Technician</th>
                  <th>Total Billed</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No service history matches your search. Enter a vehicle VIN or customer name above.
                    </td>
                  </tr>
                ) : (
                  historyList.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        <code>{h.ticketNo || h.ticket_number}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{h.vehicleModel || h.vehicle_model}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{h.vin || 'VIN-ON-FILE'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{h.customerName || h.customer_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{h.customerPhone || h.customer_phone}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '3px 7px', borderRadius: '4px', color: '#334155' }}>
                          {h.serviceType || h.service_type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '200px' }}>
                        {h.customer_complaints || h.complaints || h.notes || 'Routine Inspection'}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0f172a' }}>
                          {h.technician || h.technician_name || 'Master Tech'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>
                          ₹{Number(h.estimatedCost || h.total_service_cost || 12000).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {h.date || h.entry_date}
                      </td>
                      <td>
                        <span className={getStatusBadge(h.status)}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocate Spare Parts Modal (Atomic Stock Deduction) */}
      {selectedTicketForParts && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-content glass-card" style={{ maxWidth: '480px', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Allocate Genuine Spare Parts
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Job Card: {selectedTicketForParts.ticketNo || selectedTicketForParts.ticket_number} • {selectedTicketForParts.vehicleModel || selectedTicketForParts.vehicle_model}
                </p>
              </div>
              <button onClick={() => setSelectedTicketForParts(null)} className="btn btn-secondary btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmAllocateParts} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Select Spare Part SKU *</label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Choose genuine component...</option>
                  {parts.map(p => {
                    const st = Number(p.stock || p.stock_quantity || 0);
                    return (
                      <option key={p.id} value={p.id} disabled={st <= 0}>
                        {p.name} ({p.partNo || p.part_number}) — {st} in stock • ₹{Number(p.sellingPrice || p.selling_price || 2000).toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="form-label">Quantity to Allocate *</label>
                <input
                  type="number"
                  min="1"
                  max={chosenPart ? Number(chosenPart.stock || chosenPart.stock_quantity || 1) : 10}
                  value={partQuantity}
                  onChange={(e) => setPartQuantity(e.target.value)}
                  className="form-input"
                  required
                />
                {chosenPart && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    Available in warehouse: <strong>{chosenPart.stock || chosenPart.stock_quantity} units</strong> (Shelf: {chosenPart.location || chosenPart.shelf_location || 'Bay-1'})
                  </div>
                )}
              </div>

              {chosenPart && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Line Total Added to Bill
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {partQuantity} x ₹{Number(chosenPart.sellingPrice || chosenPart.selling_price || 2000).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                    ₹{(Number(partQuantity) * Number(chosenPart.sellingPrice || chosenPart.selling_price || 2000)).toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setSelectedTicketForParts(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocating || !chosenPart}
                  className="btn btn-primary"
                >
                  {allocating ? 'Deducting Stock...' : 'Confirm Stock Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
