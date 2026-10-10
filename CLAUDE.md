# PazarEntegra 360 – Ajan ve Geliştirici Kuralları

Bu dosya, bu depoda çalışan her ajanın (ve insanın) uyması gereken tek kural kaynağıdır.

## Proje

Trendyol, Hepsiburada, N11 ve ikas satıcıları için e-ticaret işletim sistemi: sipariş, katalog, stok/fiyat, iade, hakediş, müşteri soruları ve AI asistanı.

**Mevcut durum:** Arayüz (17 ekran) hazır ama çoğu `src/data/mockData.ts`'teki sahte veriyle çalışıyor. Backend yeni kuruluyor. Yol haritası GitHub milestone'larında:

- Faz 0 – Temel Altyapı (test, CI, DB, auth, iş kuyruğu)
- Faz 1 – Trendyol Çekirdek
- Faz 2 – Ekranları Gerçek Veriye Bağlama
- Sonrası: Hepsiburada, N11, ikas epic'leri

## Teknoloji

- Frontend: React 19, Vite 6, Tailwind 4, lucide-react, motion
- Backend: Node 22, Express 4, TypeScript (tsx ile çalışır, esbuild ile paketlenir)
- AI: Google Gemini (`@google/genai`), anahtar yoksa kural tabanlı yanıt
- Test: Vitest, Supertest, Testing Library (jsdom)
- Planlanan: PostgreSQL + Drizzle (#7), pg-boss iş kuyruğu (#11, kuruldu)

## Klasör yapısı

```
server/index.ts        # giriş noktası: Vite middleware / statik dosya + listen
server/app.ts          # createApp(): Express app, router'ları bağlar
server/config.ts       # çalışma zamanı yapılandırması
server/routes/         # HTTP rotaları (her dosya bir createXRouter)
server/middleware/     # requireAuth (oturum → req.auth.tenantId)
server/services/       # iş mantığı (crypto.ts: AES-256-GCM, CREDENTIALS_ENCRYPTION_KEY)
server/integrations/   # <pazaryeri>/ altında adaptörler
server/db/             # Drizzle şeması (schema.ts), migrations/, seed.ts, cli.ts (#7)
server/jobs/           # pg-boss iş kuyruğu: definitions.ts, registry.ts, queue.ts, worker.ts (#11)
server/*.test.ts       # backend testleri
src/                   # React uygulaması
  App.tsx              # tüm durum burada (ileride React Query'ye taşınacak, #13)
  components/          # ekranlar ve modallar
  data/mockData.ts     # demo verisi
  types.ts             # paylaşılan alan tipleri
docs/                  # ajanların kalıcı hafızası (bkz. docs/README.md)
  adr/                 # mimari karar kayıtları
  pazaryerleri/        # doğrulanmış pazaryeri API bilgisi
  dersler.md           # incelemede reddedilen hata tipleri
```

Backend yapısı (#5) uygulandı: yeni rota `server/routes/`, iş mantığı `server/services/`, pazaryeri kodu `server/integrations/<pazaryeri>/` altına gider.

## Komutlar

```bash
npm install
npm run dev            # http://localhost:3000 (API + arayüz)
npm run lint           # tsc --noEmit + eslint
npm run format         # prettier --write (CI: format:check)
npm test               # tüm testler
npm run test:coverage
npm run build && npm start
docker compose up -d   # yerel PostgreSQL
npm run db:generate    # şema değişince migration üret ve commit et
npm run db:migrate && npm run db:seed
npm run worker         # arka plan işleri (pg-boss), API'den ayrı süreç
```

## Ajan iş akışı

0. `docs/dersler.md`'yi oku; orada yazan hataları tekrarlama. Pazaryeri işiyse `docs/pazaryerleri/<pazaryeri>.md`'yi de oku.
1. Bir issue al: `agent-ready` etiketli, açık, "Bağımlılık" bölümündeki issue'lar kapanmış olmalı. Öncelik sırası: `p1` > `p2` > `p3`, aynı öncelikte en küçük numara.
2. `main`den dal aç: `agent/<issue-no>-<kisa-ad>` (ör. `agent/7-postgres-drizzle`).
3. Yalnızca o issue'nun kapsamını yap. Kapsam dışı bir sorun görürsen düzeltme, yeni issue aç.
4. Her davranış değişikliği için test yaz. Hata düzeltmesinde önce hatayı gösteren testi yaz.
5. PR açmadan önce yerelde `npm run lint && npm run test:coverage && npm run build` yeşil olmalı (kapsam eşiği dahil).
6. PR açıklaması: ne değişti, nasıl test edildi, issue'daki kabul kriterleri tek tek işaretli, sonda `Closes #N`.
7. Yeni veri modeli, dış bağımlılık, pazaryeri adaptörü veya modüller arası sözleşme getiren işte **kodlamadan önce** `docs/adr/` altına ADR yaz ve aynı PR'a ekle.
8. Pazaryeri API'sinden doğruladığın bilgiyi `docs/pazaryerleri/<pazaryeri>.md`'ye yaz.
9. İnceleyicinin düzeltme istediği bir hatayı giderirken, hata tipini aynı PR'da `docs/dersler.md`'ye bir madde olarak ekle.
10. Takılırsan (eksik bilgi, iş kuralı kararı, gerçek API anahtarı ihtiyacı) issue'ya soruyu yaz, `needs-human` etiketi ekle ve dur. Tahminle ilerleme.

## Otonom çalışma düzeni

Proje sahibi sistemin başında değildir. Bulutta zamanlanmış ajanlar (claude.ai routines) çalışır:

| Ajan              | Ne zaman (İstanbul)                                  | Görev                                                                       |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Geliştirici       | Her gün 09:00, 14:00, 19:00                          | Önce `changes-requested` PR'ları düzeltir; yoksa bir issue alıp PR açar     |
| İnceleyici (Opus) | Bir PR'ın CI'ı bitince otomatik + 6 saatte bir yedek | CI yeşil PR'ları inceler; uygunsa squash merge, değilse `changes-requested` |
| Planlayıcı        | Pazartesi 08:00                                      | Haftalık rapor issue'su (`report`), backlog'u doldurma, bakım               |

Etiketler:

- `agent-wip`: issue'yu bir ajan aldı, başkası almaz. Ajan bırakırsa (takıldı/bitti) etiketi kaldırır.
- `changes-requested`: inceleyici düzeltme istedi; geliştirici bir sonraki çalışmada önce bunu ele alır.
- `needs-human`: insan kararı gerekiyor; ajanlar bu issue'yu atlar.
- `report`: haftalık rapor.

Merge yalnızca inceleyici ajan tarafından ve yalnızca CI yeşilken yapılır. Geliştirici kendi PR'ını merge etmez.

## "Done" tanımı

- [ ] CI yeşil: tip kontrolü, testler + kapsam eşiği (`server/` için satır ve fonksiyon %70), build, gitleaks, CodeQL
- [ ] Yeni/değişen davranışın testi var
- [ ] Kabul kriterlerinin hepsi karşılandı
- [ ] Gerekirse `README.md` ve bu dosya güncellendi (yeni komut, env değişkeni, klasör)

## Yasaklar

- `main`e doğrudan push, force push, başkasının dalını yeniden yazmak
- Gerçek API anahtarı, secret, şifre veya müşteri verisini commit etmek (`.env*` git dışında; yalnızca `.env.example`)
- Testlerde gerçek pazaryeri veya AI API'sine istek atmak. HTTP her zaman mock'lanır (`msw`/`nock`); `GEMINI_API_KEY` testte boştur.
- CI'yı geçmek için test silmek, `skip` etmek veya beklentiyi gevşetmek
- Pazaryerinde fiyat düşüren, stok sıfırlayan, siparişi iptal eden veya müşteriye mesaj gönderen kodu insan onayı / güvenlik freni olmadan otomatik çalıştırmak
- Kapsam dışı büyük refactor, gereksiz bağımlılık eklemek

## Kod kuralları

- TypeScript. Yeni kodda `any` yerine tip veya `unknown` + doğrulama kullan.
- Kimlik doğrulama (#8): `/api/health` ve `/api/auth/*` dışındaki her `/api` rotası `requireAuth` arkasındadır. Tenant yalnızca `tenantIdOf(req)` ile oturumdan alınır; istek gövdesi/sorgusundan asla. Testlerde `createTestApp()` (`server/testApp.ts`) kullan.
- API yanıt biçimi: `{ success: true, ... }` / `{ success: false, error: { code, message } }` (#6 ile standartlaşacak).
- Kullanıcıya görünen metinler Türkçe; kod, değişken adları ve commit mesajları İngilizce.
- Commit mesajı: Conventional Commits (`feat:`, `fix:`, `test:`, `ci:`, `docs:`, `refactor:`, `chore:`).
- Pazaryeri entegrasyonları `server/integrations/<pazaryeri>/` altında, ortak adaptör arayüzünü uygular: `fetchOrders`, `fetchProducts`, `updateStockPrice`, `updateOrderStatus`, `fetchQuestions`, `answerQuestion`, `fetchClaims`, `fetchSettlements`.
- Pazaryeri API'lerinin uç noktalarını hafızadan yazma; resmi dokümandan doğrula ve kaynağı PR'da belirt.

## Bilinen eksikler

- `@types/react` kurulu değil, React bileşenleri tip kontrolünden tam geçmiyor.
- Backend verisi bellekte; sunucu yeniden başlayınca sıfırlanır (#7, #10).
