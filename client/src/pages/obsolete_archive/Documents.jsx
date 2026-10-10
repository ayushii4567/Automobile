import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Eye, 
  Search,
  Filter,
  RefreshCw,
  FolderOpen,
  History,
  X,
  Clock,
  User,
  Shield,
  FileCheck
} from 'lucide-react';
import { api } from '../api';

export default function Documents({ customers = [], vehicles = [], sales = [] }) {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // History state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyEntity, setHistoryEntity] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    entity_type: 'CUSTOMER',
    entity_id: '',
    title: '',
    doc_type: 'CUSTOMER_KYC',
    file: null
  });


  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments({ search: searchQuery, docType: filterType });
      setDocuments(res.documents || []);
      setStats(res.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [searchQuery, filterType]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) return alert('Please select a file');

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('entity_type', uploadData.entity_type);
      formData.append('entity_id', uploadData.entity_id);
      formData.append('title', uploadData.title);
      formData.append('doc_type', uploadData.doc_type);
      formData.append('file', uploadData.file);

      await api.uploadDocument(formData);
      setUploadData({ ...uploadData, title: '', file: null });
      alert('Document uploaded successfully');
      loadDocuments();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await api.deleteDocument(id);
      loadDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const resolveEntityName = (type, id) => {
    if (type === 'CUSTOMER') {
      const c = customers.find(x => x.id === id);
      return c ? c.name : id;
    }
    if (type === 'VEHICLE') {
      const v = vehicles.find(x => x.id === id);
      return v ? `${v.brand} ${v.model}` : id;
    }
    if (type === 'SALE') {
      const s = sales.find(x => x.id === id);
      return s ? `Sale #${s.invoiceNo || s.invoice_number}` : id;
    }
    return id;
  };

  const handleOpenHistory = async (entityType, entityId) => {
    try {
      setHistoryEntity({ type: entityType, id: entityId, name: resolveEntityName(entityType, entityId) });
      setLoadingHistory(true);
      setHistoryModalOpen(true);
      const records = await api.getDocumentHistory(entityType, entityId);
      setHistoryRecords(records || []);
    } catch (err) {
      alert('Failed to load entity document history: ' + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Stats row */}
      {stats && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Total Documents</span>
              <FileText color="#3b82f6" size={20} />
            </div>
            <div className="stat-card-value">{stats.totalDocuments}</div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Storage Used</span>
              <FolderOpen color="#10b981" size={20} />
            </div>
            <div className="stat-card-value">{stats.totalSizeMB} MB</div>
          </div>
        </div>
      )}

      <div className="responsive-split-2">
        
        {/* Upload Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#8b5cf6" />
            Upload Document
          </h3>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Link to Entity Type</label>
              <select 
                className="form-input"
                value={uploadData.entity_type}
                onChange={e => setUploadData({...uploadData, entity_type: e.target.value, entity_id: ''})}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="SALE">Sale / Invoice</option>
                <option value="GENERAL">General / Other</option>
              </select>
            </div>

            {uploadData.entity_type !== 'GENERAL' && (
              <div className="form-group">
                <label className="form-label">Select Entity</label>
                <select 
                  className="form-input"
                  value={uploadData.entity_id}
                  onChange={e => setUploadData({...uploadData, entity_id: e.target.value})}
                  required
                >
                  <option value="">-- Select --</option>
                  {uploadData.entity_type === 'CUSTOMER' && customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                  {uploadData.entity_type === 'VEHICLE' && vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.vin})</option>
                  ))}
                  {uploadData.entity_type === 'SALE' && sales.map(s => (
                    <option key={s.id} value={s.id}>{s.invoiceNo || s.invoice_number || s.id} - {s.customerName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select 
                className="form-input"
                value={uploadData.doc_type}
                onChange={e => setUploadData({...uploadData, doc_type: e.target.value})}
              >
                <option value="CUSTOMER_KYC">Customer KYC (Aadhar / PAN)</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="ADDRESS_PROOF">Address Proof (Utility / Passport / Voter ID)</option>
                <option value="VEHICLE_DOCS">Vehicle Documents (RC / Fitness / Permit)</option>
                <option value="INSURANCE">Insurance Policy</option>
                <option value="REGISTRATION">RC / Registration Certificate</option>
                <option value="AGREEMENT">Sales Agreement / Contract</option>
                <option value="OTHER">Other Supporting Document</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Document Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. John Doe Aadhar Card"
                value={uploadData.title}
                onChange={e => setUploadData({...uploadData, title: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">File</label>
              <input
                type="file"
                className="form-input"
                style={{ padding: '8px' }}
                onChange={e => setUploadData({...uploadData, file: e.target.files[0]})}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isUploading} style={{ justifyContent: 'center' }}>
              {isUploading ? <span className="spinner" style={{ width: '16px', height: '16px' }}></span> : <Upload size={16} />}
              <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
            </button>
          </form>
        </div>

        {/* Document List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '0 12px', borderRadius: '8px' }}>
              <Filter size={16} color="#94a3b8" />
              <select 
                className="form-input" 
                style={{ border: 'none', background: 'transparent', padding: '8px 0', minWidth: '140px' }}
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">All Document Types</option>
                <option value="CUSTOMER_KYC">Customer KYC</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="ADDRESS_PROOF">Address Proof</option>
                <option value="VEHICLE_DOCS">Vehicle Documents</option>
                <option value="INSURANCE">Insurance</option>
                <option value="REGISTRATION">RC / Registration</option>
                <option value="AGREEMENT">Agreements</option>
              </select>
            </div>
            
            <button onClick={loadDocuments} className="btn btn-ghost">
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No documents found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title & Type</th>
                    <th>Linked Entity</th>
                    <th>Size</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: '#f8fafc' }}>{d.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{d.doc_type}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: '#94a3b8', marginRight: '4px' }}>{d.entity_type}:</span>
                          {resolveEntityName(d.entity_type, d.entity_id)}
                        </div>
                      </td>
                      <td>{d.file_size_kb} KB</td>
                      <td>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleOpenHistory(d.entity_type, d.entity_id)} 
                            className="btn btn-ghost" 
                            title={`View Document History for ${d.entity_type}`}
                          >
                            <History size={16} color="#8b5cf6" />
                          </button>
                          <a href={api.getDocumentPreviewUrl(d.id)} target="_blank" rel="noreferrer" className="btn btn-ghost" title="Preview Document">
                            <Eye size={16} color="#3b82f6" />
                          </a>
                          <a href={api.getDocumentDownloadUrl(d.id)} className="btn btn-ghost" title="Download Document">
                            <Download size={16} color="#10b981" />
                          </a>
                          <button onClick={() => handleDelete(d.id)} className="btn btn-ghost" title="Delete Document">
                            <Trash2 size={16} color="#ef4444" />
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
      </div>

      {/* Entity Document History Modal */}
      {historyModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History color="#8b5cf6" size={22} />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Document Audit History
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                    {historyEntity?.type}: <strong>{historyEntity?.name}</strong> (ID: {historyEntity?.id})
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="btn btn-ghost" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {loadingHistory ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                </div>
              ) : historyRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <FileText size={40} style={{ opacity: 0.4, margin: '0 auto 10px' }} />
                  <p>No document history records found for this entity.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {historyRecords.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#8b5cf6',
                          marginTop: '2px'
                        }}>
                          <FileCheck size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                            <span style={{ color: '#8b5cf6', fontWeight: 600, marginRight: '8px' }}>{item.doc_type}</span>
                            • {item.file_size_kb} KB
                            • Uploaded: {new Date(item.created_at).toLocaleString()}
                          </div>
                          {item.uploader_name && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              By: {item.uploader_name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a 
                          href={api.getDocumentPreviewUrl(item.id)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        >
                          <Eye size={14} /> Preview
                        </a>
                        <a 
                          href={api.getDocumentDownloadUrl(item.id)} 
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        >
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button onClick={() => setHistoryModalOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

