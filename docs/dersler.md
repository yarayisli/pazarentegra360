# Dersler

İncelemede reddedilen veya sonradan hata çıkaran her hata tipi buraya bir madde olarak eklenir. Geliştirici her işe başlamadan bu dosyayı okur.

Format: `- **Kısa başlık** (#PR): Yanlış olan. Doğrusu.`

Aynı ders zaten varsa yenisini ekleme; mevcut maddeye PR numarasını ekle.

## Test

- **Testler ortak durumu paylaşmasın** (#33): Modül düzeyindeki bellek içi depolar testler arasında sızar. Uygulamayı bir fabrika fonksiyonuyla (`createApp()`) kur ve her testte yeni örnek oluştur.

## Güvenlik

- **Parola KDF parametreleri OWASP alt sınırında olmalı** (#39): scrypt N=2^14,p=1 ile kullanıldı. Parola hash parametrelerini OWASP Password Storage Cheat Sheet'teki minimumdan (scrypt: N=2^17,r=8,p=1 veya eşdeğeri N=2^14,r=8,p=5) seç ve testle kilitle.

- **İstek gövdesinden gelen anahtarlarla nesneye yazma** (#40): `out[k] = v` ile kullanıcı anahtarları kopyalandı (CodeQL remote property injection). İzinli alanları beyaz listeyle oku; yetkilendirme yapan her yeni rotaya `express-rate-limit` ekle.

## Pazaryeri entegrasyonu

## Diğer

- **Yeni bağımlılık = ADR** (#37): CI/CodeQL'i geçmek için bile olsa yeni npm paketi ADR'siz eklendi. Paket eklemeden önce docs/adr/ altına kısa bir ADR yaz ve aynı PR'a koy.
- **Davranış değişikliğini açıklamada belirt** (#37): "Davranış değişmedi" denen bir refactor PR'ına sonradan 429 rate limit eklendi. Sonradan eklenen commit davranışı değiştiriyorsa PR açıklamasını güncelle.
