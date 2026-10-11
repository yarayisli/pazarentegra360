# ADR 0012: @types/react ve @types/react-dom

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-11
- **İlgili:** #34

## Bağlam

`@types/react` kurulu olmadığı için `tsc --noEmit` JSX'i ve React importlarını gerçekten denetlemiyordu (`any` olarak çözülüyordu).

## Kararlar

- **Yeni geliştirme bağımlılıkları:** `@types/react` ve `@types/react-dom` (React 19 ile uyumlu, `^19`). Yalnızca devDependencies; çalışma zamanına girmez.
- Ortaya çıkan tek tip hatası düzeltildi: `CustomerCommunicationView` var olmayan `q.createdAt` alanını okuyordu; tipte tanımlı `q.questionDate` kullanıldı (tarih artık görünür).

## Sonuçlar

- `npm run lint` React bileşenlerini ve JSX'i gerçekten tip denetimine sokar.
