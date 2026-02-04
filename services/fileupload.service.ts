import { FileUploadResponse, FileUploadApiResponse } from "@/types/fileUpload.types";
import { compressImage, isImageFile, formatFileSize } from "@/lib/image-compression";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function uploadFileService(file: File, token: string): Promise<FileUploadResponse> {
  try {
    console.log('🔍 [Upload Service] Starting upload...');
    console.log('🔍 [Upload Service] API URL:', API_URL);
    console.log('🔍 [Upload Service] File:', file.name, formatFileSize(file.size));
    console.log('🔑 [Upload Service] Token present:', !!token);

    // ✅ OPTIMIZATION: Skip compression here!
    // Image is already compressed in image-upload.tsx component
    // Double compression was causing slowness!
    const fileToUpload = file;
    console.log('⚡ [Upload Service] Using pre-compressed file (fast path)');

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
    formData.append('file', fileToUpload);

    const uploadUrl = `${API_URL}/files/upload`;
    console.log('📤 [Upload Service] Uploading to:', uploadUrl);

    // ✅ OPTIMIZATION: Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('⏱️ [Upload Service] Upload timeout after 30s');
    }, 30000); // 30 second timeout

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal, // Enable timeout
    });

    clearTimeout(timeoutId); // Clear timeout on success

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
    console.log('✅ [Upload Service] File URL:', apiResponse.data.url);
    console.log('✅ [Upload Service] File Name:', apiResponse.data.fileName);
    console.log('✅ [Upload Service] File Size:', apiResponse.data.size, 'bytes');
    console.log('✅ [Upload Service] Content Type:', apiResponse.data.contentType);
    
    // Return with backward compatibility
    return {
      success: apiResponse.success,
      message: apiResponse.message,
      data: apiResponse.data,
      url: apiResponse.data.url, // For backward compatibility
      createdAt: apiResponse.createdAt,
    };
  } catch (error) {
    console.error('❌ [Upload Service] Network error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: "Upload timeout. Please check your connection and try again.",
          error: "Request timed out after 30 seconds",
          url: "",
        };
      }
    }
    
    return {
      success: false,
      message: "Unable to reach server. Check if backend is running and accessible.",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "",
    };
  }
}