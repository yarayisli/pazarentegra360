# Pazaryeri Bilgileri

Her pazaryeri için bir dosya: `trendyol.md`, `hepsiburada.md`, `n11.md`, `ikas.md`. Entegrasyon görevi yapan geliştirici, resmi dokümandan doğruladığı bilgiyi buraya yazar.

Her dosyada şu başlıklar bulunur:

1. **Kaynaklar:** resmi doküman linkleri, son doğrulama tarihi
2. **Ortamlar:** prod / test taban URL'leri
3. **Kimlik doğrulama:** yöntem, zorunlu başlıklar
4. **Rate limit:** limitler ve aşıldığında davranış
5. **Uç noktalar:** kullandığımız her uç nokta için yöntem, yol, önemli parametreler, sayfalama
6. **Durum eşlemesi:** pazaryeri sipariş durumları ↔ bizim `PackageStatus`
7. **İş kuralları:** komisyon, kargo, iade, fatura kuralları
8. **Bilinen tuhaflıklar:** dokümanda yazmayan ama karşılaşılan davranışlar

Gizli bilgi (API anahtarı, satıcı ID'si, müşteri verisi) asla bu dosyalara yazılmaz.
