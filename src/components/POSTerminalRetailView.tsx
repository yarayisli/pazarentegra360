import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Printer, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Zap, 
  Layers, 
  Receipt, 
  ShoppingBag,
  Percent,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ProductItem, POSSaleReceipt, POSTerminalCartItem } from '../types';

interface POSTerminalRetailViewProps {
  products: ProductItem[];
  receipts: POSSaleReceipt[];
  onCompleteSale: (receipt: POSSaleReceipt, updatedProducts: ProductItem[]) => void;
}

export const POSTerminalRetailView: React.FC<POSTerminalRetailViewProps> = ({
  products,
  receipts: initialReceipts,
  onCompleteSale
}) => {
  const [receipts, setReceipts] = useState<POSSaleReceipt[]>(initialReceipts);
  const [cart, setCart] = useState<POSTerminalCartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'CASH'>('CREDIT_CARD');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [customerName, setCustomerName] = useState('Perakende Müşteri');
  const [lastCompletedReceipt, setLastCompletedReceipt] = useState<POSSaleReceipt | null>(null);
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'RECEIPTS_HISTORY'>('REGISTER');
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto focus barcode reader
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Filter products for quick search
  const searchResults = products.filter(p => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
  }).slice(0, 6);

  // Quick popular products
  const quickProducts = products.slice(0, 6);

  // Add to cart by product
  const handleAddToCart = (product: ProductItem) => {
    if (product.totalStock <= 0) {
      alert(`Uyarı: "${product.name}" ürününde yeterli stok yok! (Mevcut: ${product.totalStock})`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.totalStock) {
          alert(`Uyarı: Maksimum mevcut depo stoğuna (${product.totalStock} adet) ulaşıldı.`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product,
        quantity: 1,
        discountRate: 0,
        finalUnitPrice: product.basePrice
      }];
    });
    setSearchQuery('');
  };

  // Barcode scanned
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(p => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (matched) {
      handleAddToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`Barkod "${barcodeInput}" ile eşleşen ürün bulunamadı!`);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.product.totalStock) {
          alert(`Maksimum mevcut stok: ${item.product.totalStock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as POSTerminalCartItem[]);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, i) => sum + (i.product.basePrice * i.quantity), 0);
  const discountTotal = cart.reduce((sum, i) => sum + ((i.product.basePrice * (i.discountRate / 100)) * i.quantity), 0);
  const grandTotal = subtotal - discountTotal;
  const taxTotal = grandTotal * 0.20 / 1.20; // %20 KDV dahil hesap
  const changeDue = Math.max(0, cashTendered - grandTotal);

  // Complete Sale & Sync to Marketplaces
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'CASH' && cashTendered > 0 && cashTendered < grandTotal) {
      alert(`Alınan nakit tutar (₺${cashTendered}) toplam tutardan (₺${grandTotal}) düşük olamaz!`);
      return;
    }

    const receiptNumber = `POS-${Date.now().toString().slice(-6)}`;
    const newReceipt: POSSaleReceipt = {
      id: `pos-rec-${Date.now()}`,
      receiptNumber,
      saleTime: new Date().toLocaleDateString('tr-TR', { 
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
      }),
      cashierName: "Kasa-1 (Yetkili Satıcı)",
      customerName: customerName || "Perakende Müşteri",
      paymentMethod,
      items: cart.map(item => ({
        sku: item.product.sku,
        name: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: item.finalUnitPrice,
        total: item.finalUnitPrice * item.quantity
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      syncedToMarketplaces: true
    };

    // Deduct stock from products
    const updatedProducts = products.map(p => {
      const soldItem = cart.find(i => i.product.id === p.id);
      if (soldItem) {
        const newStock = Math.max(0, p.totalStock - soldItem.quantity);
        return {
          ...p,
          totalStock: newStock,
          channels: {
            ...p.channels,
            trendyol: { ...p.channels.trendyol, stock: Math.max(0, p.channels.trendyol.stock - soldItem.quantity), lastSync: "Şimdi (POS Satışı)" },
            hepsiburada: { ...p.channels.hepsiburada, stock: Math.max(0, p.channels.hepsiburada.stock - soldItem.quantity), lastSync: "Şimdi (POS Satışı)" },
            n11: { ...p.channels.n11, stock: Math.max(0, p.channels.n11.stock - soldItem.quantity), lastSync: "Şimdi (POS Satışı)" },
            ...(p.channels.ikas ? {
              ikas: { ...p.channels.ikas, stock: newStock, lastSync: "Şimdi (POS Satışı)" }
            } : {})
          }
        };
      }
      return p;
    });

    setReceipts(prev => [newReceipt, ...prev]);
    setLastCompletedReceipt(newReceipt);
    setCart([]);
    setCashTendered(0);
    onCompleteSale(newReceipt, updatedProducts);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-semibold border border-cyan-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>ikas POS Entegre Barkodlu Kasa Terminali</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Hızlı Perakende Satış & Anlık Stok Senkronizasyonu
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Fiziki mağazadan veya depodan saniyeler içinde barkodla satış yapın. Kasa kapandığı anda <strong>Trendyol, Hepsiburada, N11 ve ikas web sitenizdeki</strong> stoklar canlı olarak düşer; çift satış riski sıfırlanır.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('REGISTER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'REGISTER'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Kasa Ekranı (POS)</span>
            </button>

            <button
              onClick={() => setActiveTab('RECEIPTS_HISTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'RECEIPTS_HISTORY'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Satış Fişleri ({receipts.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Omnichannel Sync Badge */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
              Omnichannel Stok Kilidi Aktif
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-slate-600">Her satışta: <strong>Trendyol, HB, N11, ikas Store</strong> stokları anında güncellenir</span>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Aktif Kasa: <strong className="text-slate-700">KASA-01 (Kadir U.)</strong>
          </div>
        </div>
      </div>

      {activeTab === 'REGISTER' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Product Search & Quick Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barcode & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <form onSubmit={handleBarcodeSubmit} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Barcode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Barkod okutun veya SKU yazıp Enter'a basın..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Okut
                </button>
              </form>

              {/* Text Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün adı ile ara..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      className="w-full p-2 text-left flex items-center justify-between hover:bg-white rounded-lg transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover border border-slate-200" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{p.barcode} • Stok: {p.totalStock}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900">₺{p.basePrice.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Speed-Dial Products */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900">Hızlı Satış Butonları (En Çok Satanlar)</h3>
                </div>
                <span className="text-[10px] text-slate-400">Dokunmatik Satış</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {quickProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 text-left transition-all group flex flex-col justify-between h-28"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">{p.sku}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        p.totalStock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        Stok: {p.totalStock}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-cyan-900">
                      {p.name}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs font-black text-slate-900">₺{p.basePrice.toFixed(2)}</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Active POS Cart & Checkout (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col min-h-[580px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4 text-slate-900" />
                  <h3 className="text-sm font-bold text-slate-900">Kasa Sepeti ({cart.reduce((s, i) => s + i.quantity, 0)} Ürün)</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold"
                  >
                    Sepeti Temizle
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 max-h-[260px]">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                    <Barcode className="w-8 h-8 mb-2 stroke-[1.5]" />
                    <span className="text-xs">Sepet boş. Barkod okutun veya hızlı ürün seçin.</span>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.product.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">₺{item.finalUnitPrice.toFixed(2)} / adet</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-slate-200 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono font-bold text-slate-900 text-xs">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-slate-900 min-w-[65px] text-right">
                          ₺{(item.finalUnitPrice * item.quantity).toFixed(2)}
                        </span>

                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer & Payment Details */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Müşteri / Cari:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                {/* Payment Method Switcher */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kredi Kartı (POS)</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nakit Para</span>
                  </button>
                </div>

                {paymentMethod === 'CASH' && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Alınan Nakit (₺):</span>
                      <input
                        type="number"
                        value={cashTendered || ''}
                        onChange={(e) => setCashTendered(Number(e.target.value))}
                        placeholder="Ör. 1500"
                        className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 w-24 font-bold"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Para Üstü:</span>
                      <span className="font-extrabold text-emerald-600 text-sm">₺{changeDue.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Financial Totals */}
                <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-xs border border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Ara Toplam:</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Hesaplanan KDV (%20 dahil):</span>
                    <span>₺{taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Ödenecek Tutar:</span>
                    <span className="text-cyan-600">₺{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleFinalizeSale}
                  disabled={cart.length === 0}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Satışı Tamamla, Fiş Bas & Pazaryeri Stoklarını Düş</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View 2: Past Receipts History */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Perakende Kasa Satış Geçmişi</h3>
              <p className="text-xs text-slate-500">Fiziki dükkandan ve depodan kesilen son satış fişleri</p>
            </div>
            <button 
              onClick={() => alert('Gün Sonu Z Raporu oluşturuldu ve muhasebe sistemine aktarıldı.')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Gün Sonu Z Raporu Yazdır</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Fiş No</th>
                  <th className="p-3 font-semibold">Tarih / Saat</th>
                  <th className="p-3 font-semibold">Müşteri</th>
                  <th className="p-3 font-semibold">Ödeme Türü</th>
                  <th className="p-3 font-semibold">Satılan Kalemler</th>
                  <th className="p-3 font-semibold text-right">Toplam Tutar</th>
                  <th className="p-3 font-semibold text-center">Stok Senkronizasyonu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{rec.receiptNumber}</td>
                    <td className="p-3 text-slate-500">{rec.saleTime}</td>
                    <td className="p-3 font-medium text-slate-800">{rec.customerName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.paymentMethod === 'CREDIT_CARD' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {rec.paymentMethod === 'CREDIT_CARD' ? 'Kredi Kartı' : 'Nakit'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {rec.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      ₺{rec.grandTotal.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Pazaryerleri Eşitlendi
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {lastCompletedReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">Satış Başarıyla Tamamlandı</h4>
              <span className="text-xs text-slate-500 font-mono">Fiş No: {lastCompletedReceipt.receiptNumber}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1 font-mono">
              <div className="text-center font-bold text-slate-800 pb-1 border-b border-slate-200">
                TRENDMODA RESMİ SATIŞ FİŞİ
              </div>
              {lastCompletedReceipt.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.quantity}x {i.name.slice(0, 20)}...</span>
                  <span className="font-bold">₺{i.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900">
                <span>TOPLAM:</span>
                <span>₺{lastCompletedReceipt.grandTotal.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-emerald-700 text-center pt-1">
                ✓ Trendyol, HB, N11, ikas stokları eşzamanlı düşürüldü
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Termal Fiş Yazdır</span>
              </button>
              <button
                onClick={() => setLastCompletedReceipt(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
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
