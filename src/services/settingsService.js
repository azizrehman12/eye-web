import { supabase } from '../lib/supabase';

export const settingsService = {
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    // If no settings exist yet, don't throw an error, just return null 
    // so the frontend can handle the empty state.
    if (error && error.code !== 'PGRST116') { 
      throw error;
    }

    return data;
  },

  async updateSettings(settingsData) {
    // Check if settings exist
    const current = await this.getSettings();
    
    if (current) {
      const { data, error } = await supabase
        .from('settings')
        .update(settingsData)
        .eq('id', current.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('settings')
        .insert([settingsData])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }
  }
};
