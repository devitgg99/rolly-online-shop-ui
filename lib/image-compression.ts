/**
 * Image Compression Utility
 * Compresses images before upload to reduce bandwidth and storage
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  outputFormat: 'image/jpeg',
};

/**
 * Compress an image file before upload
 * @param file - The original image file
 * @param options - Compression options
 * @returns Promise<File> - Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // If file is already small, return as-is
  const MIN_FILE_SIZE = 100 * 1024; // 100KB
  if (file.size < MIN_FILE_SIZE) {
    console.log('📦 Image already small, skipping compression:', file.size, 'bytes');
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let objectURL: string | null = null;

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          const maxW = opts.maxWidth!;
          const maxH = opts.maxHeight!;

          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', { willReadFrequently: false });
          if (!ctx) {
            // Cleanup
            if (objectURL) URL.revokeObjectURL(objectURL);
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              // Cleanup image object and object URL
              img.src = '';
              if (objectURL) {
                URL.revokeObjectURL(objectURL);
              }

              if (!blob) {
                // Cleanup canvas
                canvas.width = 0;
                canvas.height = 0;
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: opts.outputFormat,
                lastModified: Date.now(),
              });

              const originalSizeKB = (file.size / 1024).toFixed(2);
              const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
              const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

              console.log('✅ Image compressed successfully!');
              console.log(`📦 Original: ${originalSizeKB}KB → Compressed: ${compressedSizeKB}KB`);
              console.log(`💾 Saved: ${savings}% (${width}x${height})`);

              // Cleanup canvas
              canvas.width = 0;
              canvas.height = 0;

              resolve(compressedFile);
            },
            opts.outputFormat,
            opts.quality
          );
        } catch (error) {
          // Cleanup on error
          if (objectURL) URL.revokeObjectURL(objectURL);
          img.src = '';
          reject(error);
        }
      };

      img.onerror = () => {
        // Cleanup on error
        if (objectURL) URL.revokeObjectURL(objectURL);
        img.src = '';
        reject(new Error('Failed to load image'));
      };

      // Use object URL instead of data URL for better memory management on mobile
      const dataUrl = e.target?.result as string;
      objectURL = dataUrl;
      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
