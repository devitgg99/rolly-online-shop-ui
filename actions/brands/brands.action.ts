'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createBrandService, updateBrandService, deleteBrandService } from "@/services/brands.service";
import { BrandRequest } from "@/types/brand.types";
import { ApiResponse } from "@/types/api.types";
import { Brand } from "@/types/brand.types";
import { logger } from "@/lib/logger";
import { sanitizeError } from "@/lib/security";

export async function createBrandAction(brandData: BrandRequest): Promise<ApiResponse<Brand>> {
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
    const response = await createBrandService(brandData, token);
    return response;
  } catch (error) {
    logger.error("createBrandAction error", error);
    return {
      success: false,
      message: "Failed to create brand",
      error: sanitizeError(error),
    };
  }
}

export async function updateBrandAction(
  id: string,
  brandData: BrandRequest
): Promise<ApiResponse<Brand>> {
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
    const response = await updateBrandService(id, brandData, token);
    return response;
  } catch (error) {
    logger.error("updateBrandAction error", error);
    return {
      success: false,
      message: "Failed to update brand",
      error: sanitizeError(error),
    };
  }
}

export async function deleteBrandAction(id: string): Promise<ApiResponse<void>> {
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
    const response = await deleteBrandService(id, token);
    return response;
  } catch (error) {
    logger.error("deleteBrandAction error", error);
    return {
      success: false,
      message: "Failed to delete brand",
      error: sanitizeError(error),
    };
  }
}
