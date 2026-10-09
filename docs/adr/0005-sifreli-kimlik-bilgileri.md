# ADR 0005: Pazaryeri kimlik bilgilerinin sunucuda şifreli saklanması

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-09
- **İlgili:** #9, ADR 0003, ADR 0004

## Bağlam

API anahtarları ve secret'lar tarayıcı `localStorage`'ında açık metin tutuluyordu. Sunucuda `marketplace_accounts.encrypted_credentials` kolonu hazırdı ama kullanılmıyordu.

## Kararlar

- **Şifreleme:** Node'un yerleşik `crypto` modülüyle AES-256-GCM (yeni bağımlılık yok). Her kayıt için rastgele 12 baytlık IV; saklama biçimi `v1:<iv>:<tag>:<şifreli metin>` (base64). `v1` öneki ileride anahtar/algoritma değişimine izin verir.
- **Anahtar:** `CREDENTIALS_ENCRYPTION_KEY` ortam değişkeni; 32 bayt, base64 veya 64 karakterlik hex. Anahtar yoksa/geçersizse hesap uç noktaları `503 CONFIG_MISSING` döner; sessizce zayıf anahtara düşülmez. Anahtar döndürme (rotation) bu işin kapsamı dışında.
- **Saklanan içerik:** Hesabın tüm yapılandırması (kimlik alanları ve anahtarlar, bayraklar) tek bir JSON olarak şifrelenir. `store_name` ve `status` düz kolonlarda kalır (listeleme için).
- **Maskeleme:** Liste/okuma yanıtlarında kimlik tanımlayıcıları (`supplierId`, `merchantId`, `storeDomain`) ve `storeName` dışındaki tüm metin alanları `••••` + son 4 karakter olarak döner. Güncellemede maskeli veya boş gelen değer mevcut değeri korur. Secret'lar hiçbir yanıtta ve logda düz metin olarak yer almaz.
- **Uç noktalar** (hepsi `requireAuth` arkasında, tenant yalnızca oturumdan): `GET/POST /api/marketplace-accounts`, `PUT/DELETE /api/marketplace-accounts/:id`, `POST /api/marketplace-accounts/:id/test`. Test uç noktası şimdilik gerçek pazaryerine istek atmaz; zorunlu alanları doğrular ve Trendyol için mevcut yer tutucuyu kullanır. Gerçek doğrulama Trendyol istemcisiyle (#14) gelecek.
- **Girdi doğrulama:** İstek gövdesinden yalnızca pazaryerine özgü beyaz listedeki alanlar okunur (`__proto__` gibi bilinmeyen anahtarlar atılır; CodeQL "remote property injection"). Uç noktalar `express-rate-limit` ile dakikada 60 istekle sınırlıdır (ADR 0002).
- **Frontend:** Kimlik bilgileri artık tarayıcıda saklanmaz; eski `localStorage` anahtarı açılışta silinir.

## Değerlendirilen alternatifler

- **pgcrypto / DB tarafı şifreleme:** anahtar DB'ye gitmek zorunda kalır, PGlite testlerinde yok; reddedildi.
- **Harici KMS:** bu aşama için fazla; anahtar env'de, ileride KMS'e taşınabilir (`v1` öneki).

## Sonuçlar

- Anahtar kaybolursa kayıtlı kimlik bilgileri çözülemez; kullanıcı yeniden girer.
- Anahtar tüm tenant'lar için ortaktır (tenant başına anahtar yok).
