import { supabase } from '../lib/supabase';

export const categoryService = {
  // Get all categories, typically formatted as a tree
  async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Convert flat list to tree (parent -> children)
    const categoryMap = {};
    const rootCategories = [];

    data.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    data.forEach(cat => {
      if (cat.parent_id) {
        if (categoryMap[cat.parent_id]) {
          categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
        }
      } else {
        rootCategories.push(categoryMap[cat.id]);
      }
    });

    return { raw: data, tree: rootCategories };
  },

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCategory(id, categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
