import React, { useState } from 'react';
import { 
  Car, 
  Lock, 
  User, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-configured accounts
  const accounts = {
    admin: {
      username: 'admin',
      password: 'admin123',
      name: 'Marcus Vance',
      role: 'admin',
      title: 'Showroom Director / General Manager',
      tagline: 'Full operational authority & executive oversight'
    },
    sales: {
      username: 'sales',
      password: 'sales123',
      name: 'Alex Rivera',
      role: 'sales',
      title: 'Senior Sales Executive',
      tagline: 'Customer relations, quotations, test drives & deals'
    }
  };

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    setUsername(accounts[roleKey].username);
    setPassword(accounts[roleKey].password);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin(accounts.admin);
      } else if (username === 'sales' && password === 'sales123') {
        onLogin(accounts.sales);
      } else {
        setError('Invalid username or password. Please use default credentials shown below.');
        setIsSubmitting(false);
      }
    }, 350);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #1e1e2d 0%, #0b0f19 75%, #05070d 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background glow & grid effect */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '650px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.02) 65%, transparent 100%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 10
      }} className="animate-slide-up">
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(239, 68, 68, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
            marginBottom: '16px'
          }} className="animate-float">
            <Car size={34} color="#ffffff" />
          </div>
          
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            Apex Motors
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: '#94a3b8',
            marginTop: '6px',
            fontWeight: 500
          }}>
            Supercar Showroom & Operations Portal
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.15)',
          padding: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glowing top line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #ef4444, #f97316, transparent)'
          }} />

          {/* Role Selection Switcher */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#94a3b8',
              marginBottom: '10px'
            }}>
              Select Access Role (1-Click Switch)
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleSelectRole('admin')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: selectedRole === 'admin' ? '2px solid #ef4444' : '1px solid #374151',
                  background: selectedRole === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(31, 41, 55, 0.6)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color={selectedRole === 'admin' ? '#ef4444' : '#9ca3af'} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>Admin</span>
                  </div>
                  {selectedRole === 'admin' && (
                    <CheckCircle2 size={14} color="#ef4444" />
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Full Showroom Access
                </div>
              </button>

              {/* Sales Executive Button */}
              <button
                type="button"
                onClick={() => handleSelectRole('sales')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: selectedRole === 'sales' ? '2px solid #ef4444' : '1px solid #374151',
                  background: selectedRole === 'sales' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(31, 41, 55, 0.6)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={16} color={selectedRole === 'sales' ? '#ef4444' : '#9ca3af'} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>Sales Exec</span>
                  </div>
                  {selectedRole === 'sales' && (
                    <CheckCircle2 size={14} color="#ef4444" />
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Client & Deal Portal
                </div>
              </button>
            </div>
          </div>

          {/* Active Profile Info Banner */}
          <div style={{
            background: 'rgba(31, 41, 55, 0.7)',
            border: '1px solid #374151',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#ef4444',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.88rem',
              fontWeight: 700
            }}>
              {accounts[selectedRole].name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                {accounts[selectedRole].name}
              </div>
              <div style={{ fontSize: '0.73rem', color: '#ef4444', fontWeight: 600 }}>
                {accounts[selectedRole].title}
              </div>
            </div>
            <span className="badge badge-available" style={{ fontSize: '0.7rem' }}>
              Ready
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="#ef4444" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#d1d5db',
                marginBottom: '6px'
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '10px',
                    padding: '11px 14px 11px 38px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                  onBlur={(e) => e.target.style.borderColor = '#374151'}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#d1d5db',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '10px',
                    padding: '11px 14px 11px 38px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                  onBlur={(e) => e.target.style.borderColor = '#374151'}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '10px',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.35)';
              }}
            >
              <span>{isSubmitting ? 'Authenticating...' : `Enter as ${selectedRole === 'admin' ? 'Administrator' : 'Sales Executive'}`}</span>
              <ArrowRight size={17} />
            </button>
          </form>

          {/* Quick Credential Hint Box */}
          <div style={{
            marginTop: '22px',
            padding: '12px 14px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px dashed #374151',
            borderRadius: '10px',
            fontSize: '0.76rem',
            color: '#94a3b8'
          }}>
            <div style={{ fontWeight: 700, color: '#d1d5db', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} color="#ef4444" />
              <span>Default Credentials (Pre-filled):</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>👑 Admin: <strong>admin</strong> / <strong>admin123</strong></span>
              <span style={{ color: '#ef4444' }}>Full Control</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>🚗 Sales Exec: <strong>sales</strong> / <strong>sales123</strong></span>
              <span style={{ color: '#ef4444' }}>Showroom Floor</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.74rem', color: '#64748b' }}>
          Apex Horizon Motor Showroom Platform &copy; 2026. Secure Local Session.
        </div>
      </div>
    </div>
  );
}
