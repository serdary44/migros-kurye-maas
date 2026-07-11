# Proje Amaçları ve Kapsamı - Migros Kurye Maaş Hesaplayıcı

Bu proje, Migros kuryelerinin günlük ve aylık hak edişlerini, bonuslarını, KDV ve tevkifat kesintilerini kuruşu kuruşuna hesaplayabilecekleri ve verilerini geçmişe dönük saklayabilecekleri premium bir web uygulamasıdır.

## 1. Ana Hedefler (Core Goals)
* **Kuruşu Kuruşuna Doğruluk:** Paket Taxi / Migros kuryelerinin mutabakat tablolarına birebir uyan, KDV ve 2/10 Tevkifat kesintilerini de hesaba katan hatasız bir finansal hesaplayıcı sunmak.
* **Hızlı Hesaplama Paneli (One-Off):** Kayıt olmadan, kuryelerin hızlıca o ayki toplam saatlerini ve paketlerini girip alacakları net ücreti görebilecekleri pratik bir araç.
* **Kişiselleştirilmiş Kurye Paneli (Supabase Entegre):** Üyelik sistemi sayesinde kuryelerin kendi çalışma loglarını gün gün kaydedip, ay sonunda ne kadar kazanacaklarını anlık olarak takip edebilmesi.
* **Kapsamlı Ayarlar (Dinamik Parametreler):** Saatlik ücret (177 TL), kıdem yılı desteği (2250 TL), yardım fonu (180 TL), motor taksiti/aidatı (1200 TL) gibi değişkenlerin değiştirilebilir olması.

## 2. Kapsam ve Özellikler (Scope & Features)

### A. Hesaplama Algoritması
* **Sabit Gelir:** Çalışılan Saat × Saatlik Ücret (Varsayılan 177 TL).
* **Günlük Paket Primi:** Günlük atılan paket sayısına göre belirlenen barem (20 pakette 255 TL, 38 pakette 1595 TL vb.).
* **Aylık Paket Bonusu:** Aylık toplam paket sayısına göre belirlenen toplu bonus baremi (700 pakette 12.800 TL, 1000 pakette 33.408 TL vb.).
* **Yemek Mesafe Destekleri:** Migros Yemek paketlerinde 4-6 Km arası için paket başı +25 TL, 6 Km üzeri için paket başı +35 TL ek gelir.
> [!WARNING]
> **İptal Edilen Paketler:** İptal edilen paketler kesinlikle toplam paket sayılarına dahil edilmez; kuryeye günlük prim, aylık bonus veya herhangi bir ek ücret kazandırmaz. Hesaplama yapılırken yalnızca "Teslim Edildi" durumundaki paketler dikkate alınır.

* **KDV ve Tevkifat Hesaplaması:**
  * Brüt Gelir = Sabit Gelir + Günlük Prim Toplamı + Aylık Bonus + Mesafe Destekleri + Kıdem Desteği.
  * Tutar (KDV Hariç Net) = Brüt Gelir - Kesintiler (Yardım Fonu).
  * KDV (%20) = Tutar × 0.20.
  * Tevkifat (2/10) = KDV × 0.20.
  * Toplam Fatura Tutarı = Tutar + KDV - Tevkifat.
  * Ödenecek Tutar (Net Ele Geçen) = Toplam Fatura Tutarı - Mahsup Edilenler (Aidat & Taksit).

### B. Kullanıcı Arayüzü (UI/UX)
* **Hızlı Hesaplama Paneli (Misafir Kullanıcı):** Aylık toplam verileri girip hızlıca net kazancı hesaplama.
* **Günlük Kayıt Paneli (Giriş Yapmış Kullanıcı):** Gün gün takvim üzerinden çalışılan saat, paket sayısı, yemek paketi mesafe dağılımlarını kaydetme.
* **Özet Tablolar ve Grafikler:** Ayın o gününe kadar olan birikmiş geliri, kalan günlerdeki hedefleri ve grafiksel gelir dağılımını gösteren gösterge paneli (Dashboard).
* **Geçmiş Ayların Mutabakatı:** Tamamlanan ayların verilerini arşivleme, düzenleme ve silme.

## 3. Teknoloji Yığını (Tech Stack)
* **Frontend:** React.js (Vite) + Vanilla CSS (Sleek Dark Mode ve Cam Morfolojisi).
* **Database & Auth:** Supabase (Kullanıcı kaydı, günlük çalışma logları, kişisel ayarlar tablosu).
* **Hosting:** Vercel (Çevre değişkenleri yönetimi ile hızlı ve güvenli dağıtım).
