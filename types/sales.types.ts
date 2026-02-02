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
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
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
  periodStart?: string;
  periodEnd?: string;
}

export interface SaleListResponse {
  content: SaleListItem[]; // Use SaleListItem, not Sale!
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean; // NOT isFirst!
  last: boolean; // NOT isLast!
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
