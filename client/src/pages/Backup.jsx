import React, { useState, useEffect } from 'react';
import { 
  DatabaseBackup, 
  Download, 
  HardDriveDownload, 
  ShieldCheck,
  Server,
  Trash2,
  RefreshCw,
  Activity,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { api } from '../api';

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');


  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getBackup();
      setBackups(res.backups || []);
      setHealth(res.health || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await api.createBackup({ label: backupLabel });
      setBackupLabel('');
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete backup ${filename}?`)) return;
    try {
      await api.deleteBackup(filename);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyBackup = async (filename) => {
    try {
      const res = await api.verifyBackup(filename);
      if (res.isValid) {
        alert(`Backup ${filename} is valid and structurally intact.\nTotal Tables: ${res.tableCount}\nTotal Records: ${res.totalRecords}`);
      } else {
        alert(`Backup ${filename} verification failed! Integrity check: ${res.integrityCheck}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestoreBackup = async (filename) => {
    const confirmed = window.confirm(
      `⚠️ RESTORE WARNING:\n\nAre you sure you want to restore the entire showroom database from "${filename}"?\n\nAn automatic safety backup of your current database will be created first before applying changes.\n\nClick OK to execute restore.`
    );
    if (!confirmed) return;

    try {
      setIsRestoring(true);
      const res = await api.restoreBackup(filename);
      alert(
        `✅ Database successfully restored!\n\n` +
        `• Snapshot restored: ${filename}\n` +
        `• Tables restored: ${res.result?.tablesRestored}\n` +
        `• Total records restored: ${res.result?.totalRecordsRestored}\n` +
        `• Pre-restore safety backup: ${res.result?.safetyBackupFilename}\n` +
        `• Integrity check: ${res.result?.integrityCheck}`
      );
      await loadData();
    } catch (err) {
      alert(`❌ Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };


  if (loading && !health) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* DB Health Dashboard */}
      {health && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ flex: 1, minWidth: '250px' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Database Status</span>
              <Activity color={health.status === 'healthy' ? "#10b981" : "#ef4444"} size={20} />
            </div>
            <div className="stat-card-value" style={{ color: health.status === 'healthy' ? "#10b981" : "#ef4444" }}>
              {health.status.toUpperCase()}
            </div>
            <div className="stat-card-trend">
              <span>Integrity: {health.integrityCheck}</span>
            </div>
          </div>

          <div className="stat-card" style={{ flex: 1, minWidth: '250px' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Data Volume</span>
              <DatabaseBackup color="#3b82f6" size={20} />
            </div>
            <div className="stat-card-value">
              {health.totalRecords.toLocaleString()} Records
            </div>
            <div className="stat-card-trend">
              <span>Size: {health.dbSizeMB} MB</span>
            </div>
          </div>

          <div className="stat-card" style={{ flex: 1, minWidth: '250px' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Available Backups</span>
              <Server color="#8b5cf6" size={20} />
            </div>
            <div className="stat-card-value">
              {backups.length}
            </div>
            <div className="stat-card-trend">
              <span>Ready to restore</span>
            </div>
          </div>
        </div>
      )}

      <div className="responsive-split-2">
        
        {/* Create Backup Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <DatabaseBackup size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Create Snapshot</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '2px 0 0' }}>Generate a real SQLite DB backup</p>
            </div>
          </div>

          <form onSubmit={handleCreateBackup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Backup Label (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. End of Month"
                value={backupLabel}
                onChange={(e) => setBackupLabel(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isCreating} style={{ justifyContent: 'center' }}>
              {isCreating ? <span className="spinner" style={{ width: '16px', height: '16px' }}></span> : <DatabaseBackup size={16} />}
              <span>{isCreating ? 'Creating Snapshot...' : 'Create Backup Snapshot'}</span>
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>Export Data</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>Download the entire database as a JSON payload for external BI tools.</p>
            <a href={api.getBackupExportJsonUrl()} className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center' }}>
              <HardDriveDownload size={16} />
              <span>Export Full Database (JSON)</span>
            </a>
          </div>
        </div>

        {/* Backup List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>Backup History</h3>
            <button onClick={loadData} className="btn btn-ghost" style={{ padding: '6px' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          {backups.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <DatabaseBackup size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No backups found. Create one to secure your data.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Label</th>
                    <th>Size (MB)</th>
                    <th>Records</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(b => (
                    <tr key={b.filename}>
                      <td>
                        <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{new Date(b.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(b.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td>
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                          {b.label}
                        </span>
                      </td>
                      <td>{b.sizeMB} MB</td>
                      <td>{b.totalRecords?.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleVerifyBackup(b.filename)} className="btn btn-ghost" title="Verify Integrity">
                            <ShieldCheck size={16} color="#10b981" />
                          </button>
                          <button 
                            onClick={() => handleRestoreBackup(b.filename)} 
                            className="btn btn-ghost" 
                            title="Restore Database from this Snapshot"
                            disabled={isRestoring}
                          >
                            <RotateCcw size={16} color="#f59e0b" />
                          </button>
                          <a href={api.getBackupDownloadUrl(b.filename)} className="btn btn-ghost" title="Download Snapshot (.db)">
                            <Download size={16} color="#3b82f6" />
                          </a>
                          <button onClick={() => handleDeleteBackup(b.filename)} className="btn btn-ghost" title="Delete">
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
    </div>
  );
}
