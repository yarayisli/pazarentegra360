import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Sparkles, 
  Sliders, 
  ArrowUpRight, 
  Percent, 
  Calculator,
  ShieldAlert,
  Award
} from 'lucide-react';
import { SKUProfitability } from '../types';

interface SKUProfitabilityViewProps {
  profitabilityData: SKUProfitability[];
  onUpdatePricing: (sku: string, newPrice: number) => void;
}

export const SKUProfitabilityView: React.FC<SKUProfitabilityViewProps> = ({
  profitabilityData,
  onUpdatePricing,
}) => {
  const [items, setItems] = useState<SKUProfitability[]>(profitabilityData);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(0);

  // Financial aggregates
  const totalNetMonthlyProfit = items.reduce((acc, i) => acc + i.totalNetProfit, 0);
  const lossMakingItems = items.filter(i => i.isLossMaking);
  const totalMonthlyLoss = lossMakingItems.reduce((acc, i) => acc + Math.abs(i.totalNetProfit), 0);
  const topEarner = [...items].sort((a, b) => b.totalNetProfit - a.totalNetProfit)[0];

  // Quick price update simulation
  const handleStartEdit = (item: SKUProfitability) => {
    setEditingSku(item.sku);
    setSimulatedPrice(item.salePrice);
  };

  const handleApplyNewPrice = (item: SKUProfitability) => {
    const diff = simulatedPrice - item.salePrice;
    const newCommission = simulatedPrice * (item.commissionRate / 100);
    const newNetMargin = simulatedPrice - item.cogs - newCommission - item.shippingCost - item.packagingCost - item.adCostPerUnit - item.taxAndWithholding - item.returnLossPerUnit;
    const isStillLoss = newNetMargin < 0;

    const updated = items.map(i => {
      if (i.sku === item.sku) {
        return {
          ...i,
          salePrice: simulatedPrice,
          commissionAmount: newCommission,
          netContributionMargin: newNetMargin,
          marginPercentage: Number(((newNetMargin / simulatedPrice) * 100).toFixed(1)),
          totalNetProfit: newNetMargin * i.monthlySalesQty,
          isLossMaking: isStillLoss,
          recommendation: isStillLoss ? i.recommendation : "✅ Fiyat artışı ile ürün kâra geçirildi!"
        };
      }
      return i;
    });

    setItems(updated);
    onUpdatePricing(item.sku, simulatedPrice);
    setEditingSku(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Net Katkı Payı & Gerçek Maliyet Motoru</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              SKU Gerçek Kârlılık & Gizli Masraf Radarı
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Satış Fiyatı - COGS - Pazaryeri Komisyonu - Desi Kargo - Ambalaj - Reklam (PPC) - KDV - İade Oranı Kaybı = Net Cepte Kalan Kâr.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center">
              <Percent className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span>Ortalama Net Marj: %18.2</span>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Aylık Toplam Net Katkı Payı</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-600">
                ₺{totalNetMonthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Tüm masraflar düşüldükten sonra</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs text-rose-800 font-semibold">Gizli Zarar Yapan SKU'lar</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-rose-600">
                {lossMakingItems.length} Ürün (₺{totalMonthlyLoss.toFixed(0)} Zarar/Ay)
              </span>
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-rose-600 mt-1 block">Kargo + komisyon kârı yutuyor</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <span className="text-xs text-indigo-900 font-semibold">En Çok Kazandıran Lider Ürün</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-indigo-900 truncate max-w-[200px]" title={topEarner?.name}>
                {topEarner?.name}
              </span>
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-indigo-700 mt-1 block">
              Aylık Net: +₺{topEarner?.totalNetProfit.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden Loss Warning Alert (if any loss making products exist) */}
      {lossMakingItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-900 text-sm">
              Gizli Zarar Radarı: {lossMakingItems.length} SKU her satışta eksi bakiye üretiyor!
            </h4>
            <p className="text-rose-700 mt-1 leading-relaxed">
              Örnek: <span className="font-bold">{lossMakingItems[0].name}</span>, pazaryeri kargo zammı ve %12 iade oranı nedeniyle her siparişte net <span className="font-bold">₺{lossMakingItems[0].netContributionMargin.toFixed(2)}</span> zarar yazıyor. Satış hacmi arttıkça toplam zarar büyüyor. Fiyatı revize ediniz.
            </p>
          </div>
        </div>
      )}

      {/* Detailed SKU Margin Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Birim Maliyet & Katkı Payı Detay Matrisi</h3>
            <span className="text-xs text-slate-500">Tüm pazaryeri ve operasyon kesintileri ayrıştırılmıştır</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ürün & SKU</th>
                <th className="py-3 px-4">Satış Fiyatı</th>
                <th className="py-3 px-4">COGS (Alış)</th>
                <th className="py-3 px-4">Komisyon</th>
                <th className="py-3 px-4">Kargo (Desi)</th>
                <th className="py-3 px-4">Paket + Reklam</th>
                <th className="py-3 px-4">İade Payı</th>
                <th className="py-3 px-4">Net Katkı Payı</th>
                <th className="py-3 px-4">Marj %</th>
                <th className="py-3 px-4">Aylık Net Kâr</th>
                <th className="py-3 px-4 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr 
                  key={item.sku} 
                  className={`hover:bg-slate-50 transition-colors ${item.isLossMaking ? 'bg-rose-50/40' : ''}`}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={item.name}>
                      {item.name}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {editingSku === item.sku ? (
                      <input
                        type="number"
                        value={simulatedPrice}
                        onChange={(e) => setSimulatedPrice(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-indigo-500 rounded text-xs font-bold text-slate-900"
                        autoFocus
                      />
                    ) : (
                      `₺${item.salePrice.toFixed(2)}`
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    ₺{item.cogs.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-slate-800">₺{item.commissionAmount.toFixed(2)}</span>
                    <span className="block text-[10px] text-slate-400">%{item.commissionRate}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    ₺{item.shippingCost.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    ₺{(item.packagingCost + item.adCostPerUnit).toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-rose-600 whitespace-nowrap font-medium">
                    -₺{item.returnLossPerUnit.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      item.isLossMaking 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      ₺{item.netContributionMargin.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-bold whitespace-nowrap">
                    <span className={item.isLossMaking ? 'text-rose-600' : 'text-emerald-600'}>
                      %{item.marginPercentage}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    ₺{item.totalNetProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {editingSku === item.sku ? (
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleApplyNewPrice(item)}
                          className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[11px]"
                        >
                          Uygula
                        </button>
                        <button
                          onClick={() => setEditingSku(null)}
                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[11px]"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center ml-auto"
                      >
                        <Sliders className="w-3 h-3 mr-1" />
                        Fiyat Simüle Et
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
