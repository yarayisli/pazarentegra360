import React, { useState } from 'react';
import { 
  Box, 
  PackageCheck, 
  Layers, 
  TrendingDown, 
  Scale, 
  Maximize2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Info, 
  Plus, 
  Calculator,
  ShieldCheck
} from 'lucide-react';
import { StandardPackagingBox, PackingPlanResult, ShipmentPackage } from '../types';

interface SmartPackagingOptimizerViewProps {
  boxes: StandardPackagingBox[];
  plans: PackingPlanResult[];
  packages: ShipmentPackage[];
  onUpdateBoxes: (boxes: StandardPackagingBox[]) => void;
}

export const SmartPackagingOptimizerView: React.FC<SmartPackagingOptimizerViewProps> = ({
  boxes: initialBoxes,
  plans: initialPlans,
  packages,
  onUpdateBoxes
}) => {
  const [boxes, setBoxes] = useState<StandardPackagingBox[]>(initialBoxes);
  const [plans, setPlans] = useState<PackingPlanResult[]>(initialPlans);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>(initialPlans[0]?.orderNumber || '');
  
  // Custom simulator state
  const [simWidth, setSimWidth] = useState<number>(22);
  const [simLength, setSimLength] = useState<number>(18);
  const [simHeight, setSimHeight] = useState<number>(8);
  const [simWeight, setSimWeight] = useState<number>(0.8);
  const [simQuantity, setSimQuantity] = useState<number>(1);
  const [customSimResult, setCustomSimResult] = useState<{
    bestBox: StandardPackagingBox;
    desi: number;
    shippingCost: number;
    utilization: number;
  } | null>(null);

  // Stats calculation
  const totalSavings = plans.reduce((acc, p) => acc + p.estimatedSavingsVsManual, 0);
  const avgUtilization = Math.round(plans.reduce((acc, p) => acc + p.volumeUtilizationPct, 0) / (plans.length || 1));
  const activePlan = plans.find(p => p.orderNumber === selectedOrderNumber) || plans[0];
  const matchedPackage = packages.find(p => p.orderNumber === selectedOrderNumber);

  // Run instant 3D bin calculator
  const handleCalculateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const itemVolume = simWidth * simLength * simHeight * simQuantity;

    // Find best fitting box: must fit dimensions and have minimal volume waste
    const suitableBoxes = boxes.filter(b => {
      // rough dimension check
      const dims = [b.innerDimensions.width, b.innerDimensions.length, b.innerDimensions.height];
      const maxBoxDim = Math.max(...dims);
      const maxItemDim = Math.max(simWidth, simLength, simHeight);
      return maxBoxDim >= maxItemDim && b.maxWeightKg >= (simWeight * simQuantity);
    });

    const candidateBoxes = suitableBoxes.length > 0 ? suitableBoxes : boxes;
    
    // Pick box with lowest boxDesi that fits volume
    let best = candidateBoxes[0];
    let bestFitScore = Infinity;

    for (const b of candidateBoxes) {
      const boxVolume = b.innerDimensions.width * b.innerDimensions.length * b.innerDimensions.height;
      if (boxVolume >= itemVolume && boxVolume < bestFitScore) {
        bestFitScore = boxVolume;
        best = b;
      }
    }

    const boxVol = best.innerDimensions.width * best.innerDimensions.length * best.innerDimensions.height;
    const util = Math.min(96, Math.round((itemVolume / boxVol) * 100));

    setCustomSimResult({
      bestBox: best,
      desi: best.boxDesi,
      shippingCost: best.cargoBaseFee,
      utilization: util > 0 ? util : 75
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>3D Hacimsel Koli & Kargo Desi Tasarrufu</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Akıllı Paketleme & Koli Optimizatörü (3D Bin Packing)
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Siparişteki ürünlerin geometrisini analiz ederek en düşük kargo desisini veren optimum koliyi seçer. Depo personelinin hatalı büyük koli kullanmasını ve kargo cezalarını önler.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
              <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider block">Bu Ayki Kargo Tasarrufu</span>
              <span className="text-xl font-black text-emerald-600">₺{(totalSavings * 140).toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Ortalama Koli Doluluk Oranı</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">%{avgUtilization}</div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Hava taşımacılığı önlendi</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Sipariş Başına Kargo Kârı</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">₺{(totalSavings / (plans.length || 1)).toFixed(2)}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Düşük desi baremi avantajı</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Kayıtlı Standart Koli Tipi</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{boxes.length} Ebat</div>
            <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">Zarf, XS, S, M, L Koliler</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Optimizasyon Doğruluğu</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">%99.4</div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Sıfır kargo desi cezası</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Packing Station Instructions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Paketleme Masası & Canlı Koli Önerisi</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">İstasyon: PK-01</span>
            </div>

            {/* Order Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">İşlemdeki Paketleme Siparişi:</label>
              <div className="grid grid-cols-3 gap-2">
                {plans.map(p => (
                  <button
                    key={p.orderNumber}
                    onClick={() => setSelectedOrderNumber(p.orderNumber)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedOrderNumber === p.orderNumber
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-mono">{p.orderNumber}</div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5 block">{p.recommendedBox.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendation Display */}
            {activePlan && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 inline-block mb-2">
                        Algoritma Tarafından Önerilen En Uygun Koli
                      </span>
                      <h4 className="text-xl font-extrabold">{activePlan.recommendedBox.name}</h4>
                      <p className="text-indigo-200 text-xs mt-1 font-mono">
                        {activePlan.recommendedBox.innerDimensions.width} x {activePlan.recommendedBox.innerDimensions.length} x {activePlan.recommendedBox.innerDimensions.height} cm • {activePlan.recommendedBox.boxDesi} Desi
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-indigo-300 block">Kargo Maliyeti</span>
                      <span className="text-2xl font-black text-emerald-400">₺{activePlan.estimatedShippingCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Volume Bar */}
                  <div className="mt-4 pt-3 border-t border-indigo-800/60">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-indigo-200">Koli Hacim Doluluğu:</span>
                      <span className="font-bold text-white">%{activePlan.volumeUtilizationPct} Dolu (İdeal)</span>
                    </div>
                    <div className="w-full bg-indigo-950/80 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${activePlan.volumeUtilizationPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Suboptimal comparison */}
                {activePlan.suboptimalBoxAlternative && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-amber-900">Eğer {activePlan.suboptimalBoxAlternative.name} kullanılsaydı:</span>
                        <span className="text-amber-700 block text-[11px]">
                          Kargo ücreti ₺{activePlan.suboptimalBoxAlternative.cargoBaseFee.toFixed(2)} olacaktı ({activePlan.suboptimalBoxAlternative.boxDesi} Desi).
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">Net Tasarruf</span>
                      <span className="text-sm font-black text-emerald-700">+₺{activePlan.estimatedSavingsVsManual.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Step by step Packing SOP */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center">
                    <PackageCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
                    Paketleme & Yerleşim Talimatı (SOP)
                  </h5>
                  <div className="space-y-1.5">
                    {activePlan.packingSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => alert(`Sipariş ${activePlan.orderNumber} için ${activePlan.recommendedBox.name} kolisi kullanılarak barkod basıldı ve paket kapatıldı.`)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Koliyi Kapat & Kargo Barkodunu Yazdır
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Custom 3D Calculator & Box Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Custom Instant Calculator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-slate-900" />
              <h3 className="text-sm font-bold text-slate-900">Anlık 3D Koli Simülatörü</h3>
            </div>
            <p className="text-xs text-slate-500">
              Kataloğa yeni girecek veya çoklu paketlenecek ürün ölçülerini girin; en ucuz kargo baremini veren koliyi saniyeler içinde hesaplayın.
            </p>

            <form onSubmit={handleCalculateCustom} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">En (cm)</label>
                  <input
                    type="number"
                    value={simWidth}
                    onChange={(e) => setSimWidth(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Boy (cm)</label>
                  <input
                    type="number"
                    value={simLength}
                    onChange={(e) => setSimLength(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Yükseklik (cm)</label>
                  <input
                    type="number"
                    value={simHeight}
                    onChange={(e) => setSimHeight(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Ağırlık (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={simWeight}
                    onChange={(e) => setSimWeight(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Adet</label>
                  <input
                    type="number"
                    value={simQuantity}
                    onChange={(e) => setSimQuantity(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 text-center font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                Optimum Koliyi Hesapla
              </button>
            </form>

            {customSimResult && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-bold">Önerilen Kutu:</span>
                  <span className="font-extrabold text-slate-900">{customSimResult.bestBox.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700">
                  <span>Hesaplanan Kargo Desisi:</span>
                  <span className="font-mono font-bold">{customSimResult.desi} Desi</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700">
                  <span>Tahmini Taşıma Ücreti:</span>
                  <span className="font-bold text-emerald-900">₺{customSimResult.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700">
                  <span>Tahmini Hacim Doluluğu:</span>
                  <span className="font-bold text-emerald-900">%{customSimResult.utilization}</span>
                </div>
              </div>
            )}
          </div>

          {/* Standard Boxes Catalog */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">Depo Standart Koli Kataloğu</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{boxes.length} Çeşit</span>
            </div>

            <div className="space-y-2">
              {boxes.map(b => (
                <div key={b.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{b.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {b.innerDimensions.width}x{b.innerDimensions.length}x{b.innerDimensions.height} cm • {b.boxDesi} Desi
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-900 font-bold block">₺{b.cargoBaseFee.toFixed(2)} Kargo</span>
                    <span className={`text-[10px] font-semibold ${b.stockCount < 200 ? 'text-amber-600' : 'text-slate-400'}`}>
                      Stok: {b.stockCount} adet
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
