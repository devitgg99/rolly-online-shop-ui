# Products Category Filter - Backend Update Needed 🔄

## Current Status ⚠️

**The category filter is currently FRONTEND-ONLY**. This means:
- ✅ All products are fetched from backend
- ❌ Filtering by category happens on the client side
- ⚠️ This doesn't scale well with large product catalogs

## What's Needed 🎯

You need to update your products API endpoint to support **category filtering on the backend**.

---

## Backend API Update Required

### Current Endpoint
```
GET /api/v1/admin/products
```

**Current Parameters:**
- `page` (pagination)
- `size` (page size)

### Updated Endpoint (What You Need)
```
GET /api/v1/admin/products
```

**New Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | Integer | Page number (0-based) | `0` |
| `size` | Integer | Items per page | `20` |
| `categoryId` | UUID (Optional) | Filter by category ID | `123e4567-e89b-12d3-a456-426614174000` |
| `search` | String (Optional) | Search by product name or barcode | `"phone"` |

---

## Example Requests

### 1. Get All Products (No Filter)
```bash
GET /api/v1/admin/products?page=0&size=20
```

### 2. Filter by Category
```bash
GET /api/v1/admin/products?page=0&size=20&categoryId=123e4567-e89b-12d3-a456-426614174000
```

### 3. Search Products
```bash
GET /api/v1/admin/products?page=0&size=20&search=phone
```

### 4. Combined: Category + Search
```bash
GET /api/v1/admin/products?page=0&size=20&categoryId=123e4567-e89b-12d3-a456-426614174000&search=samsung
```

---

## Backend Implementation Examples

### Java (Spring Boot)

```java
@GetMapping("/admin/products")
public ResponseEntity<Page<AdminProductDto>> getProducts(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) UUID categoryId,
    @RequestParam(required = false) String search
) {
    Pageable pageable = PageRequest.of(page, size);
    
    // Build specification/criteria
    Specification<Product> spec = Specification.where(null);
    
    if (categoryId != null) {
        spec = spec.and((root, query, cb) -> 
            cb.equal(root.get("category").get("id"), categoryId)
        );
    }
    
    if (search != null && !search.isEmpty()) {
        spec = spec.and((root, query, cb) -> 
            cb.or(
                cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"),
                cb.like(cb.lower(root.get("barcode")), "%" + search.toLowerCase() + "%")
            )
        );
    }
    
    Page<Product> products = productRepository.findAll(spec, pageable);
    return ResponseEntity.ok(products.map(this::mapToAdminDto));
}
```

### Node.js (Express + Prisma)

```javascript
router.get('/admin/products', async (req, res) => {
    const { page = 0, size = 20, categoryId, search } = req.query;
    
    const where = {};
    
    if (categoryId) {
        where.categoryId = categoryId;
    }
    
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } }
        ];
    }
    
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip: parseInt(page) * parseInt(size),
            take: parseInt(size),
            include: {
                category: true,
                brand: true
            }
        }),
        prisma.product.count({ where })
    ]);
    
    res.json({
        success: true,
        data: {
            content: products,
            page: parseInt(page),
            size: parseInt(size),
            totalElements: total,
            totalPages: Math.ceil(total / size)
        }
    });
});
```

### Python (FastAPI + SQLAlchemy)

```python
@router.get("/admin/products")
async def get_products(
    page: int = 0,
    size: int = 20,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.barcode.ilike(search_pattern)
            )
        )
    
    total = query.count()
    products = query.offset(page * size).limit(size).all()
    
    return {
        "success": True,
        "data": {
            "content": [product.to_admin_dto() for product in products],
            "page": page,
            "size": size,
            "totalElements": total,
            "totalPages": (total + size - 1) // size
        }
    }
```

---

## SQL Query Example

```sql
-- Base query
SELECT 
    p.id,
    p.name,
    p.barcode,
    p.cost_price,
    p.price,
    p.discount_percent,
    p.stock_quantity,
    p.image_url,
    c.name as category_name,
    (p.price - p.cost_price) as profit
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE 1=1
    -- Optional: Filter by category
    AND (@categoryId IS NULL OR p.category_id = @categoryId)
    -- Optional: Search
    AND (
        @search IS NULL 
        OR LOWER(p.name) LIKE LOWER(CONCAT('%', @search, '%'))
        OR LOWER(p.barcode) LIKE LOWER(CONCAT('%', @search, '%'))
    )
ORDER BY p.created_at DESC
LIMIT @size OFFSET (@page * @size);
```

---

## Response Format

Your backend should return the same format as before:

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "name": "Product Name",
        "barcode": "123456789",
        "costPrice": 10.00,
        "price": 15.00,
        "discountPercent": 10,
        "discountedPrice": 13.50,
        "profit": 3.50,
        "stockQuantity": 100,
        "imageUrl": "https://...",
        "brandName": "Brand Name",
        "categoryName": "Category Name"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "isFirst": true,
    "isLast": false
  },
  "message": "Products retrieved successfully",
  "createdAt": "2026-02-05T10:30:00Z"
}
```

---

## Frontend Integration (Already Done ✅)

Once you update the backend, the frontend will automatically use the backend filter because:

1. **Export function already sends categoryId** to backend:
```typescript
const filters = {
  categoryId: filterCategory !== 'all' ? filterCategory : undefined,
  search: searchTerm || undefined,
};
```

2. **You'll just need to update the main products fetch** to also use these filters (I can help with this once backend is ready)

---

## What Changed in Frontend? ✅

- ❌ Removed "Quick Filters" dropdown (low stock, high profit, etc.)
- ✅ Kept Category filter (but currently frontend-only)
- ✅ Kept Search filter (but currently frontend-only)

---

## Next Steps

1. ✅ **Update your backend** to support `categoryId` and `search` query parameters
2. ✅ **Test the endpoint** with the examples above
3. ✅ **Let me know** when it's ready, and I'll update the frontend to fetch products with filters from backend instead of filtering locally

---

## Benefits of Backend Filtering

✅ **Scalability** - Works with thousands of products
✅ **Performance** - Only fetch what you need
✅ **Reduced bandwidth** - Don't download all products
✅ **Better pagination** - Accurate page counts per filter

---

## Questions?

If you need any clarification or help implementing the backend, let me know! 🚀
