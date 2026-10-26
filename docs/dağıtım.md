# Dağıtım (üretim)

Uygulama tek bir Docker imajı olarak paketlenir (`Dockerfile`, çok aşamalı, Node 22, root olmayan `node` kullanıcısı). Aynı imaj üç farklı komutla çalışır:

| Süreç     | Komut                               | Not                                               |
| --------- | ----------------------------------- | ------------------------------------------------- |
| API       | `node dist/server.cjs` (varsayılan) | Arayüzü ve `/api`'yi 3000 portundan sunar         |
| Worker    | `node dist/worker.mjs`              | pg-boss iş kuyruğu; API'den **ayrı süreç** olmalı |
| Migration | `node dist/db-cli.mjs migrate`      | Her sürümde API/worker başlamadan önce bir kez    |

Üretim imajında `tsx` ve devDependencies yoktur; bu yüzden `npm run worker` / `npm run db:migrate` imaj içinde değil, yukarıdaki derlenmiş komutlar kullanılır.

## İmajı üretme

```bash
docker build -t pazarentegra360 .
```

`.dockerignore` `.env*` dosyalarını imaja almaz. Sırlar imaja gömülmez, çalışma zamanında ortam değişkeni olarak verilir.

## Ortam değişkenleri

`.env.example` ile uyumludur; değerler `server/config.ts` içinde doğrulanır.

| Değişken                     | Zorunlu             | Açıklama                                                                                                                                                                              |
| ---------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                   | imajda `production` | Üretimde `CREDENTIALS_ENCRYPTION_KEY` zorunlu olur                                                                                                                                    |
| `DATABASE_URL`               | evet                | PostgreSQL bağlantı dizesi (API, worker ve migration)                                                                                                                                 |
| `CREDENTIALS_ENCRYPTION_KEY` | evet (üretimde)     | 32 bayt, base64 veya 64 hex karakter. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Kaybedilirse kayıtlı pazaryeri anahtarları çözülemez; yedekleyin |
| `GEMINI_API_KEY`             | hayır               | Yoksa AI asistanı kural tabanlı yanıt verir                                                                                                                                           |
| `GEMINI_MODEL`               | hayır               | Varsayılan `gemini-2.5-flash`                                                                                                                                                         |
| `LOG_LEVEL`                  | hayır               | `fatal`…`trace`, `silent`; varsayılan `info`                                                                                                                                          |
| `APP_URL`                    | hayır               | `.env.example`'da yer alır; şu an çalışma zamanında kullanılmıyor                                                                                                                     |

Port 3000'dir ve şu an değiştirilemez (`server/config.ts`).

## Adımlar

1. PostgreSQL 16 hazırlayın, `DATABASE_URL`'i belirleyin.
2. Migration: `docker run --rm -e DATABASE_URL=... pazarentegra360 node dist/db-cli.mjs migrate`
3. API: `docker run -d -p 3000:3000 -e DATABASE_URL=... -e CREDENTIALS_ENCRYPTION_KEY=... pazarentegra360`
4. Worker (ayrı süreç/konteyner): `docker run -d -e DATABASE_URL=... -e CREDENTIALS_ENCRYPTION_KEY=... pazarentegra360 node dist/worker.mjs`

Birden fazla API kopyası çalıştırılabilir; worker'dan kaç kopya çalışacağı pg-boss'un zamanlama kurallarına bağlıdır, başlangıçta tek kopya önerilir.

## Sağlık kontrolü

`GET /api/health` kimlik doğrulamasız çalışır; yük dengeleyici/orkestratör bu uç noktayı yoklamalıdır. Worker HTTP dinlemez; sağlığı için konteyner yeniden başlatma politikası (`restart: unless-stopped`) ve loglar kullanılır. İmajda `HEALTHCHECK` yoktur çünkü aynı imaj worker olarak da çalışır; `docker-compose.yml` sağlık kontrolünü yalnızca `app` servisine tanımlar.

## Yerelde üretim benzeri deneme

```bash
export CREDENTIALS_ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
docker compose --profile app up --build
```

`app` profili `db`, `migrate` (bir kez), `app` ve `worker` servislerini başlatır. Profil verilmezse yalnızca `db` başlar (geliştirme akışı değişmez).
