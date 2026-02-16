import { ApiResponse } from "./api.types";

/**
 * Brand object (used in product detail)
 */
export interface ProductBrand {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  createdAt: string;
}

/**
 * Category object (used in product detail)
 */
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  createdAt: string;
}

/**
 * Product object (list view - simplified)
 * Used for public/customer-facing product lists
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  stockQuantity: number;
  imageUrl: string;
  brandName?: string; // Optional - brand is no longer required
  categoryName: string;
}

/**
 * Admin Product object (list view with cost & profit)
 * Used for admin product management
 */
export interface AdminProduct {
  id: string;
  name: string;
  barcode?: string;
  costPrice: number;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  profit: number;
  stockQuantity: number;
  imageUrl: string;
  brandName?: string;
  categoryName: string;
  // Variant fields
  isVariant?: boolean;
  parentProductId?: string | null;
  hasVariants?: boolean;
  variantCode?: string | null;
  variantColor?: string | null;
  variantSize?: string | null;
  totalVariantStock?: number;
  variants?: ProductVariantInline[];
}

/**
 * Inline variant info returned on parent products
 */
export interface ProductVariantInline {
  id: string;
  variantCode?: string | null;
  variantColor?: string | null;
  variantSize?: string | null;
  stockQuantity: number;
  price: number;
  discountedPrice?: number;
  costPrice?: number;
  profit?: number;
  barcode?: string | null;
  imageUrl?: string;
}

/**
 * Product detail object (full details with nested brand/category)
 * Public view - no cost price or profit
 */
export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  stockQuantity: number;
  imageUrl: string;
  brand?: ProductBrand | null; // Optional - brand is no longer required
  category: ProductCategory;
  averageRating: number;
  createdAt: string;
}

/**
 * Admin Product detail object (full details with cost & profit)
 * Admin view - includes cost price and profit
 */
export interface AdminProductDetail {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  costPrice: number;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  profit: number;
  stockQuantity: number;
  imageUrl: string;
  brand?: ProductBrand | null;
  category: ProductCategory;
  averageRating: number;
  createdAt: string;
  // Variant fields
  isVariant?: boolean;
  parentProductId?: string | null;
  hasVariants?: boolean;
  variantCode?: string | null;
  variantColor?: string | null;
  variantSize?: string | null;
  totalVariantStock?: number;
  variants?: ProductVariantInline[];
}

/**
 * Product creation/update request payload (Admin)
 * Includes cost price and optional variant fields
 */
export interface ProductRequest {
  name: string;
  description: string;
  barcode?: string;
  costPrice: number;
  price: number;
  discountPercent: number;
  stockQuantity: number;
  imageUrl: string;
  brandId?: string;
  categoryId: string;
  // Variant fields
  parentProductId?: string;
  isVariant?: boolean;
  variantCode?: string;
  variantColor?: string;
  variantSize?: string;
}

/**
 * Product variant summary (from GET /products/{parentId}/variants)
 */
export interface ProductVariant {
  id: string;
  variantCode?: string | null;
  variantColor?: string | null;
  variantSize?: string | null;
  stockQuantity: number;
  price: number;
  discountedPrice: number;
  costPrice: number;
  profit: number;
  barcode?: string | null;
}

/**
 * Grouped products response (from GET /products/admin/grouped)
 */
export interface GroupedProductListResponse {
  content: AdminProduct[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

/**
 * Can-delete check response
 */
export interface CanDeleteResponse {
  canDelete: boolean;
}

export type ProductVariantsApiResponse = ApiResponse<ProductVariant[]>;
export type GroupedProductListApiResponse = ApiResponse<GroupedProductListResponse>;
export type CanDeleteApiResponse = ApiResponse<CanDeleteResponse>;

/**
 * Paginated product list response (Public)
 */
export interface ProductListResponse {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Paginated admin product list response (includes cost & profit)
 */
export interface AdminProductListResponse {
  content: AdminProduct[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Inventory statistics response
 */
export interface InventoryStats {
  totalProducts: number;
  totalValue: number;           // Inventory worth (cost × stock)
  totalPotentialProfit: number;  // Potential earnings
  lowStockCount: number;         // Need restock
  lowStockThreshold: number;
}

/**
 * Inventory table item with full sales data
 */
export interface InventoryTableItem {
  id: string;
  name: string;
  barcode: string | null;
  categoryName: string;
  brandName?: string; // Optional - brand is no longer required
  costPrice: number;
  price: number;
  discountPercent: number;
  sellingPrice: number;
  profit: number;
  stockQuantity: number;
  stockValue: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inventory table response with pagination
 */
export interface InventoryTableResponse {
  content: InventoryTableItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface InventoryTableApiResponse {
  success: boolean;
  message: string;
  data: InventoryTableResponse | null;
  createdAt: string;
}

/**
 * Product Image object (multi-image support)
 */
export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Stock History Entry
 */
export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  adjustmentType: 'SALE' | 'RESTOCK' | 'DAMAGE' | 'MANUAL' | 'RETURN' | 'CORRECTION';
  reason?: string;
  referenceId?: string;
  referenceType?: 'SALE' | 'PURCHASE_ORDER' | 'ADJUSTMENT';
  updatedBy: string;
  updatedByName: string;
  createdAt: string;
}

/**
 * Stock History Response
 */
export interface StockHistoryResponse {
  content: StockHistoryEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Stock Adjustment Request
 */
export interface StockAdjustmentRequest {
  adjustment: number;
  adjustmentType: 'SALE' | 'RESTOCK' | 'DAMAGE' | 'MANUAL' | 'RETURN' | 'CORRECTION';
  reason?: string;
}

/**
 * Stock Adjustment Response
 */
export interface StockAdjustmentResponse {
  productId: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  adjustmentType: string;
  reason?: string;
  historyEntryId: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * Add Product Image Request
 */
export interface AddProductImageRequest {
  url: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

/**
 * Reorder Images Request
 */
export interface ReorderImagesRequest {
  imageOrders: {
    imageId: string;
    displayOrder: number;
  }[];
}

export type ProductListApiResponse = ApiResponse<ProductListResponse>;
export type AdminProductListApiResponse = ApiResponse<AdminProductListResponse>;
export type ProductDetailApiResponse = ApiResponse<ProductDetail>;
export type AdminProductDetailApiResponse = ApiResponse<AdminProductDetail>;
export type InventoryStatsApiResponse = ApiResponse<InventoryStats>;
export type ProductImagesApiResponse = ApiResponse<ProductImage[]>;
export type ProductImageApiResponse = ApiResponse<ProductImage>;
export type StockHistoryApiResponse = ApiResponse<StockHistoryResponse>;
export type StockAdjustmentApiResponse = ApiResponse<StockAdjustmentResponse>;
