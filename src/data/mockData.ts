import { 
  ShipmentPackage, 
  ProductItem, 
  CustomerQuestion, 
  MarketplaceCredentials,
  ProductWarehouseDetail,
  PickingBatchWave,
  WarehouseLocation,
  BuyboxMonitorItem,
  SettlementAuditRecord,
  StandardPackagingBox,
  PackingPlanResult,
  ProductReviewItem,
  POSSaleReceipt
} from '../types';

export const INITIAL_CREDENTIALS: MarketplaceCredentials = {
  trendyol: {
    supplierId: "149208",
    apiKey: "ty_live_k7x9029a1b94",
    apiSecret: "ty_sec_9940281ba82e0911",
    isConnected: true,
    autoPicking: true,
    autoInvoice: false,
    testMode: false,
    webhookActive: true,
    storeName: "TrendModa Store (Trendyol Entegre)",
  },
  hepsiburada: {
    merchantId: "hb-9102-3921",
    serviceKey: "hb_srv_882910fa8820",
    isConnected: true,
    autoInvoice: true,
    testMode: false,
    storeName: "TrendModa HB Resmi Satıcı",
  },
  n11: {
    appKey: "n11_app_77491028",
    appSecret: "n11_sec_aa992100",
    isConnected: true,
    autoInvoice: false,
    testMode: false,
    storeName: "TrendModa N11 Dükkanı",
  },
  ikas: {
    storeDomain: "trendmoda.myikas.com",
    apiClientId: "ikas_client_89104820",
    apiClientSecret: "ikas_sec_993019ab0011",
    isConnected: true,
    syncInventory: true,
    syncOrders: true,
    storeName: "TrendModa Kendi Web Sitemiz (ikas DTC)",
  }
};

const now = Date.now();
const hour = 3600 * 1000;

export const INITIAL_PACKAGES: ShipmentPackage[] = [
  {
    id: 914028471,
    orderNumber: "9482019481",
    packetNumber: "PK-TY-914028471",
    marketplace: "trendyol",
    packageStatus: "Created",
    customerFirstName: "Burak",
    customerLastName: "Yılmaz",
    customerId: "CUST-49102",
    customerEmail: "burak.yilmaz@example.com",
    grossAmount: 1850.00,
    totalDiscount: 150.00,
    totalPrice: 1700.00,
    cargoProviderName: "Trendyol Express",
    cargoTrackingNumber: "TY73910294820",
    cargoTrackingLink: "https://kargotakip.trendyol.com/?trackingNumber=TY73910294820",
    cargoBarcode: "TY914028471TEX",
    orderDate: now - (2 * hour),
    agreedDeliveryDate: now + (6 * hour), // Son kargolama 6 saat kaldı!
    fastDelivery: true,
    taxNumber: "38920194821",
    shipmentAddress: {
      fullName: "Burak Yılmaz",
      address1: "Acıbadem Mah. Çeçen Sok. Akasya Kule A Blok No:24 D:108",
      district: "Üsküdar",
      city: "İstanbul",
      postalCode: "34660",
      phone: "+90 532 411 90 28"
    },
    invoiceAddress: {
      fullName: "Burak Yılmaz",
      address1: "Acıbadem Mah. Çeçen Sok. Akasya Kule A Blok No:24 D:108",
      district: "Üsküdar",
      city: "İstanbul",
      postalCode: "34660",
      phone: "+90 532 411 90 28"
    },
    lines: [
      {
        id: "line-1",
        lineId: 1049281,
        productName: "AirFlow Pro Kablosuz Bluetooth 5.3 ANC Kulaklık - Mat Siyah",
        barcode: "8680019284019",
        merchantSku: "SKU-AUDIO-AF01-BLK",
        quantity: 1,
        price: 1350.00,
        vatBaseAmount: 225.00,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"
      },
      {
        id: "line-2",
        lineId: 1049282,
        productName: "Silikon Koruma Kılıfı & Askı Aparatı - Siyah",
        barcode: "8680019284088",
        merchantSku: "SKU-AUDIO-CASE-BLK",
        quantity: 1,
        price: 350.00,
        vatBaseAmount: 58.33,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200&h=200&fit=crop"
      }
    ],
    packageHistories: [
      {
        createdDate: now - (2 * hour),
        status: "Created",
        description: "Sipariş pazaryerinde oluşturuldu ve PazarEntegra sistemine senkronize edildi."
      }
    ]
  },
  {
    id: 914028479,
    orderNumber: "IKAS-10492",
    packetNumber: "PK-IKAS-10492",
    marketplace: "ikas",
    packageStatus: "Created",
    customerFirstName: "Ahmet",
    customerLastName: "Demir",
    customerId: "CUST-IKAS-901",
    customerEmail: "ahmet.demir@gmail.com",
    grossAmount: 3499.00,
    totalDiscount: 350.00,
    totalPrice: 3149.00,
    cargoProviderName: "ikas Kargo (Yurtiçi)",
    cargoTrackingNumber: "YK8820194812",
    cargoTrackingLink: "https://yurticikargo.com/takip/YK8820194812",
    cargoBarcode: "IKAS10492YK",
    orderDate: now - (1 * hour),
    agreedDeliveryDate: now + (24 * hour),
    fastDelivery: true,
    commercialBoxCode: "KOLI-S",
    shipmentAddress: {
      fullName: "Ahmet Demir",
      address1: "Bağdat Caddesi No:142 D:8",
      city: "İstanbul",
      district: "Kadıköy",
      postalCode: "34728",
      phone: "+90 532 111 2233"
    },
    invoiceAddress: {
      fullName: "Ahmet Demir",
      address1: "Bağdat Caddesi No:142 D:8",
      city: "İstanbul",
      district: "Kadıköy",
      postalCode: "34728",
      phone: "+90 532 111 2233"
    },
    lines: [
      {
        id: "line-ikas-1",
        lineId: 9810,
        productName: "Titanium Akıllı Saat 49mm Siyah",
        merchantSku: "SKU-WATCH-ULTRA-BLK",
        barcode: "8680001002002",
        quantity: 1,
        price: 3149.00,
        vatBaseAmount: 2624.17,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
        picked: false
      }
    ],
    packageHistories: [
      {
        createdDate: now - (1 * hour),
        status: "Created",
        description: "ikas Web Mağazasından sipariş alındı. Pazaryeri komisyonsuz doğrudan DTC satışı."
      }
    ]
  },
  {
    id: 914028472,
    orderNumber: "HB-74920194",
    packetNumber: "PK-HB-914028472",
    marketplace: "hepsiburada",
    packageStatus: "Picking",
    customerFirstName: "Selin",
    customerLastName: "Kaya",
    customerId: "CUST-88192",
    customerEmail: "selin.kaya@example.com",
    grossAmount: 2899.00,
    totalDiscount: 200.00,
    totalPrice: 2699.00,
    cargoProviderName: "HepsiJET",
    cargoTrackingNumber: "HJ8491028491",
    cargoTrackingLink: "https://hepsijet.com/kargo-takip?no=HJ8491028491",
    cargoBarcode: "HB914028472JET",
    orderDate: now - (5 * hour),
    agreedDeliveryDate: now + (3 * hour), // Kritik SLA: 3 saat kaldı!
    fastDelivery: true,
    invoiceNumber: "GIB202600004128",
    invoiceSerial: "E-ARSIV",
    invoiceDate: new Date(now - 1 * hour).toISOString().slice(0, 10),
    shipmentAddress: {
      fullName: "Selin Kaya",
      address1: "Alsancak Mah. Atatürk Cad. No:184 K:4 D:12",
      district: "Konak",
      city: "İzmir",
      postalCode: "35220",
      phone: "+90 544 382 10 99"
    },
    invoiceAddress: {
      fullName: "Selin Kaya",
      address1: "Alsancak Mah. Atatürk Cad. No:184 K:4 D:12",
      district: "Konak",
      city: "İzmir",
      postalCode: "35220",
      phone: "+90 544 382 10 99"
    },
    lines: [
      {
        id: "line-3",
        lineId: 1049283,
        productName: "Ergonomik Alüminyum Laptop Standı - 360 Döner Tablalı",
        barcode: "8680019284026",
        merchantSku: "SKU-DESK-STND-ALU",
        quantity: 1,
        price: 1499.00,
        vatBaseAmount: 249.83,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop",
        picked: true
      },
      {
        id: "line-4",
        lineId: 1049284,
        productName: "Mekanik RGB Kompakt Klavye %75 - Red Switch Türkçe Q",
        barcode: "8680019284033",
        merchantSku: "SKU-TECH-KB75-TR",
        quantity: 1,
        price: 1200.00,
        vatBaseAmount: 200.00,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&h=200&fit=crop",
        picked: true
      }
    ],
    packageHistories: [
      {
        createdDate: now - (5 * hour),
        status: "Created",
        description: "Hepsiburada siparişi alındı."
      },
      {
        createdDate: now - (2 * hour),
        status: "Picking",
        description: "Depoda toplama listesine eklendi ve barkodları okutuldu."
      }
    ]
  },
  {
    id: 914028473,
    orderNumber: "N11-20948190",
    packetNumber: "PK-N11-914028473",
    marketplace: "n11",
    packageStatus: "Invoiced",
    customerFirstName: "Mehmet",
    customerLastName: "Demir",
    customerId: "CUST-10491",
    customerEmail: "mehmet.demir@example.com",
    grossAmount: 3450.00,
    totalDiscount: 0.00,
    totalPrice: 3450.00,
    cargoProviderName: "Aras Kargo",
    cargoTrackingNumber: "AR48192039120",
    cargoTrackingLink: "https://araskargo.com.tr/kargom-nerede?code=AR48192039120",
    cargoBarcode: "N11914028473ARAS",
    orderDate: now - (14 * hour),
    agreedDeliveryDate: now + (18 * hour),
    fastDelivery: false,
    invoiceNumber: "GIB202600004129",
    invoiceSerial: "E-FATURA",
    invoiceDate: new Date(now - 4 * hour).toISOString().slice(0, 10),
    shipmentAddress: {
      fullName: "Mehmet Demir",
      address1: "Çukurambar Mah. 1425. Cad. No:8 D:14",
      district: "Çankaya",
      city: "Ankara",
      postalCode: "06510",
      phone: "+90 533 902 44 11"
    },
    invoiceAddress: {
      fullName: "Demir İnşaat ve Mimarlık Ltd. Şti.",
      address1: "Çukurambar Mah. 1425. Cad. No:8 D:14",
      district: "Çankaya",
      city: "Ankara",
      postalCode: "06510",
      phone: "+90 533 902 44 11"
    },
    lines: [
      {
        id: "line-5",
        lineId: 1049285,
        productName: "100W GaN 4 Portlu Hızlı Şarj Adaptörü (2x Type-C + 2x USB-A)",
        barcode: "8680019284040",
        merchantSku: "SKU-PWR-100W-GAN",
        quantity: 2,
        price: 1725.00,
        vatBaseAmount: 287.50,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&h=200&fit=crop",
        picked: true
      }
    ],
    packageHistories: [
      {
        createdDate: now - (14 * hour),
        status: "Created",
        description: "N11 siparişi oluşturuldu."
      },
      {
        createdDate: now - (6 * hour),
        status: "Picking",
        description: "Ürünler toplandı."
      },
      {
        createdDate: now - (4 * hour),
        status: "Invoiced",
        description: "GIB e-Fatura kesildi ve sisteme işlendi. Kargo bekleniyor."
      }
    ]
  },
  {
    id: 914028474,
    orderNumber: "9482019420",
    packetNumber: "PK-TY-914028474",
    marketplace: "trendyol",
    packageStatus: "Shipped",
    customerFirstName: "Cansu",
    customerLastName: "Öztürk",
    customerId: "CUST-39012",
    customerEmail: "cansu.ozturk@example.com",
    grossAmount: 899.00,
    totalDiscount: 50.00,
    totalPrice: 849.00,
    cargoProviderName: "Yurtiçi Kargo",
    cargoTrackingNumber: "YK99401829481",
    cargoTrackingLink: "https://yurticikargo.com/takip?code=YK99401829481",
    cargoBarcode: "TY914028474YK",
    orderDate: now - (28 * hour),
    agreedDeliveryDate: now + (24 * hour),
    fastDelivery: true,
    invoiceNumber: "GIB202600004125",
    invoiceSerial: "E-ARSIV",
    shipmentAddress: {
      fullName: "Cansu Öztürk",
      address1: "Gazi Cad. Nilüfer Park Evleri No:12 D:5",
      district: "Nilüfer",
      city: "Bursa",
      postalCode: "16110",
      phone: "+90 535 221 88 44"
    },
    invoiceAddress: {
      fullName: "Cansu Öztürk",
      address1: "Gazi Cad. Nilüfer Park Evleri No:12 D:5",
      district: "Nilüfer",
      city: "Bursa",
      postalCode: "16110",
      phone: "+90 535 221 88 44"
    },
    lines: [
      {
        id: "line-6",
        lineId: 1049286,
        productName: "MagSafe Uyumlu 10.000 mAh Kablosuz Manyetik Powerbank",
        barcode: "8680019284057",
        merchantSku: "SKU-PWR-MAG10K-SLV",
        quantity: 1,
        price: 849.00,
        vatBaseAmount: 141.50,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop",
        picked: true
      }
    ],
    packageHistories: [
      {
        createdDate: now - (28 * hour),
        status: "Created",
        description: "Sipariş oluşturuldu."
      },
      {
        createdDate: now - (20 * hour),
        status: "Picking",
        description: "Ürünler toplandı."
      },
      {
        createdDate: now - (16 * hour),
        status: "Invoiced",
        description: "Fatura kesildi."
      },
      {
        createdDate: now - (8 * hour),
        status: "Shipped",
        description: "Yurtiçi Kargo kuryesine sevk irsaliyesi ile teslim edildi. Transfer merkezinde."
      }
    ]
  },
  {
    id: 914028475,
    orderNumber: "9482019311",
    packetNumber: "PK-TY-914028475",
    marketplace: "trendyol",
    packageStatus: "Delivered",
    customerFirstName: "Emre",
    customerLastName: "Aydın",
    customerId: "CUST-22910",
    customerEmail: "emre.aydin@example.com",
    grossAmount: 2150.00,
    totalDiscount: 100.00,
    totalPrice: 2050.00,
    cargoProviderName: "Trendyol Express",
    cargoTrackingNumber: "TY73910294899",
    cargoTrackingLink: "https://kargotakip.trendyol.com/?trackingNumber=TY73910294899",
    cargoBarcode: "TY914028475TEX",
    orderDate: now - (72 * hour),
    agreedDeliveryDate: now - (20 * hour),
    fastDelivery: false,
    invoiceNumber: "GIB202600004118",
    shipmentAddress: {
      fullName: "Emre Aydın",
      address1: "Liman Mah. Boğaçayı Cad. Palmiye Sit. No:4",
      district: "Konyaaltı",
      city: "Antalya",
      postalCode: "07070",
      phone: "+90 536 719 33 22"
    },
    invoiceAddress: {
      fullName: "Emre Aydın",
      address1: "Liman Mah. Boğaçayı Cad. Palmiye Sit. No:4",
      district: "Konyaaltı",
      city: "Antalya",
      postalCode: "07070",
      phone: "+90 536 719 33 22"
    },
    lines: [
      {
        id: "line-7",
        lineId: 1049287,
        productName: "Akıllı Titanyum Çelik Akıllı Saat Pro - Nabız & GPS",
        barcode: "8680019284064",
        merchantSku: "SKU-WATCH-PRO-TITAN",
        quantity: 1,
        price: 2050.00,
        vatBaseAmount: 341.66,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
        picked: true
      }
    ],
    packageHistories: [
      {
        createdDate: now - (72 * hour),
        status: "Created",
        description: "Sipariş oluşturuldu."
      },
      {
        createdDate: now - (48 * hour),
        status: "Shipped",
        description: "Trendyol Express teslim aldı."
      },
      {
        createdDate: now - (6 * hour),
        status: "Delivered",
        description: "Alıcıya bizzat imza karşılığı teslim edildi."
      }
    ]
  },
  {
    id: 914028476,
    orderNumber: "HB-74920042",
    packetNumber: "PK-HB-914028476",
    marketplace: "hepsiburada",
    packageStatus: "Returned",
    customerFirstName: "Ayşe",
    customerLastName: "Koç",
    customerId: "CUST-66102",
    grossAmount: 1350.00,
    totalDiscount: 0.00,
    totalPrice: 1350.00,
    cargoProviderName: "HepsiJET",
    cargoTrackingNumber: "HJ8491029910",
    cargoTrackingLink: "https://hepsijet.com/kargo-takip?no=HJ8491029910",
    cargoBarcode: "HB914028476JET",
    orderDate: now - (120 * hour),
    agreedDeliveryDate: now - (90 * hour),
    fastDelivery: false,
    shipmentAddress: {
      fullName: "Ayşe Koç",
      address1: "Batıkent Mah. 1928. Cad. No:14 D:8",
      district: "Yenimahalle",
      city: "Ankara",
      postalCode: "06370",
      phone: "+90 542 819 02 11"
    },
    invoiceAddress: {
      fullName: "Ayşe Koç",
      address1: "Batıkent Mah. 1928. Cad. No:14 D:8",
      district: "Yenimahalle",
      city: "Ankara",
      postalCode: "06370",
      phone: "+90 542 819 02 11"
    },
    lines: [
      {
        id: "line-8",
        lineId: 1049288,
        productName: "AirFlow Pro Kablosuz Bluetooth 5.3 ANC Kulaklık - Mat Siyah",
        barcode: "8680019284019",
        merchantSku: "SKU-AUDIO-AF01-BLK",
        quantity: 1,
        price: 1350.00,
        vatBaseAmount: 225.00,
        currencyCode: "TRY",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"
      }
    ],
    packageHistories: [
      {
        createdDate: now - (120 * hour),
        status: "Created",
        description: "Sipariş oluşturuldu."
      },
      {
        createdDate: now - (48 * hour),
        status: "Delivered",
        description: "Müşteriye teslim edildi."
      },
      {
        createdDate: now - (12 * hour),
        status: "Returned",
        description: "Müşteri 'Vazgeçtim / Beden/Model Uyumsuz' gerekçesiyle kolay iade talebi oluşturdu. İade kargo şubede."
      }
    ]
  }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "AirFlow Pro Kablosuz Bluetooth 5.3 ANC Kulaklık - Mat Siyah",
    barcode: "8680019284019",
    sku: "SKU-AUDIO-AF01-BLK",
    category: "Elektronik / Ses Sistemleri",
    brand: "SoundMaster",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    totalStock: 142,
    reservedStock: 2,
    buyingPrice: 650.00,
    basePrice: 1350.00,
    vatRate: 20,
    channels: {
      trendyol: { active: true, price: 1350.00, stock: 65, commissionRate: 18.5, lastSync: "10 dk önce" },
      hepsiburada: { active: true, price: 1399.00, stock: 45, commissionRate: 19.0, lastSync: "15 dk önce" },
      n11: { active: true, price: 1350.00, stock: 32, commissionRate: 17.0, lastSync: "30 dk önce" },
      ikas: { active: true, price: 1299.00, stock: 142, commissionRate: 0.0, lastSync: "Canlı Eşzamanlı" }
    }
  },
  {
    id: "prod-2",
    name: "Ergonomik Alüminyum Laptop Standı - 360 Döner Tablalı",
    barcode: "8680019284026",
    sku: "SKU-DESK-STND-ALU",
    category: "Bilgisayar & Aksesuar",
    brand: "ErgoDesk",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
    totalStock: 88,
    reservedStock: 1,
    buyingPrice: 680.00,
    basePrice: 1499.00,
    vatRate: 20,
    channels: {
      trendyol: { active: true, price: 1499.00, stock: 40, commissionRate: 16.0, lastSync: "5 dk önce" },
      hepsiburada: { active: true, price: 1499.00, stock: 30, commissionRate: 17.5, lastSync: "10 dk önce" },
      n11: { active: true, price: 1449.00, stock: 18, commissionRate: 15.0, lastSync: "25 dk önce" },
      ikas: { active: true, price: 1399.00, stock: 88, commissionRate: 0.0, lastSync: "Canlı Eşzamanlı" }
    }
  },
  {
    id: "prod-3",
    name: "Mekanik RGB Kompakt Klavye %75 - Red Switch Türkçe Q",
    barcode: "8680019284033",
    sku: "SKU-TECH-KB75-TR",
    category: "Oyuncu Ekipmanları",
    brand: "KeyPulse",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop",
    totalStock: 54,
    reservedStock: 1,
    buyingPrice: 550.00,
    basePrice: 1200.00,
    vatRate: 20,
    channels: {
      trendyol: { active: true, price: 1200.00, stock: 25, commissionRate: 17.0, lastSync: "8 dk önce" },
      hepsiburada: { active: true, price: 1249.00, stock: 20, commissionRate: 18.0, lastSync: "12 dk önce" },
      n11: { active: false, price: 1199.00, stock: 9, commissionRate: 16.5, lastSync: "1 gün önce" }
    }
  },
  {
    id: "prod-4",
    name: "100W GaN 4 Portlu Hızlı Şarj Adaptörü (2x Type-C + 2x USB-A)",
    barcode: "8680019284040",
    sku: "SKU-PWR-100W-GAN",
    category: "Telefon & Şarj",
    brand: "VoltCharge",
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop",
    totalStock: 195,
    reservedStock: 2,
    buyingPrice: 720.00,
    basePrice: 1725.00,
    vatRate: 20,
    channels: {
      trendyol: { active: true, price: 1725.00, stock: 90, commissionRate: 18.0, lastSync: "3 dk önce" },
      hepsiburada: { active: true, price: 1750.00, stock: 65, commissionRate: 18.5, lastSync: "5 dk önce" },
      n11: { active: true, price: 1725.00, stock: 40, commissionRate: 16.0, lastSync: "20 dk önce" }
    }
  },
  {
    id: "prod-5",
    name: "MagSafe Uyumlu 10.000 mAh Manyetik Kablosuz Powerbank",
    barcode: "8680019284057",
    sku: "SKU-PWR-MAG10K-SLV",
    category: "Telefon & Şarj",
    brand: "VoltCharge",
    imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=300&fit=crop",
    totalStock: 34,
    reservedStock: 0,
    buyingPrice: 390.00,
    basePrice: 849.00,
    vatRate: 20,
    channels: {
      trendyol: { active: true, price: 849.00, stock: 15, commissionRate: 18.0, lastSync: "1 saat önce" },
      hepsiburada: { active: true, price: 879.00, stock: 10, commissionRate: 18.5, lastSync: "1 saat önce" },
      n11: { active: true, price: 849.00, stock: 9, commissionRate: 16.0, lastSync: "1 saat önce" }
    }
  },
  {
    id: "prod-6",
    name: "Akıllı Titanyum Çelik Akıllı Saat Pro - Nabız & GPS",
    barcode: "8680019284064",
    sku: "SKU-WATCH-PRO-TITAN",
    category: "Giyilebilir Teknoloji",
    brand: "Chronos",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    totalStock: 22,
    reservedStock: 0,
    buyingPrice: 950.00,
    basePrice: 2050.00,
    vatRate: 20,
    channels: {
      trendyol: { active: true, price: 2050.00, stock: 10, commissionRate: 20.0, lastSync: "45 dk önce" },
      hepsiburada: { active: true, price: 2099.00, stock: 8, commissionRate: 20.0, lastSync: "45 dk önce" },
      n11: { active: true, price: 2050.00, stock: 4, commissionRate: 18.0, lastSync: "45 dk önce" }
    }
  }
];

export const INITIAL_QUESTIONS: CustomerQuestion[] = [
  {
    id: "q-1",
    marketplace: "trendyol",
    customerName: "Gamze Ç.",
    productName: "AirFlow Pro Kablosuz Bluetooth 5.3 ANC Kulaklık - Mat Siyah",
    productBarcode: "8680019284019",
    productImageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    question: "Merhaba, ürün iPhone 15 ve MacBook ile tam uyumlu mu? Bir de kulak pedleri terletme yapar mı?",
    questionDate: "Bugün 13:45",
    status: "WAITING",
    orderNumber: "Sipariş Öncesi Soru"
  },
  {
    id: "q-2",
    marketplace: "trendyol",
    customerName: "Murat S.",
    productName: "100W GaN 4 Portlu Hızlı Şarj Adaptörü",
    productBarcode: "8680019284040",
    productImageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=100&h=100&fit=crop",
    question: "Sipariş verdim 9482019481 nolu siparişim, kargoya bugün verilir mi aciliyetim var şehir dışına çıkacağım?",
    questionDate: "Bugün 12:20",
    status: "WAITING",
    orderNumber: "9482019481"
  },
  {
    id: "q-3",
    marketplace: "hepsiburada",
    customerName: "Ece T.",
    productName: "Ergonomik Alüminyum Laptop Standı - 360 Döner Tablalı",
    productBarcode: "8680019284026",
    productImageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop",
    question: "16 inç ağır oyuncu laptopu taşır mı sallantı yapar mı?",
    questionDate: "Bugün 09:15",
    status: "ANSWERED",
    answer: "Merhaba Ece Hanım, standımız 1. Sınıf uçak sınıfı anodize alüminyumdan üretilmiş olup 17.3 inç ve 8 kg'a kadar olan tüm laptopları milimetrik sarsıntı olmadan güvenle taşımaktadır. Çift kilitli menteşe mekanizmasına sahiptir. İlginiz için teşekkür ederiz.",
    answeredAt: "Bugün 09:30"
  },
  {
    id: "q-4",
    marketplace: "n11",
    customerName: "Kerem A.",
    productName: "MagSafe Uyumlu 10.000 mAh Kablosuz Manyetik Powerbank",
    productBarcode: "8680019284057",
    productImageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=100&h=100&fit=crop",
    question: "Kutu içeriğinde şarj kablosu geliyor mu bir de kılıf takılıyken yapışır mı?",
    questionDate: "Dün 18:50",
    status: "WAITING"
  }
];

export const INITIAL_RETURNS = [
  {
    id: "ret-1",
    orderNumber: "9482019401",
    packageId: 914028476,
    marketplace: "trendyol" as const,
    claimNumber: "CLM-TY-8849102",
    customerName: "Derya Aydın",
    productName: "AirFlow Pro Kablosuz Bluetooth 5.3 ANC Kulaklık - Mat Siyah",
    barcode: "8680019284019",
    sku: "SKU-AUDIO-AF01-BLK",
    quantity: 1,
    claimDate: now - (26 * hour),
    status: "ARRIVED_AT_WAREHOUSE" as const,
    trackingCode: "TY-RET-99401284",
    carrierName: "Trendyol Express",
    claimReason: "Kalıp kulağa tam oturmuyor, pedler sert geldi (Model/Beden Uyumsuzluğu)",
    faultCategory: "SIZE_MISMATCH" as const,
    condition: "RE_SELLABLE" as const,
    warehouseNote: "Kutu jelatini açılmış fakat aksesuar eksiksiz, temizlendi ve tekrar paketlendi.",
    inspectedAt: now - (2 * hour),
    restocked: true,
    refundAmount: 1350.00
  },
  {
    id: "ret-2",
    orderNumber: "HB-74920110",
    packageId: 914028477,
    marketplace: "hepsiburada" as const,
    claimNumber: "CLM-HB-1049281",
    customerName: "Volkan Kılıç",
    productName: "Mekanik RGB Kompakt Klavye %75 - Red Switch",
    barcode: "8680019284033",
    sku: "SKU-TECH-KB75-TR",
    quantity: 1,
    claimDate: now - (48 * hour),
    status: "INSPECTED" as const,
    trackingCode: "HJ-RET-49102941",
    carrierName: "HepsiJET",
    claimReason: "Tuş basmıyor / Space tuşu takılı kalıyor (Arızalı Ürün)",
    faultCategory: "DEFECTIVE_PRODUCT" as const,
    condition: "SUPPLIER_RETURN" as const,
    warehouseNote: "Sol switch kırık tespit edildi. Tedarikçi garanti iadesi için ayrıldı.",
    inspectedAt: now - (5 * hour),
    restocked: false,
    refundAmount: 1200.00
  },
  {
    id: "ret-3",
    orderNumber: "N11-20948115",
    packageId: 914028478,
    marketplace: "n11" as const,
    claimNumber: "CLM-N11-4491029",
    customerName: "Barış Koç",
    productName: "Ergonomik Alüminyum Laptop Standı - 360 Döner Tablalı",
    barcode: "8680019284026",
    sku: "SKU-DESK-STND-ALU",
    quantity: 1,
    claimDate: now - (14 * hour),
    status: "IN_TRANSIT" as const,
    trackingCode: "AR-RET-99401201",
    carrierName: "Aras Kargo",
    claimReason: "Kargo kolisi ezik geldi, ürün eğilmiş olabilir (Kargo Hasarı)",
    faultCategory: "CARGO_DAMAGE" as const,
    condition: "DAMAGED_SCRAP" as const,
    warehouseNote: "Kargo hasar tutanağı talep edilecek.",
    restocked: false,
    refundAmount: 1499.00
  },
  {
    id: "ret-4",
    orderNumber: "9482019388",
    packageId: 914028479,
    marketplace: "trendyol" as const,
    claimNumber: "CLM-TY-8849333",
    customerName: "Ezgi Tuncer",
    productName: "MagSafe Uyumlu 10.000 mAh Kablosuz Powerbank",
    barcode: "8680019284057",
    sku: "SKU-PWR-MAG10K-SLV",
    quantity: 1,
    claimDate: now - (72 * hour),
    status: "REFUNDED" as const,
    trackingCode: "YK-RET-10940192",
    carrierName: "Yurtiçi Kargo",
    claimReason: "Vazgeçtim / İhtiyacım kalmadı (Cayma Hakkı)",
    faultCategory: "RIGHT_OF_WITHDRAWAL" as const,
    condition: "RE_SELLABLE" as const,
    warehouseNote: "Kutu hiç açılmamış, orijinal ambalaj. Raf stoğuna eklendi.",
    inspectedAt: now - (30 * hour),
    restocked: true,
    refundAmount: 849.00
  }
];

export const INITIAL_PROFITABILITY = [
  {
    sku: "SKU-AUDIO-AF01-BLK",
    barcode: "8680019284019",
    name: "AirFlow Pro Kablosuz ANC Kulaklık",
    salePrice: 1350.00,
    cogs: 650.00,
    commissionRate: 18.5,
    commissionAmount: 249.75,
    shippingCost: 58.00, // 2 Desi
    packagingCost: 15.00,
    adCostPerUnit: 45.00,
    taxAndWithholding: 85.00,
    returnLossPerUnit: 34.20, // %8.5 İade payı ortalama maliyeti
    netContributionMargin: 208.05,
    marginPercentage: 15.4,
    monthlySalesQty: 240,
    totalNetProfit: 49932.00,
    isLossMaking: false,
    recommendation: "Sağlıklı kâr marjı. İade oranını %8'den %4'e düşürürseniz kâr +₺8.200 artacak."
  },
  {
    sku: "SKU-PWR-MAG10K-SLV",
    barcode: "8680019284057",
    name: "MagSafe 10.000 mAh Powerbank",
    salePrice: 849.00,
    cogs: 490.00, // Artan tedarik maliyeti
    commissionRate: 18.0,
    commissionAmount: 152.82,
    shippingCost: 65.00, // Ağır batarya kargo zammı
    packagingCost: 18.00,
    adCostPerUnit: 60.00,
    taxAndWithholding: 55.00,
    returnLossPerUnit: 26.50, // %12 İade masrafı
    netContributionMargin: -18.32, // GİZLİ ZARAR!
    marginPercentage: -2.1,
    monthlySalesQty: 180,
    totalNetProfit: -3297.60,
    isLossMaking: true,
    recommendation: "🔴 KRİTİK ZARAR: Kargo ve reklam harcamaları ürünü zarara sokuyor. Satış fiyatı en az ₺929 yapılmalı veya reklam durdurulmalı!"
  },
  {
    sku: "SKU-PWR-100W-GAN",
    barcode: "8680019284040",
    name: "100W GaN 4 Portlu Hızlı Şarj Cihazı",
    salePrice: 1725.00,
    cogs: 720.00,
    commissionRate: 18.0,
    commissionAmount: 310.50,
    shippingCost: 52.00,
    packagingCost: 12.00,
    adCostPerUnit: 35.00,
    taxAndWithholding: 110.00,
    returnLossPerUnit: 14.00, // Düşük iade %2.1
    netContributionMargin: 471.50,
    marginPercentage: 27.3,
    monthlySalesQty: 310,
    totalNetProfit: 146165.00,
    isLossMaking: false,
    recommendation: "⭐ YILDIZ ÜRÜN: En yüksek katkı payına sahip ürün. Reklam bütçesi %25 artırılarak ölçeklendirilebilir."
  },
  {
    sku: "SKU-TECH-KB75-TR",
    barcode: "8680019284033",
    name: "Mekanik RGB Kompakt Klavye %75",
    salePrice: 1200.00,
    cogs: 550.00,
    commissionRate: 17.0,
    commissionAmount: 204.00,
    shippingCost: 75.00, // 3 Desi
    packagingCost: 20.00,
    adCostPerUnit: 80.00,
    taxAndWithholding: 75.00,
    returnLossPerUnit: 48.00, // %9.8 İade (arızalı switchler)
    netContributionMargin: 148.00,
    marginPercentage: 12.3,
    monthlySalesQty: 110,
    totalNetProfit: 16280.00,
    isLossMaking: false,
    recommendation: "Kırık switch iadeleri net marjı aşındırıyor. Kalite kontrol denetimi şart."
  },
  {
    sku: "SKU-DESK-STND-ALU",
    barcode: "8680019284026",
    name: "Alüminyum 360 Döner Laptop Standı",
    salePrice: 1499.00,
    cogs: 680.00,
    commissionRate: 16.0,
    commissionAmount: 239.84,
    shippingCost: 88.00, // 4 Desi ağır metal
    packagingCost: 25.00,
    adCostPerUnit: 40.00,
    taxAndWithholding: 95.00,
    returnLossPerUnit: 22.00,
    netContributionMargin: 309.16,
    marginPercentage: 20.6,
    monthlySalesQty: 145,
    totalNetProfit: 44828.20,
    isLossMaking: false,
    recommendation: "Yüksek marj. Kargo ambalajı güçlendirilerek kargo hasarı iadeleri sıfırlanabilir."
  },
  {
    sku: "SKU-WATCH-PRO-TITAN",
    barcode: "8680019284064",
    name: "Titanyum Çelik Akıllı Saat Pro",
    salePrice: 2050.00,
    cogs: 950.00,
    commissionRate: 20.0,
    commissionAmount: 410.00,
    shippingCost: 52.00,
    packagingCost: 22.00,
    adCostPerUnit: 90.00,
    taxAndWithholding: 130.00,
    returnLossPerUnit: 38.00,
    netContributionMargin: 358.00,
    marginPercentage: 17.5,
    monthlySalesQty: 95,
    totalNetProfit: 34010.00,
    isLossMaking: false,
    recommendation: "Kârlı ancak stok kritik seviyede! Stok tükenmeden PO oluşturulmalı."
  }
];

export const INITIAL_FORECASTS = [
  {
    sku: "SKU-WATCH-PRO-TITAN",
    barcode: "8680019284064",
    name: "Titanyum Çelik Akıllı Saat Pro",
    currentStock: 22,
    reservedStock: 2,
    dailyVelocity: 3.2,
    runoutDays: 6.8, // 7 günden az!
    leadTimeDays: 8,
    safetyStock: 15,
    suggestedReorderQty: 60,
    abcCategory: "A" as const,
    riskLevel: "CRITICAL_RUNOUT" as const
  },
  {
    sku: "SKU-PWR-100W-GAN",
    barcode: "8680019284040",
    name: "100W GaN 4 Portlu Hızlı Şarj Cihazı",
    currentStock: 195,
    reservedStock: 2,
    dailyVelocity: 10.3,
    runoutDays: 18.9,
    leadTimeDays: 10,
    safetyStock: 40,
    suggestedReorderQty: 250,
    abcCategory: "A" as const,
    riskLevel: "ORDER_NOW" as const
  },
  {
    sku: "SKU-AUDIO-AF01-BLK",
    barcode: "8680019284019",
    name: "AirFlow Pro Kablosuz ANC Kulaklık",
    currentStock: 142,
    reservedStock: 2,
    dailyVelocity: 8.0,
    runoutDays: 17.7,
    leadTimeDays: 7,
    safetyStock: 30,
    suggestedReorderQty: 180,
    abcCategory: "A" as const,
    riskLevel: "OPTIMAL" as const
  },
  {
    sku: "SKU-DESK-STND-ALU",
    barcode: "8680019284026",
    name: "Alüminyum 360 Döner Laptop Standı",
    currentStock: 88,
    reservedStock: 1,
    dailyVelocity: 4.8,
    runoutDays: 18.3,
    leadTimeDays: 5,
    safetyStock: 20,
    suggestedReorderQty: 100,
    abcCategory: "B" as const,
    riskLevel: "OPTIMAL" as const
  },
  {
    sku: "SKU-TECH-KB75-TR",
    barcode: "8680019284033",
    name: "Mekanik RGB Kompakt Klavye %75",
    currentStock: 54,
    reservedStock: 1,
    dailyVelocity: 3.6,
    runoutDays: 15.0,
    leadTimeDays: 6,
    safetyStock: 15,
    suggestedReorderQty: 80,
    abcCategory: "B" as const,
    riskLevel: "OPTIMAL" as const
  },
  {
    sku: "SKU-PWR-MAG10K-SLV",
    barcode: "8680019284057",
    name: "MagSafe 10.000 mAh Powerbank (Zarar Eden)",
    currentStock: 34,
    reservedStock: 0,
    dailyVelocity: 1.2,
    runoutDays: 28.3,
    leadTimeDays: 12,
    safetyStock: 10,
    suggestedReorderQty: 0, // Kâr etmediği için sipariş verme
    abcCategory: "C" as const,
    riskLevel: "DEAD_STOCK" as const
  }
];

export const INITIAL_WAREHOUSE_LOCATIONS: WarehouseLocation[] = [
  { id: "LOC-A01-01", warehouseCode: "ANA_DEPO", zone: "A (Hızlı Tüketim)", aisle: "01", rack: "R1", shelf: "01", bin: "A-01-R1-01", occupiedCapacityPct: 85 },
  { id: "LOC-A01-02", warehouseCode: "ANA_DEPO", zone: "A (Hızlı Tüketim)", aisle: "01", rack: "R1", shelf: "02", bin: "A-01-R1-02", occupiedCapacityPct: 40 },
  { id: "LOC-A02-01", warehouseCode: "ANA_DEPO", zone: "A (Hızlı Tüketim)", aisle: "02", rack: "R2", shelf: "01", bin: "A-02-R2-01", occupiedCapacityPct: 92 },
  { id: "LOC-B01-01", warehouseCode: "ANA_DEPO", zone: "B (Elektronik & Aksesuar)", aisle: "01", rack: "R1", shelf: "01", bin: "B-01-R1-01", occupiedCapacityPct: 60 },
  { id: "LOC-B02-03", warehouseCode: "ANA_DEPO", zone: "B (Elektronik & Aksesuar)", aisle: "02", rack: "R3", shelf: "03", bin: "B-02-R3-03", occupiedCapacityPct: 30 },
  { id: "LOC-C01-02", warehouseCode: "ANA_DEPO", zone: "C (Hacimli / Stand)", aisle: "01", rack: "R2", shelf: "02", bin: "C-01-R2-02", occupiedCapacityPct: 75 },
];

export const INITIAL_WAREHOUSE_PRODUCTS: ProductWarehouseDetail[] = [
  {
    sku: "SKU-HEAD-ANC-001",
    barcode: "8680019284002",
    name: "AirFlow Pro Gürültü Engelleyici Kulaklık",
    locationBin: "A-01-R1-01",
    warehouseCode: "ANA_DEPO",
    quantityOnHand: 48,
    quantityAllocated: 2,
    lotNumber: "LOT-2026-Q1-TY",
    serialNumbers: ["SN-AF-99201", "SN-AF-99202", "SN-AF-99203"],
    requiresSerialScan: true
  },
  {
    sku: "SKU-WATCH-ULTRA-BLK",
    barcode: "8680019284019",
    name: "Titanium Akıllı Saat 49mm Siyah",
    locationBin: "A-02-R2-01",
    warehouseCode: "ANA_DEPO",
    quantityOnHand: 118,
    quantityAllocated: 3,
    lotNumber: "LOT-2026-M4",
    serialNumbers: ["IMEI-869201928401", "IMEI-869201928402"],
    requiresSerialScan: true
  },
  {
    sku: "SKU-DESK-STND-ALU",
    barcode: "8680019284026",
    name: "Alüminyum 360 Döner Laptop Standı",
    locationBin: "C-01-R2-02",
    warehouseCode: "ANA_DEPO",
    quantityOnHand: 88,
    quantityAllocated: 1,
    requiresSerialScan: false
  },
  {
    sku: "SKU-TECH-KB75-TR",
    barcode: "8680019284033",
    name: "Mekanik RGB Kompakt Klavye %75",
    locationBin: "B-01-R1-01",
    warehouseCode: "ANA_DEPO",
    quantityOnHand: 54,
    quantityAllocated: 1,
    requiresSerialScan: false
  },
  {
    sku: "SKU-PWR-MAG10K-SLV",
    barcode: "8680019284057",
    name: "MagSafe 10.000 mAh Powerbank",
    locationBin: "B-02-R3-03",
    warehouseCode: "ANA_DEPO",
    quantityOnHand: 34,
    quantityAllocated: 0,
    lotNumber: "LOT-BAT-2025B",
    expirationDate: "2028-12-31",
    requiresSerialScan: false
  }
];

export const INITIAL_PICKING_WAVES: PickingBatchWave[] = [
  {
    id: "WAVE-2026-081",
    waveNumber: "DALGA #81",
    batchName: "Öğleden Önce Acil SLA Siparişleri (Trendyol + HB)",
    assignedPicker: "Ahmet Yılmaz (Depo-1)",
    status: "IN_PROGRESS",
    packageCount: 4,
    totalItemsCount: 5,
    pickedItemsCount: 3,
    createdAt: Date.now() - (45 * 60 * 1000),
    items: [
      {
        sku: "SKU-HEAD-ANC-001",
        barcode: "8680019284002",
        name: "AirFlow Pro Gürültü Engelleyici Kulaklık",
        binLocation: "A-01-R1-01",
        qtyNeeded: 2,
        qtyPicked: 2,
        orderNumbers: ["TY-94029104", "HB-88192041"],
        isPicked: true
      },
      {
        sku: "SKU-WATCH-ULTRA-BLK",
        barcode: "8680019284019",
        name: "Titanium Akıllı Saat 49mm Siyah",
        binLocation: "A-02-R2-01",
        qtyNeeded: 1,
        qtyPicked: 1,
        orderNumbers: ["N11-55019284"],
        isPicked: true
      },
      {
        sku: "SKU-TECH-KB75-TR",
        barcode: "8680019284033",
        name: "Mekanik RGB Kompakt Klavye %75",
        binLocation: "B-01-R1-01",
        qtyNeeded: 1,
        qtyPicked: 0,
        orderNumbers: ["HB-88192041"],
        isPicked: false
      },
      {
        sku: "SKU-DESK-STND-ALU",
        barcode: "8680019284026",
        name: "Alüminyum 360 Döner Laptop Standı",
        binLocation: "C-01-R2-02",
        qtyNeeded: 1,
        qtyPicked: 0,
        orderNumbers: ["TY-94029104"],
        isPicked: false
      }
    ]
  },
  {
    id: "WAVE-2026-080",
    waveNumber: "DALGA #80",
    batchName: "Sabah Toplama Dalgası (Tekli Paketler)",
    assignedPicker: "Mehmet Kaya (Depo-2)",
    status: "COMPLETED",
    packageCount: 8,
    totalItemsCount: 8,
    pickedItemsCount: 8,
    createdAt: Date.now() - (180 * 60 * 1000),
    items: []
  }
];

export const INITIAL_BUYBOX_ITEMS: BuyboxMonitorItem[] = [
  {
    id: "BB-01",
    sku: "SKU-WATCH-ULTRA-BLK",
    barcode: "8680019284019",
    name: "Titanium Akıllı Saat 49mm Siyah",
    marketplace: "trendyol",
    myCurrentPrice: 2050.00,
    minPriceFloor: 1850.00,
    maxPriceCeiling: 2399.00,
    cogs: 1200.00,
    commissionRate: 15.0,
    buyboxWinnerPrice: 1999.00,
    isWinningBuybox: false,
    strategy: "BEAT_BY_1TL",
    autoRepriceEnabled: true,
    lastRepricedAt: Date.now() - (20 * 60 * 1000),
    competitors: [
      { sellerName: "TeknoStore_TR", sellerRating: 9.8, price: 1999.00, isBuyboxOwner: true, isFulfillmentByMarketplace: true, shippingDays: 1 },
      { sellerName: "Bizim Mağaza (TrendModa)", sellerRating: 9.9, price: 2050.00, isBuyboxOwner: false, isFulfillmentByMarketplace: true, shippingDays: 1 },
      { sellerName: "DijitalGrup", sellerRating: 9.2, price: 2120.00, isBuyboxOwner: false, isFulfillmentByMarketplace: false, shippingDays: 2 }
    ],
    priceHistory: [
      { timestamp: Date.now() - (120 * 60 * 1000), price: 2090.00, trigger: "İlk Fiyat" },
      { timestamp: Date.now() - (40 * 60 * 1000), price: 2050.00, trigger: "Rakip İndirimi Algılandı" }
    ]
  },
  {
    id: "BB-02",
    sku: "SKU-HEAD-ANC-001",
    barcode: "8680019284002",
    name: "AirFlow Pro Gürültü Engelleyici Kulaklık",
    marketplace: "trendyol",
    myCurrentPrice: 1449.00,
    minPriceFloor: 1299.00,
    maxPriceCeiling: 1699.00,
    cogs: 750.00,
    commissionRate: 17.5,
    buyboxWinnerPrice: 1449.00,
    isWinningBuybox: true,
    strategy: "PROFIT_MAXIMIZER",
    autoRepriceEnabled: true,
    lastRepricedAt: Date.now() - (60 * 60 * 1000),
    competitors: [
      { sellerName: "Bizim Mağaza (TrendModa)", sellerRating: 9.9, price: 1449.00, isBuyboxOwner: true, isFulfillmentByMarketplace: true, shippingDays: 1 },
      { sellerName: "SesElektronik", sellerRating: 9.4, price: 1490.00, isBuyboxOwner: false, isFulfillmentByMarketplace: false, shippingDays: 2 },
      { sellerName: "MegaSepet", sellerRating: 8.9, price: 1549.00, isBuyboxOwner: false, isFulfillmentByMarketplace: false, shippingDays: 3 }
    ],
    priceHistory: [
      { timestamp: Date.now() - (180 * 60 * 1000), price: 1449.00, trigger: "Buybox Kazanıldı" }
    ]
  },
  {
    id: "BB-03",
    sku: "SKU-DESK-STND-ALU",
    barcode: "8680019284026",
    name: "Alüminyum 360 Döner Laptop Standı",
    marketplace: "hepsiburada",
    myCurrentPrice: 599.00,
    minPriceFloor: 499.00,
    maxPriceCeiling: 749.00,
    cogs: 260.00,
    commissionRate: 14.0,
    buyboxWinnerPrice: 579.00,
    isWinningBuybox: false,
    strategy: "MATCH_BUYBOX",
    autoRepriceEnabled: false,
    lastRepricedAt: Date.now() - (360 * 60 * 1000),
    competitors: [
      { sellerName: "ErgoDesk Ticaret", sellerRating: 9.5, price: 579.00, isBuyboxOwner: true, isFulfillmentByMarketplace: true, shippingDays: 1 },
      { sellerName: "Bizim Mağaza (TrendModa)", sellerRating: 9.9, price: 599.00, isBuyboxOwner: false, isFulfillmentByMarketplace: false, shippingDays: 1 }
    ],
    priceHistory: [
      { timestamp: Date.now() - (400 * 60 * 1000), price: 599.00, trigger: "Manuel Ayar" }
    ]
  },
  {
    id: "BB-04",
    sku: "SKU-TECH-KB75-TR",
    barcode: "8680019284033",
    name: "Mekanik RGB Kompakt Klavye %75",
    marketplace: "n11",
    myCurrentPrice: 1249.00,
    minPriceFloor: 1099.00,
    maxPriceCeiling: 1499.00,
    cogs: 680.00,
    commissionRate: 16.0,
    buyboxWinnerPrice: 1249.00,
    isWinningBuybox: true,
    strategy: "PROFIT_MAXIMIZER",
    autoRepriceEnabled: true,
    lastRepricedAt: Date.now() - (15 * 60 * 1000),
    competitors: [
      { sellerName: "Bizim Mağaza (TrendModa)", sellerRating: 9.9, price: 1249.00, isBuyboxOwner: true, isFulfillmentByMarketplace: true, shippingDays: 1 },
      { sellerName: "GameCenter", sellerRating: 9.1, price: 1290.00, isBuyboxOwner: false, isFulfillmentByMarketplace: false, shippingDays: 2 }
    ],
    priceHistory: [
      { timestamp: Date.now() - (15 * 60 * 1000), price: 1249.00, trigger: "Stok Kontrolü ile Fiyat Korundu" }
    ]
  }
];

export const INITIAL_SETTLEMENT_AUDITS: SettlementAuditRecord[] = [
  {
    id: "SET-2026-001",
    orderNumber: "TY-94029104",
    marketplace: "trendyol",
    orderDate: "2026-03-10",
    settlementDate: "2026-03-24",
    sku: "SKU-HEAD-ANC-001",
    productName: "AirFlow Pro Gürültü Engelleyici Kulaklık",
    grossAmount: 1449.00,
    expectedCommission: 217.35, // %15 Sözleşme
    actualCommissionDeducted: 260.82, // %18 Haksız kesinti
    expectedDesi: 2,
    billedDesi: 6, // Kargo 4 desi fazla yazmış
    expectedCargoCost: 48.00,
    billedCargoCost: 112.00,
    discrepancyType: "DESI_OVERCHARGE",
    discrepancyAmount: 107.47, // (260.82 - 217.35) + (112 - 48)
    claimStatus: "OPEN_DISCREPANCY",
    claimNotes: "Kargo faturasında 2 desi yerine 6 desi faturalandırılmış ve komisyon %18 uygulanmış."
  },
  {
    id: "SET-2026-002",
    orderNumber: "HB-88192041",
    marketplace: "hepsiburada",
    orderDate: "2026-03-08",
    settlementDate: "2026-03-22",
    sku: "SKU-WATCH-ULTRA-BLK",
    productName: "Titanium Akıllı Saat 49mm Siyah",
    grossAmount: 2050.00,
    expectedCommission: 307.50, // %15
    actualCommissionDeducted: 369.00, // %18
    expectedDesi: 1,
    billedDesi: 1,
    expectedCargoCost: 42.00,
    billedCargoCost: 42.00,
    discrepancyType: "COMMISSION_OVERCHARGE",
    discrepancyAmount: 61.50,
    claimStatus: "CLAIM_SUBMITTED",
    claimTicketNumber: "HB-TIK-940192",
    claimNotes: "Sözleşmeli kategori komisyonu %15 olmasına rağmen hakedişte %18 kesilmiş. İtiraz açıldı."
  },
  {
    id: "SET-2026-003",
    orderNumber: "N11-55019284",
    marketplace: "n11",
    orderDate: "2026-03-05",
    settlementDate: "2026-03-19",
    sku: "SKU-DESK-STND-ALU",
    productName: "Alüminyum 360 Döner Laptop Standı",
    grossAmount: 599.00,
    expectedCommission: 83.86,
    actualCommissionDeducted: 83.86,
    expectedDesi: 3,
    billedDesi: 7, // 4 desi aşım
    expectedCargoCost: 55.00,
    billedCargoCost: 125.00,
    discrepancyType: "DESI_OVERCHARGE",
    discrepancyAmount: 70.00,
    claimStatus: "REFUNDED_BY_MARKETPLACE",
    claimTicketNumber: "N11-DESI-8120",
    claimNotes: "Kargo desi aşımı N11 Destek tarafından kabul edildi ve ₺70 cari hesaba iade edildi."
  },
  {
    id: "SET-2026-004",
    orderNumber: "TY-93821094",
    marketplace: "trendyol",
    orderDate: "2026-02-28",
    settlementDate: "2026-03-14",
    sku: "SKU-TECH-KB75-TR",
    productName: "Mekanik RGB Kompakt Klavye %75",
    grossAmount: 1249.00,
    expectedCommission: 199.84,
    actualCommissionDeducted: 199.84,
    expectedDesi: 2,
    billedDesi: 2,
    expectedCargoCost: 48.00,
    billedCargoCost: 48.00,
    discrepancyType: "UNPAID_SETTLEMENT",
    discrepancyAmount: 1001.16, // Hakediş vadesi geçtiği halde bankaya yatmadı
    claimStatus: "OPEN_DISCREPANCY",
    claimNotes: "Vade tarihi 14 Mart 2026 olmasına rağmen banka ekstresinde ödeme görünmüyor (Bloke kalmış)."
  },
  {
    id: "SET-2026-005",
    orderNumber: "HB-87401928",
    marketplace: "hepsiburada",
    orderDate: "2026-03-01",
    settlementDate: "2026-03-15",
    sku: "SKU-PWR-MAG10K-SLV",
    productName: "MagSafe 10.000 mAh Powerbank",
    grossAmount: 649.00,
    expectedCommission: 97.35,
    actualCommissionDeducted: 97.35,
    expectedDesi: 1,
    billedDesi: 1,
    expectedCargoCost: 42.00,
    billedCargoCost: 42.00,
    discrepancyType: "REFUND_WITHOUT_RETURN",
    discrepancyAmount: 509.65, // Depoya iade ulaşmadan müşteriye para ödendi
    claimStatus: "CLAIM_SUBMITTED",
    claimTicketNumber: "HB-REV-10924",
    claimNotes: "Müşteriye iade onayı verilmiş ancak ürün 14 gündür kargodan depomuza teslim edilmedi (Kayıp kargo)."
  }
];

export const INITIAL_PACKAGING_BOXES: StandardPackagingBox[] = [
  {
    id: "BOX-01-FLY",
    code: "ZARF-BALONLU",
    name: "Balonlu Kargo Zarfı A4",
    innerDimensions: { width: 25, length: 35, height: 2 },
    maxWeightKg: 1.0,
    boxDesi: 0.58, // < 1 desi
    boxCost: 3.50,
    cargoBaseFee: 38.00,
    stockCount: 1420
  },
  {
    id: "BOX-02-XS",
    code: "KOLI-XS",
    name: "Mikro Koli (20x15x10 cm)",
    innerDimensions: { width: 20, length: 15, height: 10 },
    maxWeightKg: 2.0,
    boxDesi: 1.0,
    boxCost: 5.20,
    cargoBaseFee: 42.00,
    stockCount: 890
  },
  {
    id: "BOX-03-S",
    code: "KOLI-S",
    name: "Standart Küçük Koli (30x20x15 cm)",
    innerDimensions: { width: 30, length: 20, height: 15 },
    maxWeightKg: 5.0,
    boxDesi: 3.0,
    boxCost: 8.40,
    cargoBaseFee: 55.00,
    stockCount: 650
  },
  {
    id: "BOX-04-M",
    code: "KOLI-M",
    name: "Orta Boy Koli (40x30x20 cm)",
    innerDimensions: { width: 40, length: 30, height: 20 },
    maxWeightKg: 10.0,
    boxDesi: 8.0,
    boxCost: 14.50,
    cargoBaseFee: 92.00,
    stockCount: 340
  },
  {
    id: "BOX-05-L",
    code: "KOLI-L",
    name: "Büyük Boy Koli (50x40x30 cm)",
    innerDimensions: { width: 50, length: 40, height: 30 },
    maxWeightKg: 20.0,
    boxDesi: 20.0,
    boxCost: 24.00,
    cargoBaseFee: 165.00,
    stockCount: 120
  }
];

export const INITIAL_PACKING_PLANS: PackingPlanResult[] = [
  {
    orderNumber: "TY-94029104",
    recommendedBox: INITIAL_PACKAGING_BOXES[1], // KOLI-XS
    suboptimalBoxAlternative: INITIAL_PACKAGING_BOXES[2], // Personelin eli alışkanlıkla KOLI-S'e gidiyordu
    volumeUtilizationPct: 82,
    totalWeightKg: 0.45,
    estimatedDesi: 1.0,
    estimatedShippingCost: 42.00,
    estimatedSavingsVsManual: 13.00, // ₺55 yerine ₺42 (Siparişte 13 TL kargo tasarrufu!)
    packingSteps: [
      "1x AirFlow Pro Kulaklık orijinal kutusunu tabana yatay yerleştirin.",
      "Koli kapağını kapatmadan önce 1 kat hava yastığı ile sabitleyin.",
      "Kargo etiketini üst düzeye barkod kırışmayacak şekilde yapıştırın."
    ]
  },
  {
    orderNumber: "HB-88192041",
    recommendedBox: INITIAL_PACKAGING_BOXES[0], // ZARF-BALONLU
    suboptimalBoxAlternative: INITIAL_PACKAGING_BOXES[1], // KOLI-XS
    volumeUtilizationPct: 65,
    totalWeightKg: 0.28,
    estimatedDesi: 0.58,
    estimatedShippingCost: 38.00,
    estimatedSavingsVsManual: 4.00,
    packingSteps: [
      "Titanium Akıllı Saat kutusunu koruyucu antistatik poşete koyun.",
      "Balonlu kargo zarfına yerleştirip çift emniyetli yapışkan bandı çekin.",
      "Kargo barkodunu düz yüzeye yapıştırın."
    ]
  },
  {
    orderNumber: "N11-55019284",
    recommendedBox: INITIAL_PACKAGING_BOXES[2], // KOLI-S
    suboptimalBoxAlternative: INITIAL_PACKAGING_BOXES[3], // KOLI-M
    volumeUtilizationPct: 76,
    totalWeightKg: 1.40,
    estimatedDesi: 3.0,
    estimatedShippingCost: 55.00,
    estimatedSavingsVsManual: 37.00, // ₺92 yerine ₺55 (Sipariş başına ₺37 kargo kârı!)
    packingSteps: [
      "Alüminyum Laptop Standı gövdesini sünger destekleriyle kolinin merkezine koyun.",
      "Köşe koruma kartonlarını yerleştirin.",
      "Koli bant makinesi ile H-bantlama metodunu uygulayın."
    ]
  }
];

export const INITIAL_REVIEWS: ProductReviewItem[] = [
  {
    id: "REV-101",
    orderNumber: "TY-94029104",
    marketplace: "trendyol",
    sku: "SKU-HEAD-ANC-001",
    productName: "AirFlow Pro Gürültü Engelleyici Kulaklık",
    customerName: "Caner Y.",
    rating: 1,
    commentDate: "2026-03-14 11:20",
    commentText: "Kutusu ezik büzük geldi, sağ kulaklıktan ses cızırtılı geliyor. Kargo şirketi üstüne basmış resmen! İade edeceğim.",
    sentiment: "VERY_NEGATIVE",
    rootCause: "CARGO_DAMAGE",
    status: "PENDING_ACTION",
    sellerResponseDraft: "Merhaba Caner Bey, öncelikle kargo taşıma sürecinde yaşanan bu talihsiz durum adına çok üzgünüz. Ürününüz 2 yıl resmi garantilidir. İade süreciyle uğraşmamanız için dilerseniz hemen bugün adınıza sıfır kapalı kutu yeni ürün sevk edelim veya Trendyol Asistan üzerinden 'Kargo Hasar Tutanağı' ile anında birebir değişim başlatalım.",
    compensationAction: {
      type: "FREE_REPLACEMENT",
      status: "OFFERED",
      details: "Müşteriye aynı gün sıfır ürün değişimi ve ₺100 mağaza telafi kuponu önerildi."
    }
  },
  {
    id: "REV-102",
    orderNumber: "HB-88192041",
    marketplace: "hepsiburada",
    sku: "SKU-WATCH-ULTRA-BLK",
    productName: "Titanium Akıllı Saat 49mm Siyah",
    customerName: "Ebru S.",
    rating: 2,
    commentDate: "2026-03-13 16:45",
    commentText: "Saat güzel fakat kutudan Türkçe kullanım kılavuzu çıkmadı, telefonla bluetooth eşleşmesi yapamadım saat çalışmıyor sanıp iade edecektim.",
    sentiment: "NEGATIVE",
    rootCause: "USER_ERROR",
    status: "RESOLVED",
    sellerResponseDraft: "Merhaba Ebru Hanım, Bluetooth eşleştirmesi için saatin yan tuşuna 5 sn basılı tutup mobil uygulamadaki 'Cihaz Ekle' menüsünü seçmeniz yeterlidir. PDF Türkçe kılavuz ve adım adım video linkini mesaj yoluyla ilettik. Teknik destek hattımız her an yanınızda.",
    sellerResponseSent: "Müşteriye teknik kılavuz iletildi, kurulum başarıyla tamamlandı ve müşteri puanını 5 yıldıza revize etti.",
    compensationAction: {
      type: "CALL_CUSTOMER",
      status: "ACCEPTED",
      details: "Teknik destek ekibimiz müşteriyi arayıp kurulumu yaptırdı."
    }
  },
  {
    id: "REV-103",
    orderNumber: "N11-55019284",
    marketplace: "n11",
    sku: "SKU-DESK-STND-ALU",
    productName: "Alüminyum 360 Döner Laptop Standı",
    customerName: "Murat K.",
    rating: 1,
    commentDate: "2026-03-12 09:15",
    commentText: "Ben gümüş renk sipariş ettim, bana uzay grisi rengi göndermişsiniz. Dikkat sıfır!",
    sentiment: "VERY_NEGATIVE",
    rootCause: "WRONG_ITEM_SENT",
    status: "PENDING_ACTION",
    sellerResponseDraft: "Merhaba Murat Bey, paketleme esnasında yaşanan barkod karışıklığı sebebiyle özür dileriz. İstediğiniz Gümüş renk laptop standını bugün Yurtiçi Kargo ile adınıza hediye mousepad ile birlikte ücretsiz kargoluyoruz. Yanlış gelen ürünü ise müsait olduğunuzda karşı ödemeli gönderebilirsiniz.",
    compensationAction: {
      type: "DISCOUNT_COUPON",
      status: "OFFERED",
      details: "₺150 hediye çeki ve doğru ürünün ücretsiz kargolanması önerildi."
    }
  },
  {
    id: "REV-104",
    orderNumber: "TY-93821094",
    marketplace: "trendyol",
    sku: "SKU-TECH-KB75-TR",
    productName: "Mekanik RGB Kompakt Klavye %75",
    customerName: "Barış T.",
    rating: 5,
    commentDate: "2026-03-11 14:10",
    commentText: "Muazzam ürün! Tuş hissiyatı, switch sesi ve RGB aydınlatması harika. Paketleme çok özenliydi.",
    sentiment: "POSITIVE",
    rootCause: "HIGH_SATISFACTION",
    status: "RESOLVED",
    sellerResponseSent: "Değerli yorumunuz için çok teşekkür eder, keyifli oyun ve çalışmalar dileriz!"
  }
];

export const INITIAL_POS_RECEIPTS: POSSaleReceipt[] = [
  {
    id: "POS-REC-1001",
    receiptNumber: "FIS-2026-0001",
    saleTime: "2026-03-15 17:42",
    cashierName: "Kasa-1 (Kadir U.)",
    customerName: "Mağaza Müşterisi",
    paymentMethod: "CREDIT_CARD",
    items: [
      {
        sku: "SKU-AUDIO-AF01-BLK",
        name: "AirFlow Pro Kablosuz Bluetooth 5.3 ANC Kulaklık",
        barcode: "8680019284019",
        quantity: 1,
        unitPrice: 1350.00,
        total: 1350.00
      }
    ],
    subtotal: 1125.00,
    discountTotal: 0.00,
    taxTotal: 225.00,
    grandTotal: 1350.00,
    syncedToMarketplaces: true
  },
  {
    id: "POS-REC-1002",
    receiptNumber: "FIS-2026-0002",
    saleTime: "2026-03-15 18:15",
    cashierName: "Kasa-1 (Kadir U.)",
    customerName: "Can Bey",
    paymentMethod: "CASH",
    items: [
      {
        sku: "SKU-DESK-STND-ALU",
        name: "Ergonomik Alüminyum Laptop Standı",
        barcode: "8680019284026",
        quantity: 1,
        unitPrice: 1499.00,
        total: 1499.00
      }
    ],
    subtotal: 1249.17,
    discountTotal: 0.00,
    taxTotal: 249.83,
    grandTotal: 1499.00,
    syncedToMarketplaces: true
  }
];

