# API Updates Required - Rolly Online Shop UI Enhancements

This document outlines the API changes needed to support the updated UI features. All endpoints listed below are already being called by the frontend, so ensure your backend is implementing them correctly.

## Overview of Updates

The UI has been enhanced with:
1. Real-time analytics on dashboard
2. Image-focused POS product browsing
3. Improved product management with brand/category filtering
4. Advanced sales filtering by date and payment method
5. Receipt pagination and detailed filtering

---

## Existing API Endpoints (Verify Implementation)

### 1. Sales Endpoints

#### GET /sales
- **Purpose**: Fetch paginated sales list
- **Query Parameters**:
  - `page` (optional, default: 0) - Page number for pagination
  - `size` (optional, default: 10) - Items per page
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "content": [
        {
          "id": "uuid",
          "customerName": "string or null",
          "itemCount": 5,
          "totalAmount": 150.00,
          "profit": 25.50,
          "paymentMethod": "CASH",
          "createdAt": "2024-02-06T10:30:00Z"
        }
      ],
      "page": 0,
      "size": 10,
      "totalElements": 100,
      "totalPages": 10,
      "isFirst": true,
      "isLast": false
    }
  }
  ```
- **Status**: VERIFY - Must return paginated SaleListItem, not full Sale objects

#### GET /sales/today-summary
- **Purpose**: Get today's sales summary metrics
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalSales": 15,
      "totalRevenue": 2500.00,
      "totalCost": 1800.00,
      "totalProfit": 700.00,
      "profitMargin": 28.0,
      "totalProductsSold": 50,
      "periodStart": "2024-02-06T00:00:00Z",
      "periodEnd": "2024-02-06T23:59:59Z"
    }
  }
  ```
- **Status**: VERIFY - Ensure `totalProductsSold` is included

#### GET /sales/{saleId}
- **Purpose**: Get full sale details with items
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "customerName": "string or null",
      "customerPhone": "string or null",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "productName": "string",
          "quantity": 2,
          "unitPrice": 75.00,
          "unitCost": 50.00,
          "subtotal": 150.00,
          "profit": 50.00
        }
      ],
      "totalAmount": 150.00,
      "totalCost": 100.00,
      "discountAmount": 0,
      "profit": 50.00,
      "profitMargin": 33.3,
      "paymentMethod": "CASH",
      "soldBy": "admin-id",
      "notes": "string or null",
      "createdAt": "2024-02-06T10:30:00Z"
    }
  }
  ```
- **Status**: VERIFY - Ensure complete sale details available

#### POST /sales/filter
- **Purpose**: Advanced filtering of sales
- **Request Body**:
  ```json
  {
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-06T23:59:59Z",
    "paymentMethod": "CASH",
    "minAmount": 0,
    "maxAmount": 10000,
    "customerName": "John",
    "sortBy": "date",
    "direction": "desc"
  }
  ```
- **Response**: Same as GET /sales paginated response
- **Status**: VERIFY - Implement if not already available

#### POST /sales
- **Purpose**: Create new sale
- **Request Body**:
  ```json
  {
    "items": [
      {
        "productId": "uuid",
        "quantity": 2
      }
    ],
    "paymentMethod": "CASH",
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "discountAmount": 10.00,
    "notes": "Optional notes"
  }
  ```
- **Response**: Full Sale object with created details
- **Status**: VERIFY - Ensure working correctly

---

### 2. Product Endpoints

#### GET /products/admin
- **Purpose**: Get admin products with cost/profit info
- **Query Parameters**:
  - `page` (optional, default: 0)
  - `size` (optional, default: 20)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "content": [
        {
          "id": "uuid",
          "name": "Product Name",
          "barcode": "123456789",
          "costPrice": 50.00,
          "price": 100.00,
          "discountPercent": 10,
          "discountedPrice": 90.00,
          "profit": 40.00,
          "stockQuantity": 50,
          "imageUrl": "https://...",
          "brandName": "Brand A",
          "categoryName": "Category X"
        }
      ],
      "page": 0,
      "size": 20,
      "totalElements": 200,
      "totalPages": 10,
      "isFirst": true,
      "isLast": false
    }
  }
  ```
- **Status**: VERIFY - Ensure brand and category names included, not just IDs

#### GET /products/{id}
- **Purpose**: Get product details with barcode search
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "Product Name",
      "description": "...",
      "barcode": "123456789",
      "costPrice": 50.00,
      "price": 100.00,
      "discountPercent": 10,
      "discountedPrice": 90.00,
      "profit": 40.00,
      "stockQuantity": 50,
      "imageUrl": "https://...",
      "brand": {
        "id": "uuid",
        "name": "Brand A",
        "logoUrl": "https://...",
        "description": "...",
        "createdAt": "..."
      },
      "category": {
        "id": "uuid",
        "name": "Category X",
        "description": "...",
        "imageUrl": "https://...",
        "parentId": null,
        "createdAt": "..."
      },
      "averageRating": 4.5,
      "createdAt": "..."
    }
  }
  ```
- **Status**: VERIFY - Ensure brand and category objects are complete

#### GET /products/barcode/{barcode}
- **Purpose**: Find product by barcode for POS
- **Response**: AdminProductDetail object (same as GET /products/{id})
- **Status**: VERIFY - Critical for barcode scanning in POS

#### GET /inventory/stats
- **Purpose**: Get inventory statistics
- **Query Parameters**:
  - `lowStockThreshold` (optional, default: 10)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalProducts": 200,
      "totalValue": 50000.00,
      "totalPotentialProfit": 20000.00,
      "lowStockCount": 15,
      "lowStockThreshold": 10
    }
  }
  ```
- **Status**: VERIFY - Needed for inventory dashboard

#### GET /inventory/table
- **Purpose**: Get inventory table with sales data
- **Query Parameters**:
  - `page` (optional, default: 0)
  - `size` (optional, default: 20)
  - `sortBy` (optional, default: "name")
  - `direction` (optional, default: "asc")
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "content": [
        {
          "id": "uuid",
          "name": "Product Name",
          "barcode": "123456789",
          "categoryName": "Category X",
          "brandName": "Brand A",
          "costPrice": 50.00,
          "price": 100.00,
          "discountPercent": 10,
          "sellingPrice": 90.00,
          "profit": 40.00,
          "stockQuantity": 50,
          "stockValue": 2500.00,
          "totalSold": 100,
          "totalRevenue": 9000.00,
          "totalProfit": 4000.00,
          "imageUrl": "https://...",
          "createdAt": "...",
          "updatedAt": "..."
        }
      ],
      "page": 0,
      "size": 20,
      "totalElements": 200,
      "totalPages": 10,
      "isFirst": true,
      "isLast": false
    }
  }
  ```
- **Status**: VERIFY - Needed for inventory table view

---

### 3. Brand Endpoints

#### GET /brands
- **Purpose**: Get all brands (no pagination)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Brand A",
        "logoUrl": "https://...",
        "description": "...",
        "createdAt": "..."
      }
    ]
  }
  ```
- **Status**: VERIFY - Used for filtering in products and POS

---

### 4. Category Endpoints

#### GET /categories
- **Purpose**: Get all categories (no pagination)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Category X",
        "description": "...",
        "imageUrl": "https://...",
        "parentId": null,
        "createdAt": "..."
      }
    ]
  }
  ```
- **Status**: VERIFY - Used for filtering in products and POS

---

## New Features That May Require API Changes

### 1. Receipt Filtering by Date Range
The ReceiptList component now filters receipts by:
- Today
- Yesterday
- Last 7 days
- Custom date range

**Recommendation**: Implement POST /sales/filter endpoint if not already available.

### 2. Payment Method Filtering
Receipts are filtered by payment method (CASH, CARD, E_WALLET, BANK_TRANSFER, COD).

**Status**: Supported by existing GET /sales endpoint - just filter on client side.

### 3. Pagination on Receipt List
Receipts are displayed with pagination (10 per page by default).

**Status**: Already supported - GET /sales supports `page` and `size` parameters.

### 4. Product Images in POS
The POSProductGrid component displays products with images prominently.

**Requirement**: Ensure `imageUrl` field is always populated in product responses.

### 5. Real-time Dashboard Updates
Dashboard updates every 30 seconds with latest sales summary.

**Status**: Supported by GET /sales/today-summary endpoint.

---

## API Best Practices for Frontend

1. **Authentication**: All endpoints require Bearer token in Authorization header
   ```
   Authorization: Bearer {token}
   ```

2. **Error Responses**: Should follow consistent format:
   ```json
   {
     "success": false,
     "message": "Error description",
     "data": null,
     "createdAt": "2024-02-06T10:30:00Z"
   }
   ```

3. **Date Format**: Use ISO 8601 format (2024-02-06T10:30:00Z)

4. **Pagination**: All list endpoints should support:
   - `page` (0-indexed)
   - `size`
   - `totalElements`
   - `totalPages`
   - `isFirst`
   - `isLast`

---

## Testing Checklist

- [ ] Verify all sales are fetched with correct pagination
- [ ] Verify today's summary includes totalProductsSold
- [ ] Verify product details include full brand and category objects
- [ ] Verify barcode search works (GET /products/barcode/{barcode})
- [ ] Verify filtering works on existing sales
- [ ] Verify all product images load correctly
- [ ] Verify inventory statistics are calculated correctly
- [ ] Verify date filtering works for custom ranges

---

## Frontend-Ready Features (No Backend Changes Needed)

1. ✅ Enhanced Dashboard UI with real-time metrics
2. ✅ Image-focused POS product grid
3. ✅ Advanced receipt filtering and pagination
4. ✅ Product management with brand/category filters
5. ✅ Improved UI/UX across all pages
6. ✅ Receipt list with payment method badges
7. ✅ Quick stats on products page
8. ✅ Performance metrics on dashboard

All frontend code is ready to use. Just ensure your API returns data in the expected format!
