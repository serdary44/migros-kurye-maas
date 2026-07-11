import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/supabaseClient.js';
import { calculateMonthlyTotals, calculateDailyLog } from '../utils/calculator.js';

export default function Dashboard({ session, selectedCourier, logs = [], onRefreshLogs }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Calendar states
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoursWorked, setHoursWorked] = useState('');
  const [marketPackages, setMarketPackages] = useState(''); // Normal packages (Market + Yemek 0-4 Km)
  const [food4_6, setFood4_6] = useState('');
  const [food6plus, setFood6plus] = useState('');
  const [fuelExpense, setFuelExpense] = useState('');
  const [motorLeaseExpense, setMotorLeaseExpense] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Extra monthly flat premiums
  const [extraPremiumsInput, setExtraPremiumsInput] = useState('');
  const [savingData, setSavingData] = useState(false);
  const [message, setMessage] = useState('');

  // Document metadata states (persisted in localStorage for convenience)
  const [workingYear, setWorkingYear] = useState(() => localStorage.getItem('mutabakat_working_year') || '2');
  const [startDate, setStartDate] = useState(() => localStorage.getItem('mutabakat_start_date') || '04.2024');
  const [region, setRegion] = useState(() => localStorage.getItem('mutabakat_region') || 'ANKARA');
  const [customer, setCustomer] = useState(() => localStorage.getItem('mutabakat_customer') || 'HEMEN');
  const [vehicle, setVehicle] = useState(() => localStorage.getItem('mutabakat_vehicle') || 'HONDA');
  const [invoiceNote, setInvoiceNote] = useState(() => localStorage.getItem('mutabakat_invoice_note') || 'HAZİRAN MOTOR HAK EDİŞ BEDELİ');
  const [invoiceNote2, setInvoiceNote2] = useState(() => localStorage.getItem('mutabakat_invoice_note2') || 'eren.atasever@pakettaxi.com.tr');

  // Save metadata to localStorage when changed
  useEffect(() => {
    localStorage.setItem('mutabakat_working_year', workingYear);
    localStorage.setItem('mutabakat_start_date', startDate);
    localStorage.setItem('mutabakat_region', region);
    localStorage.setItem('mutabakat_customer', customer);
    localStorage.setItem('mutabakat_vehicle', vehicle);
    localStorage.setItem('mutabakat_invoice_note', invoiceNote);
    localStorage.setItem('mutabakat_invoice_note2', invoiceNote2);
  }, [workingYear, startDate, region, customer, vehicle, invoiceNote, invoiceNote2]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthYearStr = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  // Sync inputs with selected courier details
  useEffect(() => {
    if (selectedCourier) {
      setExtraPremiumsInput(selectedCourier.monthly_extra_premiums || '');
      setMessage('');
      setSelectedDay(null);
    }
  }, [selectedCourier]);

  // Filter logs for the selected month/year
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = new Date(log.log_date);
      return logDate.getFullYear() === year && logDate.getMonth() === month;
    });
  }, [logs, year, month]);

  // Calculate monthly totals
  const results = useMemo(() => {
    if (!selectedCourier) return {};
    return calculateMonthlyTotals(filteredLogs, selectedCourier);
  }, [filteredLogs, selectedCourier]);

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Create list of days
  const days = [];
  for (let i = 0; i < adjustedFirstDayIndex; i++) {
    days.push({ empty: true });
  }
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    // Find if there is an existing log for this day
    const dayLog = filteredLogs.find(log => log.log_date === dateStr);
    
    // If log exists, calculate its earnings to show on calendar
    let calc = null;
    if (dayLog && selectedCourier) {
      calc = calculateDailyLog(dayLog, selectedCourier.hourly_rate, undefined, selectedCourier.vat_rate);
    }

    days.push({
      dayNumber: i,
      dateStr,
      log: dayLog,
      calc
    });
  }

  // Populate form if a day is clicked
  const handleDayClick = (day) => {
    if (day.empty) return;
    setSelectedDay(day);

    if (day.log) {
      setHoursWorked(day.log.hours_worked ?? '');
      setMarketPackages(day.log.market_packages ?? '');
      setFood4_6(day.log.food_packages_4_6 ?? '');
      setFood6plus(day.log.food_packages_6plus ?? '');
      setFuelExpense(day.log.fuel_expense ?? '');
      setMotorLeaseExpense(day.log.motor_lease_expense ?? '');
    } else {
      // Initialize with empty inputs (user requested empty boxes)
      setHoursWorked('');
      setMarketPackages('');
      setFood4_6('');
      setFood6plus('');
      setFuelExpense('');
      setMotorLeaseExpense('');
    }
  };

  // Upsert daily log in DB
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!selectedCourier || !selectedDay) return;
    
    try {
      setSaving(true);
      const logData = {
        courier_id: selectedCourier.id,
        log_date: selectedDay.dateStr,
        hours_worked: parseFloat(hoursWorked) || 0,
        market_packages: parseInt(marketPackages) || 0,
        food_packages_4_6: parseInt(food4_6) || 0,
        food_packages_6plus: parseInt(food6plus) || 0,
        fuel_expense: parseFloat(fuelExpense) || 0,
        motor_lease_expense: parseFloat(motorLeaseExpense) || 0
      };

      let error;
      if (selectedDay.log) {
        // Update existing log
        const { error: updateError } = await supabase
          .from('daily_logs')
          .update(logData)
          .eq('id', selectedDay.log.id);
        error = updateError;
      } else {
        // Insert new log
        const { error: insertError } = await supabase
          .from('daily_logs')
          .insert([logData]);
        error = insertError;
      }

      if (error) throw error;

      onRefreshLogs();
      setSelectedDay(null);
    } catch (error) {
      console.error('Error saving log:', error.message);
      alert('Günlük veriler kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete daily log from DB
  const handleDeleteLog = async () => {
    if (!selectedDay?.log) return;
    if (!window.confirm(`${selectedDay.dateStr} tarihli günlük veriyi silmek istediğinize emin misiniz?`)) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('id', selectedDay.log.id);

      if (error) throw error;

      onRefreshLogs();
      setSelectedDay(null);
    } catch (error) {
      console.error('Error deleting log:', error.message);
      alert('Gün silinirken hata oluştu.');
    } finally {
      setDeleting(false);
    }
  };

  // Save manual monthly extra premiums
  const handleSaveExtraData = async (e) => {
    e.preventDefault();
    if (!selectedCourier) return;

    try {
      setSavingData(true);
      setMessage('');
      const premiums = parseFloat(extraPremiumsInput) || 0;

      const { error } = await supabase
        .from('couriers')
        .update({ 
          monthly_extra_premiums: premiums
        })
        .eq('id', selectedCourier.id);

      if (error) throw error;

      setMessage('Aylık ek veriler başarıyla kaydedildi.');
      onRefreshLogs();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Error saving extra monthly data:', error.message);
      setMessage('Veriler kaydedilirken hata oluştu.');
    } finally {
      setSavingData(false);
    }
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

  if (!selectedCourier) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Lütfen panel verilerini yüklemek için geçerli bir kurye profili seçin.
      </div>
    );
  }

  return (
    <div className="animated-page">
      {/* Month selector header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
            🗓️ "{selectedCourier.name}" Çalışma Takvimi & Hakediş Paneli
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Takvimden gün seçerek çalışma saati ve paketlerinizi girin, sağ tarafta resmi faturanızın canlı dökümünü izleyin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>◄ Önceki Ay</button>
          <span style={{ fontWeight: 600, color: 'var(--text-main)', minWidth: '120px', textAlign: 'center' }}>{monthYearStr}</span>
          <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>Sonraki Ay ►</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card stat-card" style={{ padding: '1rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)' }}>
          <span className="stat-label" style={{ color: '#ef4444' }}>Toplam Operasyonel Giderler</span>
          <span className="stat-value" style={{ color: '#ef4444', fontSize: '1.4rem' }}>{formatCurrency(results.totalExpenses)}</span>
          <span className="stat-desc">Yakıt ({formatCurrency(results.totalFuelExpense)}) + Motor Kira ({formatCurrency(results.totalMotorLeaseExpense)})</span>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.1) 100%)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <span className="stat-label" style={{ color: '#22c55e', fontWeight: 600 }}>Cepte Kalan Net Kar 🚀</span>
          <span className="stat-value" style={{ color: '#22c55e', fontSize: '1.45rem' }}>{formatCurrency(results.netProfit)}</span>
          <span className="stat-desc">Ödenecek net hakedişten giderler çıktıktan sonra kalan</span>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1rem' }}>
          <span className="stat-label">Toplam Çalışılan Gün / Süre</span>
          <span className="stat-value secondary" style={{ fontSize: '1.35rem' }}>{results.daysWorked} Gün / {results.grandTotalHours} Sa</span>
          <span className="stat-desc">{results.totalHours} sa toplam çalışma süresi</span>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem' }}>
        
        {/* Left Column: Calendar & Edit Day Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Calendar Grid */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
              📅 Günlük Veri Takvimi
            </h3>
            
            {/* Days of week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <div>Pzt</div>
              <div>Sal</div>
              <div>Çar</div>
              <div>Per</div>
              <div>Cum</div>
              <div>Cmt</div>
              <div>Paz</div>
            </div>

            {/* Calendar grid items */}
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
                      padding: '0.5rem',
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
                      fontSize: '0.9rem',
                      color: isLogged ? 'var(--text-main)' : 'var(--text-muted)'
                    }}>
                      {day.dayNumber}
                    </span>
                    
                    {isLogged && day.calc && (
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {day.calc.totalPackages} Pkt
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>
                          {formatCurrency(day.calc.dailyTotalNet * (1 + selectedCourier.vat_rate / 100) - (day.calc.dailyTotalNet * selectedCourier.vat_rate / 100 * selectedCourier.withholding_rate / 100))}
                        </span>
                        {day.calc.totalDailyExpense > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>
                            -{formatCurrency(day.calc.totalDailyExpense)} Gdr
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Panel (Visible only when selectedDay is active) */}
          <div className="glass-card" style={{ padding: '1.5rem', minHeight: '120px' }}>
            {selectedDay ? (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  ✏️ {selectedDay.dateStr} Çalışma Detayları
                </h3>
                
                <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#f87171' }}>Günlük Yakıt (TL)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="glass-input" 
                        value={fuelExpense}
                        onChange={(e) => setFuelExpense(e.target.value)}
                        placeholder="Yakıt Gideri"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#f87171' }}>Motor Kira (TL)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="glass-input" 
                        value={motorLeaseExpense}
                        onChange={(e) => setMotorLeaseExpense(e.target.value)}
                        placeholder="Kira Gideri"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flex: 2 }}
                      disabled={saving}
                    >
                      {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                    
                    {selectedDay.log && (
                      <button 
                        type="button" 
                        onClick={handleDeleteLog}
                        className="btn btn-secondary" 
                        style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        disabled={deleting}
                      >
                        {deleting ? 'Siliniyor...' : 'Sil'}
                      </button>
                    )}
                  </div>

                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</span>
                <p style={{ fontSize: '0.9rem' }}>Çalışma saati, paket sayısı ve gider girmek için soldaki takvimden bir gün seçin.</p>
              </div>
            )}
          </div>

          {/* Mutabakat Header Metadata Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
              📝 Fatura Üst Bilgileri (Görsel Tasarım İçin)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Faturada görünen kişisel bilgileri değiştirmek için aşağıdaki kutuları doldurun (Tarayıcınızda saklanır):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Çalışma Yılı</label>
                  <input type="text" className="glass-input" value={workingYear} onChange={(e) => setWorkingYear(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>İşe Giriş Tarihi</label>
                  <input type="text" className="glass-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Bölge</label>
                  <input type="text" className="glass-input" value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Müşteri</label>
                  <input type="text" className="glass-input" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Araç</label>
                  <input type="text" className="glass-input" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Fatura Notu 1</label>
                  <input type="text" className="glass-input" value={invoiceNote} onChange={(e) => setInvoiceNote(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Fatura Notu 2</label>
                  <input type="text" className="glass-input" value={invoiceNote2} onChange={(e) => setInvoiceNote2(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Official Mutabakat Invoice & Flat Premiums */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-card" style={{ padding: '2rem 1.5rem', background: '#ffffff', color: '#111827', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            
            {/* Mutabakat Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', cursor: 'pointer' }}>◀</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Mutabakat</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>{monthYearStr.toUpperCase()} HAKEDİŞ</div>
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
                  <span style={{ color: '#4b5563', minWidth: '180px' }}>Kdv Tutarı %{selectedCourier.vat_rate}</span>
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
          
          {/* Monthly extra flat premium entry */}
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>
              🕒 Aylık Diğer Ekstra Prim Girişi
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              June mutabakatındaki gibi diğer hak ediş dışı primleri buraya ekleyebilirsiniz:
            </p>
            <form onSubmit={handleSaveExtraData} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="number" 
                step="0.01"
                className="glass-input"
                value={extraPremiumsInput}
                onChange={(e) => setExtraPremiumsInput(e.target.value)}
                placeholder="Örn: 500"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={savingData} style={{ padding: '0.45rem 1.25rem' }}>
                {savingData ? '...' : 'Kaydet'}
              </button>
            </form>
            {message && (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'block', marginTop: '0.5rem' }}>
                {message}
              </span>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Yukarıdaki döküm kuryenin aylık verileriyle kuruşu kuruşuna fatura eşleşmesi sunar.
          </div>
        </div>

      </div>
    </div>
  );
}
