import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient.js';
import { calculateDailyLog } from '../utils/calculator.js';

export default function Calendar({ session, selectedCourier, onLogChange, logs = [], hourlyRate = 177 }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Form states for selected day (initialized empty as requested by user)
  const [hoursWorked, setHoursWorked] = useState('');
  const [marketPackages, setMarketPackages] = useState(''); // Normal packages (Market + Yemek 0-4 Km)
  const [food4_6, setFood4_6] = useState('');
  const [food6plus, setFood6plus] = useState('');
  const [fuelExpense, setFuelExpense] = useState('');
  const [motorLeaseExpense, setMotorLeaseExpense] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const monthYearStr = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  // Calculate calendar grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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
    const dayLog = logs.find(log => log.log_date === dateStr);
    
    // If log exists, calculate its earnings to show on calendar
    let calc = null;
    if (dayLog) {
      calc = calculateDailyLog(dayLog, hourlyRate, undefined, selectedCourier?.vat_rate ?? 20);
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
      // Default values for new log
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

      onLogChange();
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

      onLogChange();
      setSelectedDay(null);
    } catch (error) {
      console.error('Error deleting log:', error.message);
      alert('Gün silinirken hata oluştu.');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  return (
    <div className="animated-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Month selector header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
            🗓️ "{selectedCourier.name}" Çalışma Takvimi
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Gün seçerek o günkü çalışma saatlerinizi, paket sayılarınızı ve operasyonel giderlerinizi girin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>◄ Önceki Ay</button>
          <span style={{ fontWeight: 600, color: 'var(--text-main)', minWidth: '120px', textAlign: 'center' }}>{monthYearStr}</span>
          <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>Sonraki Ay ►</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Calendar Grid */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          
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
                        {formatCurrency(day.calc.dailyTotalNet * (1 + (selectedCourier?.vat_rate ?? 20) / 100) - (day.calc.dailyTotalNet * (selectedCourier?.vat_rate ?? 20) / 100 * (selectedCourier?.withholding_rate ?? 20) / 100))}
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

        {/* Edit Panel */}
        <div className="glass-card" style={{ padding: '1.5rem', minHeight: '300px' }}>
          {selectedDay ? (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                ✏️ {selectedDay.dateStr} Gününü Düzenle
              </h3>
              
              <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
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
                  <label className="form-label">Normal Paketler (Market + Yemek 0-4 Km)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    value={marketPackages}
                    onChange={(e) => setMarketPackages(e.target.value)}
                    placeholder="Normal Sipariş Toplamı"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Yemek (4-6 Km)</span>
                      <span style={{ color: 'var(--success)' }}>+25 TL</span>
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
                      <span style={{ color: 'var(--success)' }}>+35 TL</span>
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
                      placeholder="Gider Girin"
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
                      placeholder="Gider Girin"
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
            <div style={{ display: 'flex', height: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👈</span>
              <p>Çalışma saati, paket sayısı ve yakıt/kira giderlerinizi eklemek veya düzenlemek için sol taraftaki takvimden bir gün seçin.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
