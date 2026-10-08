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

Uygulama http://localhost:3000 adresinde açılır. API ve arayüz aynı porttan sunulur.

### Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `GEMINI_API_KEY` | Hayır | AI asistanı ve müşteri cevabı önerisi için. Yoksa kural tabanlı yanıt döner. |
| `APP_URL` | Hayır | Uygulamanın yayınlandığı adres. |

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

## Mimari

```
server/index.ts     Giriş noktası (Vite middleware / statik dosya + listen)
server/app.ts       createApp(): Express uygulaması, router'ların bağlanması
server/config.ts    Çalışma zamanı yapılandırması
server/routes/      HTTP rotaları (health, orders, webhooks, ai, integrations)
server/services/    İş mantığı (event store, mutabakat, AI)
server/integrations/ Pazaryeri adaptörleri (trendyol, hepsiburada, n11, ikas)
server/db/, jobs/   Veritabanı (#7) ve iş kuyruğu (#11) için ayrılmış klasörler
src/                React arayüzü
  components/       Ekranlar
  data/mockData.ts  Demo verisi
  types.ts          Ortak tipler
```

Mimari kararlar [`docs/adr/`](docs/adr/) altında, pazaryeri bilgileri [`docs/pazaryerleri/`](docs/pazaryerleri/) altındadır.

Hedef mimari: tek kod tabanında API ve worker süreçleri, PostgreSQL, her pazaryeri için ortak arayüzü uygulayan adaptörler. Ayrıntılar [CLAUDE.md](CLAUDE.md) dosyasında.

## Katkı

Geliştirme GitHub issue'ları üzerinden yürür; `agent-ready` etiketli görevler otomatik ajanlar tarafından alınır. Kurallar, iş akışı ve "done" tanımı [CLAUDE.md](CLAUDE.md) dosyasındadır. Her PR'da CI yeşil olmalıdır: tip kontrolü, testler ve kapsam eşiği, build, sızan secret taraması (gitleaks) ve CodeQL güvenlik taraması.
