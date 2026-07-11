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
  // Input states (initialized empty as requested by user)
  const [daysWorked, setDaysWorked] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [monthlyExtraHours, setMonthlyExtraHours] = useState('');
  
  // Package inputs
  const [marketPackages, setMarketPackages] = useState(''); // Normal packages (Market + Yemek 0-4 Km)
  const [food4_6, setFood4_6] = useState('');
  const [food6plus, setFood6plus] = useState('');
  const [extraPremiumsInput, setExtraPremiumsInput] = useState('');
  
  // Configuration inputs
  const [showConfig, setShowConfig] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [senioritySupport, setSenioritySupport] = useState(DEFAULT_SENIORITY_SUPPORT);
  const [reliefFund, setReliefFund] = useState(DEFAULT_RELIEF_FUND);
  const [duesInstallments, setDuesInstallments] = useState(DEFAULT_DUES_INSTALLMENTS);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [withholdingRate, setWithholdingRate] = useState(DEFAULT_WITHHOLDING_RATE);

  // Document metadata states for receipt styling
  const [workingYear, setWorkingYear] = useState('2');
  const [startDate, setStartDate] = useState('04.2024');
  const [region, setRegion] = useState('ANKARA');
  const [customer, setCustomer] = useState('HEMEN');
  const [vehicle, setVehicle] = useState('HONDA');
  const [invoiceNote, setInvoiceNote] = useState('HAZİRAN MOTOR HAK EDİŞ BEDELİ');
  const [invoiceNote2, setInvoiceNote2] = useState('eren.atasever@pakettaxi.com.tr');

  // Memoized calculations
  const results = useMemo(() => {
    const monthlyData = {
      days_worked: parseInt(daysWorked) || 0,
      total_hours: parseFloat(totalHours) || 0,
      market_packages: parseInt(marketPackages) || 0,
      food_packages_4_6: parseInt(food4_6) || 0,
      food_packages_6plus: parseInt(food6plus) || 0
    };

    const settings = {
      hourly_rate: hourlyRate,
      seniority_support: senioritySupport,
      relief_fund: reliefFund,
      dues_installments: duesInstallments,
      vat_rate: vatRate,
      withholding_rate: withholdingRate,
      monthly_extra_hours: parseFloat(monthlyExtraHours) || 0,
      monthly_extra_premiums: parseFloat(extraPremiumsInput) || 0
    };

    return calculateFromMonthlyAverages(monthlyData, settings);
  }, [
    daysWorked, totalHours, monthlyExtraHours, extraPremiumsInput,
    marketPackages, food4_6, food6plus,
    hourlyRate, senioritySupport, reliefFund, duesInstallments,
    vatRate, withholdingRate
  ]);

  const totalPackages = (parseInt(marketPackages) || 0) + (parseInt(food4_6) || 0) + (parseInt(food6plus) || 0);

  // Format helper
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
          Giriş yapmadan, sadece bu ayki toplam verilerinizi girerek KDV, Tevkifat ve tüm kesintiler sonrası banka hesabınıza yatacak net ücreti faturanızla birebir formatta hesaplayın.
        </p>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem' }}>
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
                  onChange={(e) => setDaysWorked(e.target.value)}
                  placeholder="Örn: 26"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Online Süre (Saat)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="glass-input" 
                  value={totalHours}
                  onChange={(e) => setTotalHours(e.target.value)}
                  placeholder="Örn: 296.66"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Aylık Ekstra Mesai (Saat)</label>
                <input 
                  type="number" 
                  step="0.5"
                  className="glass-input" 
                  value={monthlyExtraHours}
                  onChange={(e) => setMonthlyExtraHours(e.target.value)}
                  placeholder="Örn: 4.5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Aylık Diğer Primler (TL)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="glass-input" 
                  value={extraPremiumsInput}
                  onChange={(e) => setExtraPremiumsInput(e.target.value)}
                  placeholder="Örn: 500"
                />
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
              Ekstra mesailer saatlik ücretle çarpılarak Sabit Çalışma Gelirlerinize eklenecektir.
            </span>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)' }}>📦</span> Dağıtılan Paketler
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Normal Paketler (Market + Yemek 0-4 Km)</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={marketPackages}
                  onChange={(e) => setMarketPackages(e.target.value)}
                  placeholder="Normal Sipariş Toplamı (Örn: 1024)"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Yemek 0-4 Km paketleri normal market paketi gibi hesaplandığından buraya dahil edilmelidir.
                </span>
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
            </div>
          </div>

          {/* Settings Section */}
          <div className="glass-card">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>⚙️ Fatura Parametreleri ve Notları</span>
              <span>{showConfig ? '▲' : '▼'}</span>
            </button>

            {showConfig && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                
                <h4 style={{ color: 'var(--primary-glow)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Fatura Notları & Bilgileri</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Çalışma Yılı / Giriş Tarihi</label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input type="text" className="glass-input" value={workingYear} onChange={(e) => setWorkingYear(e.target.value)} style={{ width: '60px' }} />
                      <input type="text" className="glass-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bölge / Araç / Müşteri</label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input type="text" className="glass-input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="ANKARA" />
                      <input type="text" className="glass-input" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="HONDA" style={{ width: '80px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Fatura Notu 1</label>
                    <input type="text" className="glass-input" value={invoiceNote} onChange={(e) => setInvoiceNote(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fatura Notu 2</label>
                    <input type="text" className="glass-input" value={invoiceNote2} onChange={(e) => setInvoiceNote2(e.target.value)} />
                  </div>
                </div>

                <h4 style={{ color: 'var(--primary-glow)', margin: '0.5rem 0 0.5rem 0', fontSize: '0.9rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>Oran ve Kesinti Ayarları</h4>
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
                    <label className="form-label">Tevkifat Oranı (%)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      value={withholdingRate}
                      onChange={(e) => setWithholdingRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>
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
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{totalPackages}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Hemen Çalışma Gün Sayısı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{daysWorked || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Toplam Çalışma Gün Sayısı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{daysWorked || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', minWidth: '180px' }}>Hemen Mesai Sayısı</span>
                  <span style={{ width: '20px', textAlign: 'center', color: '#9ca3af' }}>:</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{results.grandTotalHours || 0}</span>
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
