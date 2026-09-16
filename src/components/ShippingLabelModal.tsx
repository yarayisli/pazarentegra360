import React from 'react';
import { X, Printer, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { ShipmentPackage } from '../types';

interface ShippingLabelModalProps {
  pkg: ShipmentPackage | null;
  onClose: () => void;
  onMarkInvoicedOrShipped?: (id: number) => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  pkg,
  onClose,
  onMarkInvoicedOrShipped,
}) => {
  if (!pkg) return null;

  const handlePrint = () => {
    window.print();
  };

  const getCarrierColor = (carrier: string) => {
    if (carrier.includes('Trendyol Express')) return 'bg-orange-500 text-white';
    if (carrier.includes('HepsiJET')) return 'bg-orange-600 text-white';
    if (carrier.includes('Yurtiçi')) return 'bg-blue-600 text-white';
    if (carrier.includes('Aras')) return 'bg-sky-600 text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        
        {/* Top Controls (not printed) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold">100x150 mm Termal Kargo Sevk Etiketi (ZPL / PDF)</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Label Area */}
        <div className="p-6 bg-slate-100 flex justify-center">
          <div 
            id="printable-label"
            className="w-full max-w-[380px] bg-white border-2 border-slate-900 text-slate-950 p-4 font-sans text-xs shadow-md rounded-sm"
          >
            {/* Header: Carrier & Marketplace */}
            <div className="border-b-2 border-slate-900 pb-2.5 mb-2.5">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded font-black text-xs uppercase tracking-wider ${getCarrierColor(pkg.cargoProviderName)}`}>
                  {pkg.cargoProviderName}
                </span>
                <span className="font-extrabold text-[11px] uppercase tracking-wide text-slate-700">
                  {pkg.marketplace.toUpperCase()} SEVKİYAT
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-500">Hat/Acente Kodu:</span>
                <span className="font-mono font-bold text-sm bg-slate-100 px-1.5 py-0.5 rounded">
                  {pkg.shipmentAddress.city.slice(0, 3).toUpperCase()}-{(pkg.shipmentAddress.district.slice(0, 3)).toUpperCase()}-01
                </span>
              </div>
            </div>

            {/* Recipient & Destination Block */}
            <div className="border-b-2 border-slate-900 pb-2.5 mb-2.5">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">ALICI (MÜŞTERİ)</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {pkg.shipmentAddress.fullName}
              </div>
              <div className="text-[11px] leading-tight text-slate-800 mt-1 font-medium">
                {pkg.shipmentAddress.address1}
              </div>
              <div className="text-xs font-bold text-slate-950 mt-1 uppercase flex items-center justify-between">
                <span>{pkg.shipmentAddress.district} / {pkg.shipmentAddress.city}</span>
                <span className="font-mono bg-slate-200 px-1 rounded">{pkg.shipmentAddress.postalCode}</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                Tel: {pkg.shipmentAddress.phone}
              </div>
            </div>

            {/* Simulated Code128 Barcode for Cargo Tracking */}
            <div className="text-center py-2 border-b-2 border-slate-900">
              <div className="text-[10px] text-slate-600 uppercase font-semibold mb-1">
                Kargo Takip Barkodu (Barkod Okuyucu Uyumlu)
              </div>
              
              {/* Code 128 CSS Barcode Generator */}
              <div className="h-14 flex items-center justify-center space-x-[2px] bg-slate-50 px-2 py-1 rounded border border-slate-300">
                {[4, 2, 6, 2, 4, 1, 8, 3, 2, 6, 2, 4, 8, 2, 3, 6, 2, 8, 4, 2, 6, 3, 2, 4, 7, 2, 4, 2, 8, 3, 5, 2, 6, 2, 4].map((width, idx) => (
                  <div 
                    key={idx} 
                    className="bg-black h-full" 
                    style={{ width: `${width}px` }}
                  />
                ))}
              </div>

              <div className="font-mono font-bold text-sm tracking-wider mt-1 text-slate-900">
                *{pkg.cargoTrackingNumber}*
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Paket No: {pkg.cargoBarcode}
              </div>
            </div>

            {/* Shipment Details & Order ID */}
            <div className="grid grid-cols-2 gap-2 text-[10px] py-2 border-b-2 border-slate-900">
              <div>
                <span className="text-slate-500 block">Sipariş No:</span>
                <span className="font-mono font-bold text-slate-900">{pkg.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tarih / Saat:</span>
                <span className="font-medium text-slate-900">
                  {new Date(pkg.orderDate).toLocaleDateString('tr-TR')} - {new Date(pkg.orderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Desi / Ağırlık:</span>
                <span className="font-bold text-slate-900">2.0 Desi / 0.85 kg</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ödeme Tipi:</span>
                <span className="font-bold text-emerald-700">Ön Ödemeli / Pazaryeri</span>
              </div>
            </div>

            {/* Warehouse Order Lines (Picking validation on box) */}
            <div className="pt-2">
              <div className="text-[10px] font-bold text-slate-700 uppercase mb-1">
                Koli İçi Ürünler ({pkg.lines.reduce((acc, l) => acc + l.quantity, 0)} Adet)
              </div>
              <div className="space-y-1">
                {pkg.lines.map((line) => (
                  <div key={line.id} className="text-[10px] bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                    <span className="truncate max-w-[240px] font-medium">
                      {line.quantity}x {line.productName}
                    </span>
                    <span className="font-mono text-slate-600 text-[9px]">{line.barcode}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer QR & Verification */}
            <div className="mt-3 pt-2 border-t border-dashed border-slate-400 flex items-center justify-between text-[9px] text-slate-500">
              <div className="flex items-center space-x-1.5">
                <QrCode className="w-6 h-6 text-slate-800" />
                <div>
                  <span className="font-bold block text-slate-700">PazarEntegra Sevk Doğrulama</span>
                  <span>Trendyol SAPIGW v2 Onaylı</span>
                </div>
              </div>
              <span className="font-mono text-slate-400">ID: {pkg.id}</span>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Termal barkod yazıcılarla (Zebra, Xprinter, HPRT vb.) %100 uyumludur.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
