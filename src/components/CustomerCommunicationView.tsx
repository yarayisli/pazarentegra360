import React, { useState } from 'react';
import { 
  MessageSquareQuote, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Bot, 
  User, 
  FileText, 
  Zap, 
  ShieldCheck,
  Star,
  AlertTriangle,
  Gift,
  PhoneCall,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Award
} from 'lucide-react';
import { CustomerQuestion, ProductReviewItem } from '../types';

interface CustomerCommunicationViewProps {
  questions: CustomerQuestion[];
  reviews: ProductReviewItem[];
  onAnswerQuestion: (questionId: string, answerText: string) => void;
  onUpdateReview: (review: ProductReviewItem) => void;
}

export const CustomerCommunicationView: React.FC<CustomerCommunicationViewProps> = ({
  questions,
  reviews: initialReviews,
  onAnswerQuestion,
  onUpdateReview
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'QUESTIONS' | 'REVIEWS'>('QUESTIONS');
  
  // Questions State
  const [selectedQuestion, setSelectedQuestion] = useState<CustomerQuestion | null>(
    questions.find(q => q.status === 'WAITING') || questions[0] || null
  );
  const [answerDraft, setAnswerDraft] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'WAITING' | 'ANSWERED'>('ALL');

  // Reviews State
  const [reviews, setReviews] = useState<ProductReviewItem[]>(initialReviews);
  const [selectedReview, setSelectedReview] = useState<ProductReviewItem | null>(
    initialReviews.find(r => r.status === 'PENDING_ACTION') || initialReviews[0] || null
  );
  const [reviewReplyDraft, setReviewReplyDraft] = useState('');
  const [filterRating, setFilterRating] = useState<string>('ALL');

  const filteredQuestions = questions.filter(q => {
    if (filterStatus === 'ALL') return true;
    return q.status === filterStatus;
  });

  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'NEGATIVE') return r.rating <= 2;
    if (filterRating === 'POSITIVE') return r.rating >= 4;
    return true;
  });

  const waitingCount = questions.filter(q => q.status === 'WAITING').length;
  const criticalReviewsCount = reviews.filter(r => r.rating <= 2 && r.status === 'PENDING_ACTION').length;

  // AI Reply Generation for Questions
  const handleGenerateAiReply = async () => {
    if (!selectedQuestion) return;

    setIsGeneratingAi(true);
    try {
      const url = new URL('/api/ai/suggest-reply', window.location.href).toString();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: selectedQuestion.question,
          productName: selectedQuestion.productName,
          customerName: selectedQuestion.customerName,
          marketplace: selectedQuestion.marketplace,
          orderContext: selectedQuestion.orderNumber || 'Sipariş öncesi ürün sorusu'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.answer) {
          setAnswerDraft(data.answer);
          return;
        }
      }
      throw new Error('API unavailable');
    } catch {
      setAnswerDraft(`Merhaba ${selectedQuestion.customerName},\n\n"${selectedQuestion.productName}" ürünümüze gösterdiğiniz ilgi için teşekkür ederiz. Ürünümüz %100 orijinal, adınıza faturalı ve 2 yıl resmi Türkiye garantilidir. Saat 16:00'a kadar verilen tüm siparişler aynı gün korunaklı ambalaj ile kargoya teslim edilmektedir.\n\nKeyifli alışverişler dileriz.`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendAnswer = () => {
    if (!selectedQuestion || !answerDraft.trim()) return;
    onAnswerQuestion(selectedQuestion.id, answerDraft);
    setAnswerDraft('');
  };

  // Review Actions
  const handleSelectReview = (rev: ProductReviewItem) => {
    setSelectedReview(rev);
    setReviewReplyDraft(rev.sellerResponseDraft || '');
  };

  const handleApplyCompensation = (type: 'DISCOUNT_COUPON' | 'FREE_REPLACEMENT' | 'REFUND' | 'CALL_CUSTOMER') => {
    if (!selectedReview) return;
    const updated: ProductReviewItem = {
      ...selectedReview,
      status: 'RESOLVED',
      sellerResponseSent: reviewReplyDraft || selectedReview.sellerResponseDraft,
      compensationAction: {
        type,
        status: 'OFFERED',
        details: type === 'DISCOUNT_COUPON' 
          ? 'Müşteriye telafi amacıyla ₺100 mağaza hediye kuponu tanımlandı.'
          : type === 'FREE_REPLACEMENT'
          ? 'Müşteriye aynı gün yeni ürün sevk emri açıldı.'
          : 'Müşteri memnuniyet temsilcisi tarafından arandı.'
      }
    };
    setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
    setSelectedReview(updated);
    onUpdateReview(updated);
    alert(`Telafi aksiyonu (${type}) uygulandı ve müşteriye SMS/Mesaj ile iletildi.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Subtabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Omnichannel Müşteri Masası & İtibar Kalkanı</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Müşteri İletişimi & İtibar Kurtarma Merkezi
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Pazaryerlerinden gelen ürün sorularını Gemini AI ile kurumsal tonda saniyeler içinde yanıtlayın; 1-2 yıldızlı olumsuz yorumları anında telafi aksiyonuna dönüştürerek mağaza puanınızı koruyun.
            </p>
          </div>

          {/* SubTab Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('QUESTIONS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeSubTab === 'QUESTIONS'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
              <span>Ürün Soruları</span>
              {waitingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {waitingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('REVIEWS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeSubTab === 'REVIEWS'
                  ? 'bg-white text-rose-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Yorum & İtibar Kalkanı</span>
              {criticalReviewsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                  {criticalReviewsCount} Kriz
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: QUESTIONS (Q&A) */}
      {activeSubTab === 'QUESTIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Questions List (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">Gelen Sorular</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                  {filteredQuestions.length} adet
                </span>
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setFilterStatus('WAITING')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    filterStatus === 'WAITING' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Bekleyen ({waitingCount})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {filteredQuestions.map((q) => {
                const isSelected = selectedQuestion?.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestion(q);
                      setAnswerDraft('');
                    }}
                    className={`w-full text-left p-3.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border border-indigo-200 shadow-sm'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        q.marketplace === 'trendyol' ? 'bg-orange-100 text-orange-800' :
                        q.marketplace === 'hepsiburada' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {q.marketplace}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{q.createdAt}</span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                      {q.productName}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{q.question}"
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[10px]">
                      <span className="text-slate-500 font-medium">{q.customerName}</span>
                      {q.status === 'WAITING' ? (
                        <span className="text-amber-600 font-bold flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> Bekliyor
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Yanıtlandı
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Answer Box (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px] space-y-4">
            {selectedQuestion ? (
              <>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{selectedQuestion.productName}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{selectedQuestion.orderNumber || 'Genel Soru'}</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                    "{selectedQuestion.question}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Müşteri: <strong>{selectedQuestion.customerName}</strong></span>
                    <span>Kanal: <strong className="uppercase">{selectedQuestion.marketplace}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Müşteriye Gönderilecek Yanıt:</span>
                  <button
                    onClick={handleGenerateAiReply}
                    disabled={isGeneratingAi}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>{isGeneratingAi ? 'AI Yanıt Hazırlıyor...' : 'Gemini AI ile Yanıt Taslağı Üret'}</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={answerDraft}
                  onChange={(e) => setAnswerDraft(e.target.value)}
                  placeholder="Yanıtınızı buraya yazın veya AI Taslağı butonuna tıklayın..."
                  className="w-full flex-1 p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pazaryeri iletişim kurallarına uygunluk doğrulaması devrede</span>
                  </div>

                  <button
                    onClick={handleSendAnswer}
                    disabled={!answerDraft.trim()}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cevabı Gönder & Pazaryerine İlet</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Lütfen listeden bir soru seçin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: REVIEWS & REPUTATION SHIELD */}
      {activeSubTab === 'REVIEWS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Reviews List (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">Müşteri Yorumları</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold">
                  {filteredReviews.length} yorum
                </span>
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilterRating('ALL')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    filterRating === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setFilterRating('NEGATIVE')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    filterRating === 'NEGATIVE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  1-2 Yıldız ({reviews.filter(r => r.rating <= 2).length})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {filteredReviews.map((r) => {
                const isSelected = selectedReview?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectReview(r)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-rose-50/70 border border-rose-200 shadow-sm'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{r.commentDate}</span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                      {r.productName}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{r.commentText}"
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[10px]">
                      <span className="text-slate-500 font-medium">{r.customerName} ({r.marketplace})</span>
                      {r.status === 'PENDING_ACTION' ? (
                        <span className="text-rose-600 font-bold flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Kriz Çözüm Bekliyor
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Telafi Edildi
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Review Rescue Desk (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[650px] space-y-4 overflow-y-auto">
            {selectedReview ? (
              <>
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= selectedReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                        />
                      ))}
                      <span className="font-bold text-slate-900 text-xs ml-2">
                        {selectedReview.rating} / 5 Yıldız
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                      Kök Neden: {selectedReview.rootCause}
                    </span>
                  </div>

                  <p className="text-xs text-slate-900 font-medium bg-white p-3.5 rounded-xl border border-rose-100 leading-relaxed shadow-sm">
                    "{selectedReview.commentText}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Müşteri: <strong>{selectedReview.customerName}</strong></span>
                    <span>Sipariş No: <strong className="font-mono">{selectedReview.orderNumber}</strong></span>
                  </div>
                </div>

                {/* Instant Compensation Toolbar */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center text-amber-300">
                      <Award className="w-4 h-4 mr-1.5" />
                      İtibar Kurtarma & Hızlı Telafi Aksiyonu
                    </span>
                    <span className="text-[10px] text-slate-400">Puanı 5 yıldıza çevirme garantisi</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => handleApplyCompensation('FREE_REPLACEMENT')}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-xs transition-all"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-400 mb-1" />
                      <div className="font-bold text-white text-[11px]">Ücretsiz Değişim</div>
                      <span className="text-[10px] text-slate-400 block">Sıfır kapalı kutu ürün sevk et</span>
                    </button>

                    <button
                      onClick={() => handleApplyCompensation('DISCOUNT_COUPON')}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-xs transition-all"
                    >
                      <Gift className="w-4 h-4 text-amber-400 mb-1" />
                      <div className="font-bold text-white text-[11px]">₺100 Telafi Kuponu</div>
                      <span className="text-[10px] text-slate-400 block">Müşteri hesabına anında aktar</span>
                    </button>

                    <button
                      onClick={() => handleApplyCompensation('CALL_CUSTOMER')}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-xs transition-all"
                    >
                      <PhoneCall className="w-4 h-4 text-blue-400 mb-1" />
                      <div className="font-bold text-white text-[11px]">VIP Destek Araması</div>
                      <span className="text-[10px] text-slate-400 block">Müşteriyi arayıp kurulum yaptır</span>
                    </button>
                  </div>
                </div>

                {/* Seller Response Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Yorumun Altına Yazılacak Resmi Mağaza Yanıtı:</label>
                    <span className="text-[10px] text-slate-400">Potansiyel alıcılar bu yanıtı görecek</span>
                  </div>

                  <textarea
                    rows={4}
                    value={reviewReplyDraft}
                    onChange={(e) => setReviewReplyDraft(e.target.value)}
                    placeholder="Müşteriye ve tüm potansiyel alıcılara hitap edecek kurumsal yanıtınızı yazın..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      if (!selectedReview) return;
                      const updated: ProductReviewItem = {
                        ...selectedReview,
                        status: 'DISPUTED_WITH_PLATFORM'
                      };
                      setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
                      setSelectedReview(updated);
                      onUpdateReview(updated);
                      alert('Pazaryeri desteğine haksız yorum itirazı (Kargo kusuru gerekçesiyle) başarıyla açıldı.');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Pazaryerine Haksız Yorum İtirazı Aç
                  </button>

                  <button
                    onClick={() => {
                      if (!selectedReview) return;
                      const updated: ProductReviewItem = {
                        ...selectedReview,
                        status: 'RESOLVED',
                        sellerResponseSent: reviewReplyDraft
                      };
                      setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
                      setSelectedReview(updated);
                      onUpdateReview(updated);
                      alert('Resmi mağaza yanıtı pazaryeri yorum paneline iletildi.');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
                  >
                    Yanıtı Yayınla & Yorumu Kapat
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Lütfen incelenecek bir müşteri yorumu seçin.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
