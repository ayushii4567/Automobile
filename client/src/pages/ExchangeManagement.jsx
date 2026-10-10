import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Car, 
  TrendingUp, 
  Package, 
  BarChart3, 
  Plus, 
  Search, 
  MapPin, 
  Users, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Filter,
  Trash2,
  Edit3,
  Printer,
  Compass,
  Building,
  DollarSign
} from 'lucide-react';
import { api } from '../api';

export default function ExchangeManagement({ 
  currentUser, 
  subTab,
  onSubTabChange,
  onRecordPayment 
}) {
  const [activeSubTab, setActiveSubTab] = useState(subTab || 'purchase');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (subTab) {
      setActiveSubTab(subTab);
    }
  }, [subTab]);

  const handleTabClick = (tabId) => {
    setActiveSubTab(tabId);
    if (onSubTabChange) {
      onSubTabChange(tabId);
    }
  };

  // Data states
  const [exchangeStock, setExchangeStock] = useState([]);
  const [exchangeProfit, setExchangeProfit] = useState({ summary: {}, records: [] });
  const [exchangeReports, setExchangeReports] = useState({ 
    modelWise: [], 
    hpWise: [], 
    salesmanWise: [], 
    villageWise: [],
    tehsilWise: [],
    districtWise: []
  });
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals & Forms
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingTradeIn, setEditingTradeIn] = useState(null);
  const [isResaleModalOpen, setIsResaleModalOpen] = useState(false);
  const [selectedTradeInForSale, setSelectedTradeInForSale] = useState(null);
  const [selectedPrintResale, setSelectedPrintResale] = useState(null);

  const [purchaseFormData, setPurchaseFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_village: 'Baramati',
    customer_tehsil: 'Baramati',
    customer_district: 'Pune',
    old_brand: 'Mahindra',
    old_model: '575 DI Sarpanch Tractor',
    old_year: 2019,
    horsepower: 47,
    registration_no: 'MH-12-BG-1092',
    odometer_km: 35000,
    condition_rating: 'Good',
    estimated_valuation: 280000,
    refurbishment_cost: 15000,
    expected_resale_price: 340000,
    salesman_name: 'Alex Rivera',
    notes: 'Clean engine and hydraulic system'
  });

  const [resaleFormData, setResaleFormData] = useState({
    actual_resale_price: 335000,
    resale_customer_name: '',
    resale_date: new Date().toISOString().split('T')[0],
    notes: 'Sold to local agricultural client'
  });

  const showFeedback = (msg, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(''), 4500);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const loadExchangeData = async () => {
    try {
      setLoading(true);
      const [stk, prof, reps] = await Promise.all([
        api.getExchangeStock().catch(() => []),
        api.getExchangeProfit().catch(() => ({ summary: {}, records: [] })),
        api.getExchangeReports().catch(() => ({ 
          modelWise: [], hpWise: [], salesmanWise: [], villageWise: [], tehsilWise: [], districtWise: [] 
        }))
      ]);
      setExchangeStock(stk || []);
      setExchangeProfit(prof || { summary: {}, records: [] });
      setExchangeReports(reps || { 
        modelWise: [], hpWise: [], salesmanWise: [], villageWise: [], tehsilWise: [], districtWise: [] 
      });
    } catch (err) {
      console.error('Failed to load exchange management datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExchangeData();
  }, []);

  // Create or Update Exchange Purchase
  const handleSavePurchase = async (e) => {
    e.preventDefault();
    try {
      if (editingTradeIn) {
        await api.updateTradeIn(editingTradeIn.id, purchaseFormData);
        showFeedback(`Exchange purchase record ${editingTradeIn.exchange_number} updated.`);
      } else {
        await api.createTradeIn({
          ...purchaseFormData,
          approved_adjustment_amount: purchaseFormData.estimated_valuation,
          status: 'In Stock'
        });
        showFeedback(`New exchange purchase inward recorded and added to pre-owned lot.`);
      }
      setIsPurchaseModalOpen(false);
      setEditingTradeIn(null);
      loadExchangeData();
    } catch (err) {
      showFeedback(err.message || 'Failed to save exchange purchase.', true);
    }
  };

  // Delete / Archive Exchange Record
  const handleDeleteTradeIn = async (id, exchangeNum) => {
    if (!window.confirm(`Delete exchange vehicle record ${exchangeNum}?`)) return;
    try {
      await api.deleteTradeIn(id);
      showFeedback(`Exchange vehicle record ${exchangeNum} deleted.`);
      loadExchangeData();
    } catch (err) {
      showFeedback(err.message || 'Failed to delete record.', true);
    }
  };

  // Execute Pre-Owned Resale (Workflow: Exchange Stock -> Exchange Sale -> Profit)
  const handleExecuteResale = async (e) => {
    e.preventDefault();
    if (!selectedTradeInForSale) return;
    try {
      await api.sellExchangeVehicle({
        id: selectedTradeInForSale.id,
        ...resaleFormData
      });
      showFeedback(`Vehicle ${selectedTradeInForSale.old_model} marked as Sold! Resale profit generated.`);
      setIsResaleModalOpen(false);
      setSelectedTradeInForSale(null);
      loadExchangeData();
      setActiveSubTab('profit');
    } catch (err) {
      showFeedback(err.message || 'Failed to record exchange vehicle resale.', true);
    }
  };

  const subTabs = [
    { id: 'purchase', label: '1. Exchange Purchase', count: exchangeStock.length, icon: ArrowLeftRight },
    { id: 'sales', label: '2. Exchange Sales', count: exchangeProfit.records?.length || 0, icon: Car },
    { id: 'stock', label: '3. Exchange Stock', count: exchangeStock.filter(ti => ti.status === 'In Stock').length, icon: Package },
    { id: 'profit', label: '4. Vehicle Profit', count: exchangeProfit.records?.length || 0, icon: TrendingUp },
    { id: 'reports', label: '5. Exchange Reports', icon: BarChart3 }
  ];

  return (
    <div className="module-container" style={{ padding: '24px' }}>
      {/* Title Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
          }}>
            <ArrowLeftRight size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Exchange Management
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: '2px 0 0' }}>
              Used Vehicle Procurement, Refurbishment, Resale Lot, Profitability & Regional Demographics
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            setEditingTradeIn(null);
            setPurchaseFormData({
              customer_name: '',
              customer_phone: '',
              customer_village: 'Baramati',
              customer_tehsil: 'Baramati',
              customer_district: 'Pune',
              old_brand: 'Mahindra',
              old_model: '575 DI Sarpanch Tractor',
              old_year: 2019,
              horsepower: 47,
              registration_no: 'MH-12-BG-1092',
              odometer_km: 35000,
              condition_rating: 'Good',
              estimated_valuation: 280000,
              refurbishment_cost: 15000,
              expected_resale_price: 340000,
              salesman_name: 'Alex Rivera',
              notes: 'Clean engine and hydraulic system'
            });
            setIsPurchaseModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> New Exchange Purchase
        </button>
      </div>

      {/* Alert Notifications */}
      {actionSuccess && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {subTabs.map(tab => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                background: isActive ? '#f59e0b' : '#ffffff',
                border: isActive ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                color: isActive ? '#ffffff' : '#334155',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(0, 0, 0, 0.25)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#475569',
                  border: isActive ? 'none' : '1px solid #e2e8f0'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Universal Search Filter Box */}
      {['purchase', 'sales', 'stock'].includes(activeSubTab) && (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '380px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder={`Search in ${activeSubTab.replace('_', ' ')}...`}
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', height: '36px' }}
            />
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 1: EXCHANGE PURCHASE (INTAKE REGISTER)
          ===================================================================== */}
      {activeSubTab === 'purchase' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Exchange Purchase & Trade-In Inward Register
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Used vehicle procurement with customer details, valuation approval, condition ratings and regional tagging
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Exchange Ref</th>
                  <th>Customer (Seller)</th>
                  <th>Village / Tehsil</th>
                  <th>Vehicle Brand & Model</th>
                  <th>Year & HP</th>
                  <th>Registration No</th>
                  <th>Approved Valuation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exchangeStock.filter(ti => (
                  !searchQuery ||
                  (ti.exchange_number && ti.exchange_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (ti.customer_name && ti.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (ti.old_model && ti.old_model.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (ti.registration_no && ti.registration_no.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(ti => (
                  <tr key={ti.id}>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{ti.exchange_number}</td>
                    <td style={{ fontWeight: 600 }}>{ti.customer_name}</td>
                    <td>{ti.customer_village} ({ti.customer_tehsil})</td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{ti.old_brand} {ti.old_model}</td>
                    <td>{ti.old_year} • {ti.horsepower || 45} HP</td>
                    <td style={{ fontFamily: 'monospace' }}>{ti.registration_no}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(ti.estimated_valuation || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${ti.status === 'Sold' ? 'badge-info' : 'badge-success'}`}>
                        {ti.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => {
                            setEditingTradeIn(ti);
                            setPurchaseFormData({
                              customer_name: ti.customer_name,
                              customer_phone: ti.customer_phone || '',
                              customer_village: ti.customer_village || 'Baramati',
                              customer_tehsil: ti.customer_tehsil || 'Baramati',
                              customer_district: ti.customer_district || 'Pune',
                              old_brand: ti.old_brand,
                              old_model: ti.old_model,
                              old_year: ti.old_year,
                              horsepower: ti.horsepower,
                              registration_no: ti.registration_no,
                              odometer_km: ti.odometer_km,
                              condition_rating: ti.condition_rating,
                              estimated_valuation: ti.estimated_valuation,
                              refurbishment_cost: ti.refurbishment_cost,
                              expected_resale_price: ti.expected_resale_price,
                              salesman_name: ti.salesman_name || 'Alex Rivera',
                              notes: ti.notes || ''
                            });
                            setIsPurchaseModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Edit Purchase Record"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTradeIn(ti.id, ti.exchange_number)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exchangeStock.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No exchange vehicles procured yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 2: EXCHANGE SALES (COMPLETED PRE-OWNED RESALES)
          ===================================================================== */}
      {activeSubTab === 'sales' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Exchange Resales Ledger (Second-Hand Outward Sales)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Completed pre-owned transactions with buyer details, realized price and realized net margin
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Exchange Ref</th>
                  <th>Vehicle Brand & Model</th>
                  <th>Purchased From</th>
                  <th>Resale Buyer</th>
                  <th>Cost Basis</th>
                  <th>Resale Price</th>
                  <th>Resale Date</th>
                  <th>Net Profit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exchangeProfit.records?.filter(r => (
                  !searchQuery ||
                  (r.exchange_number && r.exchange_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (r.old_model && r.old_model.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (r.resale_customer_name && r.resale_customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{r.exchange_number}</td>
                    <td style={{ fontWeight: 600 }}>{r.old_brand} {r.old_model} ({r.horsepower} HP)</td>
                    <td>{r.seller_customer}</td>
                    <td style={{ color: '#38bdf8', fontWeight: 600 }}>{r.resale_customer_name || 'Buyer'}</td>
                    <td>₹{Number(r.total_cost || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(r.actual_resale_price || 0).toLocaleString('en-IN')}</td>
                    <td>{r.resale_date}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(r.exchange_profit || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <button 
                        onClick={() => setSelectedPrintResale(r)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer size={13} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {(!exchangeProfit.records || exchangeProfit.records.length === 0) && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No pre-owned vehicles sold yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 3: EXCHANGE STOCK (PRE-OWNED LOT)
          ===================================================================== */}
      {activeSubTab === 'stock' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Pre-Owned Vehicle & Tractor Inventory Lot
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Refurbished second-hand stock ready for sale with asking price, condition ratings and one-click resale execution
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Exchange #</th>
                  <th>Vehicle Brand & Model</th>
                  <th>Year & HP</th>
                  <th>Registration No</th>
                  <th>Condition</th>
                  <th>Valuation Cost</th>
                  <th>Refurbishment</th>
                  <th>Asking Resale Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exchangeStock.filter(ti => ti.status === 'In Stock' && (
                  !searchQuery ||
                  (ti.exchange_number && ti.exchange_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (ti.old_model && ti.old_model.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (ti.registration_no && ti.registration_no.toLowerCase().includes(searchQuery.toLowerCase()))
                )).map(ti => (
                  <tr key={ti.id}>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{ti.exchange_number}</td>
                    <td style={{ fontWeight: 600 }}>{ti.old_brand} {ti.old_model}</td>
                    <td>{ti.old_year} • {ti.horsepower || 50} HP</td>
                    <td style={{ fontFamily: 'monospace' }}>{ti.registration_no}</td>
                    <td>
                      <span className="badge badge-success">{ti.condition_rating}</span>
                    </td>
                    <td>₹{Number(ti.estimated_valuation || 0).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#94a3b8' }}>₹{Number(ti.refurbishment_cost || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      ₹{Number(ti.expected_resale_price || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button 
                        onClick={() => {
                          setSelectedTradeInForSale(ti);
                          setResaleFormData({
                            ...resaleFormData,
                            actual_resale_price: ti.expected_resale_price || 340000,
                            resale_customer_name: ''
                          });
                          setIsResaleModalOpen(true);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        Execute Resale
                      </button>
                    </td>
                  </tr>
                ))}
                {exchangeStock.filter(ti => ti.status === 'In Stock').length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No pre-owned vehicles currently available in the lot.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 4: VEHICLE PROFIT
          ===================================================================== */}
      {activeSubTab === 'profit' && (
        <div>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Pre-Owned Sold</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {exchangeProfit.summary?.totalExchangeSold || 0} Units
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Resale Realized</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                ₹{Number(exchangeProfit.summary?.totalSoldValue || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Valuation & Refurb Cost</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8', marginTop: '4px' }}>
                ₹{Number(exchangeProfit.summary?.totalCost || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Net Exchange Profit</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                ₹{Number(exchangeProfit.summary?.totalProfit || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
              Unit-wise Exchange Vehicle Profit Breakdown
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 14px' }}>
              Calculated strictly as Realized Resale Price minus (Approved Valuation + Actual Refurbishment Cost)
            </p>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Exchange #</th>
                    <th>Vehicle Model</th>
                    <th>Intake Valuation</th>
                    <th>Refurbishment</th>
                    <th>Total Cost Basis</th>
                    <th>Resale Realized</th>
                    <th>Net Profit</th>
                    <th>Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {exchangeProfit.records?.map((r, i) => {
                    const margin = r.actual_resale_price > 0 
                      ? ((r.exchange_profit / r.actual_resale_price) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: '#f59e0b' }}>{r.exchange_number}</td>
                        <td style={{ fontWeight: 600 }}>{r.old_brand} {r.old_model}</td>
                        <td>₹{Number(r.purchase_price || 0).toLocaleString('en-IN')}</td>
                        <td>₹{Number(r.refurbishment_cost || 0).toLocaleString('en-IN')}</td>
                        <td>₹{Number(r.total_cost || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(r.actual_resale_price || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(r.exchange_profit || 0).toLocaleString('en-IN')}</td>
                        <td><span className="badge badge-success">{margin}%</span></td>
                      </tr>
                    );
                  })}
                  {(!exchangeProfit.records || exchangeProfit.records.length === 0) && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No profit records available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBMODULE 5: REGIONAL & DEMOGRAPHIC REPORTS
          (Model-wise, HP-wise, Salesman-wise, Village-wise, Tehsil-wise, District-wise)
          ===================================================================== */}
      {activeSubTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Row 1: Model-wise & HP-wise */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Model-wise */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Car size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Model-wise Exchange Volume
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Model Name</th><th>Count</th><th>Resale Value</th></tr>
                </thead>
                <tbody>
                  {exchangeReports.modelWise.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{m.model_name}</td>
                      <td>{m.count} units</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(m.total_val || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {exchangeReports.modelWise.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '14px' }}>No model data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* HP-wise */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Cpu size={18} color="#a855f7" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  HP-wise (Horsepower) Exchange Breakdown
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>HP Range</th><th>Count</th><th>Total Valuation</th></tr>
                </thead>
                <tbody>
                  {exchangeReports.hpWise.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#a855f7' }}>{h.hp_range}</td>
                      <td>{h.count} units</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(h.valuation_sum || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {exchangeReports.hpWise.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '14px' }}>No HP bracket data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 2: Salesman-wise & Village-wise */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Salesman-wise */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Users size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Salesman-wise Exchange Procured
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Sales Consultant</th><th>Deals</th><th>Total Valuation</th></tr>
                </thead>
                <tbody>
                  {exchangeReports.salesmanWise.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{s.salesman_name}</td>
                      <td>{s.count} deals</td>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>₹{Number(s.total_procured || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {exchangeReports.salesmanWise.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '14px' }}>No sales agent data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Village-wise */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MapPin size={18} color="#10b981" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Village-wise Exchange Sourcing
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Village</th><th>Tehsil</th><th>Units</th><th>Total Valuation</th></tr>
                </thead>
                <tbody>
                  {exchangeReports.villageWise.map((v, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{v.customer_village}</td>
                      <td>{v.customer_tehsil}</td>
                      <td style={{ fontWeight: 700 }}>{v.count} units</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>₹{Number(v.total_val || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {exchangeReports.villageWise.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '14px' }}>No village data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Tehsil-wise and District-wise Vehicle Sales Reports */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Tehsil-wise */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Compass size={18} color="#06b6d4" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Tehsil-wise Vehicle Sales Report
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>Tehsil</th><th>District</th><th>Units Sold</th><th>Sales Turnover</th></tr>
                </thead>
                <tbody>
                  {exchangeReports.tehsilWise?.map((t, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#06b6d4' }}>{t.customer_tehsil}</td>
                      <td>{t.customer_district || 'Pune'}</td>
                      <td style={{ fontWeight: 700 }}>{t.count} units</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>₹{Number(t.total_val || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {(!exchangeReports.tehsilWise || exchangeReports.tehsilWise.length === 0) && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '14px' }}>No tehsil sales records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* District-wise */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Building size={18} color="#ec4899" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  District-wise Vehicle Sales Report
                </h3>
              </div>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>District</th><th>Units Sold</th><th>Total Valuation</th><th>Avg Deal Price</th></tr>
                </thead>
                <tbody>
                  {exchangeReports.districtWise?.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#ec4899' }}>{d.customer_district}</td>
                      <td style={{ fontWeight: 700 }}>{d.count} units</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>₹{Number(d.total_val || 0).toLocaleString('en-IN')}</td>
                      <td>₹{Math.round(Number(d.total_val || 0) / (d.count || 1)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {(!exchangeReports.districtWise || exchangeReports.districtWise.length === 0) && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '14px' }}>No district sales records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW / EDIT EXCHANGE PURCHASE
          ===================================================================== */}
      {isPurchaseModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>{editingTradeIn ? 'Edit Exchange Purchase' : 'New Exchange / Trade-In Purchase'}</h2>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSavePurchase} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Customer Name (Seller) *</label>
                  <input type="text" required className="form-input" value={purchaseFormData.customer_name} onChange={e => setPurchaseFormData({...purchaseFormData, customer_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={purchaseFormData.customer_phone} onChange={e => setPurchaseFormData({...purchaseFormData, customer_phone: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Village</label>
                  <input type="text" className="form-input" value={purchaseFormData.customer_village} onChange={e => setPurchaseFormData({...purchaseFormData, customer_village: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Tehsil</label>
                  <input type="text" className="form-input" value={purchaseFormData.customer_tehsil} onChange={e => setPurchaseFormData({...purchaseFormData, customer_tehsil: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Old Brand & Model *</label>
                  <input type="text" required className="form-input" value={purchaseFormData.old_model} onChange={e => setPurchaseFormData({...purchaseFormData, old_model: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Horsepower (HP)</label>
                  <input type="number" className="form-input" value={purchaseFormData.horsepower} onChange={e => setPurchaseFormData({...purchaseFormData, horsepower: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">Registration No *</label>
                  <input type="text" required className="form-input" value={purchaseFormData.registration_no} onChange={e => setPurchaseFormData({...purchaseFormData, registration_no: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Condition Rating</label>
                  <select 
                    className="form-select"
                    value={purchaseFormData.condition_rating}
                    onChange={e => setPurchaseFormData({...purchaseFormData, condition_rating: e.target.value})}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Refurbishment">Needs Refurbishment</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Approved Valuation (₹) *</label>
                  <input type="number" required className="form-input" value={purchaseFormData.estimated_valuation} onChange={e => setPurchaseFormData({...purchaseFormData, estimated_valuation: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">Estimated Refurbishment Cost (₹)</label>
                  <input type="number" className="form-input" value={purchaseFormData.refurbishment_cost} onChange={e => setPurchaseFormData({...purchaseFormData, refurbishment_cost: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">Expected Resale Price (₹)</label>
                  <input type="number" className="form-input" value={purchaseFormData.expected_resale_price} onChange={e => setPurchaseFormData({...purchaseFormData, expected_resale_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">Assigned Sales Consultant</label>
                  <input type="text" className="form-input" value={purchaseFormData.salesman_name} onChange={e => setPurchaseFormData({...purchaseFormData, salesman_name: e.target.value})} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTradeIn ? 'Update Vehicle' : 'Save to Pre-Owned Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EXECUTE RESALE (OUTWARD SALE)
          ===================================================================== */}
      {isResaleModalOpen && selectedTradeInForSale && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Execute Exchange Vehicle Resale</h2>
              <button onClick={() => setIsResaleModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleExecuteResale} style={{ padding: '20px' }}>
              <div style={{ padding: '12px', background: '#1e293b', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedTradeInForSale.old_brand} {selectedTradeInForSale.old_model}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Reg: {selectedTradeInForSale.registration_no} • Valuation: ₹{Number(selectedTradeInForSale.estimated_valuation).toLocaleString('en-IN')}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Buyer Client Name *</label>
                  <input type="text" required className="form-input" value={resaleFormData.resale_customer_name} onChange={e => setResaleFormData({...resaleFormData, resale_customer_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Actual Resale Price Realized (₹) *</label>
                  <input type="number" required className="form-input" value={resaleFormData.actual_resale_price} onChange={e => setResaleFormData({...resaleFormData, actual_resale_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">Resale Date</label>
                  <input type="date" className="form-input" value={resaleFormData.resale_date} onChange={e => setResaleFormData({...resaleFormData, resale_date: e.target.value})} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setIsResaleModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Resale Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRINT MODAL: RESALE RECEIPT
          ===================================================================== */}
      {selectedPrintResale && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px', background: '#ffffff', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f59e0b', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#d97706', fontWeight: 800 }}>APEX HORIZON MOTORS</h2>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Pre-Owned & Exchange Division • Baramati, Maharashtra</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>RESALE RECEIPT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{selectedPrintResale.exchange_number}</div>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.88rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '14px' }}>
                <div>
                  <strong>Purchased By:</strong> {selectedPrintResale.resale_customer_name || 'Buyer'}<br />
                  Date of Resale: {selectedPrintResale.resale_date}
                </div>
                <div>
                  <strong>Vehicle:</strong> {selectedPrintResale.old_brand} {selectedPrintResale.old_model}<br />
                  Registration: {selectedPrintResale.registration_no || 'Traded Reg'}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Particulars</th>
                    <th style={{ textAlign: 'right', padding: '6px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px' }}>Pre-Owned Certified Vehicle ({selectedPrintResale.old_brand} {selectedPrintResale.old_model})</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{Number(selectedPrintResale.actual_resale_price || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ fontSize: '1rem', fontWeight: 800, color: '#d97706' }}>
                    <td style={{ padding: '8px 6px' }}>Total Amount Paid:</td>
                    <td style={{ textAlign: 'right', padding: '8px 6px' }}>₹{Number(selectedPrintResale.actual_resale_price || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedPrintResale(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
