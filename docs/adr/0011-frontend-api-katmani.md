# ADR 0011: Frontend API istemcisi, TanStack Query ve kod bölme

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-11
- **İlgili:** #13, #6, #8, #24–#28

## Bağlam

Tüm durum `App.tsx` içinde `useState` + `localStorage` ile tutuluyor; ekranlar gerçek API'ye bağlanacak (#24–#28). JS paketi tek parça ve ~560 KB.

## Kararlar

- `src/api/client.ts`: tek tipli `apiFetch<T>()`. Hata biçimi #6 ile uyumlu (`{ success:false, error:{ code, message } }`) → `ApiError(status, code, message)`. Ağ hatası `NETWORK_ERROR`. Oturum sırasında gelen 401, `setUnauthorizedHandler` ile kayıtlı geri çağrıyı çalıştırır; `AuthGate` bunu girişe dönmek için kullanır.
- **Yeni bağımlılık: `@tanstack/react-query` (v5).** Sunucu durumu (önbellek, yeniden deneme, yükleniyor/hata durumları) için; elle yazılan `useEffect`+`useState` yerine. `QueryClient` varsayılanları: 30 sn stale, pencere odağında yeniden çekme kapalı, 4xx'te retry yok, diğerlerinde bir kez.
- Ekranlar `React.lazy` ile ayrı parçalara bölünür (`src/lazyViews.ts`); kabuk (Header/Navigation) ana pakette kalır.
- Demo modu: `?demo=1` veya `VITE_DEMO_MODE=true` (`src/demoMode.ts`). Ekranlar gerçek veriye geçerken mock veri yalnızca bu modda kullanılacak (#28); bu issue'da mevcut mock davranışı değişmez.
- Mevcut `src/api/marketplaceAccounts.ts` yeni istemciyi kullanır.

## Değerlendirilen alternatifler

- **SWR / yalnızca fetch + context:** issue TanStack Query istiyor; mutasyon ve önbellek yönetimi daha olgun.

## Sonuçlar

Ekranlar sırayla `useQuery`/`useMutation`'a taşınacak; `App.tsx`'teki `localStorage` kullanımı o issue'larda kalkacak.
