import React, { useState } from 'react';
import { 
  Warehouse, 
  Layers, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Printer, 
  Scan, 
  AlertCircle, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  Check, 
  Search,
  Plus
} from 'lucide-react';
import { 
  WarehouseLocation, 
  ProductWarehouseDetail, 
  PickingBatchWave 
} from '../types';

interface WMSWarehouseManagementViewProps {
  locations: WarehouseLocation[];
  products: ProductWarehouseDetail[];
  waves: PickingBatchWave[];
  onUpdateWave: (wave: PickingBatchWave) => void;
  onUpdateProductLocation: (sku: string, newBin: string) => void;
}

export const WMSWarehouseManagementView: React.FC<WMSWarehouseManagementViewProps> = ({
  locations,
  products: initialProducts,
  waves: initialWaves,
  onUpdateWave,
  onUpdateProductLocation,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'waves' | 'locations' | 'serials'>('waves');
  const [waves, setWaves] = useState<PickingBatchWave[]>(initialWaves);
  const [products, setProducts] = useState<ProductWarehouseDetail[]>(initialProducts);
  const [activeWaveId, setActiveWaveId] = useState<string>(waves[0]?.id || '');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentWave = waves.find(w => w.id === activeWaveId) || waves[0];

  // Barcode / Bin scan simulation during wave picking
  const handleScanItem = (barcodeOrBin: string) => {
    if (!currentWave) return;
    const trimmed = barcodeOrBin.trim();
    if (!trimmed) return;

    // Find item matching barcode or bin
    const itemIndex = currentWave.items.findIndex(
      i => (i.barcode === trimmed || i.binLocation.toLowerCase() === trimmed.toLowerCase() || i.sku === trimmed) && !i.isPicked
    );

    if (itemIndex >= 0) {
      const updatedItems = [...currentWave.items];
      const target = { ...updatedItems[itemIndex] };
      target.qtyPicked += 1;
      if (target.qtyPicked >= target.qtyNeeded) {
        target.isPicked = true;
      }
      updatedItems[itemIndex] = target;

      const newPickedCount = updatedItems.reduce((acc, it) => acc + (it.isPicked ? it.qtyNeeded : it.qtyPicked), 0);
      const isAllDone = updatedItems.every(it => it.isPicked);

      const updatedWave: PickingBatchWave = {
        ...currentWave,
        items: updatedItems,
        pickedItemsCount: newPickedCount,
        status: isAllDone ? 'COMPLETED' : 'IN_PROGRESS'
      };

      setWaves(prev => prev.map(w => w.id === updatedWave.id ? updatedWave : w));
      onUpdateWave(updatedWave);
      setScanMessage({
        type: 'success',
        text: `✅ Toplandı: [${target.binLocation}] ${target.name} (${target.qtyPicked}/${target.qtyNeeded} Adet)`
      });
      setBarcodeInput('');
    } else {
      setScanMessage({
        type: 'error',
        text: `❌ Eşleşmedi: "${trimmed}" barkodu bu toplama dalgasında bulunamadı veya zaten toplandı!`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-semibold border border-cyan-200 mb-2">
              <Warehouse className="w-3.5 h-3.5" />
              <span>WMS • Raf, Dalga (Wave) Toplama & Seri No Takip</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Depo Raf Yönetimi & Toplu Toplama (Batch Picking)
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Depo personelini koridor ve raf sırasına göre gezdirerek gereksiz yürümeyi sıfırlar. Seri No/IMEI ve Parti (Lot) takibini zorunlu kılar.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                alert(`Toplama Dalga Fişi Yazıcıya Gönderildi!\nDalga No: ${currentWave?.waveNumber}\nSipariş Sayısı: ${currentWave?.packageCount}\nToplam Kalem: ${currentWave?.totalItemsCount}`);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center shadow-sm"
            >
              <Printer className="w-4 h-4 mr-1.5 text-amber-400" />
              Toplama Fişini Yazdır
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('waves')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeSubTab === 'waves'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dalga Toplama (Wave Picking)</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
              {waves.filter(w => w.status === 'IN_PROGRESS').length} Aktif
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('locations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeSubTab === 'locations'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Raf & Göz Haritası (Bin Locations)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('serials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeSubTab === 'serials'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Seri No, IMEI & Lot/SKT Takibi</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: BATCH & WAVE PICKING */}
      {activeSubTab === 'waves' && currentWave && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wave Overview & Barcode Scanner */}
          <div className="lg:col-span-1 space-y-4">
            {/* Wave Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400">{currentWave.waveNumber}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  currentWave.status === 'COMPLETED' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentWave.status === 'COMPLETED' ? 'Tamamlandı' : 'Toplama Devam Ediyor'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">{currentWave.batchName}</h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                  <span>Toplayan: <strong className="text-slate-700">{currentWave.assignedPicker}</strong></span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Toplama İlerlemesi</span>
                  <span className="text-indigo-600 font-bold">
                    %{Math.round((currentWave.pickedItemsCount / currentWave.totalItemsCount) * 100)} ({currentWave.pickedItemsCount}/{currentWave.totalItemsCount} Adet)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(currentWave.pickedItemsCount / currentWave.totalItemsCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Quick Barcode Scanner Input */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center">
                  <Scan className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Hızlı Barkod / Raf Doğrulama
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="Barkod veya Raf Kodu oku..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScanItem(barcodeInput)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleScanItem(barcodeInput)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm"
                  >
                    Topla
                  </button>
                </div>
                {scanMessage && (
                  <div className={`p-2 rounded-lg text-xs ${
                    scanMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {scanMessage.text}
                  </div>
                )}
              </div>
            </div>

            {/* Other Waves Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tüm Toplama Dalgaları</h4>
              <div className="space-y-2">
                {waves.map(w => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWaveId(w.id);
                      setScanMessage(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      w.id === currentWave.id 
                        ? 'border-indigo-500 bg-indigo-50/60 font-semibold text-indigo-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{w.waveNumber}</div>
                      <div className="text-[11px] text-slate-500">{w.packageCount} Paket • {w.totalItemsCount} Ürün</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {w.status === 'COMPLETED' ? 'Bitti' : 'Sürüyor'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pick-Path Sorted Item List (Optimized Walk Route) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">En Kısa Yürüyüş Rotası (Pick-Path Optimization)</h3>
                <span className="text-xs text-slate-500">Personel depoda A koridorundan C koridoruna ardışık sıralı şekilde yönlendirilir</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                Rota: A-01 → A-02 → B-01 → C-01
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Raf Konumu (Bin)</th>
                    <th className="py-3 px-4">Ürün & SKU</th>
                    <th className="py-3 px-4">Barkod</th>
                    <th className="py-3 px-4 text-center">Toplanan / İhtiyaç</th>
                    <th className="py-3 px-4">İlişkili Siparişler</th>
                    <th className="py-3 px-4 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentWave.items.map((item, idx) => (
                    <tr 
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${item.isPicked ? 'bg-emerald-50/40' : ''}`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-bold text-xs">
                          <MapPin className="w-3 h-3 mr-1 text-indigo-600" />
                          {item.binLocation}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[220px]" title={item.name}>
                          {item.name}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {item.barcode}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-xs">
                        <span className={item.isPicked ? 'text-emerald-700' : 'text-slate-900'}>
                          {item.qtyPicked} / {item.qtyNeeded} Adet
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.orderNumbers.map((ord, oIdx) => (
                            <span key={oIdx} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                              {ord}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {item.isPicked ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Toplandı
                          </span>
                        ) : (
                          <button
                            onClick={() => handleScanItem(item.barcode)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-sm transition-all"
                          >
                            Manuel Onayla
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
      )}

      {/* VIEW 2: BIN LOCATIONS & CAPACITY MAP */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="font-mono font-bold text-sm text-slate-900">{loc.bin}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{loc.zone}</span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Koridor / Raf:</span>
                    <span className="font-medium text-slate-900">Krd: {loc.aisle} • {loc.rack} • Kat: {loc.shelf}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 pt-1">
                    <span>Doluluk Oranı:</span>
                    <span className="font-bold text-slate-900">%{loc.occupiedCapacityPct}</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        loc.occupiedCapacityPct > 85 ? 'bg-rose-500' : 'bg-indigo-600'
                      }`} 
                      style={{ width: `${loc.occupiedCapacityPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Depo: {loc.warehouseCode}</span>
                  <button 
                    onClick={() => alert(`Raf Barkodu Yazdırıldı: [${loc.bin}]`)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Raf Barkodu Bas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: SERIAL NUMBER, IMEI & LOT / EXPIRY DATE TRACKING */}
      {activeSubTab === 'serials' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Seri Numarası (IMEI) ve Parti (Lot) Matrisi</h3>
              <span className="text-xs text-slate-500">Elektronik cihazlarda paketleme anında seri no okutulur; iadelerde sahte ürün değişimini engeller</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ürün & SKU</th>
                  <th className="py-3 px-4">Raf Konumu</th>
                  <th className="py-3 px-4">Mevcut Stok</th>
                  <th className="py-3 px-4">Parti (Lot) No</th>
                  <th className="py-3 px-4">Kayıtlı Seri No / IMEI Listesi</th>
                  <th className="py-3 px-4">SKT</th>
                  <th className="py-3 px-4 text-right">Zorunluluk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.sku} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-800 text-xs">
                        {p.locationBin}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.quantityOnHand} Adet
                    </td>

                    <td className="py-3 px-4">
                      {p.lotNumber ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[11px] border border-amber-200">
                          {p.lotNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.serialNumbers && p.serialNumbers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {p.serialNumbers.map((sn, sIdx) => (
                            <span key={sIdx} className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 font-mono text-[10px] border border-indigo-200">
                              {sn}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Seri no takibi yok</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.expirationDate ? (
                        <span className="inline-flex items-center text-emerald-700 font-semibold text-xs">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          {p.expirationDate}
                        </span>
                      ) : (
                        <span className="text-slate-400">Yok</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.requiresSerialScan ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Paketlemede Zorunlu
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standart</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
