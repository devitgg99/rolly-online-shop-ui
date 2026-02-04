'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  createProductService, 
  updateProductService, 
  deleteProductService,
  fetchInventoryStats,
  fetchLowStockProducts,
  fetchInventoryTable
} from "@/services/products.service";
import { 
  ProductRequest, 
  AdminProductDetailApiResponse,
  InventoryStatsApiResponse,
  AdminProductListApiResponse,
  InventoryTableApiResponse
} from "@/types/product.types";
import { ApiResponse } from "@/types/api.types";
import { logger } from "@/lib/logger";
import { sanitizeError } from "@/lib/security";

export async function createProductAction(productData: ProductRequest): Promise<AdminProductDetailApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        error: "No authentication token",
      };
    }

    const token = (session as any).backendToken;
    const response = await createProductService(productData, token);
    return response;
  } catch (error) {
    logger.error("createProductAction error", error);
    return {
      success: false,
      message: "Failed to create product",
      error: sanitizeError(error),
    };
  }
}

export async function updateProductAction(
  id: string,
  productData: ProductRequest
): Promise<AdminProductDetailApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        error: "No authentication token",
      };
    }

    const token = (session as any).backendToken;
    const response = await updateProductService(id, productData, token);
    return response;
  } catch (error) {
    logger.error("updateProductAction error", error);
    return {
      success: false,
      message: "Failed to update product",
      error: sanitizeError(error),
    };
  }
}

export async function deleteProductAction(id: string): Promise<ApiResponse<void>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        error: "No authentication token",
      };
    }

    const token = (session as any).backendToken;
    const response = await deleteProductService(id, token);
    return response;
  } catch (error) {
    logger.error("deleteProductAction error", error);
    return {
      success: false,
      message: "Failed to delete product",
      error: sanitizeError(error),
    };
  }
}

export async function fetchInventoryStatsAction(
  lowStockThreshold: number = 10
): Promise<InventoryStatsApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        error: "No authentication token",
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchInventoryStats(token, lowStockThreshold);
    return response;
  } catch (error) {
    logger.error("fetchInventoryStatsAction error", error);
    return {
      success: false,
      message: "Failed to fetch inventory stats",
      error: sanitizeError(error),
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchLowStockProductsAction(
  threshold: number = 10,
  page: number = 0,
  size: number = 20
): Promise<AdminProductListApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        error: "No authentication token",
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchLowStockProducts(token, threshold, page, size);
    return response;
  } catch (error) {
    logger.error("fetchLowStockProductsAction error", error);
    return {
      success: false,
      message: "Failed to fetch low stock products",
      error: sanitizeError(error),
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchInventoryTableAction(
  page: number = 0,
  size: number = 20,
  sortBy: string = "name",
  direction: string = "asc"
): Promise<InventoryTableApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchInventoryTable(page, size, sortBy, direction, token);
    
    return response;
  } catch (error) {
    logger.error("fetchInventoryTableAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch inventory table",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}
