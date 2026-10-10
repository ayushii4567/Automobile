import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Share2, 
  Users, 
  Cake, 
  Award, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Plus, 
  Sparkles,
  ExternalLink,
  Copy,
  Info,
  Layers,
  Megaphone,
  Car
} from 'lucide-react';
import { api } from '../api';
import Modal from '../components/Modal';

export default function Communications({ currentUser, customers = [], sales = [] }) {
  const [activeTab, setActiveTab] = useState('quick-share'); // 'quick-share', 'campaigns', 'groups', 'occasions', 'logs'
  const [loading, setLoading] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Quick Share State
  const [selectedTemplate, setSelectedTemplate] = useState('quotation');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [recipientContact, setRecipientContact] = useState('+91 98201 11223');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [dispatchResult, setDispatchResult] = useState(null);

  // Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    channel: 'SMS & WhatsApp Broadcast',
    target_model: 'All Vehicles',
    budget: 50000,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2026-10-31',
    status: 'Active'
  });

  // Customer Groups State
  const [customerGroups, setCustomerGroups] = useState([]);
  const [selectedGroupForBroadcast, setSelectedGroupForBroadcast] = useState(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState('whatsapp');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Occasions State (Birthdays & Anniversaries)
  const [occasions, setOccasions] = useState({
    today: '2026-10-03',
    todaysBirthdays: [],
    upcomingBirthdays: [],
    todaysAnniversaries: [],
    upcomingAnniversaries: []
  });

  // Communication Logs
  const [commLogs, setCommLogs] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [gw, occ, camps, grps, logs] = await Promise.all([
        api.getGatewayStatus().catch(() => null),
        api.getOccasions().catch(() => ({})),
        api.getCampaigns().catch(() => []),
        api.getCustomerGroups().catch(() => []),
        api.request ? api.request('/communications').catch(() => []) : Promise.resolve([])
      ]);

      if (gw) setGatewayStatus(gw);
      if (occ) setOccasions(occ);
      if (camps) setCampaigns(camps);
      if (grps) setCustomerGroups(grps);
      if (logs) setCommLogs(logs);
    } catch (err) {
      console.error('Error loading communications data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update template message when template or customer changes
  useEffect(() => {
    const cust = customers.find(c => c.id === selectedCustomerId) || customers[0];
    if (cust) {
      setRecipientContact(cust.phone || '+91 98201 11223');
    }

    const fetchTemplate = async () => {
      try {
        const tmpl = await api.getCommunicationTemplates(selectedTemplate, {
          customerName: cust ? cust.name : 'Valued Customer',
          quotationNo: 'QUOT-2026-001',
          vehicleName: 'Tata Safari Dark Edition',
          totalAmount: 2895000,
          paidAmount: 500000,
          balanceDue: 2395000,
          invoiceNumber: 'INV-2026-002',
          receiptNumber: 'RCPT-2026-002',
          amount: 500000,
          jobCardNumber: 'JC-2026-001',
          status: 'Work Completed'
        });
        setMessageSubject(tmpl.subject || '');
        setMessageBody(tmpl.text || '');
      } catch {}
    };

    fetchTemplate();
  }, [selectedTemplate, selectedCustomerId, customers]);

  // Handle Quick Dispatch (WhatsApp, Email, SMS)
  const handleDispatch = async (channel) => {
    try {
      const res = await api.dispatchCommunication({
        channel,
        recipient: channel === 'email' ? (customers.find(c => c.id === selectedCustomerId)?.email || 'customer@gmail.com') : recipientContact,
        subject: messageSubject,
        messageText: messageBody,
        customerId: selectedCustomerId || null,
        templateType: selectedTemplate
      });

      setDispatchResult(res);
      showToast(`Communication initiated via ${channel.toUpperCase()}!`);
      loadData();

      // Open Direct Deep Link immediately for 1-click dispatch
      if (res.directUrl) {
        window.open(res.directUrl, '_blank');
      }
    } catch (err) {
      showToast(err.message || 'Dispatch failed', 'error');
    }
  };

  // Handle Birthday / Anniversary 1-Click Wishes
  const handleSendOccasionGreeting = async (occasion, channel = 'whatsapp') => {
    const isBirthday = occasion.category === 'Birthday';
    const tmplType = isBirthday ? 'birthday' : 'anniversary';

    const tmpl = await api.getCommunicationTemplates(tmplType, {
      customerName: occasion.customerName,
      vehicleName: occasion.actionPayload?.vehicleName || 'Vehicle'
    });

    const res = await api.dispatchCommunication({
      channel,
      recipient: channel === 'email' ? occasion.customerEmail : occasion.customerPhone,
      subject: tmpl.subject,
      messageText: tmpl.text,
      customerId: occasion.entityId,
      templateType: tmplType
    });

    showToast(`Opening ${channel.toUpperCase()} with personalized ${isBirthday ? 'Birthday' : 'Anniversary'} greeting!`);
    loadData();

    if (res.directUrl) {
      window.open(res.directUrl, '_blank');
    }
  };

  // Campaign creation
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.createCampaign(campaignFormData);
      showToast(`Marketing campaign "${campaignFormData.name}" activated!`);
      setIsCampaignModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create campaign', 'error');
    }
  };

  // Group Broadcast
  const handleExecuteBroadcast = async () => {
    if (!selectedGroupForBroadcast || !campaigns[0]) return;
    try {
      const res = await api.broadcastCampaign(campaigns[0].id, {
        customerGroupId: selectedGroupForBroadcast.id,
        channel: broadcastChannel,
        customMessage: broadcastMessage
      });
      showToast(`Broadcast sent to ${res.totalDispatched} contacts in ${selectedGroupForBroadcast.name}!`);
      setIsBroadcastModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Broadcast failed', 'error');
    }
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}>
            <MessageSquare size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>
              Communication, Campaigns & Client Outreach
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0' }}>
              Direct WhatsApp sharing, automated occasion greetings, customer segmentation & broadcast campaigns
            </p>
          </div>
        </div>

        {/* Honest Integration Gateway Status Badge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={16} color="#38bdf8" />
          <div>
            <div style={{ fontWeight: 700, color: '#f8fafc' }}>
              Gateway Mode: Direct Deep-Link Active
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              WhatsApp Web / Mobile Native Link Dispatch Enabled
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        padding: '6px',
        background: '#f1f5f9',
        borderRadius: '10px'
      }}>
        {[
          { id: 'quick-share', label: '1-Click Share Center', icon: Share2 },
          { id: 'occasions', label: 'Birthdays & Anniversaries', icon: Cake, badge: (occasions.todaysBirthdays?.length || 0) + (occasions.todaysAnniversaries?.length || 0) },
          { id: 'campaigns', label: 'Marketing Campaigns', icon: Megaphone, badge: campaigns.length },
          { id: 'groups', label: 'Customer Groups', icon: Users, badge: customerGroups.length },
          { id: 'logs', label: 'Dispatch History Logs', icon: Clock, badge: commLogs.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0f172a' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#10b981' : '#64748b'} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? '#10b981' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. QUICK SHARE CENTER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'quick-share' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '20px' }}>
          {/* Left Form: Select Template & Recipient */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
              Compose Direct Message
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Choose Pre-Formatted Template
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'quotation', label: 'Vehicle Quotation' },
                    { id: 'invoice', label: 'Invoice & Due Notice' },
                    { id: 'receipt', label: 'Payment Receipt' },
                    { id: 'service', label: 'Service Job Ready' },
                    { id: 'birthday', label: 'Birthday Greeting' },
                    { id: 'anniversary', label: 'Delivery Anniversary' }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: selectedTemplate === tmpl.id ? '2px solid #10b981' : '1px solid #cbd5e1',
                        background: selectedTemplate === tmpl.id ? '#ecfdf5' : '#ffffff',
                        color: selectedTemplate === tmpl.id ? '#065f46' : '#475569',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Select Customer from Directory
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} ({c.city || 'Mumbai'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Recipient Phone Number (with Country Code)
                </label>
                <input 
                  type="text"
                  value={recipientContact}
                  onChange={(e) => setRecipientContact(e.target.value)}
                  placeholder="+91 98201 11223"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Subject / Summary Headline
                </label>
                <input 
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Message Content (Editable)
                </label>
                <textarea 
                  rows={8}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Right Preview & Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* WhatsApp Phone Mockup Preview */}
            <div className="glass-card" style={{ padding: '24px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Client Preview</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(messageBody);
                    showToast('Copied message text to clipboard!');
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={13} />
                  <span>Copy Text</span>
                </button>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                whiteSpace: 'pre-wrap',
                fontSize: '0.82rem',
                color: '#1e293b',
                lineHeight: 1.5,
                maxHeight: '340px',
                overflowY: 'auto'
              }}>
                {messageBody}
              </div>
            </div>

            {/* Action Buttons: 1-Click WhatsApp, 1-Click Email, 1-Click SMS */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Instant Dispatch via Channel:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1-Click WhatsApp */}
                <button
                  onClick={() => handleDispatch('whatsapp')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: '#25D366',
                    color: '#ffffff',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <MessageSquare size={18} />
                  <span>1-Click Send via WhatsApp (Web / Mobile)</span>
                  <ExternalLink size={15} />
                </button>

                {/* 1-Click Email */}
                <button
                  onClick={() => handleDispatch('email')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: '#0284c7',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Mail size={16} />
                  <span>Send via Email Client (mailto:)</span>
                  <ExternalLink size={15} />
                </button>

                {/* 1-Click SMS */}
                <button
                  onClick={() => handleDispatch('sms')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: '#334155',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={16} />
                  <span>Send via Native SMS Link</span>
                  <ExternalLink size={15} />
                </button>
              </div>

              {dispatchResult && (
                <div style={{ marginTop: '14px', padding: '10px', background: '#f0fdf4', borderRadius: '6px', fontSize: '0.78rem', color: '#166534' }}>
                  ✓ Dispatched to {dispatchResult.recipient} [Status: {dispatchResult.status}]
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BIRTHDAYS & ANNIVERSARIES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'occasions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Today's Celebrations Highlight Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cake size={28} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Today's Milestones & Celebrations (Date: {occasions.today})
                </h3>
                <p style={{ fontSize: '0.85rem', margin: '4px 0 0', opacity: 0.95 }}>
                  Strengthen customer loyalty by delivering warm wishes and complimentary service privileges
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '14px', marginTop: '18px' }}>
              {/* Today's Birthdays */}
              {occasions.todaysBirthdays?.map(b => (
                <div key={b.id} style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#0f172a', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px' }}>
                      🎂 Birthday TODAY!
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.customerPhone}</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '8px 0 4px' }}>
                    {b.customerName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
                    {b.description}
                  </div>
                  <button
                    onClick={() => handleSendOccasionGreeting(b, 'whatsapp')}
                    style={{
                      width: '100%',
                      background: '#25D366',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Send Birthday Greeting (WhatsApp)</span>
                  </button>
                </div>
              ))}

              {/* Today's Anniversaries */}
              {occasions.todaysAnniversaries?.map(a => (
                <div key={a.id} style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#0f172a', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>
                      🚘 Delivery Anniversary TODAY!
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.customerPhone}</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '8px 0 4px' }}>
                    {a.customerName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
                    {a.description}
                  </div>
                  <button
                    onClick={() => handleSendOccasionGreeting(a, 'whatsapp')}
                    style={{
                      width: '100%',
                      background: '#25D366',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Send Anniversary Privilege (WhatsApp)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Birthdays & Anniversaries Register */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
              Upcoming Celebrations (Next 7 to 30 Days)
            </h3>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Event Date</th>
                    <th>Time Remaining</th>
                    <th>Privilege Offer</th>
                    <th>1-Click Outreach</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(occasions.upcomingBirthdays || []), ...(occasions.upcomingAnniversaries || [])].map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: item.category === 'Birthday' ? '#fef3c7' : '#e0f2fe',
                          color: item.category === 'Birthday' ? '#92400e' : '#0369a1'
                        }}>
                          {item.category === 'Birthday' ? '🎂 Birthday' : '🚘 Anniversary'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.customerName}</td>
                      <td>{item.customerPhone}</td>
                      <td>{item.dueDate}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {item.category === 'Birthday' ? 'Free 40-Pt Inspection + 15% Acc' : 'Free AC Sanitization & Teflon'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSendOccasionGreeting(item, 'whatsapp')}
                            style={{
                              background: '#25D366',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleSendOccasionGreeting(item, 'sms')}
                            style={{
                              background: '#334155',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            SMS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MARKETING CAMPAIGNS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Marketing Campaigns
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
                Track promotional events, media channels, budget, leads, and conversion yields
              </p>
            </div>

            <button
              onClick={() => setIsCampaignModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0f172a',
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
              <span>Launch New Campaign</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '18px' }}>
            {campaigns.map(camp => (
              <div key={camp.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{camp.campaign_code}</span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: camp.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                      color: camp.status === 'Active' ? '#166534' : '#64748b'
                    }}>
                      {camp.status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '8px 0 4px' }}>
                    {camp.name}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Channel: {camp.channel} | Target: {camp.target_model || 'All Vehicles'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '16px 0', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Budget</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>₹{Number(camp.budget).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Leads Generated</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb' }}>{camp.leads_generated || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Conversions</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>{camp.conversions_count || 0}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedGroupForBroadcast(customerGroups[0]);
                    setBroadcastMessage(`Greetings from Apex Horizon Motors! Special Festive Drive preview for ${camp.target_model}. Call +91 22 2650 9000 to reserve your VIP slot.`);
                    setIsBroadcastModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Share2 size={14} />
                  <span>Broadcast Campaign to Customer Group</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CUSTOMER GROUPS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'groups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
              Dynamic Customer Segmentation
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              Group patrons by transaction activity, vehicle status, and CRM purchase intent
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '18px' }}>
            {customerGroups.map(grp => (
              <div key={grp.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: '#475569' }}>
                      {grp.count} Members
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Active Segment</span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px' }}>
                    {grp.name}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 14px' }}>
                    {grp.description}
                  </p>

                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '8px' }}>
                    {grp.customers?.slice(0, 5).map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span style={{ color: '#64748b' }}>{c.phone}</span>
                      </div>
                    ))}
                    {grp.count > 5 && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                        +{grp.count - 5} more customers
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedGroupForBroadcast(grp);
                    setBroadcastMessage(`Special announcement from Apex Horizon Motors for ${grp.name}. Call +91 22 2650 9000 for details.`);
                    setIsBroadcastModalOpen(true);
                  }}
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={14} />
                  <span>Send Broadcast to {grp.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LOGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Outbound Communication Audit Trail
          </h3>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Channel</th>
                  <th>Recipient / Subject</th>
                  <th>Content Excerpt</th>
                  <th>Direction</th>
                  <th>Dispatch Status</th>
                </tr>
              </thead>
              <tbody>
                {commLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.occurred_at}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                        {log.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.subject_or_summary}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </td>
                    <td>{log.direction}</td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: log.status?.includes('DELIVERED') ? '#dcfce7' : '#fef3c7',
                        color: log.status?.includes('DELIVERED') ? '#166534' : '#92400e'
                      }}>
                        {log.status || 'Cleared'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {isCampaignModalOpen && (
        <Modal title="Launch Marketing Campaign" onClose={() => setIsCampaignModalOpen(false)}>
          <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Campaign Name
              </label>
              <input 
                type="text"
                required
                value={campaignFormData.name}
                onChange={(e) => setCampaignFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Diwali SUV Privilege Drive 2026"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Channel
                </label>
                <select
                  value={campaignFormData.channel}
                  onChange={(e) => setCampaignFormData(prev => ({ ...prev, channel: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="SMS & WhatsApp Broadcast">SMS & WhatsApp Broadcast</option>
                  <option value="Digital / Social Ads">Digital / Social Ads</option>
                  <option value="Auto Expo Event">Auto Expo Event</option>
                  <option value="Print Media">Print Media</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Target Vehicle Model
                </label>
                <input 
                  type="text"
                  value={campaignFormData.target_model}
                  onChange={(e) => setCampaignFormData(prev => ({ ...prev, target_model: e.target.value }))}
                  placeholder="e.g. Tata Safari & Nexon EV"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Budget (INR)
                </label>
                <input 
                  type="number"
                  value={campaignFormData.budget}
                  onChange={(e) => setCampaignFormData(prev => ({ ...prev, budget: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  End Date
                </label>
                <input 
                  type="date"
                  value={campaignFormData.end_date}
                  onChange={(e) => setCampaignFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '10px', background: '#0f172a', color: '#ffffff', padding: '10px' }}
            >
              Activate Campaign
            </button>
          </form>
        </Modal>
      )}

      {/* Modal: Broadcast to Customer Group */}
      {isBroadcastModalOpen && (
        <Modal title={`Broadcast to ${selectedGroupForBroadcast?.name}`} onClose={() => setIsBroadcastModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Select Broadcast Channel
              </label>
              <select
                value={broadcastChannel}
                onChange={(e) => setBroadcastChannel(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="whatsapp">WhatsApp (Direct Deep-Link Integration)</option>
                <option value="sms">SMS Text Message</option>
                <option value="email">Email Broadcast</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Message Content
              </label>
              <textarea 
                rows={5}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
              ℹ️ Will dispatch to verified members of <strong>{selectedGroupForBroadcast?.name}</strong> and update campaign metrics.
            </div>

            <button
              onClick={handleExecuteBroadcast}
              className="btn btn-primary"
              style={{ background: '#10b981', color: '#ffffff', padding: '10px' }}
            >
              Dispatch Group Broadcast
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
