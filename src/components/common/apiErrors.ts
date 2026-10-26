import { ApiError } from "../../api/client";

// User-facing Turkish messages for the API error codes the backend emits.
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.",
  UNAUTHENTICATED: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
  FORBIDDEN: "Bu işlem için yetkiniz yok.",
  NOT_FOUND: "İstenen kayıt bulunamadı.",
  NOT_PENDING: "İşlem artık beklemiyor: karar verilmiş veya süresi dolmuş.",
  VALIDATION_ERROR: "Girilen bilgiler geçersiz.",
  RATE_LIMITED: "Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.",
  INTERNAL_ERROR: "Beklenmeyen bir sunucu hatası oluştu.",
};

const GENERIC = "Bir hata oluştu. Lütfen tekrar deneyin.";

// Known code → fixed Turkish text; otherwise the server message; otherwise a generic fallback.
export function errorMessageOf(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return MESSAGES.UNAUTHENTICATED;
    if (error.status >= 500 && !MESSAGES[error.code]) return MESSAGES.INTERNAL_ERROR;
    return MESSAGES[error.code] ?? (error.message || GENERIC);
  }
  return GENERIC;
}
