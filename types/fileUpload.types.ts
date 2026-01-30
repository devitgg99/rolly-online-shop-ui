import { ApiResponse } from "./api.types";

export interface FileUpload {
  url: string;
}

export interface FileUploadResponse extends ApiResponse<FileUpload>{
    url: string;
} 