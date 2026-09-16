import React, { useState } from 'react';
import { 
  Barcode, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Printer, 
  Calculator, 
  ShieldAlert, 
  Boxes,
  FileCheck2,
  ScanLine
} from 'lucide-react';
import { ShipmentPackage } from '../types';

interface CargoOperationsViewProps {
  packages: ShipmentPackage[];
  onOpenLabel: (pkg: ShipmentPackage) => void;
  onMarkShipped: (id: number) => void;
}

export const CargoOperationsView: React.FC<CargoOperationsViewProps> = ({
  packages,
  onOpenLabel,
  onMarkShipped
}) => {
  // Barcode scanner simulation state
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    productName?: string;
    orderNumber?: string;
  }>({ status: 'idle', message: '' });

  // Desi calculator state
  const [desiWidth, setDesiWidth] = useState(25);
  const [desiLength, setDesiLength] = useState(35);
  const [desiHeight, setDesiHeight] = useState(15);

  const calculatedDesi = Number(((desiWidth * desiLength * desiHeight) / 3000).toFixed(2));

  // Handle Barcode Scan
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBarcode.trim()) return;

    const query = scannedBarcode.trim();

    // Check across pending packages (Created, Picking, Invoiced)
    const pendingPkgs = packages.filter(p => ['Created', 'Picking', 'Invoiced'].includes(p.packageStatus));
    
    let matchedPkg: ShipmentPackage | undefined;
    let matchedLine: any;

    for (const pkg of pendingPkgs) {
      const line = pkg.lines.find(l => l.barcode === query || l.merchantSku.toLowerCase() === query.toLowerCase());
      if (line) {
        matchedPkg = pkg;
        matchedLine = line;
        break;
      }
    }

    if (matchedPkg && matchedLine) {
      setScanResult({
        status: 'success',
        message: `DOĞRU ÜRÜN! Sipariş #${matchedPkg.orderNumber} ile eşleşti.`,
        productName: matchedLine.productName,
        orderNumber: matchedPkg.orderNumber
      });
    } else {
      setScanResult({
        status: 'error',
        message: `UYARI: Okutulan barkod (${query}) bekleyen hiçbir siparişle eşleşmedi! Yanlış ürün gönderimi engellendi.`
      });
    }

    setScannedBarcode('');
  };

  // Urgent SLA packages (under 6 hours remaining)
  const urgentPackages = packages.filter(p => {
    const diffHours = (p.agreedDeliveryDate - Date.now()) / (3600 * 1000);
    return ['Created', 'Picking', 'Invoiced'].includes(p.packageStatus) && diffHours <= 6;
  });

  // Carrier distribution
  const carrierDistribution = packages.reduce((acc, p) => {
    acc[p.cargoProviderName] = (acc[p.cargoProviderName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      
      {/* Operation Dashboard Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" />
              <span>Depo & Sevkiyat Kontrol Kulesi</span>
            </div>
            <h1 className="text-xl font-extrabold text-white">
              Akıllı Kargo Doğrulama & SLA Takip Merkezi
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Hatalı kargo gönderimini sıfırlamak için el terminali / barkod okuyucu ile eşleştirme yapın, kargo kuryesi teslim tutanaklarını ve son teslim sürelerini tek ekrandan yönetin.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 transition-colors shadow-sm"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Kurye Teslim Tutanağı (Manifest)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Scan to Pack & SLA Desk */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Scan to Pack (El Terminali / Barkod Doğrulama) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Scan-to-Pack: Barkod Okutarak Paketleme</h3>
                  <p className="text-xs text-slate-500">Koliye konulan ürünün barkodunu okutarak siparişi doğrulayın</p>
                </div>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                El Terminali / USB Barkod Modu
              </span>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <div className="relative">
                <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={scannedBarcode}
                  onChange={(e) => setScannedBarcode(e.target.value)}
                  placeholder="Ürün Barkodu Okutun veya Yazın (Örn: 8680019284019)..."
                  className="w-full pl-10 pr-24 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Doğrula
                </button>
              </div>

              {/* Sample quick barcodes to test */}
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <span>Test Barkodları:</span>
                <button
                  type="button"
                  onClick={() => setScannedBarcode('8680019284019')}
                  className="font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-semibold"
                >
                  8680019284019 (Kulaklık)
                </button>
                <button
                  type="button"
                  onClick={() => setScannedBarcode('8680019284026')}
                  className="font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-semibold"
                >
                  8680019284026 (Stand)
                </button>
                <button
                  type="button"
                  onClick={() => setScannedBarcode('9999999999999')}
                  className="font-mono bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded text-red-700 font-semibold"
                >
                  Hatalı Barkod Simülasyonu
                </button>
              </div>
            </form>

            {/* Scan Feedback Banner */}
            {scanResult.status === 'success' && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    {scanResult.message}
                  </div>
                  <div className="text-sm font-extrabold text-emerald-950 mt-1">
                    {scanResult.productName}
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Bu ürün koliye güvenle yerleştirilebilir. Hatalı gönderim riski bulunmuyor.
                  </div>
                </div>
              </div>
            )}

            {scanResult.status === 'error' && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-900 animate-bounce">
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    DİKKAT! YANLIŞ ÜRÜN UYARISI
                  </div>
                  <div className="text-xs font-bold text-rose-950 mt-1">
                    {scanResult.message}
                  </div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    Lütfen koliyi kapatmayın ve doğru ürünü depodan temin edin.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Urgent SLA Warnings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kritik SLA Kargo Masası ({urgentPackages.length} Paket Acil Sevk)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Trendyol & Pazaryeri gecikme cezası yememek için bugün kargoya verilmesi zorunlu paketler
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {urgentPackages.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  Tüm paketler zamanında kargolanmış veya acil SLA riski bulunmuyor.
                </div>
              ) : (
                urgentPackages.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-slate-900">#{pkg.orderNumber}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-red-100 text-red-800">
                          {pkg.marketplace}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {pkg.customerFirstName} {pkg.customerLastName} ({pkg.shipmentAddress.city})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                        <span>Taşıyıcı: <strong className="text-slate-800">{pkg.cargoProviderName}</strong></span>
                        <span>•</span>
                        <span className="text-red-700 font-bold flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Son Kargolama Saati: {new Date(pkg.agreedDeliveryDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onOpenLabel(pkg)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Etiket Bas</span>
                      </button>
                      <button
                        onClick={() => onMarkShipped(pkg.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Kuryeye Verildi
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Desi Calculator & Carrier Volumes */}
        <div className="space-y-6">
          
          {/* Desi & Barem Calculator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-3">
              <Calculator className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Desi & Kargo Barem Hesaplayıcı
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Koli ebatlarını girerek Trendyol & Pazaryeri kargo barem kesintisini hesaplayın (Formül: En x Boy x Yükseklik / 3000).
            </p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">En (cm)</label>
                <input
                  type="number"
                  value={desiWidth}
                  onChange={(e) => setDesiWidth(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Boy (cm)</label>
                <input
                  type="number"
                  value={desiLength}
                  onChange={(e) => setDesiLength(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Yükseklik</label>
                <input
                  type="number"
                  value={desiHeight}
                  onChange={(e) => setDesiHeight(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <span className="text-xs text-amber-800 font-semibold block">Hesaplanan Hacimsel Desi:</span>
              <span className="text-2xl font-black text-amber-950">{calculatedDesi} Desi</span>
              <div className="text-[11px] text-amber-700 mt-1">
                Trendyol Express Barem: <strong>{calculatedDesi <= 2 ? '₺34.50 + KDV' : calculatedDesi <= 5 ? '₺46.00 + KDV' : '₺68.00 + KDV'}</strong>
              </div>
            </div>
          </div>

          {/* Active Carrier Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Taşıyıcı Kargo Dağılımı</span>
            </h3>

            <div className="space-y-2.5">
              {Object.entries(carrierDistribution).map(([carrier, count]) => (
                <div key={carrier} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{carrier}</span>
                  <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                    {count} Paket
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Kargo kuryesi saat 17:00'da depodan toplama yapacaktır.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
