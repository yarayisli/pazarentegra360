import React from 'react';
import { 
  Package, 
  Truck, 
  MessageSquareQuote, 
  Boxes, 
  PieChart, 
  KeyRound,
  Sparkles,
  RotateCcw,
  Calculator,
  RefreshCw,
  Zap,
  Bot,
  Warehouse,
  Award,
  FileCheck2,
  Box,
  Store
} from 'lucide-react';

export type ActiveTab = 
  | 'orders' 
  | 'wms'
  | 'packaging'
  | 'pos'
  | 'buybox'
  | 'settlement'
  | 'reconciliation'
  | 'returns' 
  | 'profitability' 
  | 'forecast' 
  | 'warehouse' 
  | 'inventory' 
  | 'finance' 
  | 'questions' 
  | 'saas';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingOrdersCount: number;
  urgentSlaCount: number;
  waitingQuestionsCount: number;
  pendingReturnsCount?: number;
  lossMakingSkuCount?: number;
  onOpenCopilot?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingOrdersCount,
  urgentSlaCount,
  waitingQuestionsCount,
  pendingReturnsCount = 2,
  lossMakingSkuCount = 1,
  onOpenCopilot,
}) => {
  const navItems = [
    {
      id: 'orders' as ActiveTab,
      label: 'Sipariş V2',
      sublabel: 'getShipmentPackages',
      icon: Package,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'wms' as ActiveTab,
      label: 'WMS & Raf',
      sublabel: 'Dalga Toplama & Lot',
      icon: Warehouse,
      badge: 'Yeni',
      badgeColor: 'bg-cyan-600 text-white font-bold',
    },
    {
      id: 'packaging' as ActiveTab,
      label: 'Akıllı Koli & 3D Paket',
      sublabel: 'Desi Tasarruf Motoru',
      icon: Box,
      badge: '3D',
      badgeColor: 'bg-emerald-600 text-white font-bold',
    },
    {
      id: 'pos' as ActiveTab,
      label: 'ikas POS (Kasa)',
      sublabel: 'Barkodlu Perakende & Stok',
      icon: Store,
      badge: 'POS',
      badgeColor: 'bg-cyan-600 text-white font-bold',
    },
    {
      id: 'buybox' as ActiveTab,
      label: 'Buybox & Repricer',
      sublabel: 'Dinamik Fiyat Radarı',
      icon: Award,
      badge: 'Bot',
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'settlement' as ActiveTab,
      label: 'Hakediş & Desi Denetçisi',
      sublabel: 'Komisyon & Kaçak İtiraz',
      icon: FileCheck2,
      badge: 'Audit',
      badgeColor: 'bg-rose-600 text-white font-bold',
    },
    {
      id: 'reconciliation' as ActiveTab,
      label: 'Event Store & SLA',
      sublabel: 'Webhook & Delta Sync',
      icon: RefreshCw,
      badge: urgentSlaCount > 0 ? `${urgentSlaCount} SLA` : undefined,
      badgeColor: 'bg-red-500 text-white font-bold animate-pulse',
    },
    {
      id: 'warehouse' as ActiveTab,
      label: 'Depo & Kargo Masası',
      sublabel: 'Barkod Okuma & Fiş',
      icon: Truck,
    },
    {
      id: 'returns' as ActiveTab,
      label: 'İade & Reverse Lojistik',
      sublabel: 'Kabul, Kusur & İtiraz',
      icon: RotateCcw,
      badge: pendingReturnsCount > 0 ? `${pendingReturnsCount} Bekleyen` : undefined,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'profitability' as ActiveTab,
      label: 'SKU Kârlılık Radarı',
      sublabel: 'Net Katkı & Gizli Zarar',
      icon: Calculator,
      badge: lossMakingSkuCount > 0 ? '1 Zarar' : undefined,
      badgeColor: 'bg-rose-600 text-white font-bold',
    },
    {
      id: 'forecast' as ActiveTab,
      label: 'Akıllı Stok & PO',
      sublabel: 'Talep & Satın Alma',
      icon: Zap,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Katalog & Envanter',
      sublabel: 'Çapraz Eşitleme',
      icon: Boxes,
    },
    {
      id: 'finance' as ActiveTab,
      label: 'Finans & Hakediş',
      sublabel: 'Komisyon & Ödeme',
      icon: PieChart,
    },
    {
      id: 'questions' as ActiveTab,
      label: 'Müşteri & İtibar Masası',
      sublabel: 'Q&A & Yorum Telafisi',
      icon: MessageSquareQuote,
      badge: waitingQuestionsCount > 0 ? waitingQuestionsCount : undefined,
      badgeColor: 'bg-indigo-500 text-white font-bold',
    },
    {
      id: 'saas' as ActiveTab,
      label: 'API & Ayarlar',
      sublabel: 'Pazaryeri Credentials',
      icon: KeyRound,
      highlight: true,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap group ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-1.5 rounded-lg mr-2 transition-colors ${
                  isActive 
                    ? 'bg-slate-800 text-amber-400' 
                    : 'bg-slate-100 text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span>{item.label}</span>
                    {item.highlight && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        SaaS
                      </span>
                    )}
                  </div>
                  <span className={`block text-[10px] font-normal leading-tight ${
                    isActive ? 'text-slate-300' : 'text-slate-400'
                  }`}>
                    {item.sublabel}
                  </span>
                </div>

                {item.badge !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] leading-tight ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {onOpenCopilot && (
            <div className="flex items-center pl-2 border-l border-slate-200 shrink-0">
              <button
                onClick={onOpenCopilot}
                className="flex items-center px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <Bot className="w-4 h-4 mr-1.5 text-amber-300 animate-pulse" />
                <span>AI Copilot</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};
