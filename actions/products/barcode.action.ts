'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { findProductByBarcode } from "@/services/products.service";
import { AdminProductDetailApiResponse } from "@/types/product.types";

export async function findProductByBarcodeAction(barcode: string): Promise<AdminProductDetailApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await findProductByBarcode(barcode, token);
    
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to find product by barcode",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}
