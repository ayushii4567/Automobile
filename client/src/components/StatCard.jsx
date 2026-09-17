import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  accent = 'blue', 
  onClick 
}) {
  const accentColors = {
    blue: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    emerald: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    amber: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    purple: { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
    cyan: { bg: '#eff6ff', color: '#0284c7', border: '#bae6fd' }
  };

  const styleConfig = accentColors[accent] || accentColors.blue;

  return (
    <div 
      className={`glass-card ${onClick ? 'glass-card-interactive' : ''}`}
      onClick={onClick}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: '#64748b'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#0f172a',
            marginTop: '6px'
          }}>
            {value}
          </div>
        </div>

        {Icon && (
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: styleConfig.bg,
            border: `1px solid ${styleConfig.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: styleConfig.color
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.78rem'
        }}>
          {trend && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontWeight: 600,
              color: trend.startsWith('+') ? '#16a34a' : '#dc2626',
              background: trend.startsWith('+') ? '#f0fdf4' : '#fef2f2',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {trend.startsWith('+') ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trend}
            </span>
          )}
          {subtitle && (
            <span style={{ color: '#64748b' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
