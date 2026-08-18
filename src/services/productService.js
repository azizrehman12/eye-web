import { supabase } from '../lib/supabase';

export const productService = {
  // Get all products (admin)
  async getProducts({ page = 1, limit = 20, search = '', categoryId = null, activeOnly = false } = {}) {
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' });

    if (activeOnly) {
      query = query.eq('active', true);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return { data, count, page, limit, totalPages: Math.ceil(count / limit) };
  },

  // Get a single product by slug (customer)
  async getProductBySlug(slug) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    
    // Fetch images
    if (data) {
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', data.id)
        .order('sort_order');
        
      data.images = images || [];
    }

    return data;
  },

  // Get a single product by ID (admin)
  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;

    if (data) {
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', data.id)
        .order('sort_order');
        
      data.images = images || [];
    }

    return data;
  },

  async createProduct(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateProduct(id, productData) {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
