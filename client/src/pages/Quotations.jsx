import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  CalendarClock, 
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Quotations({ 
  quotations = [], 
  onAddQuotation, 
  onEditQuotation, 
  onDeleteQuotation, 
  onViewQuotation, 
  onConvertToSale 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter logic
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch = (
        (q.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.vehicleName || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.quotationNo || '').toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, search, statusFilter]);

  // Metric computations (NO charts, pure stats)
  const totalValuation = quotations.reduce((acc, q) => acc + Number(q.totalAmount || 0), 0);
  const acceptedQuotes = quotations.filter(q => q.status === 'Accepted');
  const sentQuotes = quotations.filter(q => q.status === 'Sent');
  const acceptedValuation = acceptedQuotes.reduce((acc, q) => acc + Number(q.totalAmount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <span className="badge badge-accepted">Accepted</span>;
      case 'Sent':
        return <span className="badge badge-sent">Sent to Client</span>;
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
            Pro-Forma Quotations & Pricing
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
            Generate on-road price estimates, tax breakdowns, warranty additions, and convert directly to sales deals.
          </p>
        </div>

        <button onClick={onAddQuotation} className="btn btn-primary" style={{ padding: '10px 18px' }}>
          <Plus size={16} />
          <span>New Quotation</span>
        </button>
      </div>

      {/* KPI Stat Cards (No charts) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Total Quotations Issued"
          value={quotations.length}
          subtitle="All active & draft records"
          trend="+4 This Month"
          icon={FileText}
          accent="blue"
        />
        <StatCard
          title="Total Pipeline Valuation"
          value={`₹${totalValuation.toLocaleString('en-IN')}`}
          subtitle="Sum of generated quotations"
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          title="Accepted by Clients"
          value={acceptedQuotes.length}
          subtitle={`₹${acceptedValuation.toLocaleString('en-IN')} Ready to close`}
          trend="High Conversion"
          icon={CheckCircle2}
          accent="purple"
        />
        <StatCard
          title="Pending Client Review"
          value={sentQuotes.length}
          subtitle="Sent proposals awaiting approval"
          icon={CalendarClock}
          accent="amber"
        />
      </div>

      {/* Quotations Table Card */}
      <div className="glass-card" style={{ padding: '20px' }}>
        
        {/* Controls: Search and Status Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search quotation, client, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {['All', 'Draft', 'Sent', 'Accepted', 'Expired'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === st ? '#ef4444' : 'transparent',
                  color: statusFilter === st ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote Ref</th>
                <th>Client Name</th>
                <th>Vehicle Proposed</th>
                <th>Ex-Showroom</th>
                <th>On-Road Total</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No quotations found matching your filter. Click "+ New Quotation" to create one.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quot) => (
                  <tr key={quot.id} style={{ transition: 'background 0.15s ease' }}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {quot.quotationNo}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{quot.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{quot.customerPhone || quot.customerEmail}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#ef4444' }}>
                      {quot.vehicleName}
                    </td>
                    <td>
                      ₹{Number(quot.exShowroomPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.92rem' }}>
                        ₹{Number(quot.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>{quot.validUntil}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Issued: {quot.createdAt}</div>
                    </td>
                    <td>
                      {getStatusBadge(quot.status)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* View / Print Document */}
                        <button 
                          onClick={() => onViewQuotation(quot)} 
                          className="btn btn-secondary btn-sm"
                          title="View & Print Pro-Forma Invoice"
                          style={{ padding: '6px 10px' }}
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        {/* Convert to Sale (if Accepted or ready) */}
                        {onConvertToSale && (
                          <button
                            onClick={() => onConvertToSale(quot)}
                            className="btn btn-primary btn-sm"
                            title="Convert into Official Sale Contract"
                            style={{ padding: '6px 10px', background: '#16a34a', borderColor: '#16a34a' }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Convert</span>
                          </button>
                        )}

                        {/* Edit */}
                        <button 
                          onClick={() => onEditQuotation(quot)}
                          className="btn btn-secondary btn-icon"
                          title="Edit Quotation"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Delete */}
                        <button 
                          onClick={() => onDeleteQuotation(quot.id)}
                          className="btn btn-secondary btn-icon"
                          title="Delete Quotation"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
