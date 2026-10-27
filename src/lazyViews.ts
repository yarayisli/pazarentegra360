import { lazy } from "react";

// Each screen is its own chunk; the main bundle only carries the shell.
export const OrdersView = lazy(() => import("./components/OrdersView").then((m) => ({ default: m.OrdersView })));
export const CargoOperationsView = lazy(() =>
  import("./components/CargoOperationsView").then((m) => ({ default: m.CargoOperationsView })),
);
export const CustomerCommunicationView = lazy(() =>
  import("./components/CustomerCommunicationView").then((m) => ({ default: m.CustomerCommunicationView })),
);
export const InventorySyncView = lazy(() =>
  import("./components/InventorySyncView").then((m) => ({ default: m.InventorySyncView })),
);
export const FinanceAnalyticsView = lazy(() =>
  import("./components/FinanceAnalyticsView").then((m) => ({ default: m.FinanceAnalyticsView })),
);
export const ApiSettingsAndSaasView = lazy(() =>
  import("./components/ApiSettingsAndSaasView").then((m) => ({ default: m.ApiSettingsAndSaasView })),
);
export const EventStoreAndReconciliationView = lazy(() =>
  import("./components/EventStoreAndReconciliationView").then((m) => ({ default: m.EventStoreAndReconciliationView })),
);
export const ReturnsManagementView = lazy(() =>
  import("./components/ReturnsManagementView").then((m) => ({ default: m.ReturnsManagementView })),
);
export const SKUProfitabilityView = lazy(() =>
  import("./components/SKUProfitabilityView").then((m) => ({ default: m.SKUProfitabilityView })),
);
export const StockForecastView = lazy(() =>
  import("./components/StockForecastView").then((m) => ({ default: m.StockForecastView })),
);
export const WMSWarehouseManagementView = lazy(() =>
  import("./components/WMSWarehouseManagementView").then((m) => ({ default: m.WMSWarehouseManagementView })),
);
export const BuyboxRepricerView = lazy(() =>
  import("./components/BuyboxRepricerView").then((m) => ({ default: m.BuyboxRepricerView })),
);
export const SettlementAuditView = lazy(() =>
  import("./components/SettlementAuditView").then((m) => ({ default: m.SettlementAuditView })),
);
export const SmartPackagingOptimizerView = lazy(() =>
  import("./components/SmartPackagingOptimizerView").then((m) => ({ default: m.SmartPackagingOptimizerView })),
);
export const POSTerminalRetailView = lazy(() =>
  import("./components/POSTerminalRetailView").then((m) => ({ default: m.POSTerminalRetailView })),
);
export const OrderPackageDetailModal = lazy(() =>
  import("./components/OrderPackageDetailModal").then((m) => ({ default: m.OrderPackageDetailModal })),
);
export const ShippingLabelModal = lazy(() =>
  import("./components/ShippingLabelModal").then((m) => ({ default: m.ShippingLabelModal })),
);
export const AICopilotModal = lazy(() =>
  import("./components/AICopilotModal").then((m) => ({ default: m.AICopilotModal })),
);
export const PendingActionsView = lazy(() =>
  import("./components/PendingActionsView").then((m) => ({ default: m.PendingActionsView })),
);
