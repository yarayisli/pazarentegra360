import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  Clock, 
  DollarSign, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  RotateCcw,
  ArrowRight,
  BarChart2,
  Lock
} from 'lucide-react';
import { BuyboxMonitorItem, BuyboxCompetitor } from '../types';

interface BuyboxRepricerViewProps {
  items: BuyboxMonitorItem[];
  onUpdateStrategy: (id: string, strategy: BuyboxMonitorItem['strategy'], autoReprice: boolean) => void;
  onApplyReprice: (id: string, newPrice: number) => void;
}

export const BuyboxRepricerView: React.FC<BuyboxRepricerViewProps> = ({
  items: initialItems,
  onUpdateStrategy,
  onApplyReprice,
}) => {
  const [items, setItems] = useState<BuyboxMonitorItem[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<BuyboxMonitorItem | null>(null);
  const [customFloor, setCustomFloor] = useState<number>(0);
  const [customCeiling, setCustomCeiling] = useState<number>(0);

  // Aggregate stats
  const winningCount = items.filter(i => i.isWinningBuybox).length;
  const losingCount = items.length - winningCount;
  const autoRepriceCount = items.filter(i => i.autoRepriceEnabled).length;

  // Toggle Auto Reprice
  const handleToggleAutoReprice = (item: BuyboxMonitorItem) => {
    const updated = items.map(i => {
      if (i.id === item.id) {
        return { ...i, autoRepriceEnabled: !i.autoRepriceEnabled };
      }
      return i;
    });
    setItems(updated);
    onUpdateStrategy(item.id, item.strategy, !item.autoRepriceEnabled);
  };

  // Run Smart Reprice Rule Simulation
  const handleExecuteSmartReprice = (item: BuyboxMonitorItem) => {
    let targetPrice = item.myCurrentPrice;

    if (item.strategy === 'BEAT_BY_1TL') {
      targetPrice = item.buyboxWinnerPrice - 1;
    } else if (item.strategy === 'MATCH_BUYBOX') {
      targetPrice = item.buyboxWinnerPrice;
    } else if (item.strategy === 'PROFIT_MAXIMIZER') {
      // If we are already winning, try to raise price up to 2nd competitor - 1
      const sorted = [...item.competitors].sort((a, b) => a.price - b.price);
      if (sorted.length > 1) {
        targetPrice = Math.min(item.maxPriceCeiling, sorted[1].price - 0.5);
      }
    }

    // Min floor check (COGS & Profit Guard)
    if (targetPrice < item.minPriceFloor) {
      alert(`⚠️ Güvenlik Kilidi Devrede!\nHedef fiyat (₺${targetPrice.toFixed(2)}) asgari kâr eşiğinin (₺${item.minPriceFloor.toFixed(2)}) altında kaldığı için fiyat düşürülmedi.`);
      return;
    }

    const updated = items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          myCurrentPrice: targetPrice,
          isWinningBuybox: true,
          lastRepricedAt: Date.now(),
          priceHistory: [
            { timestamp: Date.now(), price: targetPrice, trigger: `Otomatik Repricer (${item.strategy})` },
            ...i.priceHistory
          ]
        };
      }
      return i;
    });

    setItems(updated);
    onApplyReprice(item.id, targetPrice);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Canlı Buybox Radarı & Akıllı Fiyatlandırma (Repricer)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Buybox Takibi & Dinamik Fiyatlandırma Motoru
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Trendyol ve Hepsiburada'da rakip satıcıların fiyatlarını 7/24 izler; asgari kâr tabanınızın altına inmeden Buybox'ı geri alır.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                items.forEach(item => {
                  if (item.autoRepriceEnabled && !item.isWinningBuybox) {
                    handleExecuteSmartReprice(item);
                  }
                });
                alert('Tüm otomatik kurallara göre Reprice simülasyonu çalıştırıldı ve fiyatlar güncellendi.');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center shadow-md transition-all"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Tüm Kuralları Şimdi Çalıştır
            </button>
          </div>
        </div>

        {/* Aggregated KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs text-emerald-800 font-semibold">Buybox Kazanılan Ürünler</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-600">
                {winningCount} / {items.length} SKU (%{Math.round((winningCount / items.length) * 100)})
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">Sipariş akışı birinci sırada</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs text-rose-800 font-semibold">Buybox Kaybedilen (Riskte)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-rose-600">
                {losingCount} Ürün
              </span>
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-rose-700 mt-1 block">Rakip daha düşük fiyat veriyor</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <span className="text-xs text-indigo-900 font-semibold">Otomatik Repricer Aktif</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-indigo-900">
                {autoRepriceCount} SKU
              </span>
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-indigo-700 mt-1 block">
              Zarar önleme güvenlik tabanı devrede
            </span>
          </div>
        </div>
      </div>

      {/* Main Repricer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Canlı Buybox Matrisi & Rakip Fiyat Analizi</h3>
            <span className="text-xs text-slate-500">Pazaryeri API'leri ve anlık scraping ile rakipler kontrol edilir</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Kanal & Ürün</th>
                <th className="py-3 px-4">Bizim Fiyatımız</th>
                <th className="py-3 px-4">Buybox Fiyatı</th>
                <th className="py-3 px-4">Fiyat Sınırları (Taban / Tavan)</th>
                <th className="py-3 px-4">Buybox Sahibi & Rakipler</th>
                <th className="py-3 px-4">Strateji</th>
                <th className="py-3 px-4">Otomatik Bot</th>
                <th className="py-3 px-4 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${!item.isWinningBuybox ? 'bg-amber-50/20' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.marketplace === 'trendyol' ? 'bg-orange-100 text-orange-800' :
                        item.marketplace === 'hepsiburada' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.marketplace}
                      </span>
                      <span className="font-semibold text-slate-900 truncate max-w-[180px]" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.sku}</span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap text-sm">
                    ₺{item.myCurrentPrice.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-bold text-sm ${item.isWinningBuybox ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₺{item.buyboxWinnerPrice.toFixed(2)}
                      </span>
                      {item.isWinningBuybox ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Kazanıyoruz 🏆
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                          Kaybettik!
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    <div className="text-[11px]">
                      <span className="text-rose-600 font-medium">Min: ₺{item.minPriceFloor}</span>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="text-slate-600">Maks: ₺{item.maxPriceCeiling}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Maliyet: ₺{item.cogs}</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-1 max-w-[220px]">
                      {item.competitors.slice(0, 2).map((c, cIdx) => (
                        <div key={cIdx} className="flex items-center justify-between text-[11px]">
                          <span className={`truncate ${c.isBuyboxOwner ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                            {c.sellerName}
                          </span>
                          <span className="font-mono text-slate-800 font-medium">
                            ₺{c.price.toFixed(0)}
                          </span>
                        </div>
                      ))}
                      {item.competitors.length > 2 && (
                        <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer" onClick={() => setSelectedItem(item)}>
                          +{item.competitors.length - 2} Diğer Rakip
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                      {item.strategy === 'BEAT_BY_1TL' && 'Rakibin ₺1 Altı'}
                      {item.strategy === 'MATCH_BUYBOX' && 'Buybox ile Eşitle'}
                      {item.strategy === 'PROFIT_MAXIMIZER' && 'Maksimum Kâr'}
                      {item.strategy === 'MANUAL' && 'Manuel'}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleAutoReprice(item)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        item.autoRepriceEnabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.autoRepriceEnabled ? 'Aktif (Otomatik)' : 'Pasif'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleExecuteSmartReprice(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-sm transition-all flex items-center ml-auto"
                    >
                      <Zap className="w-3 h-3 mr-1 text-amber-300" />
                      Fiyatı Güncelle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitor Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tüm Rakip Satıcı Listesi</h3>
                <span className="text-xs text-slate-500">{selectedItem.name}</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedItem.competitors.map((comp, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  comp.isBuyboxOwner ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900">{comp.sellerName}</span>
                      {comp.isBuyboxOwner && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                          Buybox Sahibi
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Puan: {comp.sellerRating} • {comp.isFulfillmentByMarketplace ? 'Pazaryeri Lojistiği' : 'Satıcı Kargo'} • {comp.shippingDays} Günde Teslim
                    </div>
                  </div>

                  <span className="text-sm font-bold text-slate-900">
                    ₺{comp.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
