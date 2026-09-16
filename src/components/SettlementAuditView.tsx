import React, { useState } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Download, 
  Search, 
  ArrowUpRight, 
  Truck, 
  Percent, 
  Filter, 
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SettlementAuditRecord, SettlementDiscrepancyType } from '../types';

interface SettlementAuditViewProps {
  records: SettlementAuditRecord[];
  onUpdateRecord: (record: SettlementAuditRecord) => void;
}

export const SettlementAuditView: React.FC<SettlementAuditViewProps> = ({
  records: initialRecords,
  onUpdateRecord,
}) => {
  const [records, setRecords] = useState<SettlementAuditRecord[]>(initialRecords);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<SettlementAuditRecord | null>(null);
  const [claimTicketInput, setClaimTicketInput] = useState<string>('');
  const [claimNotesInput, setClaimNotesInput] = useState<string>('');

  // Calculations
  const totalDiscrepancyAmount = records.reduce((acc, r) => acc + r.discrepancyAmount, 0);
  const desiTheftCount = records.filter(r => r.discrepancyType === 'DESI_OVERCHARGE').length;
  const commissionOverchargeCount = records.filter(r => r.discrepancyType === 'COMMISSION_OVERCHARGE').length;
  const openDiscrepancies = records.filter(r => r.claimStatus === 'OPEN_DISCREPANCY');
  const openDiscrepancyAmount = openDiscrepancies.reduce((acc, r) => acc + r.discrepancyAmount, 0);
  const recoveredAmount = records
    .filter(r => r.claimStatus === 'REFUNDED_BY_MARKETPLACE')
    .reduce((acc, r) => acc + r.discrepancyAmount, 0);

  // Filtered records
  const filteredRecords = records.filter(r => {
    if (filterType !== 'ALL' && r.discrepancyType !== filterType) return false;
    if (filterStatus !== 'ALL' && r.claimStatus !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.orderNumber.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.marketplace.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle dispute submission
  const handleOpenClaimModal = (record: SettlementAuditRecord) => {
    setSelectedRecord(record);
    setClaimTicketInput(record.claimTicketNumber || `TIK-${record.marketplace.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
    setClaimNotesInput(record.claimNotes || `Haksız kesinti tespiti: ₺${record.discrepancyAmount.toFixed(2)} tutarının cari hesaba iadesi talep edilmektedir.`);
  };

  const handleSaveClaim = (newStatus: SettlementAuditRecord['claimStatus']) => {
    if (!selectedRecord) return;
    const updated: SettlementAuditRecord = {
      ...selectedRecord,
      claimStatus: newStatus,
      claimTicketNumber: claimTicketInput,
      claimNotes: claimNotesInput
    };

    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    onUpdateRecord(updated);
    setSelectedRecord(null);
  };

  // Export report
  const handleExportAuditReport = () => {
    const csvContent = [
      ["Siparis No", "Pazaryeri", "Urun", "SKU", "Tutar", "Uyuşmazlık Tipi", "Haksız Kesinti (TL)", "Durum"],
      ...records.map(r => [
        r.orderNumber,
        r.marketplace,
        `"${r.productName.replace(/"/g, '""')}"`,
        r.sku,
        r.grossAmount,
        r.discrepancyType,
        r.discrepancyAmount,
        r.claimStatus
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Hakedis_Kesinti_Mutabakat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Hakediş & Kargo Kesinti Denetçisi (Settlement Audit)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pazaryeri Kesinti Denetimi & Desi Hırsızlığı Radarı
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Pazaryeri hakediş raporlarındaki sözleşme dışı komisyonları, kargo desi aşım haksızlıklarını ve bloke kalmış ödemeleri tespit edip itiraz dosyası açar.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportAuditReport}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center shadow-sm"
            >
              <Download className="w-4 h-4 mr-1.5 text-rose-400" />
              İtiraz Raporunu İndir (CSV)
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs text-rose-800 font-semibold">Toplam Tespit Edilen Kaçak</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              ₺{totalDiscrepancyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-rose-700 mt-1 block">
              {records.length} siparişte usulsüz kesinti
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-xs text-amber-900 font-semibold">İtiraz Edilmeyi Bekleyen</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              ₺{openDiscrepancyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-amber-800 mt-1 block">
              {openDiscrepancies.length} adet açık itiraz kaydı
            </span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-xs text-blue-900 font-semibold">Kargo Desi Aşımı (Desi Theft)</span>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {desiTheftCount} Paket
            </div>
            <span className="text-[11px] text-blue-800 mt-1 block">
              Kargo firması gerçek boyuttan fazla faturalandırmış
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs text-emerald-900 font-semibold">Geri Kazanılan Tutar</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              ₺{recoveredAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              Pazaryerinden iadesi tahsil edildi
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Sipariş No, SKU veya ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">Tüm Kesinti Tipleri</option>
            <option value="DESI_OVERCHARGE">Kargo Desi Aşımı</option>
            <option value="COMMISSION_OVERCHARGE">Fazla Komisyon Kesintisi</option>
            <option value="UNPAID_SETTLEMENT">Bloke / Ödenmemiş Hakediş</option>
            <option value="REFUND_WITHOUT_RETURN">Dönmeyen İade Bedeli</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="OPEN_DISCREPANCY">Açık (İtiraz Bekliyor)</option>
            <option value="CLAIM_SUBMITTED">İtiraz Açıldı (Cevap Bekleniyor)</option>
            <option value="REFUNDED_BY_MARKETPLACE">Kabul Edildi (Geri Ödendi)</option>
            <option value="REJECTED">Reddedildi</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Toplam <strong>{filteredRecords.length}</strong> kayıt listeleniyor
        </span>
      </div>

      {/* Main Audit Discrepancies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Pazaryeri & Sipariş No</th>
                <th className="py-3 px-4">Ürün & SKU</th>
                <th className="py-3 px-4">Uyuşmazlık Türü</th>
                <th className="py-3 px-4">Beklenen vs Kesilen</th>
                <th className="py-3 px-4">Haksız Kesinti Tutarı</th>
                <th className="py-3 px-4">İtiraz Durumu</th>
                <th className="py-3 px-4 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.marketplace === 'trendyol' ? 'bg-orange-100 text-orange-800' :
                        r.marketplace === 'hepsiburada' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {r.marketplace}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{r.orderNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Vade: {r.settlementDate}</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={r.productName}>
                      {r.productName}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{r.sku}</span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {r.discrepancyType === 'DESI_OVERCHARGE' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-medium text-[11px]">
                        <Truck className="w-3 h-3 mr-1" />
                        Kargo Desi Aşımı
                      </span>
                    )}
                    {r.discrepancyType === 'COMMISSION_OVERCHARGE' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px]">
                        <Percent className="w-3 h-3 mr-1" />
                        Komisyon Fazlası
                      </span>
                    )}
                    {r.discrepancyType === 'UNPAID_SETTLEMENT' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium text-[11px]">
                        <Clock className="w-3 h-3 mr-1" />
                        Vadesi Geçen Alacak
                      </span>
                    )}
                    {r.discrepancyType === 'REFUND_WITHOUT_RETURN' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-medium text-[11px]">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Dönmeyen İade Bedeli
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {r.discrepancyType === 'DESI_OVERCHARGE' ? (
                      <div className="text-[11px]">
                        <span className="text-slate-600">Beklenen: {r.expectedDesi} Desi (₺{r.expectedCargoCost})</span>
                        <span className="block font-bold text-rose-600">Faturalanan: {r.billedDesi} Desi (₺{r.billedCargoCost})</span>
                      </div>
                    ) : r.discrepancyType === 'COMMISSION_OVERCHARGE' ? (
                      <div className="text-[11px]">
                        <span className="text-slate-600">Sözleşme: ₺{r.expectedCommission.toFixed(2)}</span>
                        <span className="block font-bold text-amber-600">Kesilen: ₺{r.actualCommissionDeducted.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Toplam: ₺{r.grossAmount}</span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-bold text-rose-600 text-sm whitespace-nowrap">
                    +₺{r.discrepancyAmount.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {r.claimStatus === 'OPEN_DISCREPANCY' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                        İtiraz Açılmadı
                      </span>
                    )}
                    {r.claimStatus === 'CLAIM_SUBMITTED' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        İnceleniyor ({r.claimTicketNumber})
                      </span>
                    )}
                    {r.claimStatus === 'REFUNDED_BY_MARKETPLACE' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        İade Edildi ✓
                      </span>
                    )}
                    {r.claimStatus === 'REJECTED' && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                        Reddedildi
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenClaimModal(r)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-sm transition-all flex items-center ml-auto"
                    >
                      <FileText className="w-3 h-3 mr-1 text-rose-400" />
                      İtiraz Dosyası
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim / Dispute Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pazaryeri İtiraz & Mutabakat Dosyası</h3>
                <span className="text-xs text-slate-500">Sipariş: {selectedRecord.orderNumber} ({selectedRecord.marketplace})</span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Ürün:</span>
                <strong className="text-slate-900">{selectedRecord.productName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Haksız Kesinti:</span>
                <strong className="text-rose-600 font-bold text-sm">₺{selectedRecord.discrepancyAmount.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tespit Nedeni:</span>
                <span className="text-slate-700">{selectedRecord.claimNotes}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pazaryeri Destek / Talep Numarası (Ticket No)
                </label>
                <input
                  type="text"
                  value={claimTicketInput}
                  onChange={(e) => setClaimTicketInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  İtiraz Gerekçesi ve Kanıt Açıklaması
                </label>
                <textarea
                  rows={3}
                  value={claimNotesInput}
                  onChange={(e) => setClaimNotesInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => handleSaveClaim('CLAIM_SUBMITTED')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
              >
                İtirazı Pazaryerine Gönderildi Olarak İşle
              </button>

              <button
                onClick={() => handleSaveClaim('REFUNDED_BY_MARKETPLACE')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Para İadesi Alındı (Tahsil Edildi)
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
