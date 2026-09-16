import React, { useState } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Truck, 
  Receipt, 
  ShieldCheck,
  Star,
  Award
} from 'lucide-react';
import { ShipmentPackage, ProductItem } from '../types';

interface FinanceAnalyticsViewProps {
  packages: ShipmentPackage[];
  products: ProductItem[];
}

export const FinanceAnalyticsView: React.FC<FinanceAnalyticsViewProps> = ({
  packages,
  products
}) => {
  // Financial aggregations
  const totalGrossRevenue = packages
    .filter(p => p.packageStatus !== 'Cancelled')
    .reduce((acc, p) => acc + p.totalPrice, 0);

  // Simulated commissions (average 18%)
  const totalCommissions = totalGrossRevenue * 0.182;
  
  // Simulated cargo deductions (approx 45 TL per shipped package)
  const shippedPackagesCount = packages.filter(p => ['Invoiced', 'Shipped', 'Delivered'].includes(p.packageStatus)).length;
  const totalCargoCost = shippedPackagesCount * 42.50;

  // Estimated tax / withholding (Stopaj %1 + KDV)
  const estimatedTax = totalGrossRevenue * 0.01;

  // Net Profit
  const netEarnings = totalGrossRevenue - totalCommissions - totalCargoCost - estimatedTax;

  // Marketplace distribution
  const marketplaceSales = {
    trendyol: packages.filter(p => p.marketplace === 'trendyol' && p.packageStatus !== 'Cancelled').reduce((a, b) => a + b.totalPrice, 0),
    hepsiburada: packages.filter(p => p.marketplace === 'hepsiburada' && p.packageStatus !== 'Cancelled').reduce((a, b) => a + b.totalPrice, 0),
    n11: packages.filter(p => p.marketplace === 'n11' && p.packageStatus !== 'Cancelled').reduce((a, b) => a + b.totalPrice, 0),
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>360° Finans & Pazaryeri Hakediş Raporu</span>
            </div>
            <h1 className="text-xl font-extrabold text-white">
              Ciro, Komisyon, Kargo ve Net Kar Analitiği
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Trendyol, Hepsiburada ve N11 komisyon oranları, kargo barem kesintileri ve stopaj vergisi sonrası banka hesabınıza yatacak net hakediş tutarını canlı takip edin.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-xl p-3 text-right">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Net Hesaba Geçecek Hakediş</span>
              <span className="text-2xl font-black text-emerald-400">
                ₺{netEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cards P&L Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Toplam Brüt Ciro</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">₺</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₺{totalGrossRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Geçen haftaya göre +%18.4</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Pazaryeri Komisyonları</span>
            <Percent className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-700 mt-2">
            ₺{totalCommissions.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ortalama Komisyon: <strong>%18.2</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Kargo Barem Giderleri</span>
            <Truck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-800 mt-2">
            ₺{totalCargoCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {shippedPackagesCount} paket x ₺42.50 ort.
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Trendyol Satıcı Puanı</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            9.8 <span className="text-xs font-normal text-slate-500">/ 10</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
            <Award className="w-3.5 h-3.5 mr-1" />
            <span>Süper Satıcı Rozeti Aktif</span>
          </div>
        </div>

      </div>

      {/* Marketplace Breakdown & Commission Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Marketplace Sales Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-slate-700" />
            <span>Pazaryeri Bazlı Ciro Dağılımı</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-orange-700">Trendyol Satışları</span>
                <span className="font-bold text-slate-900">
                  ₺{marketplaceSales.trendyol.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(marketplaceSales.trendyol / (totalGrossRevenue || 1)) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 text-right">
                %{((marketplaceSales.trendyol / (totalGrossRevenue || 1)) * 100).toFixed(1)} pay
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-amber-800">Hepsiburada Satışları</span>
                <span className="font-bold text-slate-900">
                  ₺{marketplaceSales.hepsiburada.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(marketplaceSales.hepsiburada / (totalGrossRevenue || 1)) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 text-right">
                %{((marketplaceSales.hepsiburada / (totalGrossRevenue || 1)) * 100).toFixed(1)} pay
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-red-700">N11 Satışları</span>
                <span className="font-bold text-slate-900">
                  ₺{marketplaceSales.n11.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${(marketplaceSales.n11 / (totalGrossRevenue || 1)) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 text-right">
                %{((marketplaceSales.n11 / (totalGrossRevenue || 1)) * 100).toFixed(1)} pay
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 mb-1">Hakediş Vadesi Bilgilendirmesi</h4>
            <p className="leading-relaxed">
              Trendyol teslim edilen sipariş hakedişlerini <strong>14 gün</strong> vadede, Hepsiburada <strong>21 gün</strong> vadede satıcı IBAN hesabınıza aktarmaktadır.
            </p>
          </div>
        </div>

        {/* Growth & Margin Simulator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <span>Kategori Bazlı Komisyon Oranları Matrisi</span>
          </h3>

          <div className="space-y-3">
            {[
              { category: 'Elektronik / Ses & Kulaklık', ty: '%18.5', hb: '%19.0', n11: '%17.0' },
              { category: 'Bilgisayar & Aksesuar', ty: '%16.0', hb: '%17.5', n11: '%15.0' },
              { category: 'Oyuncu Ekipmanları & Klavye', ty: '%17.0', hb: '%18.0', n11: '%16.5' },
              { category: 'Telefon Şarj & Aksesuar', ty: '%18.0', hb: '%18.5', n11: '%16.0' },
              { category: 'Akıllı Saat & Giyilebilir', ty: '%20.0', hb: '%20.0', n11: '%18.0' },
            ].map((row, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{row.category}</span>
                <div className="flex items-center space-x-3 text-[11px] font-mono">
                  <span className="text-orange-700 font-semibold">TY: {row.ty}</span>
                  <span className="text-amber-800 font-semibold">HB: {row.hb}</span>
                  <span className="text-red-700 font-semibold">N11: {row.n11}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-[11px] text-slate-400">
            * Komisyon oranları pazaryerlerinin güncel kategori komisyon sözleşmelerinden otomatik çekilmektedir.
          </div>
        </div>

      </div>

    </div>
  );
};
