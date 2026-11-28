# Proje notları — yapılanlar ve yapılacaklar

Kitap okurken beğenilen yerleri fotoğraflayıp metne çeviren, kitaba göre saklayan ve paylaşan uygulama.
İsim ve logo henüz belli değil (şimdilik "Kitap Alıntılarım").

Canlı adres: https://kitap-alintilarim.vercel.app (Vercel, "mete" ekibi, proje: `kitap-alintilarim`)
Geliştirme dalı: `claude/cool-goodall-porx9d`

## Yapılanlar

- [x] PWA (React + TypeScript + Vite), telefonda ana ekrana eklenebilir, çevrimdışı çalışır
- [x] Kişiye özel kitaplık: kitap ekle, durum (okuyorum / okudum / okuyacağım), yıldız puanı
- [x] Fotoğrafla alıntı: kamera → alanı parmakla çerçevele → metne çevir → düzenle → kaydet
  - Döndürme, "devamını fotoğrafla ekle" (iki sayfalık alıntılar), tireli kelimeleri birleştirme
  - Sayfa numarası seçimde varsa otomatik "Sayfa" alanına yazılıyor
- [x] Alıntıya kendi notunu ekleme, favori (♥)
- [x] Paylaşım: WhatsApp / telefonun paylaş menüsü, görsel alıntı kartı (1080×1350), kitabın tüm alıntılarını tek mesajda
- [x] Hatırla: rastgele eski alıntı, sadece favoriler, "geçmişte bu gün"; ana sayfada "Günün alıntısı"
- [x] Arama (Türkçe karakter farkı gözetmeden), profil istatistikleri, metin/JSON yedek ve geri yükleme
- [x] Vercel'e yayın; ana adres herkese açık (standart koruma)
- [x] Metin okuma iki katmanlı (`src/lib/ocr.ts`, `api/ocr.ts`):
  - Claude ile okuma (sunucu fonksiyonu) — kıvrık sayfa, gölge, karşı sayfa ve başlık sorununu çözmek için
  - Yedek: cihazdaki Tesseract (Türkçe), adaptif eşikleme + düşük güvenli kelime filtresi
  - Gerçek bir kitap fotoğrafında (Kâtibin Kaleminden, s. 79) Tesseract karşı sayfayı ve kıvrık satırları karıştırdı; bu yüzden Claude'a geçildi

- [x] **Arayüz yenilendi** (örnek: aposto.com + lezzetgunleri.com)
  - Aposto'dan: açık gri zemin üstünde yüzen beyaz kartlar, serif başlıklar, küçük büyük harfli etiketler,
    ince ayraçlı sekmeler, mavi vurgu (#4956ea), sarı "Favori" etiketi, "kitap | yazar | sayfa" bilgi satırı
  - Lezzet Günleri'nden: lacivert (#0f172a) hap butonlar, yüzen hap alt menü, italik serif vurgulu giriş başlığı,
    renkli istatistik kartları, bölmeli (segmented) seçimler
  - Fontlar: Aposto'nunkiler **Graphik** + **Canela / Canela Text** (Commercial Type, ücretli lisans).
    Kodda ilk sırada onlar var; lisans alınınca `src/fonts.css` içindeki yorum kaldırılıp dosyalar
    `public/fonts/` içine konacak. Şimdilik en yakın ücretsiz karşılıklar gömülü: Hanken Grotesk + Newsreader
  - Paylaşım kartı da yeni tasarıma geçti
- [x] Telefon testinden düzeltmeler (kullanıcı geri bildirimi):
  - iPhone'da klavye açılınca alttan açılan pencere kayboluyordu → pencere görünen alana (visualViewport) göre konumlanıyor
  - "⋯" menüsü dışarı dokununca / kaydırınca kapanıyor
  - Alıntıda görünür "Görsel" butonu: canlı önizleme, 3 format (Kare 1080×1080, Dikey 1080×1350,
    Hikâye 1080×1920) ve 3 tema (Açık, Gece, Kitap rengi); son seçim hatırlanıyor

## Bekleyen (kullanıcıdan)

- [ ] **`ANTHROPIC_API_KEY`** Vercel'e eklenecek (Settings → Environment Variables), sonra yeniden yayın.
      Eklenene kadar uygulama yedek OCR ile çalışıyor. Claude okuması henüz gerçek fotoğrafla denenmedi.
- [ ] Anthropic Console'da aylık harcama sınırı koymak
- [ ] İsim ve logo

## Yapılacaklar

- [ ] Graphik + Canela web lisansı alınırsa font dosyalarını eklemek (bkz. `src/fonts.css`)
- [ ] E-posta ile giriş + bulut eşitleme (Supabase): şema hazır (`supabase/schema.sql`), adımlar README'de
- [ ] `/api/ocr` uç noktasını sadece giriş yapmış kullanıcılara açmak (şu an adresi bilen herkes kullanabilir)
- [ ] Claude okumasını gerçek kitap fotoğraflarıyla denemek ve talimatı (prompt) gerekirse iyileştirmek
- [ ] Fikirler: etiketler/temalar, okuma hedefi, kitap kapağı arama (ISBN), alıntıdan hikâye kartı için tema seçenekleri
