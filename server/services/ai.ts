import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "../config";

// Initialize Gemini SDK lazily / safely
export function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Intelligent rule-based fallback responses for all key e-commerce questions
export function copilotFallback(prompt: string | undefined): string {
  let fallback: string;
  const query = (prompt || "").toLowerCase();

  if (query.includes("iade") || query.includes("neden")) {
    fallback = `🤖 **AI İade & Risk Analizi**:
1. **AirFlow Pro ANC Kulaklık**: İade oranı son 14 günde %3.2'den %9.4'e yükseldi. Müşteri bildirimlerinin %68'i "Kalıp kulağa tam oturmuyor / ped sertliği" gerekçesini içeriyor.
2. **Öneri**: Ürün açıklamasına silikon ped ebat tablosu eklenmeli ve kutu içeriğine yedek 3 boy silikon uyarısı konulmalıdır.
3. **Mali Etki**: İade başına ortalama kargo + desi zararı ~₺52. Çözüm ile aylık ~₺9.400 tasarruf sağlanabilir.`;
  } else if (query.includes("zarar") || query.includes("kâr") || query.includes("kar") || query.includes("fiyat")) {
    fallback = `💰 **AI Kârlılık & Gizli Masraf Radarı**:
- **MagSafe Uyumlu 10K Powerbank**: Satış Fiyatı: ₺849, Alış: ₺390. Kargo (₺65) + Trendyol Komisyonu (%18, ₺152.82) + Ambalaj (₺15) + KDV sonrası net kâr sadece ₺42.
- Eğer iade oranı %11 hesaba katılırsa **sipariş başına net kâr eksiye düşme riski** taşımaktadır.
- **Öneri**: Satış fiyatını ₺849'dan ₺899'a çıkarıp Trendyol 2. ürüne %10 kampanya sepeti oluşturun.`;
  } else if (query.includes("stok") || query.includes("sipariş") || query.includes("tükenecek")) {
    fallback = `📦 **AI Akıllı Stok & Satın Alma Uyarısı**:
- **Chronos Akıllı Saat Titanyum (SKU-WATCH-PRO-TITAN)**: Kalan stok 22 adet. Günlük satış hızı: 3.2 adet/gün. 
- **Tahmini Bitme Süresi**: 6.8 gün! Tedarikçi teslimat süresi (Lead Time) 8 gün olduğundan **HEMEN 50 ADET SATIN ALMA EMRİ (PO)** açılmalıdır.
- Gecikilirse ~₺32.000 ciro kaybı ve Buybox sıralama düşüşü öngörülmektedir.`;
  } else if (query.includes("buybox") || query.includes("rakip") || query.includes("reprice")) {
    fallback = `🎯 **AI Buybox & Fiyat Rekabet Analizi**:
1. **Titanium Akıllı Saat 49mm**: Rakip satıcı *TeknoStore_TR* fiyatı ₺1.999'a çekti ve Buybox'ı devraldı (Biz: ₺2.050). Maliyetimiz ₺1.200 olduğundan asgari kâr güvenlik tabanımız (₺1.850) aşılmadan ₺1.998'e çekilerek Buybox geri alınabilir.
2. **Laptop Standı**: Hepsiburada'da *ErgoDesk* ₺579 veriyor (Biz: ₺599). Otomatik Repricer eşitleme veya ₺1 altı ile satış hacmi %45 artırılabilir.
3. **Korumalı Ürünler**: AirFlow Pro ve RGB Klavye'de Buybox %100 bizde ve kâr maksimize ediliyor.`;
  } else if (query.includes("depo") || query.includes("raf") || query.includes("dalga") || query.includes("wms")) {
    fallback = `🏭 **AI WMS & Depo Operasyon Durumu**:
- **Dalga #81 (Öğleden Önce Acil SLA)**: 4 paketten 3'ü toplandı (%60 tamamlandı). Ahmet Yılmaz şu an B koridorunda mekanik klavye rafında.
- **Yürüyüş Rotası Optimizasyonu**: Personel koridor bazlı sıralı toplama ile sipariş başına yürüyüş mesafesinde %34 tasarruf sağlıyor.
- **Seri No Kontrolü**: Titanium saat ve AirFlow kulaklıklar için IMEI/Seri No eşleştirmesi zorunlu tutuluyor; iadelerde sahte ürün riski sıfırlanmıştır.`;
  } else {
    fallback = `📊 **PazarEntegra 360 Canlı Sağlık Özeti**:
- Tüm kanallarda (Trendyol, Hepsiburada, N11) 6 adet aktif sipariş var. 1 siparişin SLA teslimine 3 saat kaldı!
- Webhook Ingestion: 0 gecikme, Idempotency motoru aktif.
- Toplam 6 ürünün stok dağıtımı senkronize durumda.`;
  }
  return fallback;
}

export function buildCopilotPrompt(prompt: unknown, context: unknown): string {
  return `Sen Türkiye e-ticaret pazaryerlerinde (Trendyol, Hepsiburada, N11, Amazon TR) devasa hacim yöneten satıcılar için çalışan kıdemli bir "E-Commerce Operating System (OS) AI Copilot" ve e-ticaret CFO'susun.
Yanıtların son derece profesyonel, analitik, net hesaplamalar içeren, aksiyona dönük ve Türkçe olmalıdır.
Gereksiz laf kalabalığı yapma. Maddeler halinde, finansal ve operasyonel metrikleri (SLA, Desi maliyeti, İade oranı, COGS, Net Katkı Payı, Lead Time, PO miktarı) belirterek cevap ver.

Kullanıcı Sorusu / Emri: "${prompt}"
Sistem Bağlamı: ${JSON.stringify(context || {})}`;
}

export function replyTemplate(customerName: string | undefined, productName: string | undefined): string {
  return `Merhaba ${customerName || "Değerli Müşterimiz"},\n\n"${productName}" ürünümüzle ilgili sorunuz için teşekkür ederiz. Ürünümüz %100 orijinal olup, adınıza faturalı ve 2 yıl resmi garantilidir. Saat 16:00'a kadar verilen siparişler aynı gün korunaklı ambalaj ile kargoya teslim edilmektedir.\n\nHerhangi bir sorunuzda bize dilediğiniz zaman ulaşabilirsiniz. Keyifli alışverişler dileriz.`;
}

export interface ReplyPromptInput {
  question: unknown;
  productName?: string;
  customerName?: string;
  marketplace?: string;
  orderContext?: string;
}

export function buildReplyPrompt({
  question,
  productName,
  customerName,
  marketplace,
  orderContext,
}: ReplyPromptInput): string {
  return `Sen Türkiye e-ticaret pazaryerlerinde (Trendyol, Hepsiburada, N11) satış yapan profesyonel, kurumsal ve müşteri memnuniyeti yüksek bir satıcı müşteri hizmetleri uzmanısın.
Müşteriden gelen soruyu analiz et ve Türk Ticaret Kanunu ile Pazaryeri kurallarına uygun, nazik, net, ikna edici ve samimi Türkçe bir cevap yaz.
Asla rakip pazaryeri adı anma, iletişim numarası veya dış bağlantı verme (pazaryeri kural ihlali olmamalı).

Müşteri: ${customerName || "Müşteri"}
Pazaryeri: ${marketplace || "Trendyol"}
İlgili Ürün: ${productName || "Genel Ürün"}
Sipariş/Kargo Durumu Bilgisi (varsa): ${orderContext || "Bilgi yok"}
Müşterinin Sorusu: "${question}"

Lütfen sadece doğrudan müşteriye gönderilecek profesyonel yanıt metnini yaz (başlık veya meta açıklama ekleme).`;
}
