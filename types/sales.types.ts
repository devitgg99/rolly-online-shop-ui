import { ApiResponse } from "./api.types";

export type PaymentMethod = 'CASH' | 'CARD' | 'E_WALLET' | 'BANK_TRANSFER' | 'COD';

export interface SaleItem {
  productId: string;
  quantity: number;
}

export interface SaleItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  profit: number;
}

export interface SaleRequest {
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Sale list item (from GET /sales) - simplified
export interface SaleListItem {
  id: string;
  customerName?: string;
  itemCount: number; // NOT items array!
  totalAmount: number;
  profit: number;
  paymentMethod: string;
  createdAt: string;
}

// Full sale details (from GET /sales/{id})
export interface Sale {
  id: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItemResponse[];
  totalAmount: number;
  totalCost: number;
  discountAmount?: number;
  profit: number;
  profitMargin: number;
  paymentMethod: string;
  soldBy: string;
  notes?: string;
  createdAt: string;
}

export interface SaleSummary {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalProductsSold?: number; // Total quantity of products sold (optional until backend implements)
  periodStart?: string;
  periodEnd?: string;
}

export interface SaleListResponse {
  content: SaleListItem[]; // Use SaleListItem, not Sale!
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean; // Changed from 'first' to match API
  isLast: boolean; // Changed from 'last' to match API
}

// API Response Types
export interface SaleApiResponse {
  success: boolean;
  message: string;
  data: Sale | null;
  createdAt: string;
}

export interface SaleListApiResponse {
  success: boolean;
  message: string;
  data: SaleListResponse | null;
  createdAt: string;
}

export interface SaleSummaryApiResponse {
  success: boolean;
  message: string;
  data: SaleSummary | null;
  createdAt: string;
}

/**
 * Product sales statistics
 */
export interface ProductSalesStats {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  currentStock: number;
}

/**
 * Top selling product item
 */
export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalQuantitySold: number;
}

export interface ProductSalesStatsApiResponse {
  success: boolean;
  message: string;
  data: ProductSalesStats | null;
  createdAt: string;
}

export interface TopSellingProductsApiResponse {
  success: boolean;
  message: string;
  data: TopSellingProduct[] | null;
  createdAt: string;
}

/**
 * Sales Analytics Data
 */
export interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  salesByDay: {
    date: string;
    sales: number;
    revenue: number;
    profit: number;
  }[];
  salesByPaymentMethod: {
    CASH: number | { count: number; revenue: number };
    CARD: number | { count: number; revenue: number };
    ONLINE: number | { count: number; revenue: number };
  };
  salesByHour: {
    hour: number;
    sales: number;
  }[];
  topCustomers: {
    name: string;
    totalSpent: number;
    orderCount: number;
  }[];
  profitMarginTrend: {
    date: string;
    margin: number;
  }[];
}

export interface SalesAnalyticsApiResponse {
  success: boolean;
  message: string;
  data: SalesAnalytics | null;
  createdAt: string;
}

/**
 * Refund & Return Types
 */
export interface RefundItemRequest {
  productId: string;
  quantity: number;
  reason: string;
}

export interface RefundRequest {
  items: RefundItemRequest[];
  refundMethod: 'CASH' | 'CARD' | 'STORE_CREDIT';
  notes?: string;
}

export interface RefundItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
}

export interface Refund {
  id: string;
  saleId: string;
  items: RefundItem[];
  totalRefundAmount: number;
  refundMethod: string;
  processedBy: string;
  processedByName: string;
  notes?: string;
  createdAt: string;
}

export interface RefundListResponse {
  content: Refund[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface RefundApiResponse {
  success: boolean;
  message: string;
  data: Refund | null;
  createdAt: string;
}

export interface RefundListApiResponse {
  success: boolean;
  message: string;
  data: RefundListResponse | null;
  createdAt: string;
}

/**
 * Sale Status Type
 */
export type SaleStatus = 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

/**
 * Enhanced Sale with refund info
 */
export interface SaleWithRefunds extends Sale {
  status: SaleStatus;
  refundedAmount?: number;
  refunds?: Refund[];
}
