# Hisse Pano (geçici isim)

Kurban hisse ve bağış afişlerini Canva'ya benzer kolay bir arayüzle hazırlayan tek sayfalık site.
Derleme gerekmez: `index.html` dosyasını tarayıcıda açman yeterli. İstersen herhangi bir statik
barındırmaya (Netlify, Vercel, GitHub Pages) olduğu gibi yükleyebilirsin.

## Neler var?

- **5 şablon:** Yeşil Klasik, Lacivert Altın, Modern, Kandil Gecesi, Sade Toprak
- **Kurban hesabı:** toplam bedel, hisse sayısı (büyükbaş 7 / küçükbaş 1) ve kutucuk bedeli girilir;
  hisse bedeli, toplam kutu sayısı, satır/sütun otomatik hesaplanır (istersen elle ayarlanır)
- **Hissedarlar:** isim + kutu adedi, "Tam hisse" düğmesi, listeyi toplu yapıştırma; isimler sırayla kutulara yazılır
- **Hedefe ulaşma çubuğu:** toplanan, hedef, kalan tutar ve yüzde
- **Renkler:** 10 hazır palet + 4 özel renk (ana, vurgu, arka plan, yazı)
- **Logo:** yükle (PNG önerilir), boyutunu ayarla; logo yoksa amblem; kurum adı
- **Boyutlar:** A4, Hikâye/Durum (9:16), Gönderi (4:5), Kare
- **Dışa aktarma:** PNG veya JPEG, normal ya da yüksek (baskı) kalite; telefonda doğrudan **Paylaş**
- Geri al / yinele, tasarım tarayıcıda otomatik kaydedilir

Afiş tamamen `<canvas>` üzerine çizilir; önizleme ile indirilen görsel aynı çizim kodundan çıkar.
