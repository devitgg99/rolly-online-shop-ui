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
  brandName: string;
  categoryName: string;
}

/**
 * Admin Product object (list view with cost & profit)
 * Used for admin product management
 */
export interface AdminProduct {
  id: string;
  name: string;
  barcode?: string; // Added barcode
  costPrice: number;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  profit: number;
  stockQuantity: number;
  imageUrl: string;
  brandName: string;
  categoryName: string;
}

/**
 * Product detail object (full details with nested brand/category)
 * Public view - no cost price or profit
 */
export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  barcode?: string; // Added barcode
  price: number;
  discountPercent: number;
  discountedPrice: number;
  stockQuantity: number;
  imageUrl: string;
  brand: ProductBrand;
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
  barcode?: string; // Added barcode
  costPrice: number;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  profit: number;
  stockQuantity: number;
  imageUrl: string;
  brand: ProductBrand;
  category: ProductCategory;
  averageRating: number;
  createdAt: string;
}

/**
 * Product creation/update request payload (Admin)
 * Includes cost price
 */
export interface ProductRequest {
  name: string;
  description: string;
  barcode?: string; // Added barcode
  costPrice: number;
  price: number;
  discountPercent: number;
  stockQuantity: number;
  imageUrl: string;
  brandId: string;
  categoryId: string;
}

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

export type ProductListApiResponse = ApiResponse<ProductListResponse>;
export type AdminProductListApiResponse = ApiResponse<AdminProductListResponse>;
export type ProductDetailApiResponse = ApiResponse<ProductDetail>;
export type AdminProductDetailApiResponse = ApiResponse<AdminProductDetail>;
export type InventoryStatsApiResponse = ApiResponse<InventoryStats>;
