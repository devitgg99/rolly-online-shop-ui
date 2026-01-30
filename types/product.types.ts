// Product Related Types

/**
 * Product object from backend API
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  stockQuantity: number;
  imageUrl: string;
  brandName: string;
  categoryName: string;
}

/**
 * Product creation/update request payload
 */
export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  stockQuantity: number;
  imageUrl: string;
  brandId: string;
  categoryId: string;
}

/**
 * Paginated product list response from backend
 */
export interface ProductListResponse {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Category object
 */
export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  active: boolean;
}

/**
 * Category creation/update request
 */
export interface CategoryRequest {
  name: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  active: boolean;
}

/**
 * Cart item
 */
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

/**
 * Shopping cart
 */
export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}
