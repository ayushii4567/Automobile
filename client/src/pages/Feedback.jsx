import React, { useState } from 'react';
import { 
  MessageSquareHeart, 
  Search, 
  Plus, 
  Star, 
  CheckCircle2, 
  Clock, 
  ThumbsUp, 
  AlertTriangle,
  User, 
  Car 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Feedback({ feedback = [], onAddFeedback, onUpdateFeedback }) {
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    saleOrServiceType: 'Vehicle Purchase',
    referenceNo: '',
    ratingScore: 5,
    deliveryExperience: 'Spotless & On Time',
    vehicleCondition: 'Showroom Mint',
    salesConsultantRating: 5,
    comments: '',
    status: 'Reviewed'
  });

  const handleOpenNew = () => {
    setSelectedReview(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      saleOrServiceType: 'Vehicle Purchase',
      referenceNo: '',
      ratingScore: 5,
      deliveryExperience: 'Spotless & On Time',
      vehicleCondition: 'Showroom Mint',
      salesConsultantRating: 5,
      comments: '',
      status: 'Reviewed'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedReview(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedReview) {
      onUpdateFeedback(selectedReview.id, formData);
    } else {
      onAddFeedback(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = feedback.filter(item => {
    const s = search.toLowerCase();
    const matchesSearch = (
      (item.customerName || '').toLowerCase().includes(s) ||
      (item.comments || '').toLowerCase().includes(s) ||
      (item.referenceNo || '').toLowerCase().includes(s) ||
      (item.feedbackNo || '').toLowerCase().includes(s)
    );
    const matchesRating = filterRating === 'ALL' || String(item.ratingScore) === filterRating;
    return matchesSearch && matchesRating;
  });

  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + Number(f.ratingScore || 5), 0) / feedback.length).toFixed(1)
    : '5.0';

  const fiveStarCount = feedback.filter(f => Number(f.ratingScore) === 5).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Overall CSAT Score</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Star size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>{avgRating}</span>
            <span style={{ color: '#eab308', fontSize: '1.1rem' }}>★★★★★</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Based on {feedback.length} customer survey responses
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>5-Star Brand Advocates</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <ThumbsUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', marginTop: '8px' }}>
            {fiveStarCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Delighted customer deliveries
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Reviews Logged</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <MessageSquareHeart size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {feedback.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            Sales & service experience surveys
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card control-bar" style={{ padding: '16px 20px', gap: '14px' }}>
        <div className="control-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px', minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px', minWidth: '160px', flex: '1 1 180px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by customer, comment, or reference..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div className="filter-chip-row">
            {['ALL', '5', '4', '3'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`filter-btn ${filterRating === r ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                {r === 'ALL' ? 'All Ratings' : `${r} Stars`}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleOpenNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          <span>Record Customer Survey</span>
        </button>
      </div>

      {/* Reviews Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            No customer feedback responses found.
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>{item.customerName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {item.saleOrServiceType} {item.referenceNo ? `• Ref: ${item.referenceNo}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < item.ratingScore ? '#eab308' : 'none'} 
                      color={i < item.ratingScore ? '#eab308' : '#475569'}
                    />
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px', fontSize: '0.88rem', color: '#cbd5e1', fontStyle: 'italic', flex: 1 }}>
                "{item.comments || 'Customer rated the showroom experience very positively with prompt vehicle delivery.'}"
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                <div>
                  <div>Delivery: <strong style={{ color: '#38bdf8' }}>{item.deliveryExperience}</strong></div>
                  <div>Condition: <strong style={{ color: '#22c55e' }}>{item.vehicleCondition}</strong></div>
                </div>
                <button 
                  onClick={() => handleOpenEdit(item)}
                  className="btn btn-secondary" 
                  style={{ height: '28px', padding: '0 10px', fontSize: '0.75rem' }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedReview ? `Update CSAT — ${selectedReview.feedbackNo}` : 'Record Customer CSAT Survey'}
        subtitle="Capture post-handover customer satisfaction, consultant review, and vehicle condition"
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Customer Name *</label>
              <input 
                type="text" 
                required 
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label>Customer Phone</label>
              <input 
                type="text" 
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Interaction Type</label>
              <select 
                value={formData.saleOrServiceType}
                onChange={(e) => setFormData({ ...formData, saleOrServiceType: e.target.value })}
                className="input-field"
              >
                <option value="Vehicle Purchase">New Vehicle Purchase</option>
                <option value="Service Center">Workshop Maintenance / Service</option>
                <option value="Test Drive Drive">Showroom Test Drive</option>
              </select>
            </div>

            <div className="input-group">
              <label>Invoice / Ticket Ref</label>
              <input 
                type="text" 
                placeholder="e.g. INV-2026-0881"
                value={formData.referenceNo}
                onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Overall Star Rating (1 to 5) *</label>
              <select 
                value={formData.ratingScore}
                onChange={(e) => setFormData({ ...formData, ratingScore: Number(e.target.value) })}
                className="input-field"
                style={{ fontWeight: 800, color: '#eab308' }}
              >
                <option value="5">★★★★★ (5 Stars - Outstanding)</option>
                <option value="4">★★★★☆ (4 Stars - Very Good)</option>
                <option value="3">★★★☆☆ (3 Stars - Average)</option>
                <option value="2">★★☆☆☆ (2 Stars - Needs Improvement)</option>
                <option value="1">★☆☆☆☆ (1 Star - Poor Experience)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Sales Consultant Rating (1-5)</label>
              <input 
                type="number" 
                min="1" 
                max="5"
                value={formData.salesConsultantRating}
                onChange={(e) => setFormData({ ...formData, salesConsultantRating: Number(e.target.value) })}
                className="input-field" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Delivery Handover Punctuality</label>
              <select 
                value={formData.deliveryExperience}
                onChange={(e) => setFormData({ ...formData, deliveryExperience: e.target.value })}
                className="input-field"
              >
                <option value="Spotless & On Time">Spotless & On Time</option>
                <option value="Slight Delay (Under 1 Hr)">Slight Delay (Under 1 Hr)</option>
                <option value="Major Delay">Major Delay</option>
              </select>
            </div>

            <div className="input-group">
              <label>Delivered Vehicle Condition</label>
              <select 
                value={formData.vehicleCondition}
                onChange={(e) => setFormData({ ...formData, vehicleCondition: e.target.value })}
                className="input-field"
              >
                <option value="Showroom Mint">Showroom Mint (Flawless)</option>
                <option value="Good Condition">Good Condition</option>
                <option value="Minor Dust / Cleaning Needed">Minor Dust / Cleaning Needed</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Customer Comments & Testimonial</label>
            <textarea 
              rows="3"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="input-field"
              placeholder="e.g. Loved the vehicle handover ceremony and quick documentation process."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedReview ? 'Update Survey' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
