import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ShoppingCart, 
  Warehouse, 
  Sparkles, 
  FileText, 
  Check, 
  Layers, 
  Boxes,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { StockDemandForecast, ProductItem } from '../types';

interface StockForecastViewProps {
  forecasts: StockDemandForecast[];
  products: ProductItem[];
  onCreatePO: (sku: string, quantity: number) => void;
}

export const StockForecastView: React.FC<StockForecastViewProps> = ({
  forecasts,
  products,
  onCreatePO,
}) => {
  const [items, setItems] = useState<StockDemandForecast[]>(forecasts);
  const [selectedPO, setSelectedPO] = useState<{ sku: string; name: string; qty: number } | null>(null);
  const [createdPOs, setCreatedPOs] = useState<string[]>([]);

  // Forecast aggregations
  const criticalItems = items.filter(i => i.riskLevel === 'CRITICAL_RUNOUT');
  const orderNowItems = items.filter(i => i.riskLevel === 'ORDER_NOW');
  const deadStockItems = items.filter(i => i.riskLevel === 'DEAD_STOCK');

  // Handle PO Creation
  const handleConfirmPO = () => {
    if (!selectedPO) return;
    onCreatePO(selectedPO.sku, selectedPO.qty);
    setCreatedPOs(prev => [...prev, selectedPO.sku]);
    alert(`Satın Alma Emri (PO) Başarıyla Oluşturuldu!\nSKU: ${selectedPO.sku}\nMiktar: ${selectedPO.qty} Adet\nTedarikçi bildirim taslağı hazırlandı.`);
    setSelectedPO(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Akıllı Talep Tahmini & Tedarik Motoru</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Akıllı Stok Tahmini & Satın Alma (PO) Planlama
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Satış hızı, lead time (tedarik süresi) ve emniyet stoğuna göre stok tükenme riskini önceden hesaplar; Buybox kaybını engeller.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              ABC Pareto Sınıflandırması Aktif
            </span>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
            <span className="text-xs text-rose-800 font-semibold">Tükenme Riski (&lt;7 Gün)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-rose-600">{criticalItems.length} SKU</span>
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-rose-600 mt-1 block">Tedarik süresi stoktan uzun!</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-xs text-amber-800 font-semibold">Sipariş Zamanı Gelen</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-amber-600">{orderNowItems.length} SKU</span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <ShoppingCart className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-amber-700 mt-1 block">Emniyet stoğuna yaklaşıyor</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-xs text-emerald-800 font-semibold">Optimal Stoklu Ürünler</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-600">3 SKU</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">15-30 gün arası yeterli stok</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Hareketsiz Stok (Dead Stock)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-slate-700">{deadStockItems.length} SKU</span>
              <span className="p-1.5 rounded-lg bg-slate-200 text-slate-600">
                <Boxes className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Zarar eden veya satmayan</span>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Notice */}
      {criticalItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                Stok Acil Durumu: {criticalItems[0].name} 6.8 gün sonra tükeniyor!
              </h4>
              <p className="text-amber-800 mt-0.5">
                Tedarikçinin teslim etmesi 8 gün sürdüğü için en geç bugün sipariş verilmezse ~₺32.000 ciro ve Buybox sıralaması kaybedilecek.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPO({ sku: criticalItems[0].sku, name: criticalItems[0].name, qty: criticalItems[0].suggestedReorderQty })}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap shadow-sm"
          >
            Hemen PO Oluştur ({criticalItems[0].suggestedReorderQty} Adet)
          </button>
        </div>
      )}

      {/* Demand Forecast Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">SKU Bazlı Satış Hızı & Satın Alma Öngörüsü</h3>
            <span className="text-xs text-slate-500">Geçmiş satış ivmesi ve tedarik süresi algoritmasıyla hesaplanmıştır</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ürün & ABC</th>
                <th className="py-3 px-4">Mevcut Stok</th>
                <th className="py-3 px-4">Satış Hızı</th>
                <th className="py-3 px-4">Tükenme Süresi</th>
                <th className="py-3 px-4">Tedarik (Lead Time)</th>
                <th className="py-3 px-4">Güvenli Stok</th>
                <th className="py-3 px-4">Önerilen PO Miktarı</th>
                <th className="py-3 px-4">Durum / Risk</th>
                <th className="py-3 px-4 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        item.abcCategory === 'A' ? 'bg-purple-100 text-purple-800' :
                        item.abcCategory === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        Sınıf {item.abcCategory}
                      </span>
                      <span className="font-semibold text-slate-900 truncate max-w-[180px]" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.sku}</span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.currentStock} Adet
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-semibold">{item.dailyVelocity}</span>
                    <span className="text-[10px] text-slate-400 block">adet / gün</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`font-bold ${
                      item.runoutDays < 7 ? 'text-red-600' :
                      item.runoutDays < 15 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {item.runoutDays.toFixed(1)} Gün
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {item.leadTimeDays} Gün
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {item.safetyStock} Adet
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.suggestedReorderQty > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        {item.suggestedReorderQty} Adet
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.riskLevel === 'CRITICAL_RUNOUT' ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300' :
                      item.riskLevel === 'ORDER_NOW' ? 'bg-amber-100 text-amber-800' :
                      item.riskLevel === 'DEAD_STOCK' ? 'bg-slate-100 text-slate-600' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.riskLevel === 'CRITICAL_RUNOUT' && 'Acil Tükeniyor!'}
                      {item.riskLevel === 'ORDER_NOW' && 'Sipariş Zamanı'}
                      {item.riskLevel === 'OPTIMAL' && 'Optimal'}
                      {item.riskLevel === 'DEAD_STOCK' && 'Hareketsiz / Zarar'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {item.suggestedReorderQty > 0 ? (
                      createdPOs.includes(item.sku) ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                          <Check className="w-3.5 h-3.5 mr-1" /> PO Açıldı
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedPO({ sku: item.sku, name: item.name, qty: item.suggestedReorderQty })}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-sm transition-all"
                        >
                          PO Oluştur
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Gerek yok</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Confirmation Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Satın Alma Siparişi (PO) Onayı</h3>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="font-bold text-slate-900">{selectedPO.name}</div>
              <div className="text-slate-500 font-mono">SKU: {selectedPO.sku}</div>
              <div className="text-indigo-700 font-semibold">
                Önerilen Satın Alma Miktarı: {selectedPO.qty} Adet
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              Bu işlem resmi bir Satın Alma Emri oluşturur, tedarikçiye e-posta taslağı hazırlar ve beklenen mal kabul takvimine işler.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmPO}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md flex items-center"
              >
                <Check className="w-4 h-4 mr-1 text-emerald-400" />
                PO'yu Onayla ve Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
