import React from 'react';
import { 
  Boxes, 
  RefreshCw, 
  ShieldCheck, 
  Store, 
  Bell, 
  ExternalLink,
  Cpu,
  Layers
} from 'lucide-react';
import { MarketplaceCredentials } from '../types';

interface HeaderProps {
  credentials: MarketplaceCredentials;
  isSyncing: boolean;
  onManualSync: () => void;
  activeStore: string;
  onChangeStore: (store: string) => void;
  unreadQuestionsCount: number;
  onOpenQuestions: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  credentials,
  isSyncing,
  onManualSync,
  activeStore,
  onChangeStore,
  unreadQuestionsCount,
  onOpenQuestions
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                  PazarEntegra <span className="text-amber-400">360</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v3.2 SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Trendyol • Hepsiburada • N11 • ikas Store & POS Perakende Hub
              </p>
            </div>
          </div>

          {/* Quick Active Store Selector & API Status */}
          <div className="flex items-center space-x-3">
            {/* Active Store selector */}
            <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700 text-xs">
              <Store className="w-4 h-4 text-amber-400 mr-2" />
              <span className="text-slate-400 mr-1.5">Mağaza:</span>
              <select 
                value={activeStore}
                onChange={(e) => onChangeStore(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Tüm Kanallar (Pazaryeri + ikas)</option>
                <option value="trendyol" className="bg-slate-900 text-white">Trendyol ({credentials.trendyol.supplierId})</option>
                <option value="hepsiburada" className="bg-slate-900 text-white">Hepsiburada Store</option>
                <option value="n11" className="bg-slate-900 text-white">N11 Mağazası</option>
                <option value="ikas" className="bg-slate-900 text-white">ikas Web Mağazamız (DTC)</option>
              </select>
            </div>

            {/* Live API Pulse Indicators */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-700/50">
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium text-[11px]">Trendyol API Aktif</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>HB</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>N11</span>
              </div>
            </div>

            {/* Manual Sync Trigger */}
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isSyncing 
                  ? 'bg-amber-600 text-white cursor-wait'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold hover:shadow-amber-500/20'
              }`}
              title="Tüm pazaryerlerinden yeni siparişleri ve kargo hareketlerini çek"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Senkronize Ediliyor...' : 'Pazaryerlerini Tara'}</span>
            </button>

            {/* Notification & Q&A Alert */}
            <button
              onClick={onOpenQuestions}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Müşteri Soruları ve Mesajları"
            >
              <Bell className="w-4 h-4" />
              {unreadQuestionsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                  {unreadQuestionsCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
