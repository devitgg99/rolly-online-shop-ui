import { ApiResponse } from "./api.types";

export interface FileUpload {
  url: string;
}

// New API response format: data is the URL string directly
export interface FileUploadApiResponse {
  success: boolean;
  message: string;
  data: string; // The URL string
  createdAt?: string;
  error?: string;
}

export interface FileUploadResponse extends ApiResponse<FileUpload> {
  url: string;
} 