# ADR 0018: Üretim dağıtım biçimi (tek imaj, API + worker + migration)

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-26
- **İlgili:** #67

## Bağlam

Depoda yalnızca yerel PostgreSQL için `docker-compose.yml` vardı. API, worker (pg-boss) ve migration'ın üretimde nasıl çalışacağı tanımsızdı. `npm run worker` ve `npm run db:migrate` `tsx` (devDependency) gerektiriyor.

## Kararlar

- **Tek imaj, farklı komut:** Çok aşamalı `Dockerfile` (Node 22 slim). Aşamalar: `build` (tüm bağımlılıklar + derleme), `prod-deps` (`npm ci --omit=dev`), `runtime` (yalnızca `dist/` + üretim `node_modules`, `USER node`).
- **Derlenmiş giriş noktaları:** API mevcut `npm run build` çıktısı (`dist/server.cjs`). Worker ve migration CLI'ı Dockerfile içinde esbuild ile ayrı ESM paketleri (`dist/worker.mjs`, `dist/db-cli.mjs`; `--packages=external`) olarak derlenir; böylece `tsx` üretim imajına girmez ve `package.json` script'leri değişmez. Migration SQL'leri `dist/migrations` altına kopyalanır (CLI `import.meta.url`'e göre bulur).
- **Süreç ayrımı:** API ve worker ayrı konteynerlerdir; migration API/worker'dan önce çalışan tek seferlik bir komuttur.
- **Sırlar imajda yok:** `.dockerignore` `.env*` dosyalarını dışlar; sırlar yalnızca çalışma zamanı ortam değişkenidir.
- **Sağlık kontrolü:** İmajda `HEALTHCHECK` yok (worker HTTP dinlemez); compose'ta yalnızca `app` servisinde `/api/health`.
- **Compose:** `app` profili altında `migrate`, `app`, `worker`; profilsiz `docker compose up -d` yalnızca `db` başlatır.

## Sonuçlar

- Yeni bağımlılık eklenmedi.
- Migration CLI'ının kullanım mesajı hâlâ `tsx` yolunu gösterir (geliştirme yolu); davranış değişmedi.
