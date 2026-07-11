import React from 'react';
import { supabase } from '../supabase/supabaseClient.js';

export default function Layout({ children, currentTab, setCurrentTab, session }) {
  const handleLogout = async () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Floating Glass Nav Bar */}
      <nav className="nav-bar">
        <div className="nav-logo">
          <span>🏍️</span> Migros Kurye Maaş
        </div>
        
        <div className="nav-links">
          {!session ? (
            // Guest Navigation Links
            <>
              <button 
                onClick={() => setCurrentTab('quickCalc')}
                className={`nav-btn ${currentTab === 'quickCalc' ? 'active' : ''}`}
              >
                Hızlı Hesaplama
              </button>
              <button 
                onClick={() => setCurrentTab('auth')}
                className={`nav-btn ${currentTab === 'auth' ? 'active' : ''}`}
                style={{
                  background: 'var(--primary-glow)',
                  borderColor: 'var(--border-focus)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-light)'
                }}
              >
                Giriş / Kayıt
              </button>
            </>
          ) : (
            // Authenticated Navigation Links
            <>
              <button 
                onClick={() => setCurrentTab('dashboard')}
                className={`nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
              >
                Gösterge Paneli
              </button>
              <button 
                onClick={() => setCurrentTab('calendar')}
                className={`nav-btn ${currentTab === 'calendar' ? 'active' : ''}`}
              >
                Çalışma Takvimi
              </button>
              <button 
                onClick={() => setCurrentTab('settings')}
                className={`nav-btn ${currentTab === 'settings' ? 'active' : ''}`}
              >
                Ayarlar
              </button>
              
              {/* User Email Badge */}
              <span style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)', 
                background: 'rgba(255,255,255,0.03)', 
                padding: '0.4rem 0.8rem', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={session.user.email}>
                👤 {session.user.email}
              </span>

              <button 
                onClick={handleLogout}
                className="nav-btn btn-danger"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Çıkış Yap
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ flex: 1 }}>
        <div className="container">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '2rem 1.5rem', 
        textAlign: 'center', 
        borderTop: '1px solid var(--border-light)', 
        background: 'rgba(13, 17, 28, 0.4)', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        marginTop: '3rem'
      }}>
        <div>© 2026 Migros Kurye Maaş Hesaplayıcı. Tüm hakları saklıdır.</div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
          Bu uygulama, kurye arkadaşların aylık hakedişlerini hesaplamalarına yardımcı olmak için tasarlanmıştır. Lütfen sonuçları mutabakat faturanız ile test edin.
        </div>
      </footer>

    </div>
  );
}
