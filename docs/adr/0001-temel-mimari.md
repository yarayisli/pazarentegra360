# ADR 0001: Temel mimari

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-07
- **İlgili:** #5, #7, #8, #11, #14

## Bağlam

Proje, Trendyol, Hepsiburada, N11 ve ikas için çok kiracılı (SaaS) bir e-ticaret işletim sistemi olacak. Geliştirme büyük ölçüde otonom ajanlarla yapılıyor; küçük, öngörülebilir ve test edilebilir bir yapı gerekiyor. Başlangıç noktası: hazır bir React arayüzü ve neredeyse boş bir Express backend.

## Kararlar

1. **Modüler monolit.** Tek kod tabanı, iki süreç: `api` (Express) ve `worker` (arka plan işleri). Mikroservis yok. Gerekçe: tek geliştirme/test/deploy hattı; ajanlar için en az hareketli parça.
2. **PostgreSQL + Drizzle ORM.** Tipli şema, SQL'e yakın sorgular, migration dosyaları kodla birlikte versiyonlanır.
3. **Çok kiracılık satır düzeyinde.** Her tabloda `tenant_id`; her sorgu tenant ile filtrelenir. Ayrı veritabanı/şema yok.
4. **İş kuyruğu: pg-boss.** Kuyruk Postgres'te durur; Redis gibi ek altyapı gerekmez. Periyodik senkron, retry ve hesap başına kilit buradan.
5. **Ortak pazaryeri adaptör arayüzü.** Her pazaryeri `server/integrations/<pazaryeri>/` altında aynı arayüzü uygular: `fetchOrders`, `fetchProducts`, `updateStockPrice`, `updateOrderStatus`, `fetchQuestions`, `answerQuestion`, `fetchClaims`, `fetchSettlements`. Uygulamanın geri kalanı pazaryerini bilmez.
6. **Sipariş geçmişi olay kaydı olarak.** `order_events` yalnızca eklenir (append-only); durum değişikliğinin kaynağı (webhook, polling, kullanıcı, mutabakat) her olayda tutulur.
7. **Kimlik bilgileri sunucuda şifreli.** Pazaryeri anahtarları AES-256-GCM ile şifrelenip veritabanında saklanır; tarayıcıya ve loglara düz metin olarak çıkmaz.
8. **Paraya dokunan otomasyonda güvenlik freni.** Fiyat düşürme, stok sıfırlama, sipariş iptali ve müşteriye mesaj gönderme; eşik kontrolü ve/veya insan onayı olmadan otomatik çalışmaz.

## Sonuçlar

- Yeni bir pazaryeri eklemek, Trendyol adaptörünü örnek alan sınırlı bir iştir.
- Tek Postgres hem veri hem kuyruk için kritik bağımlılık olur; yedekleme ve izleme ona göre planlanmalı.
- Ölçek ihtiyacı doğarsa worker süreçleri yatayda çoğaltılabilir; API ve worker zaten ayrı süreç.
