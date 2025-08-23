import { auditClient } from '@/services/auditClient';

/**
 * Product Catalog Service
 * Manages product catalog data for SOF and bundle creation
 */
export const productCatalogService = {
  // Cache for products to reduce API calls
  _productsCache: null,
  _cacheExpiry: null,
  _cacheDuration: 5 * 60 * 1000, // 5 minutes

  /**
   * Fetch all products from the catalog
   * Implements caching to reduce API calls
   */
  async getAllProducts() {
    // Check cache
    if (this._productsCache && this._cacheExpiry && Date.now() < this._cacheExpiry) {
      return this._productsCache;
    }

    try {
      const response = await auditClient.http.get('/products/by-category', {
        params: {
          active_only: true,
          currency: 'USD'
        }
      });
      
      // Flatten products from all categories
      const products = [];
      if (response.data?.categories) {
        response.data.categories.forEach(category => {
          category.products.forEach(product => {
            products.push({
              ...product,
              category: category.category_name,
              category_key: category.category_key,
              rack_price: product.default_rack_price,
              currency: product.default_currency
            });
          });
        });
      }
      
      this._productsCache = products;
      this._cacheExpiry = Date.now() + this._cacheDuration;
      return products;
    } catch (error) {
      console.error('Failed to fetch product catalog:', error);
      // Return empty array if API not available
      return [];
    }
  },

  /**
   * Search products by name or category
   */
  async searchProducts(query, category = null) {
    const products = await this.getAllProducts();
    
    let filtered = products;
    
    // Filter by search query
    if (query) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    
    return filtered;
  },

  /**
   * Get product categories from API
   */
  async getCategories() {
    try {
      const response = await auditClient.http.get('/products/categories');
      if (response.data?.categories) {
        return response.data.categories.map(cat => ({
          key: cat.key,
          name: cat.key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          product_count: cat.product_count,
          price_range: cat.price_range
        }));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
    
    // Fallback to extracting from cached products
    const products = await this.getAllProducts();
    const categories = [...new Set(products.map(p => p.category))];
    return categories.sort();
  },
  
  /**
   * Get products by category with better performance
   */
  async getProductsByCategory(categoryKey) {
    try {
      const response = await auditClient.http.get('/products', {
        params: {
          category_key: categoryKey,
          active_only: true,
          limit: 100
        }
      });
      return response.data?.products || [];
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      // Fallback to filtered cache
      const products = await this.getAllProducts();
      return products.filter(p => p.category_key === categoryKey);
    }
  },

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    const products = await this.getAllProducts();
    return products.find(p => p.id === productId);
  },

  /**
   * Get products by IDs (for bulk operations)
   */
  async getProductsByIds(productIds) {
    const products = await this.getAllProducts();
    return products.filter(p => productIds.includes(p.id));
  },

  /**
   * Clear cache (useful after updates)
   */
  clearCache() {
    this._productsCache = null;
    this._cacheExpiry = null;
  }
};