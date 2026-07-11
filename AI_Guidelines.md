# AI Guidelines - Migros Kurye Maaş Hesaplayıcı

Bu proje boyunca yapay zeka modelinin (Antigravity) uyması gereken kurallar ve kılavuz ilkeler aşağıda listelenmiştir. Bu kurallara %100 uyulacaktır.

## 1. Kod Yapısı ve Modülerlik
* **Modüler Geliştirme:** Bütün kodu tek bir dosyaya yazmak kesinlikle yasaktır. Proje, mantıksal katmanlara (Hooks, Bileşenler, Yardımcı Fonksiyonlar, Ayarlar) ayrılmalıdır.
* **Tek Sorumluluk İlkesi (Single Responsibility):** Her dosya/bileşen sadece tek bir görevi üstlenmelidir.
* **Satır Sınırı:** Hiçbir kod dosyası **800 ile 1000 satır** arasını kesinlikle geçmemelidir. Eğer sınır aşılıyorsa kod parçalanmalı ve yeni modüller oluşturulmalıdır.
* **Temiz Kod:** Gereksiz karmaşıklıktan kaçınılmalı, kod içi yorumlar ve tip tanımlamaları (TypeScript veya net JSDoc açıklamaları) eksiksiz yazılmalıdır.

## 2. Tasarım ve Estetik (Premium UI)
* **Görsel Mükemmellik:** Browser varsayılan renkleri veya standart basit renkler kullanılmayacaktır. HSL ile ayarlanmış uyumlu renk paletleri, şık koyu mod (sleek dark mode) ve cam morfolojisi (glassmorphism) tercih edilecektir.
* **Font ve Tipografi:** Google Fonts üzerinden modern fontlar (Inter veya Outfit) kullanılacaktır.
* **Mikro Animasyonlar:** Buton hover efektleri, geçişler, kart açılmaları ve veri güncellemeleri yumuşak CSS geçişleri (transitions/animations) ile zenginleştirilecektir.
* **Responsive Tasarım:** Uygulama hem mobil cihazlarda (kuryelerin sahada telefonlarından kullanabilmesi için) hem de masaüstünde kusursuz görünecektir.

## 3. Test ve Doğrulama
* **Anında Test Hatırlatması:** Eklenen her yeni özellikten sonra, kullanıcının bu özelliği test etmesi için net bir hatırlatma yapılacaktır.
* **Matematiksel Sağlama:** Maaş hesaplama algoritmaları kuruşu kuruşuna doğrulanabilir olmalıdır.
* **İptal Paket Kısıtı:** İptal edilen paketlerin toplam paket sayısına, prim veya bonus hesaplamasına kesinlikle dahil edilmediği kodda garanti altına alınmalıdır. Giriş alanlarında buna dair net açıklamalar bulunmalıdır.

## 4. Bellek Bankası (Memory Bank) ve Dokümantasyon
* Projede yapılan her kritik değişiklik, hata düzeltmesi veya yeni eklenen özellik sonrasında `memory_bank/Memory_bank.md` dosyası güncellenecektir.
* Güncellemeler hem mevcut modelin durum takibi hem de sonraki oturumlarda projeyi devralacak yapay zeka modelleri için kılavuz niteliğinde olacaktır.
