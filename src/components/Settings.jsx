import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient.js';
import { 
  DEFAULT_HOURLY_RATE, 
  DEFAULT_SENIORITY_SUPPORT, 
  DEFAULT_RELIEF_FUND, 
  DEFAULT_DUES_INSTALLMENTS,
  DEFAULT_VAT_RATE,
  DEFAULT_WITHHOLDING_RATE
} from '../utils/constants.js';

export default function Settings({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Settings states
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [senioritySupport, setSenioritySupport] = useState(DEFAULT_SENIORITY_SUPPORT);
  const [reliefFund, setReliefFund] = useState(DEFAULT_RELIEF_FUND);
  const [duesInstallments, setDuesInstallments] = useState(DEFAULT_DUES_INSTALLMENTS);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [withholdingRate, setWithholdingRate] = useState(DEFAULT_WITHHOLDING_RATE);
  const [packetPremiumRate, setPacketPremiumRate] = useState(0.50);

  // Fetch current user settings
  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true);
        if (!session?.user) return;

        const { data, error, status } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setHourlyRate(data.hourly_rate ?? DEFAULT_HOURLY_RATE);
          setSenioritySupport(data.seniority_support ?? DEFAULT_SENIORITY_SUPPORT);
          setReliefFund(data.relief_fund ?? DEFAULT_RELIEF_FUND);
          setDuesInstallments(data.dues_installments ?? DEFAULT_DUES_INSTALLMENTS);
          setVatRate(data.vat_rate ?? DEFAULT_VAT_RATE);
          setWithholdingRate(data.withholding_rate ?? DEFAULT_WITHHOLDING_RATE);
          setPacketPremiumRate(data.packet_premium_rate ?? 0.50);
        }
      } catch (error) {
        console.error('Error loading user profile:', error.message);
        setMessage({ text: 'Profil ayarları yüklenirken hata oluştu.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [session]);

  // Update profile in DB
  async function updateProfile(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const updates = {
        id: session.user.id,
        hourly_rate: parseFloat(hourlyRate),
        seniority_support: parseFloat(senioritySupport),
        relief_fund: parseFloat(reliefFund),
        dues_installments: parseFloat(duesInstallments),
        vat_rate: parseFloat(vatRate),
        withholding_rate: parseFloat(withholdingRate),
        packet_premium_rate: parseFloat(packetPremiumRate),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      
      setMessage({ text: 'Ayarlarınız başarıyla güncellendi.', type: 'success' });
      
      // Auto-hide success message
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      console.error('Error updating profile:', error.message);
      setMessage({ text: 'Ayarlar kaydedilirken hata oluştu: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Ayarlarınız Yükleniyor...
      </div>
    );
  }

  return (
    <div className="animated-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
          Kişisel Hesaplama Ayarları
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Kendi çalışma şartlarınıza ve sözleşmenize göre saatlik ücretinizi, kıdem desteğinizi ve diğer kesinti oranlarınızı buradan düzenleyebilirsiniz. Bu ayarlar, takviminizdeki ve özet ekranlarındaki tüm hesaplamaları dinamik olarak güncelleyecektir.
        </p>
      </div>

      {message.text && (
        <div className={`alert-box ${message.type === 'success' ? 'info' : ''}`} 
             style={{ 
               marginBottom: '1.5rem', 
               background: message.type === 'success' ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)',
               borderColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
               color: message.type === 'success' ? 'hsl(142, 70%, 80%)' : 'hsl(350, 80%, 80%)'
             }}
        >
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          <div>{message.text}</div>
        </div>
      )}

      <form onSubmit={updateProfile} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', color: 'var(--primary)' }}>
          ⚙️ Parametreler ve Katsayılar
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Saatlik Sabit Ücret (TL)</label>
            <input 
              type="number" 
              step="0.01"
              className="glass-input" 
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Standart mesai saatlik ödemesi. (2026 Region 2-3 standart: 177 TL)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Aylık Kıdem Desteği (TL)</label>
            <input 
              type="number" 
              step="0.01"
              className="glass-input" 
              value={senioritySupport}
              onChange={(e) => setSenioritySupport(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kıdeminize göre aylık sabit destek. (Örn: 2. Yıl desteği 2250 TL)
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Yardım Fonu Kesintisi (TL)</label>
            <input 
              type="number" 
              step="0.01"
              className="glass-input" 
              value={reliefFund}
              onChange={(e) => setReliefFund(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Mutabakattan KDV hariç düşülen yardım fonu kesintisi (Standart: 180 TL)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Aidat & Taksit Kesintisi (TL)</label>
            <input 
              type="number" 
              step="0.01"
              className="glass-input" 
              value={duesInstallments}
              onChange={(e) => setDuesInstallments(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Motor kiralama, ekipman vb. için net tahsilattan düşülen taksitler (Standart: 1200 TL)
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Fatura KDV Oranı (%)</label>
            <input 
              type="number" 
              step="0.1"
              className="glass-input" 
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kurye faturasına eklenen KDV oranı (Standart: %20)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">KDV Tevkifat Oranı (%)</label>
            <input 
              type="number" 
              step="0.1"
              className="glass-input" 
              value={withholdingRate}
              onChange={(e) => setWithholdingRate(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              KDV üzerinden uygulanan tevkifat oranı (2/10 Tevkifat = %20)
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Paket Başı Ek Prim Oranı (TL/paket)</label>
          <input 
            type="number" 
            step="0.001"
            className="glass-input" 
            value={packetPremiumRate}
            onChange={(e) => setPacketPremiumRate(e.target.value)}
            required
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Migros'un verdiği paket başına sabit ek prim katsayısı (Standart: 0.50 TL)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Ayar güncellemesi yaptıktan sonra Dashboard ekranından hesaplamalarınızın yeni oranlarla çalıştığını doğrulamak için test edin.
      </div>
    </div>
  );
}
