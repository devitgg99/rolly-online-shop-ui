'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createCategoryService, updateCategoryService, deleteCategoryService } from "@/services/categories.service";
import { CategoryRequest } from "@/types/category.types";
import { ApiResponse } from "@/types/api.types";
import { Category } from "@/types/category.types";
import { logger } from "@/lib/logger";
import { sanitizeError } from "@/lib/security";

export async function createCategoryAction(categoryData: CategoryRequest): Promise<ApiResponse<Category>> {
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
    const response = await createCategoryService(categoryData, token);
    return response;
  } catch (error) {
    logger.error("createCategoryAction error", error);
    return {
      success: false,
      message: "Failed to create category",
      error: sanitizeError(error),
    };
  }
}

export async function updateCategoryAction(
  id: string,
  categoryData: CategoryRequest
): Promise<ApiResponse<Category>> {
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
    const response = await updateCategoryService(id, categoryData, token);
    return response;
  } catch (error) {
    logger.error("updateCategoryAction error", error);
    return {
      success: false,
      message: "Failed to update category",
      error: sanitizeError(error),
    };
  }
}

export async function deleteCategoryAction(id: string): Promise<ApiResponse<void>> {
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
    const response = await deleteCategoryService(id, token);
    return response;
  } catch (error) {
    logger.error("deleteCategoryAction error", error);
    return {
      success: false,
      message: "Failed to delete category",
      error: sanitizeError(error),
    };
  }
}
