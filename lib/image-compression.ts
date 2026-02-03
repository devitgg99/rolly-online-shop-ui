/**
 * Image Compression Utility
 * Compresses images before upload to reduce bandwidth and storage
 * Handles mobile camera orientation issues
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
 * Get EXIF orientation from image file
 * This fixes the black image issue from mobile cameras
 */
function getOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1); // Not a JPEG, no orientation
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(1);
          return;
        }
        const marker = view.getUint16(offset, false);
        offset += 2;
        
        if (marker === 0xFFE1) {
          const little = view.getUint16(offset + 8, false) === 0x4949;
          offset += view.getUint16(offset, false);
          const tags = view.getUint16(offset, little);
          offset += 2;
          
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              resolve(view.getUint16(offset + (i * 12) + 8, little));
              return;
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      resolve(1);
    };
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file);
  });
}

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

  // Get image orientation (fixes black image from mobile camera)
  const orientation = await getOrientation(file);
  console.log('📱 Image orientation:', orientation);

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

          // For orientations 5-8, swap width and height
          const shouldSwapDimensions = orientation >= 5 && orientation <= 8;
          
          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas with correct dimensions based on orientation
          const canvas = document.createElement('canvas');
          if (shouldSwapDimensions) {
            canvas.width = height;
            canvas.height = width;
          } else {
            canvas.width = width;
            canvas.height = height;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: false });
          if (!ctx) {
            // Cleanup
            if (objectURL) URL.revokeObjectURL(objectURL);
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Apply transformations based on EXIF orientation
          switch (orientation) {
            case 2:
              ctx.transform(-1, 0, 0, 1, width, 0);
              break;
            case 3:
              ctx.transform(-1, 0, 0, -1, width, height);
              break;
            case 4:
              ctx.transform(1, 0, 0, -1, 0, height);
              break;
            case 5:
              ctx.transform(0, 1, 1, 0, 0, 0);
              break;
            case 6:
              ctx.transform(0, 1, -1, 0, height, 0);
              break;
            case 7:
              ctx.transform(0, -1, -1, 0, height, width);
              break;
            case 8:
              ctx.transform(0, -1, 1, 0, 0, width);
              break;
            default:
              // Orientation 1 or undefined - no transformation needed
              break;
          }

          // Draw image with correct orientation
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
              console.log(`💾 Saved: ${savings}% (${canvas.width}x${canvas.height})`);

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

      // Use data URL to load image
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
