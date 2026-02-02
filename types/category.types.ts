import { ApiResponse } from "./api.types";

/**
 * Category object
 */
export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category creation/update request
 */
export interface CategoryRequest {
  name: string;
  description: string;
  imageUrl: string;
  parentId?: string | null; // Optional: null for root category, UUID for subcategory
}

export type CategoryListResponse = ApiResponse<Category[]>;
