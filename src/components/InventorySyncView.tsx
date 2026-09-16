import React, { useState } from 'react';
import { 
  Boxes, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  Edit3, 
  CheckCircle2, 
  ArrowRightLeft,
  Search,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { ProductItem } from '../types';

interface InventorySyncViewProps {
  products: ProductItem[];
  onUpdateStock: (productId: string, newTotalStock: number) => void;
  onSimulateChannelSale: (productId: string, channel: 'trendyol' | 'hepsiburada' | 'n11') => void;
  onSyncAllChannels: () => void;
}

export const InventorySyncView: React.FC<InventorySyncViewProps> = ({
  products,
  onUpdateStock,
  onSimulateChannelSale,
  onSyncAllChannels,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  });

  const handleStartEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setNewStockVal(prod.totalStock);
  };

  const handleSaveStock = () => {
    if (editingProduct) {
      onUpdateStock(editingProduct.id, Number(newStockVal));
      setEditingProduct(null);
    }
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncAllChannels();
      setIsSyncing(false);
    }, 800);
  };

  const totalStockCount = products.reduce((acc, p) => acc + p.totalStock, 0);
  const criticalStockCount = products.filter(p => p.totalStock < 30).length;

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" />
              <span>Merkezi Katalog & Çapraz Kanal Stok Kilitleme</span>
            </div>
            <h1 className="text-xl font-extrabold text-white">
              Pazaryerleri Arası Otomatik Stok & Fiyat Senkronizasyonu
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Trendyol'da ürün satıldığında Hepsiburada ve N11 stokları anında otomatik düşürülür. Çifte satış veya stok yetersizliği cezalarını %100 önler.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'API Eşitleniyor...' : 'Tüm Kanalları Eşitle'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Katalogdaki Ürün Sayısı</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{products.length} SKU</span>
          <span className="text-[11px] text-emerald-600 font-medium">Tüm pazaryerlerinde eşleşti</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Toplam Depo Adedi</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalStockCount} Adet</span>
          <span className="text-[11px] text-slate-500 font-medium">Fiziksel depo envanteri</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Kritik Seviyedeki Ürünler</span>
          <span className="text-2xl font-extrabold text-amber-700 mt-1 block">{criticalStockCount} SKU</span>
          <span className="text-[11px] text-amber-700 font-semibold">Stok &lt; 30 adet altında</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Son Senkronizasyon Gecikmesi</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">&lt; 3 Saniye</span>
          <span className="text-[11px] text-emerald-600 font-medium">Webhook tabanlı anlık bildirim</span>
        </div>
      </div>

      {/* Search & Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün adı, barkod, SKU veya marka ara..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            Fiyat ve Stok Güncelleme: <strong>Trendyol price-and-inventory API</strong>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Ürün & Bilgiler</th>
                <th className="p-3.5">Merkezi Depo Stoku</th>
                <th className="p-3.5">Trendyol Kanalı</th>
                <th className="p-3.5">Hepsiburada Kanalı</th>
                <th className="p-3.5">N11 Kanalı</th>
                <th className="p-3.5 text-right">Otomasyon Simülasyonu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Product Info */}
                  <td className="p-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 max-w-xs">{prod.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>Barkod: <strong className="font-mono text-slate-700">{prod.barcode}</strong></span>
                          <span>•</span>
                          <span>SKU: <strong className="font-mono text-slate-700">{prod.sku}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Maliyet: ₺{prod.buyingPrice.toFixed(2)} • Liste Fiyatı: ₺{prod.basePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Master Total Stock */}
                  <td className="p-3.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">
                        {prod.totalStock} Adet
                      </span>
                      <button
                        onClick={() => handleStartEdit(prod)}
                        className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors"
                        title="Stok Miktarını Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {prod.reservedStock > 0 ? `${prod.reservedStock} adet siparişe ayrıldı` : 'Serbest kullanılabilir'}
                    </div>
                  </td>

                  {/* Trendyol Column */}
                  <td className="p-3.5">
                    <div className="p-2 rounded-lg bg-orange-50/50 border border-orange-200/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-orange-900">₺{prod.channels.trendyol.price.toFixed(2)}</span>
                        <span className="font-mono font-semibold text-orange-800">{prod.channels.trendyol.stock} Ad.</span>
                      </div>
                      <div className="text-[10px] text-orange-700/80 mt-0.5">
                        Komisyon: %{prod.channels.trendyol.commissionRate}
                      </div>
                    </div>
                  </td>

                  {/* Hepsiburada Column */}
                  <td className="p-3.5">
                    <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-950">₺{prod.channels.hepsiburada.price.toFixed(2)}</span>
                        <span className="font-mono font-semibold text-amber-900">{prod.channels.hepsiburada.stock} Ad.</span>
                      </div>
                      <div className="text-[10px] text-amber-800 mt-0.5">
                        Komisyon: %{prod.channels.hepsiburada.commissionRate}
                      </div>
                    </div>
                  </td>

                  {/* N11 Column */}
                  <td className="p-3.5">
                    <div className="p-2 rounded-lg bg-red-50/50 border border-red-200/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-red-950">₺{prod.channels.n11.price.toFixed(2)}</span>
                        <span className="font-mono font-semibold text-red-900">{prod.channels.n11.stock} Ad.</span>
                      </div>
                      <div className="text-[10px] text-red-800 mt-0.5">
                        Komisyon: %{prod.channels.n11.commissionRate}
                      </div>
                    </div>
                  </td>

                  {/* Simulation Buttons */}
                  <td className="p-3.5 text-right">
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Test Satışı Simüle Et:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onSimulateChannelSale(prod.id, 'trendyol')}
                          className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[10px] font-bold transition-colors"
                          title="Trendyol'da 1 satış simüle et -> Diğer pazaryerlerinin stoğu otomatik düşer"
                        >
                          +1 TY Satıldı
                        </button>
                        <button
                          onClick={() => onSimulateChannelSale(prod.id, 'hepsiburada')}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition-colors"
                          title="Hepsiburada'da 1 satış simüle et"
                        >
                          +1 HB Satıldı
                        </button>
                      </div>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Edit Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Merkezi Stok Güncelle
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {editingProduct.name}
            </p>

            <div className="my-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">Yeni Toplam Stok (Adet)</label>
              <input
                type="number"
                value={newStockVal}
                onChange={(e) => setNewStockVal(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Bu miktar onaylandığında Trendyol, Hepsiburada ve N11 API'lerine anında iletilir.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSaveStock}
                className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                Pazaryerlerine Gönder & Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
