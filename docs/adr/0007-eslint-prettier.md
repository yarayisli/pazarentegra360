# ADR 0007: ESLint ve Prettier

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-10
- **İlgili:** #4

## Bağlam

Kod tabanında yalnızca `tsc --noEmit` vardı; kullanılmayan import/değişkenler ve biçim farkları denetlenmiyordu.

## Kararlar

- **Yeni geliştirme bağımlılıkları:** `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`, `prettier`, `eslint-config-prettier` (yalnızca devDependencies; çalışma zamanına girmez).
- **Yapılandırma:** `eslint.config.js` (flat config). `typescript-eslint` recommended + `react-hooks/rules-of-hooks` (error) ve `exhaustive-deps` (warn). Biçim kuralları ESLint'te değil Prettier'dadır (`eslint-config-prettier`).
- **React Compiler kuralları kapalı:** `eslint-plugin-react-hooks` v7 `recommended` setindeki `purity`, `immutability`, `set-state-in-effect` kuralları mevcut ekranlarda davranış değişikliği gerektirdiği için bu işin dışında bırakıldı; React Query geçişinde (#13, #24–#28) açılabilir.
- **`no-explicit-any`:** mevcut kodda 13 yerde `any` var; tip düzeltmeleri davranışı etkileyebileceği için şimdilik `warn`. Yeni kodda `any` kullanılmaz (CLAUDE.md).
- **Kullanılmayan değişkenler:** `error`; bilerek kullanılmayanlar `_` önekiyle işaretlenir.
- **Prettier:** `printWidth: 120`, çift tırnak, `trailingComma: all`. Tüm depo bir kez biçimlendirildi (yalnızca biçim farkı).
- **Komutlar:** `npm run lint` = `tsc --noEmit && eslint .`; `npm run format`; `npm run format:check` (CI'da çalışır).

## Değerlendirilen alternatifler

- **Biome:** tek araç ama ekibin bildiği ESLint/Prettier ekosistemi ve `react-hooks` eklentisi tercih edildi.

## Sonuçlar

- CI artık ESLint ve biçim kontrolünde de kırılır.
- `any` uyarıları ve kapalı React Compiler kuralları teknik borçtur.
