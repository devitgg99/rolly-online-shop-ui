import { uploadFileService } from "@/services/fileupload.service";
import { FileUploadResponse } from "@/types/fileUpload.types";

export async function uploadFileAction(file: File, token: string): Promise<FileUploadResponse> {
    const response = await uploadFileService(file, token);
    return response;
}