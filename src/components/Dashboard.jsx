import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/supabaseClient.js';
import { calculateMonthlyTotals } from '../utils/calculator.js';
import { 
  DEFAULT_HOURLY_RATE, 
  DEFAULT_SENIORITY_SUPPORT, 
  DEFAULT_RELIEF_FUND, 
  DEFAULT_DUES_INSTALLMENTS,
  DEFAULT_VAT_RATE,
  DEFAULT_WITHHOLDING_RATE
} from '../utils/constants.js';

export default function Dashboard({ session, logs = [], onRefreshLogs }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Profile settings state
  const [profile, setProfile] = useState({
    hourly_rate: DEFAULT_HOURLY_RATE,
    seniority_support: DEFAULT_SENIORITY_SUPPORT,
    relief_fund: DEFAULT_RELIEF_FUND,
    dues_installments: DEFAULT_DUES_INSTALLMENTS,
    vat_rate: DEFAULT_VAT_RATE,
    withholding_rate: DEFAULT_WITHHOLDING_RATE,
    packet_premium_rate: 0.50,
    monthly_extra_hours: 0
  });

  const [extraHoursInput, setExtraHoursInput] = useState(0);
  const [savingExtraHours, setSavingExtraHours] = useState(false);
  const [message, setMessage] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthYearStr = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  // Fetch profile settings
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setProfile({
            hourly_rate: data.hourly_rate ?? DEFAULT_HOURLY_RATE,
            seniority_support: data.seniority_support ?? DEFAULT_SENIORITY_SUPPORT,
            relief_fund: data.relief_fund ?? DEFAULT_RELIEF_FUND,
            dues_installments: data.dues_installments ?? DEFAULT_DUES_INSTALLMENTS,
            vat_rate: data.vat_rate ?? DEFAULT_VAT_RATE,
            withholding_rate: data.withholding_rate ?? DEFAULT_WITHHOLDING_RATE,
            packet_premium_rate: data.packet_premium_rate ?? 0.50,
            monthly_extra_hours: data.monthly_extra_hours ?? 0
          });
          setExtraHoursInput(data.monthly_extra_hours ?? 0);
        }
      } catch (error) {
        console.error('Error loading profile in dashboard:', error.message);
      }
    }

    loadProfile();
  }, [session]);

  // Filter logs for the selected month/year
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = new Date(log.log_date);
      return logDate.getFullYear() === year && logDate.getMonth() === month;
    });
  }, [logs, year, month]);

  // Calculate monthly totals
  const results = useMemo(() => {
    return calculateMonthlyTotals(filteredLogs, profile);
  }, [filteredLogs, profile]);

  // Save manual monthly extra hours
  const handleSaveExtraHours = async (e) => {
    e.preventDefault();
    if (!session?.user) return;

    try {
      setSavingExtraHours(true);
      setMessage('');
      const hours = parseFloat(extraHoursInput) || 0;

      const { error } = await supabase
        .from('profiles')
        .update({ monthly_extra_hours: hours })
        .eq('id', session.user.id);

      if (error) throw error;

      // Update local state to trigger recalculation
      setProfile(prev => ({ ...prev, monthly_extra_hours: hours }));
      setMessage('Ekstra mesai saati başarıyla kaydedildi!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving extra hours:', error.message);
      alert('Ekstra mesai saati kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setSavingExtraHours(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  return (
    <div className="animated-page">
      {/* Month selector header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
            Kurye Gösterge Paneli
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {monthYearStr} dönemi güncel durumunuz ve hak ediş analiziniz.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>◄ Önceki Ay</button>
          <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>Sonraki Ay ►</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <span className="stat-label">Çalışılan Gün</span>
          <span className="stat-value secondary">{results.daysWorked} Gün</span>
          <span className="stat-desc">Log girilen gün sayısı</span>
        </div>

        <div className="glass-card stat-card">
          <span className="stat-label">Toplam Çalışma Süresi</span>
          <span className="stat-value primary">
            {results.grandTotalHours} Saat
          </span>
          <span className="stat-desc">
            {results.totalHours} sa online + {results.monthlyExtraHours} sa ekstra
          </span>
        </div>

        <div className="glass-card stat-card">
          <span className="stat-label">Delivered Paketler</span>
          <span className="stat-value" style={{ color: 'var(--text-main)' }}>{results.totalPackages} Paket</span>
          <span className="stat-desc">İptal siparişler hariçtir</span>
        </div>

        <div className="glass-card stat-card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--success-glow) 100%)' }}>
          <span className="stat-label" style={{ color: 'var(--success)' }}>Tahmini Net Hak Ediş</span>
          <span className="stat-value success">{formatCurrency(results.netPayable)}</span>
          <span className="stat-desc">Tüm kesintiler sonrası hesaba yatan</span>
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* Left Column: Overtime Form & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Overtime Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--primary)' }}>
              🕒 Aylık Ekstra Mesai Saati Girişi
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Günde 12 saatten fazla yaptığınız mesaileri Migros uygulamaya kaydetmemekte, kendi not almaktadır. Bu not aldığınız 12 saat üzeri aylık toplam ekstra mesai saatini aşağıdaki kutuya girin:
            </p>

            <form onSubmit={handleSaveExtraHours} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Aylık Ekstra Mesai Süresi (Saat)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="glass-input"
                  value={extraHoursInput}
                  onChange={(e) => setExtraHoursInput(e.target.value)}
                  min="0"
                  placeholder="Örn: 14.5"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingExtraHours}>
                {savingExtraHours ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>

            {message && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 500 }}>
                {message}
              </div>
            )}
          </div>

          {/* Package Breakdown */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--primary)' }}>
              📦 Paket Dağılım Detayı
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

        {/* Right Column: Mutabakat Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', color: 'var(--primary)' }}>
              📋 Mutabakat Detayı
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>ÖDENEKLER (Gelirler)</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sabit Çalışma Geliri:</span>
                <span>{formatCurrency(results.cumulativeFixedIncome)}</span>
              </div>

              {results.monthlyExtraHours > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', background: 'rgba(255, 111, 0, 0.05)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--primary)' }}>Ekstra Mesai ({results.monthlyExtraHours} sa):</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(results.extraHoursIncome)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Paket Başı Gelirleri:</span>
                <span>{formatCurrency(results.cumulativeDailyPremium + results.cumulativeDistanceSupport)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aylık Paket Bonusu:</span>
                <span>{formatCurrency(results.monthlyBonus)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kıdem Desteği:</span>
                <span>{formatCurrency(results.senioritySupport)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Migros Paketbaşı Primi:</span>
                <span>{formatCurrency(results.migrosPacketPremium)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', fontWeight: 600 }}>
                <span>KESİNTİLER & MAHSUPLAR</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', color: 'var(--error)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Yardım Fonu:</span>
                <span>-{formatCurrency(results.reliefFund)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', color: 'var(--error)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aidat & Taksit (Mahsup):</span>
                <span>-{formatCurrency(results.duesInstallments)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', fontWeight: 700 }}>
                <span>VERGİ HESABI (KDV & Tevkifat)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Matrah (Net Tutar):</span>
                <span>{formatCurrency(results.netEarningsPreVat)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', color: 'var(--success)' }}>
                <span style={{ color: 'var(--text-muted)' }}>KDV (%{profile.vat_rate}):</span>
                <span>+{formatCurrency(results.vatAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', color: 'var(--error)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tevkifat (%{profile.withholding_rate}):</span>
                <span>-{formatCurrency(results.withholdingAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid var(--primary)', paddingTop: '0.75rem', fontWeight: 700, fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--primary)' }}>ÖDENECEK NET TUTAR:</span>
                <span style={{ color: 'var(--success)' }}>{formatCurrency(results.netPayable)}</span>
              </div>

            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Lütfen takvime eklediğiniz günlük verilerle hesaplanan bu aylık hak ediş tutarını test edin.
          </div>
        </div>

      </div>
    </div>
  );
}
