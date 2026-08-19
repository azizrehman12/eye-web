import { supabase } from '../lib/supabase';

export const storageService = {
  async uploadProductImage(file, productId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return {
      storage_path: filePath,
      image_url: publicUrl
    };
  },

  async uploadCategoryImage(file, categoryId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `categories/${categoryId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return {
      storage_path: filePath,
      image_url: publicUrl
    };
  },

  async deleteProductImage(storagePath) {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([storagePath]);

    if (error) {
      throw error;
    }
    return true;
  }
};
