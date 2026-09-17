import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = '620px' 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ '--modal-max-width': maxWidth, maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for bottom sheet on mobile */}
        <div className="modal-drag-handle show-on-phone" style={{
          width: '36px', height: '4px', background: '#e2e8f0',
          borderRadius: '2px', margin: '10px auto 0',
        }} />
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: '50%', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
