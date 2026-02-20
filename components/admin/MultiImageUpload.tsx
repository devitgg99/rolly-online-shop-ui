'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Star, 
  GripVertical,
  X,
  Check,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  fetchProductImages, 
  addProductImage, 
  setPrimaryProductImage, 
  deleteProductImage,
  reorderProductImages 
} from '@/services/products.service';
import { uploadFileAction } from '@/actions/fileupload/fileupload.action';
import type { ProductImage } from '@/types/product.types';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onImagesUpdated?: () => void;
}

export function MultiImageUpload({
  open,
  onOpenChange,
  productId,
  productName,
  onImagesUpdated,
}: MultiImageUploadProps) {
  const { data: session } = useSession();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && productId) {
      loadImages();
    }
  }, [open, productId]);

  const loadImages = async () => {
    if (!session?.backendToken) return;

    setIsLoading(true);
    try {
      const response = await fetchProductImages(productId, session.backendToken);

      if (response.success && response.data) {
        const sortedImages = response.data.sort((a, b) => a.displayOrder - b.displayOrder);
        setImages(sortedImages);
      } else {
        toast.error(response.message || 'មិនអាចផ្ទុករូបភាព');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('មិនអាចផ្ទុករូបភាព');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('សូមជ្រើសរើសឯកសាររូបភាព');
      return;
    }

    if (!session?.backendToken) {
      toast.error('ត្រូវការការផ្ទៀងផ្ទាត់');
      return;
    }

    setUploadingFile(true);
    try {
      // Upload file
      const uploadResponse = await uploadFileAction(file, session.backendToken);
      
      if (!uploadResponse.success || !uploadResponse.data?.url) {
        toast.error(uploadResponse.message || 'មិនអាចបង្ហោះរូបភាព');
        return;
      }

      // Add image to product
      const addResponse = await addProductImage(
        productId,
        {
          url: uploadResponse.data.url,
          isPrimary: images.length === 0, // First image is primary
          displayOrder: images.length,
        },
        session.backendToken
      );

      if (addResponse.success) {
        toast.success('បានបន្ថែមរូបភាពដោយជោគជ័យ!');
        loadImages();
        onImagesUpdated?.();
      } else {
        toast.error(addResponse.message || 'មិនអាចបន្ថែមរូបភាព');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('មិនអាចបង្ហោះរូបភាព');
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!session?.backendToken) return;

    setIsLoading(true);
    try {
      const response = await setPrimaryProductImage(productId, imageId, session.backendToken);

      if (response.success) {
        toast.success('បានកំណត់រូបភាពចម្បង!');
        loadImages();
        onImagesUpdated?.();
      } else {
        toast.error(response.message || 'មិនអាចកំណត់រូបភាពចម្បង');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('មិនអាចកំណត់រូបភាពចម្បង');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (images.length === 1) {
      toast.error('មិនអាចលុបរូបភាពតែមួយបានទេ។ ផលិតផលត្រូវមានរូបភាពយ៉ាងតិចមួយ។');
      return;
    }

    if (!session?.backendToken) return;

    const confirmed = confirm('តើអ្នកប្រាកដថាចង់លុបរូបភាពនេះ?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await deleteProductImage(productId, imageId, session.backendToken);

      if (response.success) {
        toast.success('បានលុបរូបភាពដោយជោគជ័យ!');
        loadImages();
        onImagesUpdated?.();
      } else {
        toast.error(response.message || 'មិនអាចលុបរូបភាព');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('មិនអាចលុបរូបភាព');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !session?.backendToken) return;

    const imageOrders = images.map((img, index) => ({
      imageId: img.id,
      displayOrder: index,
    }));

    setIsLoading(true);
    try {
      const response = await reorderProductImages(
        productId,
        { imageOrders },
        session.backendToken
      );

      if (response.success) {
        toast.success('បានកែលំដាប់រូបភាព!');
        onImagesUpdated?.();
      } else {
        toast.error(response.message || 'មិនអាចរៀបចំលំដាប់រូបភាព');
        loadImages(); // Reload to revert
      }
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('មិនអាចរៀបចំលំដាប់រូបភាព');
      loadImages();
    } finally {
      setIsLoading(false);
      setDraggedIndex(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            គ្រប់គ្រងរូបភាពផលិតផល - {productName}
          </DialogTitle>
          <DialogDescription>
            បង្ហោះ រៀបចំ និងគ្រប់គ្រងរូបភាពផលិតផល។ អូសដើម្បីរៀបចំលំដាប់។ រូបភាពដំបូង ឬរូបភាពផ្កាយគឺជារូបភាពចម្បង។
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Upload Button */}
          <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploadingFile || isLoading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">កំពុងបង្ហោះរូបភាព...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">ចុចដើម្បីបង្ហោះរូបភាព</p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, WEBP រហូតដល់ 10MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Images Grid */}
          {isLoading && images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              កំពុងផ្ទុករូបភាព...
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">មិនទាន់មានរូបភាពបង្ហោះ</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <Card
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'relative group cursor-move transition-all',
                    image.isPrimary && 'ring-2 ring-primary',
                    draggedIndex === index && 'opacity-50'
                  )}
                >
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      <img
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            ចម្បង
                          </div>
                        </div>
                      )}

                      {/* Drag Handle */}
                      <div className="absolute top-2 right-2 bg-background/80 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.isPrimary && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetPrimary(image.id)}
                            disabled={isLoading}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            កំណត់ជាចម្បង
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(image.id)}
                          disabled={isLoading || images.length === 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Display Order */}
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      ទីតាំង: {index + 1}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <div className="text-sm text-muted-foreground text-center pt-4 border-t">
              💡 អូសរូបភាពដើម្បីរៀបចំលំដាប់។ រូបភាពចម្បងនឹងបង្ហាញក្នុងបញ្ជីផលិតផល។
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
