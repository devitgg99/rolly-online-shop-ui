import { uploadFileService } from "@/services/fileupload.service";
import { FileUploadResponse } from "@/types/fileUpload.types";

export async function uploadFileAction(file: File): Promise<FileUploadResponse> {
    const response = await uploadFileService(file);
    return response;
}