'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tag, Plus, Pencil, Trash2, FolderTree, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Category } from '@/types/category.types';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/actions/categories/categories.action';
import { uploadFileAction } from '@/actions/fileupload/fileupload.action';
import { useRouter } from 'next/navigation';

interface CategoriesManagementProps {
  categories: Category[];
}

export default function CategoriesManagement({ categories: initialCategories }: CategoriesManagementProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: string | null }>({
    open: false,
    categoryId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    parentId: 'none', // 'none' for root, or UUID for subcategory
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (!formData.imageUrl.trim()) {
      toast.error('Category image is required');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare category data
      const categoryData = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        // If 'none' is selected, don't send parentId (creates root category)
        // If UUID is selected, send it (creates subcategory)
        ...(formData.parentId !== 'none' && { parentId: formData.parentId }),
      };

      if (editingCategory) {
        const response = await updateCategoryAction(editingCategory.id, categoryData);
        
        if (response.success && response.data) {
          setCategories(categories.map(c => 
            c.id === editingCategory.id ? response.data! : c
          ));
          toast.success('Category updated successfully! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'Failed to update category');
        }
      } else {
        const response = await createCategoryAction(categoryData);
        
        if (response.success && response.data) {
          setCategories([...categories, response.data]);
          toast.success('Category created successfully! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'Failed to create category');
        }
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId || 'none',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const hasChildren = categories.some(c => c.parentId === id);
    
    if (hasChildren) {
      toast.error('Cannot delete category with subcategories. Please delete or reassign subcategories first.');
      return;
    }

    setDeleteDialog({ open: true, categoryId: id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.categoryId) return;

    setIsLoading(true);

    try {
      const response = await deleteCategoryAction(deleteDialog.categoryId);
      
      if (response.success) {
        setCategories(categories.filter(c => c.id !== deleteDialog.categoryId));
        toast.success('Category deleted successfully! ✅');
        router.refresh();
      } else {
        toast.error(response.message || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('Failed to delete category. Please try again.');
    } finally {
      setIsLoading(false);
      setDeleteDialog({ open: false, categoryId: null });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', imageUrl: '', parentId: 'none' });
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      if (!session?.backendToken) {
        toast.error('Authentication required');
        throw new Error('No authentication token');
      }

      toast.info('Uploading image... 📤');
      
      const response = await uploadFileAction(file, session.backendToken);
      
      if (response.success && response.data?.url) {
        toast.success('Image uploaded successfully! ✅');
        return response.data.url;
      } else {
        toast.error(response.message || 'Failed to upload image');
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      throw error;
    }
  };

  const getParentCategories = () => {
    return categories.filter(c => c.parentId === null);
  };

  const getSubCategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/50">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Categories</h1>
                <p className="text-muted-foreground">Organize your products</p>
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg" onClick={() => { setEditingCategory(null); resetForm(); }}>
                <Plus className="w-5 h-5 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Update the category information below' : 'Fill in the details to add a new category'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category Image *</Label>
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    showUrlInput={false}
                    onFileSelect={handleFileUpload}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Category</Label>
                  <Select 
                    value={formData.parentId} 
                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Root Category)</SelectItem>
                      {getParentCategories()
                        .filter(c => !editingCategory || c.id !== editingCategory.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave as "None" to create a root category, or select a parent to create a subcategory
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description..."
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                All categories
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Root Categories</CardTitle>
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{getParentCategories().length}</div>
              <p className="text-xs text-muted-foreground">
                Top level
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subcategories</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {categories.filter(c => c.parentId !== null).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Nested categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="space-y-8">
            {/* Root Categories Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FolderTree className="w-6 h-6 text-purple-600" />
                Root Categories
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {getParentCategories().map((category) => (
                  <Card key={category.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-500/20">
                    {/* Image Section with Gradient Background */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-indigo-950/20 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                      <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                        <AvatarImage src={category.imageUrl} alt={category.name} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl font-bold">
                          {category.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Floating Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className="shadow-lg backdrop-blur-sm bg-purple-600/90">
                          Root Category
                        </Badge>
                      </div>

                      {/* Subcategory Count Badge */}
                      {getSubCategories(category.id).length > 0 && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="shadow-lg backdrop-blur-sm">
                            <Layers className="w-3 h-3 mr-1" />
                            {getSubCategories(category.id).length} Subcategories
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <CardHeader className="text-center pb-3 space-y-2">
                      <CardTitle className="text-xl font-bold group-hover:text-purple-600 transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2 min-h-[40px] px-2">
                        {category.description || 'No description available'}
                      </CardDescription>
                    </CardHeader>

                    {/* Action Buttons */}
                    <CardContent className="pt-0 pb-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="flex-1 h-9 hover:bg-purple-600 hover:text-white transition-all"
                          disabled={isLoading}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="flex-1 h-9 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30 transition-all"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>

                    {/* Subcategories Preview */}
                    {getSubCategories(category.id).length > 0 && (
                      <CardContent className="pt-0 pb-4 border-t">
                        <div className="flex -space-x-2 mt-3">
                          {getSubCategories(category.id).slice(0, 3).map((sub) => (
                            <Avatar key={sub.id} className="w-8 h-8 border-2 border-white dark:border-gray-800">
                              <AvatarImage src={sub.imageUrl} alt={sub.name} className="object-cover" />
                              <AvatarFallback className="text-xs">{sub.name[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {getSubCategories(category.id).length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold">
                              +{getSubCategories(category.id).length - 3}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Subcategories Section */}
            {getParentCategories().some(cat => getSubCategories(cat.id).length > 0) && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-blue-600" />
                  All Subcategories
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {getParentCategories().flatMap(parent => 
                    getSubCategories(parent.id).map((subCategory) => (
                      <Card key={subCategory.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border hover:border-blue-500/20">
                        {/* Compact Image Header */}
                        <div className="relative h-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 flex items-center justify-center">
                          <Avatar className="w-20 h-20 border-2 border-white shadow-lg group-hover:scale-110 transition-transform">
                            <AvatarImage src={subCategory.imageUrl} alt={subCategory.name} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xl">
                              {subCategory.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <CardHeader className="text-center pb-2">
                          <Badge variant="outline" className="mx-auto mb-2 text-xs">
                            <Layers className="w-3 h-3 mr-1" />
                            {parent.name}
                          </Badge>
                          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                            {subCategory.name}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-2 mt-1">
                            {subCategory.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-0 pb-3">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(subCategory)}
                              className="flex-1 h-8 text-xs"
                              disabled={isLoading}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(subCategory.id)}
                              className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10"
                              disabled={isLoading}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                <Tag className="w-10 h-10 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Start by creating your first category to organize your products
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, categoryId: null })}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
