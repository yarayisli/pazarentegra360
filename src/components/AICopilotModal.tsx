import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  TrendingDown, 
  RotateCcw, 
  Zap, 
  Clock,
  HelpCircle,
  Check
} from 'lucide-react';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actions?: { label: string; tab: string }[];
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Merhaba! Ben **PazarEntegra AI E-Ticaret Copilot**'unuz.\n\nTrendyol V2, Hepsiburada ve N11 verileriniz üzerinden canlı kârlılık, iade anomalileri, stok tükenme riskleri ve SLA cezalarını analiz ediyorum.\n\nSize bugün nasıl yardımcı olabilirim?`,
      timestamp: 'Şimdi',
      actions: [
        { label: '🔴 Gizli Zarar Eden SKU\'lar', tab: 'profitability' },
        { label: '📦 İade Kök Neden Analizi', tab: 'returns' },
        { label: '⚡ Tükenmek Üzere Olan Ürünler', tab: 'forecast' }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setIsLoading(true);

    try {
      const url = new URL('/api/ai/copilot', window.location.href).toString();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          context: { source: 'copilot-chat' }
        })
      });
      let responseText = '';
      if (res.ok) {
        const data = await res.json();
        responseText = data.text || '';
      }
      if (!responseText) {
        throw new Error('No response');
      }

      let actions: { label: string; tab: string }[] | undefined;
      const lower = textToSend.toLowerCase();
      if (lower.includes('koli') || lower.includes('paket') || lower.includes('kutu') || lower.includes('ebat')) {
        actions = [{ label: 'Akıllı Koli & 3D Paketlemeye Git', tab: 'packaging' }];
      } else if (lower.includes('pos') || lower.includes('kasa') || lower.includes('perakende') || lower.includes('barkod satış') || lower.includes('fiş')) {
        actions = [{ label: 'ikas POS Kasa Terminaline Git', tab: 'pos' }];
      } else if (lower.includes('yorum') || lower.includes('puan') || lower.includes('itibar') || lower.includes('şikayet') || lower.includes('yıldız') || lower.includes('soru')) {
        actions = [{ label: 'Müşteri & İtibar Masasına Git', tab: 'questions' }];
      } else if (lower.includes('hakediş') || lower.includes('kesinti') || lower.includes('desi') || lower.includes('mutabakat') || lower.includes('itiraz')) {
        actions = [{ label: 'Hakediş & Desi Denetçisine Git', tab: 'settlement' }];
      } else if (lower.includes('iade') || lower.includes('neden')) {
        actions = [{ label: 'İade Masasına Git', tab: 'returns' }];
      } else if (lower.includes('zarar') || lower.includes('kâr') || lower.includes('fiyat')) {
        actions = [{ label: 'Kârlılık Motoruna Git', tab: 'profitability' }];
      } else if (lower.includes('stok') || lower.includes('tükenecek')) {
        actions = [{ label: 'Stok Tahminine Git', tab: 'forecast' }];
      } else if (lower.includes('buybox') || lower.includes('rakip')) {
        actions = [{ label: 'Buybox Radarına Git', tab: 'buybox' }];
      } else if (lower.includes('depo') || lower.includes('raf') || lower.includes('dalga')) {
        actions = [{ label: 'WMS Raf Paneline Git', tab: 'wms' }];
      }

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: responseText || 'Analiz tamamlandı.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        actions
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        sender: 'ai',
        text: 'Üzgünüm, şu an analiz servisine erişilirken bir hata oluştu. Lütfen tekrar deneyiniz.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 text-white rounded-3xl max-w-2xl w-full h-[640px] shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">PazarEntegra AI Copilot</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Canlı E-Ticaret Analisti
                </span>
              </div>
              <span className="text-xs text-slate-400 block">Gemini 3.8 Flash • Sipariş, Finans ve Depo Verilerine Bağlı</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-slate-400 text-[11px] whitespace-nowrap font-medium">Hızlı Sor:</span>
          {[
            "En çok para kaybettiren ürünler?",
            "AirFlow Pro iadeleri neden arttı?",
            "Buybox kaybettiğimiz ürünler hangileri?",
            "Hangi ürünün stoğu bitiyor?",
            "Depo dalga toplama durumu nedir?"
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white whitespace-nowrap text-[11px] border border-slate-700/60 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'ai' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
              }`}>
                {msg.sender === 'ai' ? <Sparkles className="w-4 h-4 text-amber-300" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'ai' 
                  ? 'bg-slate-900 border border-slate-800 text-slate-200' 
                  : 'bg-indigo-600 text-white'
              }`}>
                <div className="whitespace-pre-line font-sans">{msg.text}</div>
                
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onNavigateTab(act.tab);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-semibold text-[11px] border border-indigo-500/40 transition-colors"
                      >
                        {act.label} →
                      </button>
                    ))}
                  </div>
                )}

                <span className="block text-[10px] text-slate-500 mt-2 text-right">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs p-3">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-200" />
              <span className="text-[11px]">E-Ticaret verileri ve formüller analiz ediliyor...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Doğal dilde sorun: 'En kârlı ürün hangisi?', 'Satışlar neden düştü?'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-40 transition-all flex items-center"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
};
