import { supabase } from '../lib/supabase';

export const lensService = {
  /**
   * Fetch all active lenses, sorted by price (cheapest first)
   */
  getAllLenses: async (categoryId = null) => {
    let query = supabase
      .from('lenses')
      .select('*')
      .order('price', { ascending: true });

    if (categoryId) {
      // Filter lenses where the JSONB array 'category_ids' contains the given categoryId
      query = query.contains('category_ids', [categoryId]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  /**
   * Create a new lens
   */
  createLens: async (lensData) => {
    const { data, error } = await supabase
      .from('lenses')
      .insert([lensData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing lens
   */
  updateLens: async (id, updates) => {
    const { data, error } = await supabase
      .from('lenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a lens
   */
  deleteLens: async (id) => {
    const { error } = await supabase
      .from('lenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
