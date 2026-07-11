import React, { useState } from 'react';
import { supabase } from '../supabase/supabaseClient.js';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({
          text: 'Kayıt başarılı! E-posta adresinize gönderilen onay linkine tıklayarak hesabınızı aktifleştirin, ardından giriş yapabilirsiniz.',
          type: 'success'
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Auth error:', error.message);
      let errorMsg = error.message;
      if (error.message === 'Invalid login credentials') {
        errorMsg = 'Hatalı e-posta adresi veya şifre girdiniz.';
      }
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-page" style={{ maxWidth: '420px', margin: '4rem auto 0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          MİGROS KURYE MAAŞ
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Çalışma loglarınızı kaydedin ve gelirinizi anlık takip edin.
        </p>
      </div>

      <div className="tab-container" style={{ margin: '0 auto 1.5rem auto' }}>
        <button 
          className={`tab-btn ${!isSignUp ? 'active' : ''}`}
          onClick={() => { setIsSignUp(false); setMessage({ text: '', type: '' }); }}
        >
          Giriş Yap
        </button>
        <button 
          className={`tab-btn ${isSignUp ? 'active' : ''}`}
          onClick={() => { setIsSignUp(true); setMessage({ text: '', type: '' }); }}
        >
          Kayıt Ol
        </button>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--primary)' }}>
          {isSignUp ? 'Yeni Hesap Oluştur' : 'Hesabınıza Giriş Yapın'}
        </h3>

        {message.text && (
          <div className="alert-box" 
               style={{ 
                 background: message.type === 'success' ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                 borderColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                 color: message.type === 'success' ? 'hsl(142, 70%, 80%)' : 'hsl(350, 80%, 80%)',
                 fontSize: '0.8rem',
                 padding: '0.75rem',
                 marginBottom: '1.25rem'
               }}
          >
            <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
            <div>{message.text}</div>
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">E-Posta Adresi</label>
            <input 
              type="email" 
              className="glass-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@kurye.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input 
              type="password" 
              className="glass-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength="6"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Lütfen bekleyin...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Giriş yapmadan denemek için üst menüden <strong>Hızlı Hesaplama</strong> seçeneğini kullanabilirsiniz.
      </div>
    </div>
  );
}
