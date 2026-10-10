// Simulates scanning marketplace APIs for the last 3-hour window to find drift/missing webhooks.
export function runReconciliation() {
  const sampleDiscrepancies = [
    {
      orderId: 914028471,
      orderNumber: "9482019481",
      marketplace: "trendyol",
      localStatus: "Created",
      remoteStatus: "Picking",
      detectedAt: Date.now(),
      resolutionStatus: "RESOLVED",
      reason: "Trendyol kargo barkodu basıldı ancak webhook bağlantı kesintisi nedeniyle gecikti.",
    },
    {
      orderId: 914028475,
      orderNumber: "9482019310",
      marketplace: "trendyol",
      localStatus: "Shipped",
      remoteStatus: "Delivered",
      detectedAt: Date.now() - 900000,
      resolutionStatus: "RESOLVED",
      reason: "Trendyol Express teslimat webhook'u 35 dk önce gecikmişti, reconciliation yakaladı.",
    },
  ];

  return {
    scannedTimeWindow: "Son 3 Saat (Delta Query)",
    totalScanned: 142,
    discrepanciesFound: sampleDiscrepancies.length,
    discrepancies: sampleDiscrepancies,
    reconciledAt: new Date().toISOString(),
  };
}
