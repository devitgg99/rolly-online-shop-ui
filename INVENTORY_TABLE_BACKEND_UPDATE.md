# Inventory Table Backend Update Required 🔄

## Overview
The Inventory Table now supports the same filters as the Grid View. You need to update the backend endpoint to support filtering.

---

## Backend API Update Needed

### Current Endpoint
```
GET /api/v1/products/admin/inventory
```

### Required New Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Integer | No | Page number (default: 0) |
| `size` | Integer | No | Items per page (default: 20) |
| `sortBy` | String | No | Sort field (default: name) |
| `direction` | String | No | asc or desc (default: asc) |
| **`categoryId`** | **UUID** | **No** | **Filter by category ID** |
| **`search`** | **String** | **No** | **Search by product name or barcode** |

---

## Example Requests

### 1. Get All Inventory (No Filter)
```bash
GET /api/v1/products/admin/inventory?page=0&size=20&sortBy=name&direction=asc
```

### 2. Filter by Category
```bash
GET /api/v1/products/admin/inventory?categoryId=123e4567-e89b-12d3-a456-426614174000&page=0&size=20
```

### 3. Search Products
```bash
GET /api/v1/products/admin/inventory?search=phone&page=0&size=20
```

### 4. Combined: Category + Search
```bash
GET /api/v1/products/admin/inventory?categoryId=123e4567&search=samsung&page=0&size=20&sortBy=totalRevenue&direction=desc
```

---

## Response Format (Same as Before)

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "name": "Product Name",
        "barcode": "123456789",
        "categoryName": "Electronics",
        "brandName": null,
        "costPrice": 100.00,
        "price": 150.00,
        "discountPercent": 10,
        "sellingPrice": 135.00,
        "profit": 35.00,
        "stockQuantity": 50,
        "stockValue": 5000.00,
        "totalSold": 25,
        "totalRevenue": 3375.00,
        "totalProfit": 875.00,
        "imageUrl": "https://...",
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-02-05T00:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "isFirst": true,
    "isLast": false
  },
  "message": "Inventory retrieved successfully"
}
```

---

## Backend Implementation Example (Java/Spring Boot)

```java
@GetMapping("/products/admin/inventory")
public ResponseEntity<Page<InventoryItemDto>> getInventoryTable(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "name") String sortBy,
    @RequestParam(defaultValue = "asc") String direction,
    @RequestParam(required = false) UUID categoryId,
    @RequestParam(required = false) String search
) {
    Pageable pageable = PageRequest.of(
        page, 
        size, 
        Sort.by(Sort.Direction.fromString(direction), sortBy)
    );
    
    // Build specification
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
    return ResponseEntity.ok(products.map(this::mapToInventoryDto));
}
```

---

## What Changed in Frontend? ✅

### Inventory Table Component
- ✅ Added category filter dropdown (same as Grid View)
- ✅ Debounced search (300ms delay)
- ✅ Removed frontend filtering (now uses backend)
- ✅ Auto page reset when filters change
- ✅ Clear filters button

### Grid View Component
- ✅ Added pagination controls
- ✅ Shows "Page X of Y"
- ✅ Previous/Next buttons
- ✅ Product count display

### Both Views Now Have:
- ✅ Category filter
- ✅ Search box
- ✅ Backend filtering
- ✅ Pagination
- ✅ Loading states
- ✅ Clear filters button

---

## Summary of Both Endpoints

### 1. Products List (Grid View)
```
GET /api/v1/products/admin/all?page=0&size=20&categoryId=xxx&search=yyy
```

### 2. Inventory Table
```
GET /api/v1/products/admin/inventory?page=0&size=20&categoryId=xxx&search=yyy&sortBy=totalRevenue&direction=desc
```

**Both endpoints need to support:**
- ✅ `categoryId` parameter
- ✅ `search` parameter
- ✅ Pagination
- ✅ Sorting

---

## Next Steps

1. **Update your backend** to support `categoryId` and `search` on the inventory endpoint
2. **Test the endpoint** with the examples above
3. **Verify** that both product list and inventory table endpoints work with filters

---

## Testing Checklist

### Inventory Table
- [ ] Filter by category works
- [ ] Search by product name works
- [ ] Search by barcode works
- [ ] Combined category + search works
- [ ] Sorting still works with filters
- [ ] Pagination works with filters
- [ ] Clear filters button works

### Grid View
- [ ] Pagination controls appear
- [ ] Previous/Next buttons work
- [ ] Page count is correct
- [ ] Pagination works with filters
- [ ] Loading state shows during fetch

---

## Questions?

Let me know when you've updated the backend endpoints! 🚀
