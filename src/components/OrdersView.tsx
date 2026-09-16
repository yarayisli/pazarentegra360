import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  PackageCheck, 
  Clock, 
  Truck, 
  AlertCircle, 
  FileSpreadsheet, 
  ChevronRight, 
  Receipt,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { ShipmentPackage, PackageStatus, MarketplaceType } from '../types';

interface OrdersViewProps {
  packages: ShipmentPackage[];
  onOpenDetail: (pkg: ShipmentPackage) => void;
  onPrintLabel: (pkg: ShipmentPackage) => void;
  onUpdateStatus: (id: number, status: PackageStatus) => void;
  onBulkPicking: (ids: number[]) => void;
  onBulkPrintLabels: (pkgs: ShipmentPackage[]) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  packages,
  onOpenDetail,
  onPrintLabel,
  onUpdateStatus,
  onBulkPicking,
  onBulkPrintLabels,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'ReturnedOrCancelled') {
          if (pkg.packageStatus !== 'Returned' && pkg.packageStatus !== 'Cancelled') return false;
        } else if (pkg.packageStatus !== selectedStatus) {
          return false;
        }
      }

      if (selectedMarketplace !== 'all' && pkg.marketplace !== selectedMarketplace) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOrder = pkg.orderNumber.toLowerCase().includes(query);
        const matchesId = pkg.id.toString().includes(query);
        const matchesCustomer = `${pkg.customerFirstName} ${pkg.customerLastName}`.toLowerCase().includes(query);
        const matchesTracking = pkg.cargoTrackingNumber.toLowerCase().includes(query);
        const matchesCity = pkg.shipmentAddress.city.toLowerCase().includes(query);
        const matchesItem = pkg.lines.some(l => 
          l.productName.toLowerCase().includes(query) || 
          l.barcode.toLowerCase().includes(query) ||
          l.merchantSku.toLowerCase().includes(query)
        );
        return matchesOrder || matchesId || matchesCustomer || matchesTracking || matchesCity || matchesItem;
      }

      return true;
    });
  }, [packages, selectedStatus, selectedMarketplace, searchQuery]);

  // Counts for status tabs
  const counts = useMemo(() => {
    return {
      all: packages.length,
      Created: packages.filter(p => p.packageStatus === 'Created').length,
      Picking: packages.filter(p => p.packageStatus === 'Picking').length,
      Invoiced: packages.filter(p => p.packageStatus === 'Invoiced').length,
      Shipped: packages.filter(p => p.packageStatus === 'Shipped').length,
      Delivered: packages.filter(p => p.packageStatus === 'Delivered').length,
      ReturnedOrCancelled: packages.filter(p => p.packageStatus === 'Returned' || p.packageStatus === 'Cancelled').length,
    };
  }, [packages]);

  // Handle Select All
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredPackages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPackages.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Remaining hours calculation for SLA
  const getSlaIndicator = (agreedDeliveryDate: number) => {
    const diffHours = Math.round((agreedDeliveryDate - Date.now()) / (3600 * 1000));
    if (diffHours < 0) {
      return (
        <span className="inline-flex items-center text-red-600 font-bold text-xs">
          <AlertCircle className="w-3.5 h-3.5 mr-1" />
          SLA Gecikmede ({Math.abs(diffHours)} sa)
        </span>
      );
    }
    if (diffHours <= 4) {
      return (
        <span className="inline-flex items-center text-amber-600 font-bold text-xs animate-pulse">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Kritik: {diffHours} saat kaldı
        </span>
      );
    }
    return (
      <span className="text-slate-500 text-xs flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        {diffHours} saat kaldı
      </span>
    );
  };

  const getStatusPill = (status: PackageStatus) => {
    switch (status) {
      case 'Created':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Yeni Sipariş</span>;
      case 'Picking':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Toplanıyor</span>;
      case 'Invoiced':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Faturalandı</span>;
      case 'Shipped':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">Kargoda</span>;
      case 'Delivered':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Teslim Edildi</span>;
      case 'Returned':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">İade</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">İptal</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getMarketplaceTag = (mp: MarketplaceType) => {
    switch (mp) {
      case 'trendyol':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Trendyol</span>;
      case 'hepsiburada':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Hepsiburada</span>;
      case 'n11':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">N11</span>;
      case 'ikas':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-300">ikas Store</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{mp}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bekleyen Siparişler</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <PackageCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {counts.Created + counts.Picking}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {counts.Created} Yeni • {counts.Picking} Toplama Aşamasında
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faturalanmış / Sevk Hazır</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">
            {counts.Invoiced}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Kargo kuryesi bekleniyor
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Taşıma Durumunda (Kargoda)</span>
            <span className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-700 mt-2">
            {counts.Shipped}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Müşteriye transfer aşamasında
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bugünkü Ciro (Brüt)</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <span className="font-bold text-xs">₺</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            ₺{packages.reduce((acc, p) => acc + p.totalPrice, 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Konsolide 3 Pazaryeri Satışları
          </div>
        </div>
      </div>

      {/* Main Order Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Status Sub-Navigation (Trendyol getShipmentPackages status query param simulation) */}
        <div className="border-b border-slate-200 px-4 pt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex space-x-1 overflow-x-auto pb-3">
            {[
              { id: 'all', label: 'Tüm Paketler', count: counts.all },
              { id: 'Created', label: 'Yeni Siparişler', count: counts.Created },
              { id: 'Picking', label: 'Toplama / Hazırlık', count: counts.Picking },
              { id: 'Invoiced', label: 'Faturalandı', count: counts.Invoiced },
              { id: 'Shipped', label: 'Kargoya Verildi', count: counts.Shipped },
              { id: 'Delivered', label: 'Teslim Edildi', count: counts.Delivered },
              { id: 'ReturnedOrCancelled', label: 'İade & İptal', count: counts.ReturnedOrCancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                  selectedStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedStatus === tab.id ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="pb-3 text-xs text-slate-500 font-mono">
            API: /suppliers/{'{id}'}/orders
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sipariş no, paket ID, müşteri adı, barkod, takip no..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Marketplace filter dropdown */}
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">Tüm Satış Kanalları</option>
              <option value="trendyol">Sadece Trendyol</option>
              <option value="hepsiburada">Sadece Hepsiburada</option>
              <option value="n11">Sadece N11</option>
              <option value="ikas">Sadece ikas Web Mağazası</option>
            </select>
          </div>

          {/* Bulk Actions if items are selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-amber-900">
                {selectedIds.length} Paket Seçildi:
              </span>
              <button
                onClick={() => {
                  onBulkPicking(selectedIds);
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Toplama Listesine Al
              </button>
              <button
                onClick={() => {
                  const pkgs = packages.filter(p => selectedIds.includes(p.id));
                  onBulkPrintLabels(pkgs);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
              >
                <Printer className="w-3 h-3 text-amber-400" />
                <span>Toplu Etiket Yazdır</span>
              </button>
            </div>
          )}

          {/* Right quick tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                alert('Tüm filtrelenmiş siparişler Excel (XLSX) formatında dışa aktarıldı.');
              }}
              className="px-3 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Excel'e Aktar"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel Çıktısı</span>
            </button>
          </div>

        </div>

        {/* Packages Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredPackages.length}
                    onChange={handleToggleSelectAll}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="p-3.5">Paket & Sipariş</th>
                <th className="p-3.5">Müşteri / Teslimat Yeri</th>
                <th className="p-3.5">Kargo & Takip No</th>
                <th className="p-3.5">Ürünler & Kalem</th>
                <th className="p-3.5">Tutar</th>
                <th className="p-3.5">Durum & SLA</th>
                <th className="p-3.5 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <PackageCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Arama kriterlerine uygun sipariş paketi bulunamadı.</p>
                    <p className="text-xs text-slate-400 mt-1">Filtreleri değiştirmeyi veya pazaryerlerini yeniden taramayı deneyin.</p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const isSelected = selectedIds.includes(pkg.id);
                  return (
                    <tr 
                      key={pkg.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(pkg.id)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                      </td>

                      {/* Package & Order No */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          {getMarketplaceTag(pkg.marketplace)}
                        </div>
                        <div className="font-mono font-bold text-slate-900 mt-1">
                          #{pkg.orderNumber}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Paket ID: {pkg.id}
                        </div>
                      </td>

                      {/* Customer & Location */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">
                          {pkg.customerFirstName} {pkg.customerLastName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pkg.shipmentAddress.district} / <strong className="text-slate-700">{pkg.shipmentAddress.city}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {pkg.shipmentAddress.phone}
                        </div>
                      </td>

                      {/* Cargo & Tracking */}
                      <td className="p-3.5">
                        <div className="font-medium text-slate-900">
                          {pkg.cargoProviderName}
                        </div>
                        <div className="font-mono text-slate-600 text-[11px] mt-0.5 flex items-center space-x-1">
                          <span>{pkg.cargoTrackingNumber}</span>
                        </div>
                        <a
                          href={pkg.cargoTrackingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center space-x-0.5 mt-0.5"
                        >
                          <span>Kargo Takip</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      {/* Products */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {pkg.lines.map((line) => (
                              <img
                                key={line.id}
                                src={line.imageUrl}
                                alt={line.productName}
                                className="inline-block h-8 w-8 rounded-lg object-cover ring-2 ring-white border border-slate-200"
                                title={line.productName}
                              />
                            ))}
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-slate-900">
                              {pkg.lines.reduce((a, b) => a + b.quantity, 0)} Ürün
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]" title={pkg.lines[0]?.productName}>
                              {pkg.lines[0]?.productName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>₺{pkg.totalPrice.toFixed(2)}</div>
                        {pkg.invoiceNumber ? (
                          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1 py-0.2 rounded">
                            {pkg.invoiceNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Faturasız</span>
                        )}
                      </td>

                      {/* Status & SLA */}
                      <td className="p-3.5">
                        <div>{getStatusPill(pkg.packageStatus)}</div>
                        <div className="mt-1">
                          {getSlaIndicator(pkg.agreedDeliveryDate)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onPrintLabel(pkg)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                            title="100x150 mm Kargo Etiketi Yazdır"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          
                          <button
                            onClick={() => onOpenDetail(pkg)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                          >
                            <span>Detay</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Toplam <strong>{filteredPackages.length}</strong> sipariş paketi gösteriliyor (Trendyol SAPIGW uyumlu)
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Trendyol API</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>Hepsiburada API</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>N11 API</span>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
