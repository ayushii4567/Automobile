import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Plus, 
  Search, 
  ArrowRight, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Tag, 
  FileText,
  DollarSign,
  Eye
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Estimates({
  estimates = [],
  onAddEstimate,
  onEditEstimate,
  onDeleteEstimate,
  onConvertToQuotation,
  onViewEstimate
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [convertingId, setConvertingId] = useState(null);

  const filteredEstimates = useMemo(() => {
    return estimates.filter(est => {
      const matchSearch = (
        (est.customer_name || est.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (est.vehicle_name || est.vehicleName || '').toLowerCase().includes(search.toLowerCase()) ||
        (est.estimate_number || est.estimateNo || '').toLowerCase().includes(search.toLowerCase())
      );
      const curStatus = est.status || 'Active';
      const matchStatus = statusFilter === 'All' || curStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [estimates, search, statusFilter]);

  // Compute Metrics
  const totalValuation = estimates.reduce((acc, e) => acc + Number(e.total_estimated_amount || e.total || 0), 0);
  const activeCount = estimates.filter(e => e.status === 'Active').length;
  const convertedCount = estimates.filter(e => e.status === 'Converted').length;
  const draftCount = estimates.filter(e => e.status === 'Draft').length;

  const handleConvert = async (est) => {
    if (onConvertToQuotation) {
      setConvertingId(est.id);
      try {
        await onConvertToQuotation(est);
      } finally {
        setConvertingId(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Converted':
        return (
          <span className="badge badge-accepted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} />
            <span>Converted to Quote</span>
          </span>
        );
      case 'Active':
        return <span className="badge badge-available">Active</span>;
      case 'Draft':
        return <span className="badge badge-draft">Draft</span>;
      case 'Expired':
        return <span className="badge badge-expired">Expired</span>;
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
            Vehicle Cost Estimates & On-Road Pricing
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
            Calculate on-road costs, RTO fees, insurance packs and seamlessly convert qualified estimates into formal pro-forma quotations.
          </p>
        </div>

        <button onClick={onAddEstimate} className="btn btn-primary" style={{ padding: '10px 18px' }}>
          <Plus size={16} />
          <span>New Estimate</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Total Estimates"
          value={estimates.length}
          subtitle="All generated price files"
          trend="+5 This Month"
          icon={Calculator}
          accent="blue"
        />
        <StatCard
          title="Active Estimates"
          value={activeCount}
          subtitle="Open for customer decision"
          trend={`${activeCount} Active Leads`}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Converted to Quotes"
          value={convertedCount}
          subtitle="Formal pro-forma issued"
          trend={`${convertedCount} Qualified Deals`}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Pipeline On-Road Value"
          value={`₹${(totalValuation / 100000).toFixed(1)}L`}
          subtitle="Estimated purchase value"
          trend="Showroom Value"
          icon={DollarSign}
          accent="purple"
        />
      </div>

      {/* Search and Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search estimate #, client, car model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="filter-chip-row">
              {['All', 'Active', 'Converted', 'Draft', 'Expired'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    background: statusFilter === st ? '#2563eb' : '#f8fafc',
                    color: statusFilter === st ? '#fff' : '#475569',
                    borderColor: statusFilter === st ? '#2563eb' : '#e5e7eb',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Estimates Data Table */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto', maxWidth: '100%' }}>
        <div className="data-table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Estimate No</th>
                <th>Client / Prospect</th>
                <th>Vehicle Model</th>
                <th>Ex-Showroom</th>
                <th>Total On-Road</th>
                <th>Validity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No vehicle estimates found. Click "+ New Estimate" to generate one.
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((est) => {
                  const estNo = est.estimate_number || est.estimateNo || est.id;
                  const custName = est.customer_name || est.customerName || 'Prospect';
                  const custPhone = est.customer_phone || est.customerPhone;
                  const vehName = est.vehicle_name || est.vehicleName;
                  const exPrice = Number(est.ex_showroom_price ?? est.exShowroomPrice ?? 0);
                  const totalAmt = Number(est.total_estimated_amount ?? est.total ?? 0);
                  const validDate = est.valid_until || est.validUntil || '—';
                  const isConverted = est.status === 'Converted';

                  return (
                    <tr key={est.id} style={{ transition: 'background 0.15s ease' }}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {estNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{custName}</div>
                        {custPhone && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{custPhone}</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: '#2563eb' }}>
                        {vehName}
                      </td>
                      <td>
                        ₹{exPrice.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.92rem' }}>
                          ₹{totalAmt.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#475569' }}>{validDate}</div>
                      </td>
                      <td>
                        {getStatusBadge(est.status)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Workflow Convert to Quotation Button */}
                          {!isConverted ? (
                            <button
                              onClick={() => handleConvert(est)}
                              disabled={convertingId === est.id}
                              className="btn btn-primary btn-sm"
                              title="Convert this estimate into formal Quotation"
                              style={{
                                padding: '6px 12px',
                                background: '#16a34a',
                                borderColor: '#16a34a',
                                fontSize: '0.78rem'
                              }}
                            >
                              <ArrowRight size={13} />
                              <span>{convertingId === est.id ? 'Converting...' : 'Convert to Quote'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, paddingRight: '6px' }}>
                              Quoted ✓
                            </span>
                          )}

                          {/* View / Print Estimate Document */}
                          {onViewEstimate && (
                            <button
                              onClick={() => onViewEstimate(est)}
                              className="btn btn-secondary btn-icon"
                              title="View & Print Official Estimate Document"
                              style={{ color: '#2563eb' }}
                            >
                              <Eye size={14} />
                            </button>
                          )}

                          {/* Edit Estimate */}
                          <button
                            onClick={() => onEditEstimate(est)}
                            className="btn btn-secondary btn-icon"
                            title="Edit Estimate"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete Estimate */}
                          <button
                            onClick={() => onDeleteEstimate(est.id)}
                            className="btn btn-secondary btn-icon"
                            title="Delete Estimate"
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
