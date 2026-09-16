import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Truck, 
  MapPin, 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Printer, 
  Scissors, 
  CheckCircle2, 
  ExternalLink,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { ShipmentPackage, PackageStatus } from '../types';

interface OrderPackageDetailModalProps {
  pkg: ShipmentPackage | null;
  onClose: () => void;
  onUpdateStatus: (id: number, newStatus: PackageStatus) => void;
  onPrintLabel: (pkg: ShipmentPackage) => void;
  onSplitPackage: (pkg: ShipmentPackage, lineIdToSplit: string) => void;
}

export const OrderPackageDetailModal: React.FC<OrderPackageDetailModalProps> = ({
  pkg,
  onClose,
  onUpdateStatus,
  onPrintLabel,
  onSplitPackage
}) => {
  const [invoiceNumberInput, setInvoiceNumberInput] = useState(pkg?.invoiceNumber || '');
  const [showInvoiceInput, setShowInvoiceInput] = useState(false);

  if (!pkg) return null;

  const getStatusBadge = (status: PackageStatus) => {
    switch (status) {
      case 'Created':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Yeni Sipariş (Created)</span>;
      case 'Picking':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Toplanıyor (Picking)</span>;
      case 'Invoiced':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">Faturalandı (Invoiced)</span>;
      case 'Shipped':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">Kargoda (Shipped)</span>;
      case 'Delivered':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Teslim Edildi</span>;
      case 'Returned':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">İade Edildi</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">İptal Edildi</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getMarketplaceBadge = (mp: string) => {
    switch (mp) {
      case 'trendyol':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300">Trendyol</span>;
      case 'hepsiburada':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Hepsiburada</span>;
      case 'n11':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">N11</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">{mp}</span>;
    }
  };

  const handleSaveInvoice = () => {
    if (invoiceNumberInput.trim()) {
      pkg.invoiceNumber = invoiceNumberInput.trim();
      onUpdateStatus(pkg.id, 'Invoiced');
      setShowInvoiceInput(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-lg text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Paket Detayı: #{pkg.id}</h2>
                {getMarketplaceBadge(pkg.marketplace)}
                {getStatusBadge(pkg.packageStatus)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pazaryeri Sipariş No: <span className="font-mono font-bold text-white">{pkg.orderNumber}</span> • {pkg.packetNumber || `PK-${pkg.id}`}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Action Quick Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Hızlı Statü Değiştir:</span>
              {pkg.packageStatus === 'Created' && (
                <button
                  onClick={() => onUpdateStatus(pkg.id, 'Picking')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Toplama Listesine Al (Picking)</span>
                </button>
              )}
              {pkg.packageStatus === 'Picking' && (
                <button
                  onClick={() => setShowInvoiceInput(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Faturalandır (Invoiced)</span>
                </button>
              )}
              {pkg.packageStatus === 'Invoiced' && (
                <button
                  onClick={() => onUpdateStatus(pkg.id, 'Shipped')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Kargoya Teslim Et (Shipped)</span>
                </button>
              )}
              {pkg.packageStatus === 'Shipped' && (
                <button
                  onClick={() => onUpdateStatus(pkg.id, 'Delivered')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Teslim Edildi Olarak İşle</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPrintLabel(pkg)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Kargo Etiketi Yazdır</span>
              </button>
            </div>
          </div>

          {/* Invoice Input Form if active */}
          {showInvoiceInput && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Receipt className="w-5 h-5 text-purple-700" />
                <div>
                  <h4 className="text-xs font-bold text-purple-900">e-Fatura / e-Arşiv Fatura Numarası Girişi</h4>
                  <p className="text-[11px] text-purple-700">Trendyol ve GİB sistemine faturayı iletmek için numarayı kaydedin.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="GIB20260000..."
                  value={invoiceNumberInput}
                  onChange={(e) => setInvoiceNumberInput(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSaveInvoice}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Onayla & Faturalandır
                </button>
                <button
                  onClick={() => setShowInvoiceInput(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Order Meta & Cargo Logistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Customer Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <User className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Müşteri Bilgisi</h3>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {pkg.customerFirstName} {pkg.customerLastName}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ID: {pkg.customerId}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {pkg.customerEmail || `${pkg.customerFirstName.toLowerCase()}@musteri.pazar`}
              </div>
              <div className="text-xs font-mono text-slate-700 mt-1 font-medium">
                {pkg.shipmentAddress.phone}
              </div>
            </div>

            {/* Cargo Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <Truck className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kargo & Lojistik</h3>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {pkg.cargoProviderName}
              </div>
              <div className="text-xs font-mono font-medium text-slate-700 mt-1">
                Takip No: <span className="font-bold">{pkg.cargoTrackingNumber}</span>
              </div>
              <div className="text-xs font-mono text-slate-500 mt-0.5">
                Koli Barkod: {pkg.cargoBarcode}
              </div>
              <a
                href={pkg.cargoTrackingLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>Canlı Kargo Sorgula</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Financials & Dates */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-slate-600 mb-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sipariş & Tutar</h3>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Toplam Tutar:</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₺{pkg.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {pkg.invoiceNumber && (
                <div className="text-xs mt-1 text-purple-700 font-medium flex items-center justify-between">
                  <span>Fatura No:</span>
                  <span className="font-mono font-bold">{pkg.invoiceNumber}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Sipariş Tarihi:</span>
                <span>{new Date(pkg.orderDate).toLocaleString('tr-TR')}</span>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center justify-between">
                <span>Son Kargolama (SLA):</span>
                <span>{new Date(pkg.agreedDeliveryDate).toLocaleDateString('tr-TR')} {new Date(pkg.agreedDeliveryDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-1.5">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>Teslimat Adresi (Shipment Address)</span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {pkg.shipmentAddress.address1}
              </p>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {pkg.shipmentAddress.district} / {pkg.shipmentAddress.city} - {pkg.shipmentAddress.postalCode}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-1.5">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Fatura Adresi (Invoice Address)</span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {pkg.invoiceAddress.fullName}
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                {pkg.invoiceAddress.address1}
              </p>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {pkg.invoiceAddress.district} / {pkg.invoiceAddress.city}
              </p>
            </div>
          </div>

          {/* Line Items Table (with Split Package Support) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Paket Kalemleri ({pkg.lines.length} Ürün Kalemi)
              </h3>
              {pkg.lines.length > 1 && (
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <Scissors className="w-3.5 h-3.5 text-amber-600" />
                  <span>Trendyol Split Package (Paket Bölme) desteklenir</span>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {pkg.lines.map((line) => (
                <div key={line.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={line.imageUrl} 
                      alt={line.productName} 
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 max-w-md">
                        {line.productName}
                      </h4>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                        <span>Barkod: <strong className="font-mono text-slate-800">{line.barcode}</strong></span>
                        <span>•</span>
                        <span>SKU: <strong className="font-mono text-slate-800">{line.merchantSku}</strong></span>
                        <span>•</span>
                        <span>KDV Matrahı: ₺{line.vatBaseAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Adet: <strong className="text-slate-900 text-sm">{line.quantity}</strong></div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">₺{line.price.toFixed(2)}</div>
                    </div>

                    {pkg.lines.length > 1 && (
                      <button
                        onClick={() => onSplitPackage(pkg, line.id)}
                        className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors flex items-center space-x-1"
                        title="Bu ürünü ayrı bir koli/paket haline getir (Trendyol Split Package API)"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Ayrı Pakete Böl</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Paket İşlem Geçmişi (Audit Trail)</span>
            </h3>
            <div className="space-y-3">
              {pkg.packageHistories.map((hist, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{hist.status}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(hist.createdDate).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{hist.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Trendyol SAPIGW v2 • getShipmentPackages standardına uygundur
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
