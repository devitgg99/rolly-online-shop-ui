'use client';

import { useState } from 'react';
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

type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  active: boolean;
};

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Footwear',
      description: 'Shoes and sneakers for all occasions',
      imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=200',
      parentId: null,
      active: true,
    },
    {
      id: '2',
      name: 'Running Shoes',
      description: 'Performance running footwear',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
      parentId: '1',
      active: true,
    },
    {
      id: '3',
      name: 'Apparel',
      description: 'Clothing and sportswear',
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200',
      parentId: null,
      active: true,
    },
    {
      id: '4',
      name: 'T-Shirts',
      description: 'Casual and sports t-shirts',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
      parentId: '3',
      active: true,
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: string | null }>({
    open: false,
    categoryId: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    parentId: 'none',
    active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const parentId = formData.parentId === 'none' ? null : formData.parentId;
      
      if (editingCategory) {
        setCategories(categories.map(c => 
          c.id === editingCategory.id 
            ? { ...editingCategory, ...formData, parentId }
            : c
        ));
        toast.success('Category updated successfully!');
      } else {
        const newCategory: Category = {
          id: Date.now().toString(),
          ...formData,
          parentId,
        };
        setCategories([...categories, newCategory]);
        toast.success('Category created successfully!');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId || 'none',
      active: category.active,
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

  const confirmDelete = () => {
    if (deleteDialog.categoryId) {
      try {
        setCategories(categories.filter(c => c.id !== deleteDialog.categoryId));
        toast.success('Category deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete category. Please try again.');
      }
    }
    setDeleteDialog({ open: false, categoryId: null });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', imageUrl: '', parentId: 'none', active: true });
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const getParentCategories = () => {
    return categories.filter(c => c.parentId === null);
  };

  const getSubCategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return 'Main Category';
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Unknown';
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
                <DialogTitle className="text-2xl">{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category Image *</Label>
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    showUrlInput={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Category</Label>
                  <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Main Category)</SelectItem>
                      {getParentCategories()
                        .filter(c => !editingCategory || c.id !== editingCategory.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="active" className="cursor-pointer">Active Category</Label>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Update Category' : 'Create Category'}
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
              <CardTitle className="text-sm font-medium">Main Categories</CardTitle>
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
          <div className="space-y-6">
            {/* Main Categories */}
            {getParentCategories().map((parentCategory) => (
              <Card key={parentCategory.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2">
                        <AvatarImage src={parentCategory.imageUrl} alt={parentCategory.name} />
                        <AvatarFallback><FolderTree className="w-6 h-6" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{parentCategory.name}</CardTitle>
                          <Badge variant={parentCategory.active ? 'default' : 'secondary'}>
                            {parentCategory.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {parentCategory.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(parentCategory)}
                      >
                        <Pencil className="w-3 h-3 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(parentCategory.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Subcategories */}
                {getSubCategories(parentCategory.id).length > 0 && (
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getSubCategories(parentCategory.id).map((subCategory) => (
                        <Card key={subCategory.id} className="group hover:shadow-lg transition-all">
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-12 h-12 border group-hover:scale-110 transition-transform">
                                <AvatarImage src={subCategory.imageUrl} alt={subCategory.name} />
                                <AvatarFallback><Layers className="w-4 h-4" /></AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
                                  {subCategory.name}
                                </CardTitle>
                                <Badge variant={subCategory.active ? 'default' : 'secondary'} className="mt-1 text-xs">
                                  {subCategory.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pb-3">
                            <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
                              {subCategory.description}
                            </CardDescription>
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(subCategory)}
                                className="flex-1 h-8 text-xs"
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(subCategory.id)}
                                className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
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
