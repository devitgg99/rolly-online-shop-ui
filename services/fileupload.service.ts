import { FileUploadResponse } from "@/types/fileUpload.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function uploadFileService(file: File): Promise<FileUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('image', file); // Backend expects 'image' field name

    const response = await fetch(`${API_URL}/images/remove-background`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data;
  }
  catch (error) {
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
      url: "",
    };
  }
}