import React, { useState, useMemo } from 'react';
import { calculateFromMonthlyAverages } from '../utils/calculator.js';
import { 
  DEFAULT_HOURLY_RATE, 
  DEFAULT_SENIORITY_SUPPORT, 
  DEFAULT_RELIEF_FUND, 
  DEFAULT_DUES_INSTALLMENTS,
  DEFAULT_VAT_RATE,
  DEFAULT_WITHHOLDING_RATE
} from '../utils/constants.js';

export default function QuickCalc() {
  // Input states
  const [daysWorked, setDaysWorked] = useState(26);
  const [totalHours, setTotalHours] = useState(296.66);
  const [monthlyExtraHours, setMonthlyExtraHours] = useState(0);
  
  // Package inputs
  const [marketPackages, setMarketPackages] = useState(900);
  const [food0_4, setFood0_4] = useState(124);
  const [food4_6, setFood4_6] = useState(22);
  const [food6plus, setFood6plus] = useState(2);
  
  // Configuration inputs (can be toggled open)
  const [showConfig, setShowConfig] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [senioritySupport, setSenioritySupport] = useState(DEFAULT_SENIORITY_SUPPORT);
  const [reliefFund, setReliefFund] = useState(DEFAULT_RELIEF_FUND);
  const [duesInstallments, setDuesInstallments] = useState(DEFAULT_DUES_INSTALLMENTS);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [withholdingRate, setWithholdingRate] = useState(DEFAULT_WITHHOLDING_RATE);
  const [packetPremiumRate, setPacketPremiumRate] = useState(0.50);

  // Memoized calculations
  const results = useMemo(() => {
    const monthlyData = {
      days_worked: daysWorked,
      total_hours: totalHours,
      market_packages: marketPackages,
      food_packages_0_4: food0_4,
      food_packages_4_6: food4_6,
      food_packages_6plus: food6plus
    };

    const settings = {
      hourly_rate: hourlyRate,
      seniority_support: senioritySupport,
      relief_fund: reliefFund,
      dues_installments: duesInstallments,
      vat_rate: vatRate,
      withholding_rate: withholdingRate,
      packet_premium_rate: packetPremiumRate,
      monthly_extra_hours: monthlyExtraHours
    };

    return calculateFromMonthlyAverages(monthlyData, settings);
  }, [
    daysWorked, totalHours, monthlyExtraHours,
    marketPackages, food0_4, food4_6, food6plus,
    hourlyRate, senioritySupport, reliefFund, duesInstallments,
    vatRate, withholdingRate, packetPremiumRate
  ]);

  const totalPackages = marketPackages + food0_4 + food4_6 + food6plus;

  // Format helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  return (
    <div className="animated-page">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
          Hızlı Maaş Hesaplama Paneli
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Giriş yapmadan, sadece bu ayki toplam verilerinizi girerek KDV, Tevkifat ve tüm kesintiler sonrası banka hesabınıza yatacak net ücreti kuruşu kuruşuna hesaplayın.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)' }}>🕒</span> Mesai & Çalışma Günleri
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Çalışılan Gün Sayısı</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={daysWorked}
                  onChange={(e) => setDaysWorked(Math.max(1, parseInt(e.target.value) || 0))}
                  min="1"
                  max="31"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Online Süre (Saat)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="glass-input" 
                  value={totalHours}
                  onChange={(e) => setTotalHours(Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Aylık Ekstra Mesai (Saat)</span>
                <span style={{ color: 'var(--primary)', textTransform: 'none', fontWeight: 500 }}>*Migros'un ayrıca eklediği saatler</span>
              </label>
              <input 
                type="number" 
                step="0.5"
                className="glass-input" 
                value={monthlyExtraHours}
                onChange={(e) => setMonthlyExtraHours(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                placeholder="Örn: 4.5"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                12 saat sınırı dışındaki ekstra mesaileriniz burada belirttiğiniz saat kadar saatlik ücretle çarpılarak Sabit Gelirlerinize eklenecektir.
              </span>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)' }}>📦</span> Dağıtılan Paketler
            </h3>
            
            <div className="alert-box info" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span>
              <div>
                <strong>İptal Paket Bilgilendirmesi:</strong> İptal edilen paketler hak ediş veya bonus hesaplamalarına dahil edilmez. Lütfen sadece <strong>teslim edilen</strong> paket sayılarını girin.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Market Paketleri</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={marketPackages}
                  onChange={(e) => setMarketPackages(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  placeholder="Sanal Mkt + Hemen + Paket Taxi"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Yemek (0-4 Km) Paketleri</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={food0_4}
                  onChange={(e) => setFood0_4(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Yemek (4-6 Km)</span>
                  <span style={{ color: 'var(--success)' }}>+25 TL/pkt</span>
                </label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={food4_6}
                  onChange={(e) => setFood4_6(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
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
                  onChange={(e) => setFood6plus(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="glass-card">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>⚙️ Gelişmiş Parametreleri Düzenle</span>
              <span>{showConfig ? '▲' : '▼'}</span>
            </button>

            {showConfig && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Saatlik Ücret (TL)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kıdem Desteği (TL)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      value={senioritySupport}
                      onChange={(e) => setSenioritySupport(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Yardım Fonu (Kesinti)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      value={reliefFund}
                      onChange={(e) => setReliefFund(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Aidat & Taksit (Kesinti)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      value={duesInstallments}
                      onChange={(e) => setDuesInstallments(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">KDV Oranı (%)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      value={vatRate}
                      onChange={(e) => setVatRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tevkifat Oranı (2/10 = %20)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      value={withholdingRate}
                      onChange={(e) => setWithholdingRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Paket Başı Ek Prim (TL/pkt)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    className="glass-input" 
                    value={packetPremiumRate}
                    onChange={(e) => setPacketPremiumRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Faturadaki "Migros Paketbaşı Primi" için paket başına ek ödeme (Varsayılan: 0.50 TL)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Net Pay Card */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, hsla(222, 47%, 11%, 0.9) 0%, hsla(25, 100%, 50%, 0.05) 100%)', borderColor: 'rgba(255, 111, 0, 0.2)' }}>
            <span className="stat-label" style={{ color: 'var(--primary)' }}>Hesaba Yatacak Net Tutar</span>
            <div className="stat-value success" style={{ fontSize: '2.5rem', margin: '0.5rem 0', textShadow: '0 0 20px rgba(74, 222, 128, 0.2)' }}>
              {formatCurrency(results.netPayable)}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              KDV (%{vatRate}) eklenmiş, Tevkifat (%{withholdingRate}) ve {formatCurrency(duesInstallments)} Aidat/Taksit düşülmüş net banka hak edişidir.
            </p>
          </div>

          {/* Detailed Breakdown Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              📄 Hak Ediş Detayları (KDV Hariç)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Günlük/Online Sabit Gelir:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(results.cumulativeFixedIncome)}</span>
              </div>

              {results.monthlyExtraHours > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 111, 0, 0.05)', padding: '4px var(--radius-sm)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Ekstra Mesai Geliri ({results.monthlyExtraHours} sa):</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(results.extraHoursIncome)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Günlük Paket Primi Toplamı:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(results.cumulativeDailyPremium)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Yemek Mesafe Desteği:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(results.cumulativeDistanceSupport)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aylık Paket Bonusu ({totalPackages} paket):</span>
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{formatCurrency(results.monthlyBonus)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kıdem Desteği:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(results.senioritySupport)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Migros Paketbaşı Primi:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(results.migrosPacketPremium)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontWeight: 700 }}>
                <span>Toplam Brüt Kazanç:</span>
                <span>{formatCurrency(results.grossEarnings)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--error)' }}>
                <span>Yardım Fonu Kesintisi:</span>
                <span>-{formatCurrency(results.reliefFund)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                <span>Fatura Tutar Matrahı (Net Tutar):</span>
                <span>{formatCurrency(results.netEarningsPreVat)}</span>
              </div>
            </div>
          </div>

          {/* Tax Breakdown Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              🏛️ KDV & Tevkifat Hesabı
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>KDV Hesabı (%{vatRate}):</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(results.vatAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tevkifat (%{withholdingRate} - KDV'nin 2/10'u):</span>
                <span style={{ fontWeight: 600, color: 'var(--error)' }}>-{formatCurrency(results.withholdingAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Tevkifat Sonrası Fatura Toplamı:</span>
                <span>{formatCurrency(results.invoiceTotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--error)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                <span>Aidat & Motor Taksiti (Mahsup Edilen):</span>
                <span>-{formatCurrency(results.duesInstallments)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Lütfen hesaplanan bu değerlerin doğruluğunu faturanızla manuel olarak karşılaştırarak test edin.
          </div>
        </div>
      </div>
    </div>
  );
}
