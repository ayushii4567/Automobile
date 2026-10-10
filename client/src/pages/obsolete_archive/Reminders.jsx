import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CalendarClock, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Phone, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Check, 
  CreditCard, 
  ShieldAlert, 
  Wrench, 
  Users, 
  Car, 
  Cake, 
  Award, 
  Filter, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import Modal from '../components/Modal';

export default function Reminders({ currentUser, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [automatedData, setAutomatedData] = useState({
    today: '2026-10-03',
    totalReminders: 0,
    urgentCount: 0,
    byCategory: {},
    reminders: []
  });
  const [manualReminders, setManualReminders] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // New manual reminder modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Lead Follow-up',
    priority: 'Medium',
    due_date: new Date().toISOString().split('T')[0]
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReminders = async () => {
    try {
      setLoading(true);
      const [autoRes, fullRes] = await Promise.all([
        api.getAutomatedReminders('2026-10-03').catch(() => null),
        api.getReminders().catch(() => null)
      ]);

      if (autoRes) setAutomatedData(autoRes);
      if (fullRes?.manualReminders) setManualReminders(fullRes.manualReminders);
    } catch (err) {
      console.error('Error loading reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleActionClick = async (rem, actionType) => {
    if (actionType === 'whatsapp') {
      let tmplType = 'quotation';
      if (rem.category === 'Payment') tmplType = 'invoice';
      else if (rem.category === 'Birthday') tmplType = 'birthday';
      else if (rem.category === 'Anniversary') tmplType = 'anniversary';
      else if (rem.category === 'Service') tmplType = 'service';

      try {
        const tmpl = await api.getCommunicationTemplates(tmplType, rem.actionPayload || { customerName: rem.customerName });
        const res = await api.dispatchCommunication({
          channel: 'whatsapp',
          recipient: rem.customerPhone || '+91 98201 11223',
          subject: rem.title,
          messageText: tmpl.text || rem.description,
          customerId: rem.entityType === 'customer' ? rem.entityId : null
        });

        showToast(`Opening WhatsApp for ${rem.customerName}...`);
        if (res.directUrl) {
          window.open(res.directUrl, '_blank');
        }
      } catch (e) {
        showToast('Failed to generate WhatsApp link', 'error');
      }
    } else if (actionType === 'call') {
      if (rem.customerPhone) {
        window.open(`tel:${rem.customerPhone}`, '_self');
      } else {
        showToast('No phone number recorded for this lead/customer', 'error');
      }
    } else if (actionType === 'view') {
      if (!onNavigate) return;
      if (rem.category === 'Payment') onNavigate('sales');
      else if (rem.category === 'Insurance') onNavigate('insurance');
      else if (rem.category === 'Service') onNavigate('service');
      else if (rem.category === 'Lead Follow-up') onNavigate('enquiries');
      else if (rem.category === 'Test Drive') onNavigate('testdrives');
      else if (rem.category === 'Delivery') onNavigate('sales');
      else onNavigate('customers');
    }
  };

  const handleCompleteManual = async (id) => {
    try {
      await api.completeReminder(id);
      showToast('Reminder marked as completed! ✓');
      loadReminders();
    } catch {
      showToast('Failed to complete reminder', 'error');
    }
  };

  const handleDeleteManual = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      showToast('Reminder deleted');
      loadReminders();
    } catch {
      showToast('Failed to delete reminder', 'error');
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    try {
      await api.createReminder(formData);
      showToast('Custom reminder scheduled!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'Lead Follow-up',
        priority: 'Medium',
        due_date: new Date().toISOString().split('T')[0]
      });
      loadReminders();
    } catch {
      showToast('Failed to create reminder', 'error');
    }
  };

  // Filter automated reminders
  const allReminders = [...(automatedData.reminders || [])];
  const filteredReminders = allReminders.filter(r => {
    const matchCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchPriority = selectedPriority === 'ALL' || r.priority === selectedPriority;
    return matchCategory && matchPriority;
  });

  const categories = [
    { id: 'ALL', label: 'All Alerts', count: allReminders.length, icon: Bell },
    { id: 'Payment', label: 'Payment (Balance Due)', count: automatedData.byCategory?.payment || 0, icon: CreditCard },
    { id: 'Insurance', label: 'Insurance (Renewal)', count: automatedData.byCategory?.insurance || 0, icon: ShieldAlert },
    { id: 'Service', label: 'Service & Job Cards', count: automatedData.byCategory?.service || 0, icon: Wrench },
    { id: 'Lead Follow-up', label: 'Lead Follow-up', count: automatedData.byCategory?.lead || 0, icon: Users },
    { id: 'Test Drive', label: 'Test Drive Prep', count: automatedData.byCategory?.testDrive || 0, icon: Clock },
    { id: 'Delivery', label: 'Vehicle Delivery', count: automatedData.byCategory?.delivery || 0, icon: Car },
    { id: 'Birthday', label: 'Birthday Wishes', count: automatedData.byCategory?.birthday || 0, icon: Cake },
    { id: 'Anniversary', label: 'Anniversary Milestones', count: automatedData.byCategory?.anniversary || 0, icon: Award }
  ];

  const getPriorityStyle = (priority) => {
    if (priority === 'Urgent') return { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' };
    if (priority === 'High') return { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' };
    return { bg: '#e0f2fe', text: '#0369a1', border: '#38bdf8' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          borderLeft: '4px solid #10b981',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
          }}>
            <Bell size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>
              Reminders, Action Alerts & Follow-ups
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0' }}>
              Real-time proactive triggers for payments, expiring insurance, workshop pickups, leads, birthdays & deliveries
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Create Custom Task</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Urgent Action Items
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
            {automatedData.urgentCount || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '2px' }}>
            Immediate resolution required
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            High Priority Tasks
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            {automatedData.highCount || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
            Due today or within 3 days
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Proactive Alerts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {allReminders.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
            Live across all 8 modules
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Manual Staff Reminders
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {manualReminders.filter(m => !m.is_completed).length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>
            Scheduled team callbacks
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        flexWrap: 'nowrap',
        padding: '6px',
        background: '#f1f5f9',
        borderRadius: '10px'
      }}>
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0f172a' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} color={isActive ? '#ffffff' : '#64748b'} />
              <span>{cat.label}</span>
              {cat.count > 0 && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? '#ef4444' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569'
                }}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reminders List & Interactive Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredReminders.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              No Pending Reminders for this Category!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '6px 0 0' }}>
              All customer follow-ups, invoices, and scheduled handovers are up to date.
            </p>
          </div>
        ) : (
          filteredReminders.map(rem => {
            const pStyle = getPriorityStyle(rem.priority);
            return (
              <div 
                key={rem.id}
                className="glass-card reminder-card"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderLeft: `5px solid ${pStyle.border}`
                }}
              >
                <div className="reminder-content" style={{ flex: '1 1 280px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: pStyle.bg,
                      color: pStyle.text,
                      textTransform: 'uppercase'
                    }}>
                      {rem.priority} • {rem.category}
                    </span>

                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      {rem.status}
                    </span>

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Due: {rem.dueDate}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.35 }}>
                    {rem.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                    {rem.description}
                  </p>
                  {rem.customerPhone && (
                    <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '6px', fontWeight: 600, wordBreak: 'break-all' }}>
                      Contact: {rem.customerPhone} {rem.customerEmail ? `| ${rem.customerEmail}` : ''}
                    </div>
                  )}
                </div>

                {/* 1-Click Action Buttons */}
                <div className="reminder-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {rem.customerPhone && (
                    <>
                      <button
                        onClick={() => handleActionClick(rem, 'whatsapp')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#25D366',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                        title="Send 1-Click WhatsApp Message"
                      >
                        <MessageSquare size={14} />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleActionClick(rem, 'call')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                        title="Call Customer"
                      >
                        <Phone size={14} />
                        <span>Call</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleActionClick(rem, 'view')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                    title="Jump to Module Record"
                  >
                    <ExternalLink size={14} />
                    <span>View Record</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Reminders Section */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '10px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
          Staff Scheduled Tasks & Reminders
        </h3>

        {manualReminders.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No custom tasks scheduled. Use "Create Custom Task" to add tasks.</div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Notes</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {manualReminders.map(m => (
                  <tr key={m.id} style={{ opacity: m.is_completed ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 700 }}>{m.title}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.description}</td>
                    <td>{m.due_date}</td>
                    <td>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9' }}>
                        {m.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: m.is_completed ? '#dcfce7' : '#fef3c7',
                        color: m.is_completed ? '#166534' : '#92400e'
                      }}>
                        {m.is_completed ? 'Completed ✓' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!m.is_completed && (
                          <button
                            onClick={() => handleCompleteManual(m.id)}
                            style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                            title="Mark Done"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteManual(m.id)}
                          style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Manual Task */}
      {isModalOpen && (
        <Modal title="Create Custom Staff Task" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSaveManual} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Task Title
              </label>
              <input 
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Call Rajesh for delivery documentation"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Description / Notes
              </label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Details of the callback or task"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Due Date
                </label>
                <input 
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '10px', background: '#0f172a', color: '#ffffff', padding: '10px' }}
            >
              Save Reminder Task
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
