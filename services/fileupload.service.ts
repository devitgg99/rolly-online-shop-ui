import { FileUploadResponse, FileUploadApiResponse } from "@/types/fileUpload.types";
import { compressImage, isImageFile, formatFileSize } from "@/lib/image-compression";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function uploadFileService(file: File): Promise<FileUploadResponse> {
  try {
    console.log('🔍 [Upload Service] Starting upload...');
    console.log('🔍 [Upload Service] API URL:', API_URL);
    console.log('🔍 [Upload Service] Original file:', file.name, formatFileSize(file.size));

    // Compress image before upload
    let fileToUpload = file;
    if (isImageFile(file)) {
      try {
        console.log('🗜️  [Upload Service] Compressing image...');
        fileToUpload = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          outputFormat: 'image/jpeg',
        });
        console.log('✅ [Upload Service] Compression complete:', formatFileSize(fileToUpload.size));
      } catch (compressionError) {
        console.warn('⚠️  [Upload Service] Compression failed, uploading original:', compressionError);
        // If compression fails, upload original file
        fileToUpload = file;
      }
    }

    if (!API_URL) {
      console.error('❌ [Upload Service] API_URL is not defined!');
      return {
        success: false,
        message: "API URL not configured. Please check .env.local",
        error: "NEXT_PUBLIC_API_URL is missing",
        url: "",
      };
    }

    const formData = new FormData();
    formData.append('file', fileToUpload); // Backend expects 'file' field name

    const uploadUrl = `${API_URL}/file/upload`;
    console.log('📤 [Upload Service] Uploading to:', uploadUrl);
    console.log('📤 [Upload Service] Field name: file');

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    console.log('📦 [Upload Service] Response status:', response.status);
    console.log('📦 [Upload Service] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Upload Service] Error response:', errorText);
      return {
        success: false,
        message: `Server error: ${response.status} - ${response.statusText}`,
        error: errorText,
        url: "",
      };
    }

    const apiResponse: FileUploadApiResponse = await response.json();
    console.log('✅ [Upload Service] Success:', apiResponse);
    
    // Transform new API format to legacy format for backward compatibility
    return {
      success: apiResponse.success,
      message: apiResponse.message,
      data: { url: apiResponse.data },
      url: apiResponse.data, // URL is directly in data field
      createdAt: apiResponse.createdAt,
    };
  }
  catch (error) {
    console.error('❌ [Upload Service] Network error:', error);
    return {
      success: false,
      message: "Unable to reach server. Check if backend is running and accessible.",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "",
    };
  }
}