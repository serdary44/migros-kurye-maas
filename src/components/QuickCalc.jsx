import React, { useState, useMemo, useEffect } from 'react';
import { calculateMonthlyTotals, calculateDailyLog } from '../utils/calculator.js';
import { 
  DEFAULT_HOURLY_RATE, 
  DEFAULT_SENIORITY_SUPPORT, 
  DEFAULT_RELIEF_FUND, 
  DEFAULT_DUES_INSTALLMENTS,
  DEFAULT_VAT_RATE,
  DEFAULT_WITHHOLDING_RATE
} from '../utils/constants.js';

export default function QuickCalc() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Local logs state (not saved in database, purely in memory for quick calculation)
  const [localLogs, setLocalLogs] = useState([]);
  
  // Selected calendar day states
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoursWorked, setHoursWorked] = useState('');
  const [marketPackages, setMarketPackages] = useState('');
  const [food4_6, setFood4_6] = useState('');
  const [food6plus, setFood6plus] = useState('');

  // Fixed default settings (June 2026 rates)
  const hourlyRate = DEFAULT_HOURLY_RATE;
  const senioritySupport = DEFAULT_SENIORITY_SUPPORT;
  const reliefFund = DEFAULT_RELIEF_FUND;
  const duesInstallments = DEFAULT_DUES_INSTALLMENTS;
  const vatRate = DEFAULT_VAT_RATE;
  const withholdingRate = DEFAULT_WITHHOLDING_RATE;

  // Metadata for the receipt preview (June 2026 defaults)
  const workingYear = '2';
  const startDate = '04.2024';
  const region = 'ANKARA';
  const customer = 'HEMEN';
  const vehicle = 'HONDA';
  const invoiceNote = 'HAZİRAN MOTOR HAK EDİŞ BEDELİ';
  const invoiceNote2 = 'eren.atasever@pakettaxi.com.tr';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthYearStr = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  // Filter local logs for selected month
  const filteredLogs = useMemo(() => {
    return localLogs.filter(log => {
      const logDate = new Date(log.log_date);
      return logDate.getFullYear() === year && logDate.getMonth() === month;
    });
  }, [localLogs, year, month]);

  // Calculate totals
  const results = useMemo(() => {
    const settings = {
      hourly_rate: hourlyRate,
      seniority_support: senioritySupport,
      relief_fund: reliefFund,
      dues_installments: duesInstallments,
      vat_rate: vatRate,
      withholding_rate: withholdingRate,
      monthly_extra_premiums: 0
    };
    return calculateMonthlyTotals(filteredLogs, settings);
  }, [filteredLogs]);

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Days list
  const days = [];
  for (let i = 0; i < adjustedFirstDayIndex; i++) {
    days.push({ empty: true });
  }
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayLog = filteredLogs.find(log => log.log_date === dateStr);
    
    let calc = null;
    if (dayLog) {
      calc = calculateDailyLog(dayLog, hourlyRate, undefined, vatRate);
    }

    days.push({
      dayNumber: i,
      dateStr,
      log: dayLog,
      calc
    });
  }

  const handleDayClick = (day) => {
    if (day.empty) return;
    setSelectedDay(day);

    if (day.log) {
      setHoursWorked(day.log.hours_worked ?? '');
      setMarketPackages(day.log.market_packages ?? '');
      setFood4_6(day.log.food_packages_4_6 ?? '');
      setFood6plus(day.log.food_packages_6plus ?? '');
    } else {
      setHoursWorked('');
      setMarketPackages('');
      setFood4_6('');
      setFood6plus('');
    }
  };

  const handleSaveLocalLog = (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    const logData = {
      log_date: selectedDay.dateStr,
      hours_worked: parseFloat(hoursWorked) || 0,
      market_packages: parseInt(marketPackages) || 0,
      food_packages_4_6: parseInt(food4_6) || 0,
      food_packages_6plus: parseInt(food6plus) || 0,
      fuel_expense: 0,
      motor_lease_expense: 0
    };

    setLocalLogs(prev => {
      const filtered = prev.filter(log => log.log_date !== selectedDay.dateStr);
      return [...filtered, logData];
    });

    setSelectedDay(null);
  };

  const handleDeleteLocalLog = () => {
    if (!selectedDay) return;
    setLocalLogs(prev => prev.filter(log => log.log_date !== selectedDay.dateStr));
    setSelectedDay(null);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
  };

  return (
    <div className="animated-page">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
          Hızlı Maaş Hesaplama Paneli
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Giriş yapmadan ve sisteme kaydetmeden, sadece takvimden günlerinizi doldurarak KDV, Tevkifat sonrası hak ediş dökümünüzü canlı olarak hesaplayın.
        </p>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem' }}>
        {/* Left Column: Local Calendar Grid & Selected Day Edit Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Calendar Grid */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
                📅 Hesaplama Takvimi
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>◄ Önceki</button>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{monthYearStr}</span>
                <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Sonraki ►</button>
              </div>
            </div>

            {/* Days of week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <div>Pzt</div>
              <div>Sal</div>
              <div>Çar</div>
              <div>Per</div>
              <div>Cum</div>
              <div>Cmt</div>
              <div>Paz</div>
            </div>

            {/* Calendar items */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {days.map((day, index) => {
                if (day.empty) {
                  return <div key={`empty-${index}`} style={{ aspectRatio: '1.2', opacity: 0 }}></div>;
                }

                const isLogged = !!day.log;
                const isSelected = selectedDay && selectedDay.dateStr === day.dateStr;

                let background = 'rgba(255, 255, 255, 0.02)';
                let border = '1px solid var(--border-light)';
                if (isLogged) {
                  background = 'rgba(249, 115, 22, 0.05)';
                  border = '1px solid rgba(249, 115, 22, 0.3)';
                }
                if (isSelected) {
                  border = '2px solid var(--primary)';
                  background = 'rgba(249, 115, 22, 0.15)';
                }

                return (
                  <div 
                    key={day.dateStr}
                    onClick={() => handleDayClick(day)}
                    style={{
                      aspectRatio: '1.2',
                      padding: '0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      background,
                      border,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                    className="calendar-day"
                  >
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.85rem',
                      color: isLogged ? 'var(--text-main)' : 'var(--text-muted)'
                    }}>
                      {day.dayNumber}
                    </span>
                    
                    {isLogged && day.calc && (
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {day.calc.totalPackages} Pkt
                        </span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--success)' }}>
                          {formatCurrency(day.calc.dailyTotalNet)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit day form card */}
          <div className="glass-card" style={{ padding: '1.5rem', minHeight: '120px' }}>
            {selectedDay ? (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  ✏️ {selectedDay.dateStr} Çalışma Detayları
                </h3>

                <form onSubmit={handleSaveLocalLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Çalışılan Süre (Saat)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        className="glass-input" 
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(e.target.value)}
                        placeholder="Saat Girin"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Günlük Toplam Paket (Market + Tüm Yemekler)</label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={marketPackages}
                        onChange={(e) => setMarketPackages(e.target.value)}
                        placeholder="Toplam Paket Sayısı"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Yemek (4-6 Km)</span>
                        <span style={{ color: 'var(--success)' }}>+25 TL/pkt</span>
                      </label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={food4_6}
                        onChange={(e) => setFood4_6(e.target.value)}
                        placeholder="Örn: 22"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Yemek (+6 Km)</span>
                        <span style={{ color: 'var(--success)' }}>+35 TL/pkt</span>
                      </label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={food6plus}
                        onChange={(e) => setFood6plus(e.target.value)}
                        placeholder="Örn: 2"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                      Hesaplamaya Ekle
                    </button>
                    {selectedDay.log && (
                      <button 
                        type="button" 
                        onClick={handleDeleteLocalLog} 
                        className="btn btn-secondary" 
                        style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</span>
                <p style={{ fontSize: '0.9rem' }}>Çalışma saati ve paket girmek için soldaki takvimden bir gün seçin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Simulated Official Mutabakat Invoice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-card" style={{ padding: '2rem 1.5rem', background: '#ffffff', color: '#111827', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            
            {/* Mutabakat Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', cursor: 'pointer' }}>◀</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Mutabakat</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>HAZİRAN HAKEDİŞ</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Firma / Tedarikçi</span>
                <span style={{ color: '#4b5563', textAlign: 'right', maxWidth: '240px', fontSize: '0.8rem' }}>Paket Lojistik Ve Teknoloji Anoni...</span>
              </div>
              
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '1rem 0 0.5rem 0' }}>Bilgiler</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Çalışma Yılı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{workingYear}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>İşe Giriş Tarihi</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{startDate} 00:00:00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Bölg.</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{region}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Müşt</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{customer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Ücret</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>SABİT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Araç</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{vehicle}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Hemen Paket Sayısı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{results.totalPackages}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Hemen Çalışma Gün Sayısı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{results.daysWorked}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Toplam Çalışma Gün Sayısı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{results.daysWorked}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Hemen Mesai Sayısı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{results.grandTotalHours}</span>
                </div>
              </div>

              {/* Allowances Section */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '1.5rem 0 0.5rem 0', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>Ödenekler</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Paket Başı Gelirleri(Kdv : Hariçtir )</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.cumulativeDailyPremium)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Sabit Çalışma Gelirleri(Kdv Hariçtir )</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.totalFixedIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Kidem Destek 2.yıl (Kdv Hariçtir )</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.senioritySupport)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Bonus(Kdv Hariçtir )</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.monthlyBonus)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Migros Paketbaşı Primi(Kdv Hariçtir )</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.migrosPacketPremium)}</span>
                </div>
                {results.monthlyExtraPremiums > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', minWidth: '180px' }}>Aylık Diğer Primler(Kdv Hariçtir )</span>
                    <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                    <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.monthlyExtraPremiums)}</span>
                  </div>
                )}
              </div>

              {/* Deductions Section */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '1.5rem 0 0.5rem 0', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>Kesintiler</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Yardim Fonu(Kdv Hariçtir )</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(results.reliefFund)}</span>
                </div>
              </div>

              {/* Offset Section */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '1.5rem 0 0.5rem 0', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>Mahsup Edilenler</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Aidat & Taksit</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.duesInstallments)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.35rem', fontWeight: 700 }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Toplam Mahsup Edilen</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', color: '#111827' }}>{formatCurrency(results.duesInstallments)}</span>
                </div>
              </div>

              {/* Warning Alert Box */}
              <div style={{
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.04)',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                color: '#ef4444',
                fontSize: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                marginTop: '0.75rem',
                marginBottom: '1rem',
                lineHeight: '1.3'
              }}>
                <span style={{ fontSize: '0.9rem' }}>ⓘ</span>
                <div>Bu tutarlar, iş ortağınız tarafından geçici olarak mahsup edilen ve daha sonra fatura edilecek veya iade edilecek tutarlardır.</div>
              </div>

              {/* Invoice Note Section */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '1rem 0 0.5rem 0', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>Fatura Notu</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Fatura Notu</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>{invoiceNote}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Fatura Notu 2</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>{invoiceNote2}</span>
                </div>
              </div>

              {/* Totals Section */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '1.5rem 0 0.5rem 0', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>Toplam</h4>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.4rem', 
                padding: '0.75rem 1rem', 
                background: '#f3f4f6', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563', minWidth: '180px' }}>Tutar</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.netEarningsPreVat)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563', minWidth: '180px' }}>Kdv Tutarı %{vatRate}</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.vatAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted #d1d5db', paddingTop: '0.35rem' }}>
                  <span style={{ color: '#4b5563', minWidth: '180px' }}>Kdv Dahil Toplam Tutar</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(results.vatIncludedAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span style={{ color: '#4b5563', minWidth: '180px' }}>Tevkifat Tutarı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>-{formatCurrency(results.withholdingAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d1d5db', paddingTop: '0.4rem', fontWeight: 700 }}>
                  <span style={{ color: '#111827', minWidth: '180px' }}>Toplam Tutar</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', color: '#111827' }}>{formatCurrency(results.invoiceTotal)}</span>
                </div>
              </div>

              {/* Total Payout Section */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '1.5rem 0 0.5rem 0' }}>Toplam Ödenecek</h4>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '1rem', 
                background: '#e0f2fe', 
                borderRadius: '8px', 
                border: '1px solid #bae6fd',
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                <span style={{ color: '#0369a1', minWidth: '180px' }}>Ödenecek Tutar</span>
                <span style={{ width: '20px', textAlign: 'center', color: '#0369a1' }}>:</span>
                <span style={{ flex: 1, textAlign: 'right', color: '#0284c7' }}>{formatCurrency(results.netPayable)}</span>
              </div>

            </div>
          </div>
          
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Yukarıdaki döküm faturanızla kuruşu kuruşuna eşleşmek üzere tasarlanmıştır.
          </div>
        </div>
      </div>
    </div>
  );
}
