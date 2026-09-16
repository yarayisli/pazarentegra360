import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { OrdersView } from './components/OrdersView';
import { CargoOperationsView } from './components/CargoOperationsView';
import { CustomerCommunicationView } from './components/CustomerCommunicationView';
import { InventorySyncView } from './components/InventorySyncView';
import { FinanceAnalyticsView } from './components/FinanceAnalyticsView';
import { ApiSettingsAndSaasView } from './components/ApiSettingsAndSaasView';
import { OrderPackageDetailModal } from './components/OrderPackageDetailModal';
import { ShippingLabelModal } from './components/ShippingLabelModal';
import { EventStoreAndReconciliationView } from './components/EventStoreAndReconciliationView';
import { ReturnsManagementView } from './components/ReturnsManagementView';
import { SKUProfitabilityView } from './components/SKUProfitabilityView';
import { StockForecastView } from './components/StockForecastView';
import { AICopilotModal } from './components/AICopilotModal';
import { WMSWarehouseManagementView } from './components/WMSWarehouseManagementView';
import { BuyboxRepricerView } from './components/BuyboxRepricerView';
import { SettlementAuditView } from './components/SettlementAuditView';
import { SmartPackagingOptimizerView } from './components/SmartPackagingOptimizerView';
import { POSTerminalRetailView } from './components/POSTerminalRetailView';
import { 
  INITIAL_PACKAGES, 
  INITIAL_PRODUCTS, 
  INITIAL_QUESTIONS, 
  INITIAL_CREDENTIALS,
  INITIAL_RETURNS,
  INITIAL_PROFITABILITY,
  INITIAL_FORECASTS,
  INITIAL_WAREHOUSE_LOCATIONS,
  INITIAL_WAREHOUSE_PRODUCTS,
  INITIAL_PICKING_WAVES,
  INITIAL_BUYBOX_ITEMS,
  INITIAL_SETTLEMENT_AUDITS,
  INITIAL_PACKAGING_BOXES,
  INITIAL_PACKING_PLANS,
  INITIAL_REVIEWS,
  INITIAL_POS_RECEIPTS
} from './data/mockData';
import { 
  ShipmentPackage, 
  ProductItem, 
  CustomerQuestion, 
  MarketplaceCredentials, 
  PackageStatus,
  ReturnRecord,
  SKUProfitability,
  StockDemandForecast,
  WarehouseLocation,
  ProductWarehouseDetail,
  PickingBatchWave,
  BuyboxMonitorItem,
  SettlementAuditRecord,
  StandardPackagingBox,
  PackingPlanResult,
  ProductReviewItem,
  POSSaleReceipt
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [activeStore, setActiveStore] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Core Datasets
  const [packages, setPackages] = useState<ShipmentPackage[]>(() => {
    const saved = localStorage.getItem('pe360_packages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PACKAGES;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('pe360_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  });

  const [questions, setQuestions] = useState<CustomerQuestion[]>(() => {
    const saved = localStorage.getItem('pe360_questions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_QUESTIONS;
  });

  const [credentials, setCredentials] = useState<MarketplaceCredentials>(() => {
    const saved = localStorage.getItem('pe360_creds');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_CREDENTIALS;
  });

  const [returns, setReturns] = useState<ReturnRecord[]>(() => {
    const saved = localStorage.getItem('pe360_returns');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_RETURNS;
  });

  const [profitability, setProfitability] = useState<SKUProfitability[]>(() => {
    const saved = localStorage.getItem('pe360_profitability');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PROFITABILITY;
  });

  const [forecasts, setForecasts] = useState<StockDemandForecast[]>(() => {
    const saved = localStorage.getItem('pe360_forecasts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_FORECASTS;
  });

  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>(() => {
    const saved = localStorage.getItem('pe360_wh_locations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_WAREHOUSE_LOCATIONS;
  });

  const [warehouseProducts, setWarehouseProducts] = useState<ProductWarehouseDetail[]>(() => {
    const saved = localStorage.getItem('pe360_wh_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_WAREHOUSE_PRODUCTS;
  });

  const [pickingWaves, setPickingWaves] = useState<PickingBatchWave[]>(() => {
    const saved = localStorage.getItem('pe360_wh_waves');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PICKING_WAVES;
  });

  const [buyboxItems, setBuyboxItems] = useState<BuyboxMonitorItem[]>(() => {
    const saved = localStorage.getItem('pe360_buybox_items');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_BUYBOX_ITEMS;
  });

  const [settlementAudits, setSettlementAudits] = useState<SettlementAuditRecord[]>(() => {
    const saved = localStorage.getItem('pe360_settlement_audits');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SETTLEMENT_AUDITS;
  });

  const [packagingBoxes, setPackagingBoxes] = useState<StandardPackagingBox[]>(() => {
    const saved = localStorage.getItem('pe360_packaging_boxes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PACKAGING_BOXES;
  });

  const [packingPlans, setPackingPlans] = useState<PackingPlanResult[]>(() => {
    const saved = localStorage.getItem('pe360_packing_plans');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PACKING_PLANS;
  });

  const [reviews, setReviews] = useState<ProductReviewItem[]>(() => {
    const saved = localStorage.getItem('pe360_product_reviews');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_REVIEWS;
  });

  const [posReceipts, setPosReceipts] = useState<POSSaleReceipt[]>(() => {
    const saved = localStorage.getItem('pe360_pos_receipts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_POS_RECEIPTS;
  });

  // Copilot modal state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Modals state
  const [inspectingPackage, setInspectingPackage] = useState<ShipmentPackage | null>(null);
  const [printingPackage, setPrintingPackage] = useState<ShipmentPackage | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('pe360_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('pe360_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pe360_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('pe360_creds', JSON.stringify(credentials));
  }, [credentials]);

  useEffect(() => {
    localStorage.setItem('pe360_returns', JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem('pe360_profitability', JSON.stringify(profitability));
  }, [profitability]);

  useEffect(() => {
    localStorage.setItem('pe360_forecasts', JSON.stringify(forecasts));
  }, [forecasts]);

  useEffect(() => {
    localStorage.setItem('pe360_wh_locations', JSON.stringify(warehouseLocations));
  }, [warehouseLocations]);

  useEffect(() => {
    localStorage.setItem('pe360_wh_products', JSON.stringify(warehouseProducts));
  }, [warehouseProducts]);

  useEffect(() => {
    localStorage.setItem('pe360_wh_waves', JSON.stringify(pickingWaves));
  }, [pickingWaves]);

  useEffect(() => {
    localStorage.setItem('pe360_buybox_items', JSON.stringify(buyboxItems));
  }, [buyboxItems]);

  useEffect(() => {
    localStorage.setItem('pe360_settlement_audits', JSON.stringify(settlementAudits));
  }, [settlementAudits]);

  useEffect(() => {
    localStorage.setItem('pe360_packaging_boxes', JSON.stringify(packagingBoxes));
  }, [packagingBoxes]);

  useEffect(() => {
    localStorage.setItem('pe360_packing_plans', JSON.stringify(packingPlans));
  }, [packingPlans]);

  useEffect(() => {
    localStorage.setItem('pe360_product_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('pe360_pos_receipts', JSON.stringify(posReceipts));
  }, [posReceipts]);

  // Filter packages based on active store if selected in header
  const storeFilteredPackages = packages.filter((p) => {
    if (activeStore === 'all') return true;
    return p.marketplace === activeStore;
  });

  // Manual Sync trigger
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      // Feedback
      alert('Tüm pazaryerleri (Trendyol SAPIGW, Hepsiburada, N11) başarıyla tarandı. 0 yeni sipariş, tüm kargo statüleri güncellendi.');
    }, 1200);
  };

  // Update Package Status
  const handleUpdateStatus = (id: number, newStatus: PackageStatus) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === id) {
          const updatedHistory = [
            ...pkg.packageHistories,
            {
              createdDate: Date.now(),
              status: newStatus,
              description: `Durum '${newStatus}' olarak güncellendi (PazarEntegra API Gateway).`,
            },
          ];
          const updated = {
            ...pkg,
            packageStatus: newStatus,
            packageHistories: updatedHistory,
          };
          if (inspectingPackage && inspectingPackage.id === id) {
            setInspectingPackage(updated);
          }
          return updated;
        }
        return pkg;
      })
    );
  };

  // Bulk Picking
  const handleBulkPicking = (ids: number[]) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (ids.includes(pkg.id) && pkg.packageStatus === 'Created') {
          return {
            ...pkg,
            packageStatus: 'Picking',
            packageHistories: [
              ...pkg.packageHistories,
              {
                createdDate: Date.now(),
                status: 'Picking',
                description: 'Toplu sipariş toplama listesine aktarıldı.',
              },
            ],
          };
        }
        return pkg;
      })
    );
  };

  // Bulk Print Labels
  const handleBulkPrintLabels = (pkgs: ShipmentPackage[]) => {
    if (pkgs.length > 0) {
      setPrintingPackage(pkgs[0]);
    }
  };

  // Split Package (Trendyol split-packages API)
  const handleSplitPackage = (pkg: ShipmentPackage, lineIdToSplit: string) => {
    const lineToSplit = pkg.lines.find((l) => l.id === lineIdToSplit);
    if (!lineToSplit) return;

    const remainingLines = pkg.lines.filter((l) => l.id !== lineIdToSplit);
    const newPkgId = Math.floor(900000000 + Math.random() * 90000000);

    const newPackage: ShipmentPackage = {
      ...pkg,
      id: newPkgId,
      packetNumber: `PK-TY-${newPkgId}`,
      cargoTrackingNumber: `TY${Math.floor(70000000000 + Math.random() * 20000000000)}`,
      cargoBarcode: `TY${newPkgId}SPLIT`,
      grossAmount: lineToSplit.price * lineToSplit.quantity,
      totalPrice: lineToSplit.price * lineToSplit.quantity,
      lines: [lineToSplit],
      packageHistories: [
        {
          createdDate: Date.now(),
          status: pkg.packageStatus,
          description: `Paket #${pkg.id} numarasından split-packages API ile bölündü.`,
        },
      ],
    };

    const updatedOriginalPkg: ShipmentPackage = {
      ...pkg,
      lines: remainingLines,
      grossAmount: pkg.grossAmount - lineToSplit.price * lineToSplit.quantity,
      totalPrice: pkg.totalPrice - lineToSplit.price * lineToSplit.quantity,
      packageHistories: [
        ...pkg.packageHistories,
        {
          createdDate: Date.now(),
          status: pkg.packageStatus,
          description: `Paketten '${lineToSplit.productName}' ayrıldı ve yeni paket #${newPkgId} oluşturuldu.`,
        },
      ],
    };

    setPackages((prev) => [
      newPackage,
      ...prev.map((p) => (p.id === pkg.id ? updatedOriginalPkg : p)),
    ]);

    setInspectingPackage(updatedOriginalPkg);
    alert(`Paket #${pkg.id} başarıyla bölündü! Yeni paket #${newPkgId} oluşturuldu.`);
  };

  // Answer Customer Question
  const handleAnswerQuestion = (questionId: string, answerText: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            status: 'ANSWERED',
            answer: answerText,
            answeredAt: 'Az önce',
          };
        }
        return q;
      })
    );
    alert('Müşteri yanıtı Trendyol / Pazaryeri API üzerinden başarıyla iletildi!');
  };

  // Update Review (Reputation & Compensation)
  const handleUpdateReview = (updatedReview: ProductReviewItem) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === updatedReview.id ? updatedReview : r))
    );
  };

  // Complete POS Retail Sale & Deduct Stock Across All Channels
  const handleCompletePOSSale = (newReceipt: POSSaleReceipt, updatedProducts: ProductItem[]) => {
    setPosReceipts((prev) => [newReceipt, ...prev]);
    setProducts(updatedProducts);
  };

  // Update Inventory Stock
  const handleUpdateStock = (productId: string, newTotalStock: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          const ratio = newTotalStock / (prod.totalStock || 1);
          return {
            ...prod,
            totalStock: newTotalStock,
            channels: {
              trendyol: {
                ...prod.channels.trendyol,
                stock: Math.round(prod.channels.trendyol.stock * ratio),
                lastSync: 'Az önce',
              },
              hepsiburada: {
                ...prod.channels.hepsiburada,
                stock: Math.round(prod.channels.hepsiburada.stock * ratio),
                lastSync: 'Az önce',
              },
              n11: {
                ...prod.channels.n11,
                stock: Math.round(prod.channels.n11.stock * ratio),
                lastSync: 'Az önce',
              },
            },
          };
        }
        return prod;
      })
    );
  };

  // Cross-Channel Sale Simulation
  const handleSimulateChannelSale = (
    productId: string,
    channel: 'trendyol' | 'hepsiburada' | 'n11'
  ) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          if (prod.totalStock <= 0) {
            alert('Ürün tükendi! Satış yapılamaz.');
            return prod;
          }
          const newTotal = prod.totalStock - 1;
          return {
            ...prod,
            totalStock: newTotal,
            channels: {
              trendyol: {
                ...prod.channels.trendyol,
                stock: Math.max(0, prod.channels.trendyol.stock - (channel === 'trendyol' ? 1 : 0)),
                lastSync: 'Az önce (Stok Kilitlendi)',
              },
              hepsiburada: {
                ...prod.channels.hepsiburada,
                stock: Math.max(0, prod.channels.hepsiburada.stock - (channel === 'hepsiburada' ? 1 : 0)),
                lastSync: 'Az önce (Stok Kilitlendi)',
              },
              n11: {
                ...prod.channels.n11,
                stock: Math.max(0, prod.channels.n11.stock - (channel === 'n11' ? 1 : 0)),
                lastSync: 'Az önce (Stok Kilitlendi)',
              },
            },
          };
        }
        return prod;
      })
    );
    alert(
      `Otomasyon: ${channel.toUpperCase()} kanalında 1 adet satış gerçekleşti! Çapraz kanal stok senkronizasyonu tetiklendi ve diğer tüm pazaryerlerinde stok anında güncellendi.`
    );
  };

  // Sync all channels
  const handleSyncAllChannels = () => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        channels: {
          trendyol: { ...p.channels.trendyol, lastSync: 'Şimdi eşitlendi' },
          hepsiburada: { ...p.channels.hepsiburada, lastSync: 'Şimdi eşitlendi' },
          n11: { ...p.channels.n11, lastSync: 'Şimdi eşitlendi' },
        },
      }))
    );
    alert('Tüm kanallardaki stok ve fiyat bilgileri Trendyol, Hepsiburada ve N11 ile eşitlendi.');
  };

  // Return update
  const handleUpdateReturn = (updated: ReturnRecord) => {
    setReturns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Restock product from return
  const handleRestockProduct = (barcode: string, qty: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.barcode === barcode) {
          return {
            ...p,
            totalStock: p.totalStock + qty,
            channels: {
              ...p.channels,
              trendyol: { ...p.channels.trendyol, stock: p.channels.trendyol.stock + qty },
              hepsiburada: { ...p.channels.hepsiburada, stock: p.channels.hepsiburada.stock + qty },
              n11: { ...p.channels.n11, stock: p.channels.n11.stock + qty },
            },
          };
        }
        return p;
      })
    );
  };

  // Update Pricing
  const handleUpdatePricing = (sku: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === sku) {
          return {
            ...p,
            basePrice: newPrice,
            channels: {
              ...p.channels,
              trendyol: { ...p.channels.trendyol, price: newPrice },
              hepsiburada: { ...p.channels.hepsiburada, price: newPrice },
              n11: { ...p.channels.n11, price: newPrice },
            },
          };
        }
        return p;
      })
    );
  };

  // Create PO
  const handleCreatePO = (sku: string, qty: number) => {
    setForecasts((prev) =>
      prev.map((f) => (f.sku === sku ? { ...f, currentStock: f.currentStock + qty, suggestedReorderQty: 0, riskLevel: 'OPTIMAL' } : f))
    );
  };

  // WMS Handlers
  const handleUpdateWave = (updatedWave: PickingBatchWave) => {
    setPickingWaves((prev) => prev.map((w) => (w.id === updatedWave.id ? updatedWave : w)));
  };

  const handleUpdateProductLocation = (sku: string, newBin: string) => {
    setWarehouseProducts((prev) =>
      prev.map((p) => (p.sku === sku ? { ...p, locationBin: newBin } : p))
    );
  };

  // Buybox Repricer Handlers
  const handleUpdateBuyboxStrategy = (
    id: string,
    strategy: BuyboxMonitorItem['strategy'],
    autoReprice: boolean
  ) => {
    setBuyboxItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, strategy, autoRepriceEnabled: autoReprice } : item
      )
    );
  };

  const handleApplyBuyboxReprice = (id: string, newPrice: number) => {
    const item = buyboxItems.find((b) => b.id === id);
    if (!item) return;

    // Update buybox item state
    setBuyboxItems((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              myCurrentPrice: newPrice,
              isWinningBuybox: true,
              lastRepricedAt: Date.now(),
              priceHistory: [
                { timestamp: Date.now(), price: newPrice, trigger: 'Repricer Uygulandı' },
                ...b.priceHistory,
              ],
            }
          : b
      )
    );

    // Also sync the price to catalog products
    handleUpdatePricing(item.sku, newPrice);
  };

  // Settlement Audit Handler
  const handleUpdateSettlementRecord = (record: SettlementAuditRecord) => {
    setSettlementAudits((prev) => prev.map((r) => (r.id === record.id ? record : r)));
  };

  // Urgent counts for badges
  const pendingOrdersCount = packages.filter((p) =>
    ['Created', 'Picking'].includes(p.packageStatus)
  ).length;

  const urgentSlaCount = packages.filter((p) => {
    const diffHours = (p.agreedDeliveryDate - Date.now()) / (3600 * 1000);
    return ['Created', 'Picking', 'Invoiced'].includes(p.packageStatus) && diffHours <= 6;
  }).length;

  const waitingQuestionsCount = questions.filter((q) => q.status === 'WAITING').length;
  const pendingReturnsCount = returns.filter((r) => r.status === 'ARRIVED_AT_WAREHOUSE').length;
  const lossMakingSkuCount = profitability.filter((p) => p.isLossMaking).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header */}
      <Header
        credentials={credentials}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        activeStore={activeStore}
        onChangeStore={setActiveStore}
        unreadQuestionsCount={waitingQuestionsCount}
        onOpenQuestions={() => setActiveTab('questions')}
      />

      {/* Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingOrdersCount={pendingOrdersCount}
        urgentSlaCount={urgentSlaCount}
        waitingQuestionsCount={waitingQuestionsCount}
        pendingReturnsCount={pendingReturnsCount}
        lossMakingSkuCount={lossMakingSkuCount}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'orders' && (
          <OrdersView
            packages={storeFilteredPackages}
            onOpenDetail={setInspectingPackage}
            onPrintLabel={setPrintingPackage}
            onUpdateStatus={handleUpdateStatus}
            onBulkPicking={handleBulkPicking}
            onBulkPrintLabels={handleBulkPrintLabels}
          />
        )}

        {activeTab === 'wms' && (
          <WMSWarehouseManagementView
            locations={warehouseLocations}
            products={warehouseProducts}
            waves={pickingWaves}
            onUpdateWave={handleUpdateWave}
            onUpdateProductLocation={handleUpdateProductLocation}
          />
        )}

        {activeTab === 'packaging' && (
          <SmartPackagingOptimizerView
            boxes={packagingBoxes}
            plans={packingPlans}
            packages={storeFilteredPackages}
            onUpdateBoxes={setPackagingBoxes}
          />
        )}

        {activeTab === 'pos' && (
          <POSTerminalRetailView
            products={products}
            receipts={posReceipts}
            onCompleteSale={handleCompletePOSSale}
          />
        )}

        {activeTab === 'buybox' && (
          <BuyboxRepricerView
            items={buyboxItems}
            onUpdateStrategy={handleUpdateBuyboxStrategy}
            onApplyReprice={handleApplyBuyboxReprice}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementAuditView
            records={settlementAudits}
            onUpdateRecord={handleUpdateSettlementRecord}
          />
        )}

        {activeTab === 'reconciliation' && (
          <EventStoreAndReconciliationView
            packages={storeFilteredPackages}
            onUpdatePackageStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'returns' && (
          <ReturnsManagementView
            returns={returns}
            products={products}
            onUpdateReturn={handleUpdateReturn}
            onRestockProduct={handleRestockProduct}
          />
        )}

        {activeTab === 'profitability' && (
          <SKUProfitabilityView
            profitabilityData={profitability}
            onUpdatePricing={handleUpdatePricing}
          />
        )}

        {activeTab === 'forecast' && (
          <StockForecastView
            forecasts={forecasts}
            products={products}
            onCreatePO={handleCreatePO}
          />
        )}

        {activeTab === 'warehouse' && (
          <CargoOperationsView
            packages={storeFilteredPackages}
            onOpenLabel={setPrintingPackage}
            onMarkShipped={(id) => handleUpdateStatus(id, 'Shipped')}
          />
        )}

        {activeTab === 'questions' && (
          <CustomerCommunicationView
            questions={questions}
            reviews={reviews}
            onAnswerQuestion={handleAnswerQuestion}
            onUpdateReview={handleUpdateReview}
          />
        )}

        {activeTab === 'inventory' && (
          <InventorySyncView
            products={products}
            onUpdateStock={handleUpdateStock}
            onSimulateChannelSale={handleSimulateChannelSale}
            onSyncAllChannels={handleSyncAllChannels}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceAnalyticsView
            packages={packages}
            products={products}
          />
        )}

        {activeTab === 'saas' && (
          <ApiSettingsAndSaasView
            credentials={credentials}
            onUpdateCredentials={setCredentials}
          />
        )}
      </main>

      {/* Footer info */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">PazarEntegra 360</span>
            <span>•</span>
            <span>Trendyol Supplier API getShipmentPackages Entegre</span>
            <span>•</span>
            <span>Google Gemini 3.8 Flash AI Q&A</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-500">
            <span>SaaS Lisanslı Sürüm</span>
            <span>Gizlilik & KVKK</span>
            <span>API Durumu: %99.99 Uptime</span>
          </div>
        </div>
      </footer>

      {/* AI Copilot Interactive Modal */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Package Inspector Modal */}
      {inspectingPackage && (
        <OrderPackageDetailModal
          pkg={inspectingPackage}
          onClose={() => setInspectingPackage(null)}
          onUpdateStatus={handleUpdateStatus}
          onPrintLabel={(p) => setPrintingPackage(p)}
          onSplitPackage={handleSplitPackage}
        />
      )}

      {/* Thermal Shipping Label Modal */}
      {printingPackage && (
        <ShippingLabelModal
          pkg={printingPackage}
          onClose={() => setPrintingPackage(null)}
          onMarkInvoicedOrShipped={(id) => handleUpdateStatus(id, 'Invoiced')}
        />
      )}

    </div>
  );
}
