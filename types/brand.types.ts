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

  export type BrandListResponse = ApiResponse<Brand[]>;