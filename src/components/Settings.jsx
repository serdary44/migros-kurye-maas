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

export default function Settings({ 
  session, 
  couriers = [], 
  selectedCourier, 
  onRefreshCouriers,
  setSelectedCourierId 
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Settings states for selected courier
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_HOURLY_RATE);
  const [senioritySupport, setSenioritySupport] = useState(DEFAULT_SENIORITY_SUPPORT);
  const [reliefFund, setReliefFund] = useState(DEFAULT_RELIEF_FUND);
  const [duesInstallments, setDuesInstallments] = useState(DEFAULT_DUES_INSTALLMENTS);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [withholdingRate, setWithholdingRate] = useState(DEFAULT_WITHHOLDING_RATE);

  // New courier state
  const [newCourierName, setNewCourierName] = useState('');
  const [addingCourier, setAddingCourier] = useState(false);

  // Load selected courier details into states
  useEffect(() => {
    if (selectedCourier) {
      setName(selectedCourier.name || '');
      setHourlyRate(selectedCourier.hourly_rate ?? DEFAULT_HOURLY_RATE);
      setSenioritySupport(selectedCourier.seniority_support ?? DEFAULT_SENIORITY_SUPPORT);
      setReliefFund(selectedCourier.relief_fund ?? DEFAULT_RELIEF_FUND);
      setDuesInstallments(selectedCourier.dues_installments ?? DEFAULT_DUES_INSTALLMENTS);
      setVatRate(selectedCourier.vat_rate ?? DEFAULT_VAT_RATE);
      setWithholdingRate(selectedCourier.withholding_rate ?? DEFAULT_WITHHOLDING_RATE);
    }
  }, [selectedCourier]);

  // Update selected courier in DB
  async function updateCourierSettings(e) {
    e.preventDefault();
    if (!selectedCourier) return;

    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const updates = {
        name,
        hourly_rate: parseFloat(hourlyRate),
        seniority_support: parseFloat(senioritySupport),
        relief_fund: parseFloat(reliefFund),
        dues_installments: parseFloat(duesInstallments),
        vat_rate: parseFloat(vatRate),
        withholding_rate: parseFloat(withholdingRate),
      };

      const { error } = await supabase
        .from('couriers')
        .update(updates)
        .eq('id', selectedCourier.id);

      if (error) throw error;
      
      setMessage({ text: 'Kurye ayarları başarıyla güncellendi.', type: 'success' });
      onRefreshCouriers();
      
      // Auto-hide success message
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (error) {
      console.error('Error updating courier:', error.message);
      setMessage({ text: 'Ayarlar kaydedilirken hata oluştu: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // Add new courier
  async function handleAddCourier(e) {
    e.preventDefault();
    if (!newCourierName.trim()) return;

    try {
      setAddingCourier(true);
      const { data, error } = await supabase
        .from('couriers')
        .insert([{ 
          manager_id: session.user.id, 
          name: newCourierName.trim() 
        }])
        .select();

      if (error) throw error;

      setNewCourierName('');
      setMessage({ text: 'Yeni kurye başarıyla eklendi.', type: 'success' });
      onRefreshCouriers();
      if (data && data.length > 0) {
        setSelectedCourierId(data[0].id);
      }
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (error) {
      console.error('Error adding courier:', error.message);
      setMessage({ text: 'Kurye eklenirken hata oluştu: ' + error.message, type: 'error' });
    } finally {
      setAddingCourier(false);
    }
  }

  // Delete courier
  async function handleDeleteCourier(courierId, courierName) {
    if (couriers.length <= 1) {
      alert("Sistemde en az bir kurye bulunmalıdır. Son kalan kuryeyi silemezsiniz.");
      return;
    }

    if (!window.confirm(`"${courierName}" kuryesini ve kuryeye ait tüm çalışma takvimini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('couriers')
        .delete()
        .eq('id', courierId);

      if (error) throw error;

      setMessage({ text: 'Kurye ve tüm verileri silindi.', type: 'success' });
      
      // If we deleted the currently selected courier, switch to another one
      if (selectedCourier && selectedCourier.id === courierId) {
        const remaining = couriers.filter(c => c.id !== courierId);
        if (remaining.length > 0) {
          setSelectedCourierId(remaining[0].id);
        }
      }
      onRefreshCouriers();
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (error) {
      console.error('Error deleting courier:', error.message);
      setMessage({ text: 'Kurye silinirken hata oluştu.', type: 'error' });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="section-header">
        <h2 className="section-title">👥 Ekip & Kurye Yönetimi</h2>
        <p className="section-subtitle">Bu panelden ekip arkadaşlarını yönetebilir, yeni kuryeler ekleyebilir ve her kuryenin hak ediş oranlarını ayrı ayrı düzenleyebilirsiniz.</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ margin: 0 }}>
          {message.text}
        </div>
      )}

      {/* Grid containing Couriers List & Selected Courier settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
        {/* Left Side: Couriers List & Add Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add New Courier Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ➕ Yeni Kurye Ekle
            </h3>
            <form onSubmit={handleAddCourier} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Kurye Adı / Plaka" 
                value={newCourierName}
                onChange={(e) => setNewCourierName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={addingCourier}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {addingCourier ? '...' : 'Ekle'}
              </button>
            </form>
          </div>

          {/* List of Couriers */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', margin: 0 }}>
              Kurye Listesi ({couriers.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {couriers.map(c => {
                const isActive = selectedCourier && selectedCourier.id === c.id;
                return (
                  <div 
                    key={c.id} 
                    className="glass-card"
                    style={{ 
                      padding: '0.75rem 1rem', 
                      margin: 0,
                      background: isActive ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '1px solid var(--primary-glow)' : '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div 
                      onClick={() => setSelectedCourierId(c.id)}
                      style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                      <div>
                        <div style={{ fontWeight: 600, color: isActive ? 'var(--primary-glow)' : 'var(--text-main)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.hourly_rate} TL/saat</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteCourier(c.id, c.name)}
                      className="nav-btn btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: 'none', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                      title="Kuryeyi Sil"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Settings for Selected Courier */}
        {selectedCourier ? (
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary-glow)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ "{selectedCourier.name}" Oran & Kesinti Ayarları
            </h3>
            
            <form onSubmit={updateCourierSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label className="form-label">Kurye Adı / Görünüm İsmi</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Saatlik Mesai Ücreti (TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="glass-input" 
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Saatlik ödeme (Region 2-3 standart: 177 TL)
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
                    Sabit kıdem desteği (Örn: 2. Yıl desteği 2250 TL)
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
                    KDV hariç düşülen yardım fonu (Standart: 180 TL)
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
                    Motor, ekipman taksit kesintileri (Standart: 1200 TL)
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
                    Fatura KDV oranı (Standart: %20)
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
                    KDV tevkifat oranı (2/10 Tevkifat = %20)
                  </span>
                </div>
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
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            Lütfen sol taraftan ayarlarını düzenlemek istediğiniz bir kuryeyi seçin.
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Ayar güncellemesi yaptıktan sonra Gösterge Paneli ekranından hesaplamaların yeni oranlarla çalıştığını kontrol edebilirsiniz.
      </div>
    </div>
  );
}
