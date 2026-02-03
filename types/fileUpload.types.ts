import { ApiResponse } from "./api.types";

/**
 * File upload data object
 */
export interface FileUploadData {
  fileName: string;
  url: string;
  size: number;
  contentType: string;
}

/**
 * API response for file upload
 */
export interface FileUploadApiResponse {
  success: boolean;
  message: string;
  data: FileUploadData;
  errors?: string[];
  createdAt: string;
}

/**
 * Legacy response format for backward compatibility
 */
export interface FileUploadResponse extends ApiResponse<FileUploadData> {
  url: string; // For backward compatibility
} 