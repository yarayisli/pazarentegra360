# PazarEntegra 360 Bilgi Tabanı

Ajanların ve insanların ortak, kalıcı hafızası. Ajanlar her çalışmaya sıfırdan başlar; burada yazılı olmayan bilgi bir sonraki çalışmada kaybolur.

| Klasör / dosya                   | İçerik                                                         | Kim yazar                                             |
| -------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| [`adr/`](adr/)                   | Mimari karar kayıtları: ne karar verildi, neden, alternatifler | Büyük özelliğe başlayan geliştirici (kodlamadan önce) |
| [`pazaryerleri/`](pazaryerleri/) | Resmi dokümandan doğrulanmış API bilgisi ve iş kuralları       | Entegrasyon görevi yapan geliştirici                  |
| [`dersler.md`](dersler.md)       | İncelemede reddedilen hata tipleri ve doğrusu                  | `changes-requested` düzelten geliştirici              |

Kurallar:

- Kısa ve doğru yaz; tahmin değil, doğrulanmış bilgi. Kaynağı (doküman linki, PR, issue) belirt.
- Bir bilgi eskidiyse sil veya düzelt; çelişkili iki kayıt bırakma.
- Gizli bilgi (API anahtarı, müşteri verisi) asla buraya yazılmaz.
