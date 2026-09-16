import React, { useState } from 'react';
import { 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldAlert, 
  Sparkles, 
  Check, 
  Search, 
  Filter, 
  Truck, 
  Eye, 
  ArrowRight,
  PackageCheck,
  AlertTriangle
} from 'lucide-react';
import { ReturnRecord, ReturnInspectionFault, ReturnCondition, ProductItem } from '../types';

interface ReturnsManagementViewProps {
  returns: ReturnRecord[];
  products: ProductItem[];
  onUpdateReturn: (updated: ReturnRecord) => void;
  onRestockProduct: (barcode: string, quantity: number) => void;
}

export const ReturnsManagementView: React.FC<ReturnsManagementViewProps> = ({
  returns,
  products,
  onUpdateReturn,
  onRestockProduct,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingReturn, setInspectingReturn] = useState<ReturnRecord | null>(null);
  
  // Inspection form states
  const [selectedFault, setSelectedFault] = useState<ReturnInspectionFault>('SIZE_MISMATCH');
  const [selectedCondition, setSelectedCondition] = useState<ReturnCondition>('RE_SELLABLE');
  const [warehouseNote, setWarehouseNote] = useState('');

  // AI Anomaly modal or alert
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Filter returns
  const filteredReturns = returns.filter((ret) => {
    const matchesStatus = filterStatus === 'ALL' || ret.status === filterStatus;
    const matchesSearch = 
      ret.orderNumber.includes(searchQuery) ||
      ret.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.claimNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate return KPI metrics
  const totalReturnsCount = returns.length;
  const inWarehouseCount = returns.filter(r => r.status === 'ARRIVED_AT_WAREHOUSE').length;
  const inTransitCount = returns.filter(r => r.status === 'IN_TRANSIT').length;
  const restockedCount = returns.filter(r => r.restocked).length;
  const totalRefundAmount = returns.reduce((acc, r) => acc + r.refundAmount, 0);

  // Trigger AI Return Anomaly Analysis
  const handleRunAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const url = new URL('/api/ai/copilot', window.location.href).toString();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "İade oranları ve iade gerekçelerini analiz et. En çok iade alan ürünlerde anomali ve maliyet kaçağı var mı?",
          context: { returnsSummary: returns }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setAiAnalysisResult(data.text);
          return;
        }
      }
      throw new Error('API unreachable');
    } catch {
      setAiAnalysisResult("İade analizi servisine bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.");
    } finally {
      setAiLoading(false);
    }
  };

  // Submit Inspection
  const handleSaveInspection = () => {
    if (!inspectingReturn) return;

    const shouldRestock = selectedCondition === 'RE_SELLABLE';
    const updated: ReturnRecord = {
      ...inspectingReturn,
      status: 'INSPECTED',
      faultCategory: selectedFault,
      condition: selectedCondition,
      warehouseNote: warehouseNote || 'Depo kabul personeli tarafından kontrol edildi.',
      inspectedAt: Date.now(),
      restocked: shouldRestock
    };

    onUpdateReturn(updated);

    if (shouldRestock) {
      onRestockProduct(inspectingReturn.barcode, inspectingReturn.quantity);
      alert(`Ürün kabul edildi ve ${inspectingReturn.quantity} adet stok havuzuna iade edildi!`);
    } else {
      alert(`Kabul kaydedildi: Ürün durumu '${selectedCondition}' olarak ayrıldı.`);
    }

    setInspectingReturn(null);
  };

  // Approve Refund
  const handleApproveRefund = (ret: ReturnRecord) => {
    const updated: ReturnRecord = {
      ...ret,
      status: 'REFUNDED'
    };
    onUpdateReturn(updated);
    alert(`Müşteri ${ret.customerName} için ₺${ret.refundAmount.toFixed(2)} tutarındaki iade onaylandı ve pazaryerine iletildi.`);
  };

  // Open Dispute
  const handleOpenDispute = (ret: ReturnRecord) => {
    const reason = prompt('Pazaryeri İade İtiraz Gerekçesi:', 'Ürün kullanılmış / jelatini yırtık / eksik aksesuarla geri gönderilmiştir.');
    if (!reason) return;
    const updated: ReturnRecord = {
      ...ret,
      status: 'DISPUTED',
      disputeReason: reason
    };
    onUpdateReturn(updated);
    alert('Pazaryeri itiraz talebi oluşturuldu. İnceleme başlatıldı.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 mb-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tersine Lojistik & Kusurlu Ürün Masası</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              İade & Müşteri Talep Yönetimi
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Pazaryerinden gelen kolay iadeler, depoya varış kabulü, kusur tespiti, tekrar stoğa alma ve pazaryeri itiraz süreçleri.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAiAnalysis}
              disabled={aiLoading}
              className="flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
              {aiLoading ? 'AI İade Radarı Taranıyor...' : 'AI İade Anomali Radarı'}
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Bekleyen Depo Kabulü</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-rose-600">{inWarehouseCount}</span>
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Kontrol bekleyen koli</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Kargodaki İadeler</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-amber-600">{inTransitCount}</span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Truck className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Depoya yolda</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Stoğa Kurtarılan</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-600">{restockedCount} Adet</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Kayıpsız rafa dönen</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Toplam İade Bedeli</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-slate-900">₺{totalRefundAmount.toLocaleString('tr-TR')}</span>
              <span className="p-1.5 rounded-lg bg-slate-200 text-slate-700">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Brüt iade hacmi</span>
          </div>
        </div>
      </div>

      {/* AI Return Anomaly Card (if triggered) */}
      {aiAnalysisResult && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-purple-800">
          <div className="flex items-center justify-between pb-3 border-b border-purple-800/80">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">AI İade Analitiği & Kök Neden Tespiti</h3>
            </div>
            <button
              onClick={() => setAiAnalysisResult(null)}
              className="text-purple-300 hover:text-white text-xs"
            >
              Kapat ✕
            </button>
          </div>
          <div className="mt-4 text-sm text-purple-100 whitespace-pre-line leading-relaxed font-sans">
            {aiAnalysisResult}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Sipariş no, müşteri veya ürün adı..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'Tümü' },
            { id: 'ARRIVED_AT_WAREHOUSE', label: 'Depoya Ulaştı (Kabul Bekliyor)' },
            { id: 'IN_TRANSIT', label: 'Kargoda' },
            { id: 'INSPECTED', label: 'İncelendi' },
            { id: 'REFUNDED', label: 'İade Edildi' },
            { id: 'DISPUTED', label: 'İtiraz Edildi' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Returns List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Talep No & Sipariş</th>
                <th className="py-3.5 px-4">Pazaryeri</th>
                <th className="py-3.5 px-4">Müşteri</th>
                <th className="py-3.5 px-4">İade Edilen Ürün</th>
                <th className="py-3.5 px-4">Müşteri Gerekçesi</th>
                <th className="py-3.5 px-4">Kargo & Takip</th>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Aramanıza uygun iade kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div>{ret.claimNumber}</div>
                      <span className="text-[11px] text-slate-500 font-normal">#{ret.orderNumber}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ret.marketplace === 'trendyol' ? 'bg-orange-100 text-orange-800' :
                        ret.marketplace === 'hepsiburada' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ret.marketplace}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {ret.customerName}
                    </td>

                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="font-semibold text-slate-900 truncate" title={ret.productName}>
                        {ret.productName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Barkod: {ret.barcode} | Adet: {ret.quantity}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[200px]">
                      <span className="text-slate-700 block truncate" title={ret.claimReason}>
                        {ret.claimReason}
                      </span>
                      {ret.faultCategory && (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          Kusur: {ret.faultCategory}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      <div className="font-medium text-slate-800">{ret.carrierName}</div>
                      <span className="font-mono text-slate-500">{ret.trackingCode}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center ${
                        ret.status === 'ARRIVED_AT_WAREHOUSE' ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300 animate-pulse' :
                        ret.status === 'INSPECTED' ? 'bg-blue-100 text-blue-800' :
                        ret.status === 'REFUNDED' ? 'bg-emerald-100 text-emerald-800' :
                        ret.status === 'DISPUTED' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ret.status === 'ARRIVED_AT_WAREHOUSE' && 'Depoda (Kabul Bekliyor)'}
                        {ret.status === 'IN_TRANSIT' && 'Kargoda'}
                        {ret.status === 'INSPECTED' && 'İncelendi'}
                        {ret.status === 'REFUNDED' && 'İade Onaylandı'}
                        {ret.status === 'DISPUTED' && 'İtiraz Açıldı'}
                      </span>
                      {ret.restocked && (
                        <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
                          ✓ Stoğa Eklendi
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {ret.status === 'ARRIVED_AT_WAREHOUSE' && (
                          <button
                            onClick={() => {
                              setInspectingReturn(ret);
                              setSelectedFault(ret.faultCategory || 'SIZE_MISMATCH');
                              setSelectedCondition(ret.condition || 'RE_SELLABLE');
                              setWarehouseNote(ret.warehouseNote || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center"
                          >
                            <PackageCheck className="w-3.5 h-3.5 mr-1" />
                            Kontrol Et
                          </button>
                        )}

                        {ret.status === 'INSPECTED' && (
                          <>
                            <button
                              onClick={() => handleApproveRefund(ret)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                              title="Ücret İadesi Onayla"
                            >
                              İade Onayla
                            </button>
                            <button
                              onClick={() => handleOpenDispute(ret)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                              title="Pazaryerine İtiraz Et"
                            >
                              İtiraz Aç
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => alert(`İade Detayları:\nMüşteri: ${ret.customerName}\nKoli Durumu: ${ret.warehouseNote || 'Not yok'}\nİade Tutarı: ₺${ret.refundAmount}`)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                          title="Detay Görüntüle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Inspection Modal */}
      {inspectingReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Depo İade Kabulü & Fiziksel Muayene
                </h3>
              </div>
              <button
                onClick={() => setInspectingReturn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-900">{inspectingReturn.productName}</div>
              <div className="text-slate-500 font-mono">Barkod: {inspectingReturn.barcode} | Sipariş: #{inspectingReturn.orderNumber}</div>
              <div className="text-rose-700 font-medium">Müşteri Beyanı: "{inspectingReturn.claimReason}"</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hasar / Kusur Sınıfı</label>
                <select
                  value={selectedFault}
                  onChange={(e) => setSelectedFault(e.target.value as ReturnInspectionFault)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                >
                  <option value="SIZE_MISMATCH">Beden / Kalıp Uyumsuzluğu (Ürün Sağlam)</option>
                  <option value="RIGHT_OF_WITHDRAWAL">Cayma Hakkı / Vazgeçme (Kutu Açılmamış)</option>
                  <option value="CARGO_DAMAGE">Kargo / Taşıma Hasarı (Koli Ezik/Kırık)</option>
                  <option value="DEFECTIVE_PRODUCT">Kusurlu / Bozuk Ürün (Fabrika Hatası)</option>
                  <option value="WRONG_ITEM">Yanlış Ürün Gönderimi</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ürünün Fiziksel Durumu & Depo Kararı</label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value as ReturnCondition)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                >
                  <option value="RE_SELLABLE">✅ Tekrar Satılabilir (Hemen Depo Stoğuna Ekle)</option>
                  <option value="SUPPLIER_RETURN">⚠️ Tedarikçiye İade (Garanti / Değişim İçin Ayır)</option>
                  <option value="DAMAGED_SCRAP">❌ Hurda / Çöp (Pazaryeri Hasar Tazmini Aç)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Depo Kabul Notu / Muayene Raporu</label>
                <textarea
                  rows={2}
                  value={warehouseNote}
                  onChange={(e) => setWarehouseNote(e.target.value)}
                  placeholder="Kutu içeriği kontrol edildi, aparatları tam..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setInspectingReturn(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                İptal
              </button>
              <button
                onClick={handleSaveInspection}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center"
              >
                <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                Muayeneyi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
