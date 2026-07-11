import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/supabaseClient.js';
import { calculateMonthlyTotals } from '../utils/calculator.js';

export default function Dashboard({ session, selectedCourier, logs = [], onRefreshLogs }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Extra hours and premiums input states
  const [extraHoursInput, setExtraHoursInput] = useState(0);
  const [extraPremiumsInput, setExtraPremiumsInput] = useState(0);
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
      setExtraHoursInput(selectedCourier.monthly_extra_hours ?? 0);
      setExtraPremiumsInput(selectedCourier.monthly_extra_premiums ?? 0);
      setMessage('');
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

  // Save manual monthly extra hours and premiums
  const handleSaveExtraData = async (e) => {
    e.preventDefault();
    if (!selectedCourier) return;

    try {
      setSavingData(true);
      setMessage('');
      const hours = parseFloat(extraHoursInput) || 0;
      const premiums = parseFloat(extraPremiumsInput) || 0;

      const { error } = await supabase
        .from('couriers')
        .update({ 
          monthly_extra_hours: hours,
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
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
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
            📊 "{selectedCourier.name}" Gösterge Paneli
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {monthYearStr} dönemi güncel durumunuz, gider takibiniz ve hak ediş analiziniz.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>◄ Önceki Ay</button>
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
          <span className="stat-desc">{results.totalHours} sa online + {results.monthlyExtraHours} sa ekstra</span>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem' }}>
        
        {/* Left Column: Extra Data Form & Metadata Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Extra Monthly Data Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
              🕒 Aylık Ekstra Veri Girişi
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Uygulamaya yazmayan 12 saat üzeri ekstra mesai saatlerini ve June mutabakatındaki gibi diğer hak ediş dışı primleri buraya ekleyebilirsiniz:
            </p>

            <form onSubmit={handleSaveExtraData} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Ekstra Mesai Süresi (Saat)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="glass-input"
                    value={extraHoursInput}
                    onChange={(e) => setExtraHoursInput(e.target.value)}
                    min="0"
                    placeholder="Örn: 12.5"
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Diğer Ekstra Primler (TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="glass-input"
                    value={extraPremiumsInput}
                    onChange={(e) => setExtraPremiumsInput(e.target.value)}
                    min="0"
                    placeholder="Örn: 500"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 500 }}>
                  {message}
                </span>
                <button type="submit" className="btn btn-primary" disabled={savingData} style={{ padding: '0.5rem 1.5rem' }}>
                  {savingData ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
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

          {/* Package Breakdown */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--primary)' }}>
              📦 Paket Dağılım Detayı (Bu Ay)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Market Paketleri:</span>
                <span style={{ fontWeight: 600 }}>{results.totalMarketPackages} Paket</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Yemek (0-4 Km):</span>
                <span style={{ fontWeight: 600 }}>{results.totalFood0_4} Paket</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Yemek (4-6 Km - +25 TL):</span>
                <span style={{ fontWeight: 600 }}>{results.totalFood4_6} Paket</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Yemek (+6 Km - +35 TL):</span>
                <span style={{ fontWeight: 600 }}>{results.totalFood6plus} Paket</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontWeight: 700 }}>
                <span>Toplam Paket Sayısı:</span>
                <span>{results.totalPackages} Paket</span>
              </div>
            </div>
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
          
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Yukarıdaki döküm kuryenin aylık verileriyle kuruşu kuruşuna fatura eşleşmesi sunar.
          </div>
        </div>

      </div>
    </div>
  );
}
