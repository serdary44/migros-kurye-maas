# Memory Bank - Migros Kurye Maaş Hesaplayıcı

Bu dosya, projenin anlık durumunu, yapılan değişiklikleri ve teknik kararları saklar. Projedeki her yenilik veya düzeltme sonrasında güncellenmelidir.

## 1. Proje Durumu (Project Status)
* **Aşama:** Tamamlandı & Doğrulandı (Ready for Deployment)
* **Tarih:** 11 Temmuz 2026
* **Tamamlananlar:**
  * `AI_Guidelines.md` oluşturuldu ve kurallar tanımlandı.
  * `Project_Goals.md` oluşturuldu; KDV, Tevkifat, İptal Paket kuralları ve maaş hesaplama algoritmaları belgelendi.
  * `memory_bank/Memory_bank.md` başlatıldı.
  * React (Vite) + Tailwind/Vanilla CSS altyapısı kuruldu.
  * `src/utils/calculator.js` ve `constants.js` oluşturulup matematiksel doğrulama testi yapıldı (Haziran mutabakatı birebir doğrulandı).
  * `schema.sql` (Profiles, Daily Logs, RLS kuralları ve trigger'lar) veritabanı şeması hazırlandı.
  * `QuickCalc.jsx` misafir hızlı hesaplama modülü yazıldı.
  * `Calendar.jsx` interaktif takvim gün-bazlı log giriş arayüzü kodlandı.
  * `Dashboard.jsx` aylık ekstra mesai ve KDV/Tevkifat fatura döküm arayüzü kodlandı.
  * `Settings.jsx` ve `Auth.jsx` profil ayarları ve Supabase üyelik modülü tamamlandı.
  * `App.jsx` ve `Layout.jsx` entegrasyonu tamamlanarak üretim derlemesi (build) doğrulandı.

## 2. Teknik Kararlar ve Altyapı
* **Teknoloji:** React (Vite) + Supabase + Vercel
* **Stil:** HSL Renk Paleti ve Modern Glassmorphism (Karanlık Mod)
* **Veritabanı Yapısı:**
  * `profiles`: Kurye saatlik ücreti, kıdemi, kesintileri ve aylık manuel ekstra mesai saati bilgisini tutar.
  * `daily_logs`: Günlük online süre, market paketleri ve Yemek mesafe-bazlı paket sayılarını benzersiz tarih constraint'iyle saklar.

## 3. Yol Haritası (Roadmap)
- [x] Uygulama İskeletinin Kurulması (Vite + React)
- [x] Supabase Veritabanı ve Auth Kurulumu (SQL şeması)
- [x] Misafir Kullanıcı için Hızlı Hesaplama Paneli (Quick Calculator)
- [x] Üye Girişi ve Kayıt Ekranları (Auth)
- [x] Günlük Log Giriş Arayüzü (Takvim ve form entegrasyonu)
- [x] Dashboard (Ekstra mesai kutusu, birikmiş kazanç ve fatura dökümü)
- [x] Ayarlar Sayfası (Kişisel parametrelerin güncellenmesi)
- [x] Vercel Dağıtım Yapılandırması ve Üretim Derlemesi
