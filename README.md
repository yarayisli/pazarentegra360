# PazarEntegra 360

[![CI](https://github.com/yarayisli/pazarentegra360/actions/workflows/ci.yml/badge.svg)](https://github.com/yarayisli/pazarentegra360/actions/workflows/ci.yml)

Trendyol, Hepsiburada, N11 ve ikas satıcıları için e-ticaret işletim sistemi: sipariş yönetimi, katalog ve stok/fiyat eşitleme, iade, hakediş denetimi, müşteri soruları ve AI asistanı.

> **Durum:** Erken geliştirme. Arayüz hazır, ancak ekranların çoğu henüz demo verisiyle çalışıyor ve pazaryeri entegrasyonları yazılıyor. Yol haritası için [milestone'lara](https://github.com/yarayisli/pazarentegra360/milestones) bakın.

## Kurulum

Gereksinim: Node.js 22+

```bash
git clone https://github.com/yarayisli/pazarentegra360.git
cd pazarentegra360
npm install
cp .env.example .env    # isteğe bağlı, aşağıya bakın
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır. API ve arayüz aynı porttan sunulur. Giriş için PostgreSQL gerekir: `docker compose up -d && npm run db:migrate`, ardından arayüzde "Kayıt ol" ile hesap oluşturun (her kayıt kendi tenant'ını açar).

### Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `GEMINI_API_KEY` | Hayır | AI asistanı ve müşteri cevabı önerisi için. Yoksa kural tabanlı yanıt döner. |
| `DATABASE_URL` | Hayır* | PostgreSQL bağlantısı. Varsayılan `docker-compose.yml`'deki yerel veritabanıdır. *DB komutları için gerekir. |
| `APP_URL` | Hayır | Uygulamanın yayınlandığı adres. |
| `CREDENTIALS_ENCRYPTION_KEY` | Evet** | Pazaryeri kimlik bilgilerini şifrelemek için 32 baytlık anahtar (base64 veya 64 hex). **Ayarlanmazsa `/api/marketplace-accounts` 503 döner. Üretim: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (API + Vite) |
| `npm run lint` | TypeScript tip kontrolü |
| `npm test` | Testleri çalıştırır |
| `npm run test:watch` | Testleri izleme modunda çalıştırır |
| `npm run test:coverage` | Kapsam raporu |
| `npm run build` | Arayüzü ve sunucuyu `dist/` altına paketler |
| `npm start` | Paketlenmiş uygulamayı çalıştırır |
| `npm run worker` | Arka plan iş kuyruğu worker'ı (pg-boss; cron ve işler burada çalışır, PostgreSQL gerekir) |
| `docker compose up -d` | Yerel PostgreSQL 16'yı başlatır |
| `npm run db:generate` | Şema değişikliğinden migration üretir (`server/db/migrations/`) |
| `npm run db:migrate` | Migration'ları uygular |
| `npm run db:seed` | Demo tenant'ı `mockData.ts` verisiyle doldurur |

## Mimari

```
server/index.ts     Giriş noktası (Vite middleware / statik dosya + listen)
server/app.ts       createApp(): Express uygulaması, router'ların bağlanması
server/config.ts    Çalışma zamanı yapılandırması
server/routes/      HTTP rotaları (health, auth, orders, webhooks, ai, integrations, marketplaceAccounts, jobs)
server/middleware/  requireAuth: oturum ve tenant bağlamı (#8)
server/services/    İş mantığı (event store, mutabakat, AI)
server/integrations/ Pazaryeri adaptörleri (trendyol, hepsiburada, n11, ikas)
server/db/          Drizzle şeması, migration'lar, seed (#7)
server/jobs/        pg-boss iş kuyruğu: iş tanımları, kayıt defteri, worker (#11)
src/                React arayüzü
  components/       Ekranlar
  data/mockData.ts  Demo verisi
  types.ts          Ortak tipler
```

Mimari kararlar [`docs/adr/`](docs/adr/) altında, pazaryeri bilgileri [`docs/pazaryerleri/`](docs/pazaryerleri/) altındadır.

Hedef mimari: tek kod tabanında API ve worker süreçleri, PostgreSQL, her pazaryeri için ortak arayüzü uygulayan adaptörler. Ayrıntılar [CLAUDE.md](CLAUDE.md) dosyasında.

## Katkı

Geliştirme GitHub issue'ları üzerinden yürür; `agent-ready` etiketli görevler otomatik ajanlar tarafından alınır. Kurallar, iş akışı ve "done" tanımı [CLAUDE.md](CLAUDE.md) dosyasındadır. Her PR'da CI yeşil olmalıdır: tip kontrolü, testler ve kapsam eşiği, build, sızan secret taraması (gitleaks) ve CodeQL güvenlik taraması.
