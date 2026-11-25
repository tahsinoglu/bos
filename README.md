# Kitap Alıntılarım (geçici isim)

Okurken hoşuna giden yerleri **fotoğrafla → metne çevir → kitabın altına kaydet**.
Sonra WhatsApp'tan paylaş, ara ara girip yeniden oku.

Telefonda tarayıcıdan açılır, "Ana ekrana ekle" ile normal bir uygulama gibi kullanılır (PWA).

## Neler var?

- **Kişiye özel kitaplık** — giriş yapan herkesin kendi kitapları ve alıntıları
- **Fotoğrafla alıntı** — kamerayı aç, sayfayı çek, hoşuna giden kısmı parmağınla çerçevele, *Metne çevir*
  - Metin, Claude (görüntü anlayan yapay zekâ) ile okunur: kıvrık sayfa, gölge, karşı sayfanın kenarı ve
    sayfa başlığı sorun olmaz. Anahtar tanımlı değilse ya da bağlantı yoksa telefonun içindeki Türkçe OCR'a
    (Tesseract) geçilir; o daha az isabetlidir, en iyi sonucu yalnızca alıntıyı çerçeveleyince verir
  - Satır sonundaki tireli kelimeler birleştirilir, metin düzgün paragraf olur
  - Sayfa numarası seçime girmişse otomatik bulunup "Sayfa" alanına yazılır
  - Alıntı iki sayfaya taşıyorsa: *Devamını fotoğrafla ekle*
  - Yan çekilmiş fotoğraf için döndür butonu
- **Sayfa ve kendi notun** — "s. 42" ve "bu satırlar bana ne düşündürdü"
- **Paylaş** — tek dokunuşla WhatsApp (veya telefonun paylaş menüsü); Instagram hikâyesine uygun **görsel alıntı kartı**; bir kitabın tüm alıntılarını tek mesajda paylaşma
- **Hatırla** — rastgele bir eski alıntı, sadece favoriler, "geçmişte bu gün"
- **Günün alıntısı** ana sayfada
- **Ara** — tüm alıntılarda, notlarda, kitap ve yazar adında (ş/s, ğ/g farkı gözetmeden)
- **Okuma durumu** (okuyorum / okudum / okuyacağım), bitirince yıldız puanı, yıllık istatistik
- **Yedekleme** — metin veya JSON olarak indir, geri yükle
- Açık/koyu tema, çevrimdışı çalışma

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme: http://localhost:5173
npm run build      # yayın için dist/ klasörü
```

Telefonda kamera için sitenin **https** üzerinden açılması gerekir (Vercel/Netlify gibi bir yere yüklendiğinde otomatik olur).

## İki çalışma modu

**1. Bu cihazda (varsayılan, kurulum yok):** Sadece adını girersin, veriler o telefonun tarayıcısında saklanır.
Denemek için ideal; ama telefon değişirse veya tarayıcı verisi silinirse gider (Profil → Yedekle ile yedek alınabilir).

**2. Hesapla giriş + bulut (önerilen):** E-posta/şifre ile giriş, veriler her cihazda aynı.
Ücretsiz bir [Supabase](https://supabase.com) projesiyle:

1. Supabase'de yeni proje aç
2. *SQL Editor*'e `supabase/schema.sql` içeriğini yapıştırıp çalıştır
3. *Project Settings → API*'den URL ve `anon` anahtarını al
4. `.env.example` dosyasını `.env` olarak kopyala ve doldur (Vercel'de: Environment Variables)
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Yeniden derle. Giriş ekranı artık e-posta/şifre ister.

Her kullanıcı yalnızca kendi verisini görebilir (Row Level Security).

## Claude ile okuma (önerilen)

Fotoğraftan metin okuma `api/ocr.ts` sunucu fonksiyonunda Claude ile yapılır. Açmak için:

1. https://console.anthropic.com adresinden bir API anahtarı al (ücretli; bir fotoğraf yaklaşık 1–2 kuruş)
2. Vercel → proje → *Settings → Environment Variables* → `ANTHROPIC_API_KEY` ekle
3. Yeniden yayınla (Deployments → son yayın → *Redeploy*)

Bu açıkken çekilen fotoğraf (çerçevelenen kısım) okunmak üzere Anthropic'e gönderilir. Not: uç nokta herkese
açıktır; uygulamanın adresini bilen biri anahtarını kullanabilir. Supabase girişi eklendiğinde yalnızca giriş
yapmış kullanıcılara açacak şekilde kısıtlanmalı. Anthropic Console'da aylık harcama sınırı koymak iyi olur.

## Teknik

- React + TypeScript + Vite, PWA (vite-plugin-pwa)
- Metin tanıma: [tesseract.js](https://github.com/naptha/tesseract.js) + Türkçe dil modeli; dosyalar `npm run dev/build` sırasında
  `public/tesseract/` altına kopyalanır (dış CDN gerekmez)
- Veri katmanı: `src/lib/store.ts` — Supabase ya da localStorage

```
src/
  lib/        store (veri), ocr (metin tanıma), share (paylaşım + görsel kart), router
  screens/    Giriş, Kitaplık, Kitap, Alıntı ekle, Hatırla, Ara, Profil
  components/ Kırpma aracı, kitap formu, alıntı kartı, kamera butonu
supabase/schema.sql
```
