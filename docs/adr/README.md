# Mimari Karar Kayıtları (ADR)

Yeni bir veri modeli, dış bağımlılık, pazaryeri adaptörü veya modüller arası sözleşme getiren işlerde **kodlamadan önce** bir ADR yazılır ve aynı PR'a eklenir.

Dosya adı: `NNNN-kisa-baslik.md` (sıradaki numara). Şablon:

```markdown
# ADR NNNN: Başlık

- **Durum:** Önerildi | Kabul edildi | Yerini aldı: ADR XXXX
- **Tarih:** YYYY-AA-GG
- **İlgili:** #issue

## Bağlam
## Kararlar
## Değerlendirilen alternatifler
## Sonuçlar
```

| No | Başlık |
|---|---|
| [0001](0001-temel-mimari.md) | Temel mimari |
| [0002](0002-rate-limiting.md) | Rate limiting (express-rate-limit) |
| [0003](0003-postgres-drizzle.md) | PostgreSQL + Drizzle ORM |
