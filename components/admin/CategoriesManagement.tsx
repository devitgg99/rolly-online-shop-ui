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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Category } from '@/types/category.types';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/actions/categories/categories.action';
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
    parentId: 'none', // 'none' for root, or UUID for subcategory
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare category data
      const categoryData = {
        name: formData.name,
        description: formData.description,
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
    setFormData({ name: '', description: '', parentId: 'none' });
    setDialogOpen(false);
    setEditingCategory(null);
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

        {/* Categories Table */}
        {categories.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const parentCategory = categories.find(c => c.id === category.parentId);
                  const subcategoryCount = getSubCategories(category.id).length;
                  
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {category.description || 'No description'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {category.parentId ? (
                          <Badge variant="secondary">
                            <Layers className="w-3 h-3 mr-1" />
                            Subcategory
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-600">
                            <FolderTree className="w-3 h-3 mr-1" />
                            Root
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {parentCategory ? (
                          <span className="text-sm">{parentCategory.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                        {subcategoryCount > 0 && !category.parentId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {subcategoryCount} sub
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            disabled={isLoading}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-destructive hover:bg-destructive/10"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
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
