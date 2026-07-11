import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient.js';
import { calculateDailyLog } from '../utils/calculator.js';

export default function Calendar({ session, onLogChange, logs = [], hourlyRate = 177 }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Form states for selected day
  const [hoursWorked, setHoursWorked] = useState(12);
  const [marketPackages, setMarketPackages] = useState(0);
  const [food0_4, setFood0_4] = useState(0);
  const [food4_6, setFood4_6] = useState(0);
  const [food6plus, setFood6plus] = useState(0);
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
  // Adjust for Monday start of week (Monday is 0, Sunday is 6)
  // standard getDay() is Sunday = 0, Monday = 1 ... Saturday = 6
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
      calc = calculateDailyLog(dayLog, hourlyRate);
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
      setHoursWorked(day.log.hours_worked ?? 12);
      setMarketPackages(day.log.market_packages ?? 0);
      setFood0_4(day.log.food_packages_0_4 ?? 0);
      setFood4_6(day.log.food_packages_4_6 ?? 0);
      setFood6plus(day.log.food_packages_6plus ?? 0);
    } else {
      // Default values for new log
      setHoursWorked(12);
      setMarketPackages(0);
      setFood0_4(0);
      setFood4_6(0);
      setFood6plus(0);
    }
  };

  // Upsert daily log in DB
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!session?.user || !selectedDay) return;
    
    try {
      setSaving(true);
      const logData = {
        user_id: session.user.id,
        log_date: selectedDay.dateStr,
        hours_worked: parseFloat(hoursWorked),
        market_packages: parseInt(marketPackages),
        food_packages_0_4: parseInt(food0_4),
        food_packages_4_6: parseInt(food4_6),
        food_packages_6plus: parseInt(food6plus)
      };

      const { error } = await supabase
        .from('daily_logs')
        .upsert(logData, { onConflict: 'user_id,log_date' });

      if (error) throw error;

      // Close panel and notify parent to reload logs
      setSelectedDay(null);
      if (onLogChange) onLogChange();
    } catch (error) {
      console.error('Error saving daily log:', error.message);
      alert('Günlük veri kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete daily log
  const handleDeleteLog = async () => {
    if (!session?.user || !selectedDay || !selectedDay.log) return;
    
    if (!window.confirm(`${selectedDay.dayNumber} ${monthYearStr} tarihli veriyi silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('user_id', session.user.id)
        .eq('log_date', selectedDay.dateStr);

      if (error) throw error;

      setSelectedDay(null);
      if (onLogChange) onLogChange();
    } catch (error) {
      console.error('Error deleting daily log:', error.message);
      alert('Günlük veri silinirken hata oluştu: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animated-page">
      <div className="dashboard-grid">
        
        {/* Calendar Grid */}
        <div className="glass-card">
          <div className="calendar-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {monthYearStr}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>◄ Geri</button>
              <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>İleri ►</button>
            </div>
          </div>

          <div className="calendar-grid">
            <div className="calendar-day-header">Pzt</div>
            <div className="calendar-day-header">Sal</div>
            <div className="calendar-day-header">Çar</div>
            <div className="calendar-day-header">Per</div>
            <div className="calendar-day-header">Cum</div>
            <div className="calendar-day-header">Cmt</div>
            <div className="calendar-day-header">Paz</div>

            {days.map((day, index) => {
              if (day.empty) {
                return <div key={`empty-${index}`} className="calendar-day empty" />;
              }

              const isSelected = selectedDay && selectedDay.dateStr === day.dateStr;
              const hasLog = !!day.log;

              return (
                <div 
                  key={`day-${day.dayNumber}`} 
                  onClick={() => handleDayClick(day)}
                  className={`calendar-day ${hasLog ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="day-number">{day.dayNumber}</span>
                    
                    {hasLog && (
                      <div className="day-dots">
                        {day.log.hours_worked > 0 && <span className="day-dot hours" title={`Süre: ${day.log.hours_worked} sa`} />}
                        {day.calc?.totalPackages > 0 && <span className="day-dot packages" title={`Paket: ${day.calc.totalPackages}`} />}
                      </div>
                    )}
                  </div>

                  {hasLog && day.calc && (
                    <div className="day-summary-text">
                      {Math.round(day.calc.dailyTotalNet)} ₺
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Log Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedDay ? (
            <div className="glass-card animated-page" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                  📅 {selectedDay.dayNumber} {monthYearStr} Verisi
                </h3>
                <button 
                  onClick={() => setSelectedDay(null)} 
                  style={{ color: 'var(--text-muted)', fontSize: '1.2rem', padding: '0.2rem' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Çalışılan Süre (Saat)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="glass-input"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    min="0"
                    max="24"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Giriş yaptığınız süre en fazla 12 saat olabilir. 12 saat üzeri fazla mesailer için lütfen paneldeki "Aylık Ekstra Mesai" alanını kullanın.
                  </span>
                </div>

                <div className="alert-box info" style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                  <span>⚠️</span>
                  <div>
                    <strong>Hatırlatma:</strong> İptal edilen siparişler ücrete tabi değildir. Yalnızca teslim ettiğiniz siparişleri girin.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Market Paket Sayısı</label>
                  <input 
                    type="number" 
                    className="glass-input"
                    value={marketPackages}
                    onChange={(e) => setMarketPackages(e.target.value)}
                    min="0"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Sanal Market, Migros Hemen ve Paket Taxi siparişleri toplamı.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Yemek Paket Sayısı (0-4 Km)</label>
                  <input 
                    type="number" 
                    className="glass-input"
                    value={food0_4}
                    onChange={(e) => setFood0_4(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Yemek (4-6 Km)</label>
                    <input 
                      type="number" 
                      className="glass-input"
                      value={food4_6}
                      onChange={(e) => setFood4_6(e.target.value)}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Yemek (+6 Km)</label>
                    <input 
                      type="number" 
                      className="glass-input"
                      value={food6plus}
                      onChange={(e) => setFood6plus(e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                </div>

                {selectedDay.calc && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-light)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--primary)' }}>Günlük Tahmini Gelir (KDV Hariç):</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Sabit Çalışma:</span>
                      <span>{(selectedDay.calc.fixedIncome).toFixed(2)} ₺</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Paket Primi:</span>
                      <span>{(selectedDay.calc.dailyPremium).toFixed(2)} ₺</span>
                    </div>
                    {selectedDay.calc.distanceSupport > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Mesafe Desteği:</span>
                        <span>{(selectedDay.calc.distanceSupport).toFixed(2)} ₺</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border-light)', marginTop: '0.25rem', paddingTop: '0.25rem', color: 'var(--success)' }}>
                      <span>Toplam:</span>
                      <span>{(selectedDay.calc.dailyTotalNet).toFixed(2)} ₺</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  {selectedDay.log && (
                    <button type="button" onClick={handleDeleteLog} className="btn btn-danger" disabled={deleting}>
                      {deleting ? 'Siliniyor...' : 'Sil'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '260px', padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-light)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.7 }}>📅</div>
              <h4 style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Günlük Veri Girişi</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Çalışma saatlerinizi ve teslim ettiğiniz sipariş sayılarını girmek, güncellemek veya silmek için soldaki takvimden bir gün seçin.
              </p>
            </div>
          )}
        </div>

      </div>
      
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Takvime veri ekledikten veya güncelledikten sonra üst menüden **Gösterge Paneli (Dashboard)** sekmesine geçerek aylık kümülatif kazancınızı ve kesinti detaylarınızı test edin.
      </div>
    </div>
  );
}
