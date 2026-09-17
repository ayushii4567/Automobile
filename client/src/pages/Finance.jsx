import React, { useState, useMemo } from 'react';
import { Calculator, IndianRupee, TrendingDown, BarChart2, RefreshCw } from 'lucide-react';

function formatINR(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Finance() {
  const [vehiclePrice, setVehiclePrice] = useState(1500000);
  const [downPayment, setDownPayment] = useState(300000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(60); // months

  const emi = useMemo(() => {
    const principal = vehiclePrice - downPayment;
    if (principal <= 0 || interestRate <= 0 || tenure <= 0) return null;
    const r = interestRate / 100 / 12;
    const n = tenure;
    const emiVal = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emiVal * n + downPayment;
    const totalInterest = totalPayable - vehiclePrice;
    return {
      principal,
      monthly: Math.round(emiVal),
      totalPayable: Math.round(totalPayable),
      totalInterest: Math.round(totalInterest),
      loanAmount: principal,
    };
  }, [vehiclePrice, downPayment, interestRate, tenure]);

  // Build amortization schedule (yearly summary)
  const schedule = useMemo(() => {
    if (!emi) return [];
    const r = interestRate / 100 / 12;
    let balance = emi.loanAmount;
    const rows = [];
    for (let year = 1; year <= Math.ceil(tenure / 12); year++) {
      let yearPrincipal = 0, yearInterest = 0;
      const months = Math.min(12, tenure - (year - 1) * 12);
      for (let m = 0; m < months; m++) {
        if (balance <= 0) break;
        const intPart = balance * r;
        const prinPart = emi.monthly - intPart;
        yearInterest += intPart;
        yearPrincipal += prinPart;
        balance = Math.max(0, balance - prinPart);
      }
      rows.push({
        year,
        principal: Math.round(yearPrincipal),
        interest: Math.round(yearInterest),
        balance: Math.round(balance),
      });
    }
    return rows;
  }, [emi, interestRate, tenure]);

  const loanPercent = emi ? Math.round((emi.loanAmount / vehiclePrice) * 100) : 0;
  const downPercent = emi ? 100 - loanPercent : 0;

  function reset() {
    setVehiclePrice(1500000);
    setDownPayment(300000);
    setInterestRate(8.5);
    setTenure(60);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>EMI & Finance Calculator</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>Calculate monthly installments, total interest and loan amortization for any vehicle.</p>
        </div>
        <button onClick={reset} className="btn btn-secondary" style={{ gap: '6px' }}>
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', alignItems: 'start' }}>
        {/* Input Panel */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="#ef4444" /> Loan Parameters
          </h3>

          {[
            { label: 'Vehicle Price (₹)', value: vehiclePrice, setter: setVehiclePrice, min: 100000, max: 10000000, step: 10000 },
            { label: 'Down Payment (₹)', value: downPayment, setter: setDownPayment, min: 0, max: vehiclePrice, step: 10000 },
          ].map(({ label, value, setter, min, max, step }) => (
            <div key={label} className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">{label}</label>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>{formatINR(value)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => setter(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ef4444' }} />
              <input type="number" className="form-input" value={value} min={min} max={max}
                onChange={e => setter(Math.min(max, Math.max(min, Number(e.target.value))))}
                style={{ marginTop: '4px' }} />
            </div>
          ))}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Interest Rate (% p.a.)</label>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>{interestRate}%</span>
            </div>
            <input type="range" min={5} max={20} step={0.1} value={interestRate}
              onChange={e => setInterestRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ef4444' }} />
            <input type="number" className="form-input" value={interestRate} min={1} max={30} step={0.1}
              onChange={e => setInterestRate(Number(e.target.value))} style={{ marginTop: '4px' }} />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Loan Tenure</label>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>{tenure} months ({Math.round(tenure / 12 * 10) / 10} yrs)</span>
            </div>
            <input type="range" min={12} max={84} step={12} value={tenure}
              onChange={e => setTenure(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ef4444' }} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {[12, 24, 36, 48, 60, 72, 84].map(t => (
                <button key={t} onClick={() => setTenure(t)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                    background: tenure === t ? '#ef4444' : '#f8fafc',
                    color: tenure === t ? '#fff' : '#475569',
                    borderColor: tenure === t ? '#ef4444' : '#e5e7eb',
                  }}>
                  {t}m
                </button>
              ))}
            </div>
          </div>

          {/* Down Payment Breakdown Bar */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>Loan vs Down Payment Split</div>
            <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${downPercent}%`, background: '#16a34a', transition: 'width 0.3s' }} />
              <div style={{ width: `${loanPercent}%`, background: '#ef4444', transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Down: {downPercent}%</span>
              <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>Loan: {loanPercent}%</span>
            </div>
          </div>
        </div>

        {/* Results + Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {emi && emi.loanAmount > 0 ? (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {[
                  { label: 'Monthly EMI', value: formatINR(emi.monthly), icon: IndianRupee, color: '#ef4444', bg: '#fee2e2' },
                  { label: 'Loan Amount', value: formatINR(emi.loanAmount), icon: BarChart2, color: '#2563eb', bg: '#eff6ff' },
                  { label: 'Total Interest', value: formatINR(emi.totalInterest), icon: TrendingDown, color: '#d97706', bg: '#fffbeb' },
                  { label: 'Total Payable', value: formatINR(emi.totalPayable), icon: Calculator, color: '#16a34a', bg: '#f0fdf4' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: color, marginTop: '2px' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Amortization Table */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Yearly Amortization Schedule</h3>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Principal Paid</th>
                        <th>Interest Paid</th>
                        <th>Balance Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map(row => (
                        <tr key={row.year}>
                          <td style={{ fontWeight: 600 }}>Year {row.year}</td>
                          <td style={{ color: '#16a34a', fontWeight: 500 }}>{formatINR(row.principal)}</td>
                          <td style={{ color: '#d97706', fontWeight: 500 }}>{formatINR(row.interest)}</td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{formatINR(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <Calculator size={36} style={{ margin: '0 auto 12px' }} />
              <p>Adjust the sliders to calculate EMI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
