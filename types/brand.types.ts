import { ApiResponse } from "./api.types";

/**
 * Brand object
 */
export interface Brand {
    id: string;
    name: string;
    logoUrl: string;
    description: string;
    createdAt: string;
  }
  
  /**
   * Brand creation/update request
   */
  export interface BrandRequest {
    name: string;
    logoUrl: string;
    description: string;
  }

  /**
   * Brand Analytics - Product count and value per brand
   */
  export interface BrandAnalytics {
    brandId: string;
    brandName: string;
    productCount: number;
    totalInventoryValue: number;
    totalPotentialProfit: number;
    avgProductPrice: number;
  }

  /**
   * Brand Statistics Summary
   */
  export interface BrandStats {
    totalBrands: number;
    brandsWithProducts: number;
    brandsWithoutProducts: number;
    totalProducts: number;
    totalInventoryValue: number;
  }

  export type BrandListResponse = ApiResponse<Brand[]>;
  export type BrandAnalyticsResponse = ApiResponse<BrandAnalytics[]>;
  export type BrandStatsResponse = ApiResponse<BrandStats>;