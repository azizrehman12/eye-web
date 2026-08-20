import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { storageService } from '../../services/storageService';
import { ArrowLeft, Upload, X, Star } from 'lucide-react';
import '../../styles/admin-forms.css';
import '../../styles/admin-utils.css';

const ProductForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category_id: '',
    brand: '',
    sku: '',
    price: '',
    sale_price: '',
    stock_quantity: 0,
    stock_status: 'in_stock',
    gender: '',
    frame_type: '',
    frame_material: '',
    frame_color: '',
    available_colors: '', // Comma-separated string for editing
    lens_type: '',
    lens_features: '',
    size: '',
    featured: false,
    new_arrival: false,
    active: true,
    purchase_method: 'whatsapp'
  });

  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const catRes = await categoryService.getAllCategories();
        setCategories(catRes.raw);

        if (isEditing) {
          const product = await productService.getProductById(id);
          if (product) {
            // Populate form fields
            const dataToSet = { ...formData };
            Object.keys(dataToSet).forEach(key => {
              if (product[key] !== undefined && product[key] !== null) {
                if (key === 'available_colors' && Array.isArray(product[key])) {
                  dataToSet[key] = product[key].join(', ');
                } else {
                  dataToSet[key] = product[key];
                }
              }
            });
            setFormData(dataToSet);
            setImages(product.images || []);
          }
        }
      } catch (err) {
        setError("Failed to load data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-generate slug from name if not editing
    if (name === 'name' && !isEditing && !formData.slug) {
      const generatedSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generatedSlug
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.name || !formData.slug || !formData.price || !formData.category_id) {
        throw new Error("Please fill in all required fields.");
      }

      // Convert string numbers to actual numbers where appropriate
      const submissionData = { ...formData };
      submissionData.price = parseFloat(submissionData.price);
      submissionData.sale_price = submissionData.sale_price ? parseFloat(submissionData.sale_price) : null;
      submissionData.stock_quantity = parseInt(submissionData.stock_quantity, 10);
      
      // Convert colors string to array
      if (submissionData.available_colors && typeof submissionData.available_colors === 'string') {
        submissionData.available_colors = submissionData.available_colors
          .split(',')
          .map(c => c.trim())
          .filter(c => c.length > 0);
      } else {
        submissionData.available_colors = [];
      }

      let savedProduct;
      if (isEditing) {
        savedProduct = await productService.updateProduct(id, submissionData);
        navigate('/admin/products');
      } else {
        savedProduct = await productService.createProduct(submissionData);
        // Navigate to the edit page so they can immediately upload images
        navigate(`/admin/products/edit/${savedProduct.id}`);
      }
    } catch (err) {
      setError(err.message);
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  // Note: Image upload in a real app might happen immediately, or wait until product save.
  // We'll require saving the product first before adding images to simplify Supabase foreign keys, 
  // or we use a temporary ID mechanism. 
  // For this implementation, if it's a NEW product, we tell the user to save first.
  const handleImageUpload = async (e) => {
    if (!isEditing) {
      alert("Please save the product first before uploading images.");
      return;
    }

    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    try {
      for (const file of files) {
        const { storage_path, image_url } = await storageService.uploadProductImage(file, id);
        
        // Save to database
        const { supabase } = await import('../../lib/supabase');
        const isFirst = images.length === 0;
        
        const { data, error } = await supabase
          .from('product_images')
          .insert([{
            product_id: id,
            storage_path,
            image_url,
            is_primary: isFirst,
            sort_order: images.length
          }])
          .select()
          .single();
          
        if (error) throw error;
        setImages(prev => [...prev, data]);
      }
    } catch (err) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Remove primary from all
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', id);
        
      // Set new primary
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);
        
      setImages(images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
    } catch (err) {
      alert("Failed to set primary image.");
    }
  };

  const handleDeleteImage = async (image) => {
    if (!window.confirm("Delete this image?")) return;
    
    try {
      await storageService.deleteProductImage(image.storage_path);
      
      const { supabase } = await import('../../lib/supabase');
      await supabase
        .from('product_images')
        .delete()
        .eq('id', image.id);
        
      setImages(images.filter(img => img.id !== image.id));
    } catch (err) {
      alert("Failed to delete image.");
    }
  };

  if (loading) return <div>Loading form...</div>;

  return (
    <div>
      <div className="header-actions">
        <h1>{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        <Link to="/admin/products" className="btn btn--outline">
          <ArrowLeft size={18} /> Back to Products
        </Link>
      </div>

      {error && (
        <div className="alert alert--error mb-2">
          {error}
        </div>
      )}

      <div className="admin-card">
        <form onSubmit={handleSubmit}>
          
          <div className="admin-form-grid">
            {/* Basic Info */}
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (URL) *</label>
              <input
                type="text"
                name="slug"
                className="form-control"
                value={formData.slug}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category_id"
                className="form-control"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                className="form-control"
                value={formData.brand}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU</label>
              <input
                type="text"
                name="sku"
                className="form-control"
                value={formData.sku}
                onChange={handleInputChange}
              />
            </div>

            {/* Pricing & Stock */}
            <div className="form-group">
              <label className="form-label">Price (PKR) *</label>
              <input
                type="number"
                name="price"
                className="form-control"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sale Price (PKR)</label>
              <input
                type="number"
                name="sale_price"
                className="form-control"
                value={formData.sale_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity *</label>
              <input
                type="number"
                name="stock_quantity"
                className="form-control"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Purchase Method *</label>
              <select
                name="purchase_method"
                className="form-control"
                value={formData.purchase_method}
                onChange={handleInputChange}
              >
                <option value="direct_order">Direct Order w/ Email Confirmation (Glasses & Frames)</option>
                <option value="whatsapp">WhatsApp (Sunglasses & Other Items)</option>
              </select>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Direct Order: Customer fills an order form on the site and gets an email confirmation. WhatsApp: Customer gets a pre-filled WhatsApp message.
              </p>
            </div>

            {/* Attributes */}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-control" value={formData.gender} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Frame Type</label>
              <select name="frame_type" className="form-control" value={formData.frame_type} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="Full Rim">Full Rim</option>
                <option value="Half Rim">Half Rim</option>
                <option value="Rimless">Rimless</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Frame Material</label>
              <input type="text" name="frame_material" className="form-control" value={formData.frame_material} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Available Colors</label>
              <input 
                type="text" 
                name="available_colors" 
                className="form-control" 
                value={formData.available_colors} 
                onChange={handleInputChange} 
                placeholder="e.g. Black, Tortoise, Gold"
              />
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Enter colors separated by commas. These will appear as selection buttons on the product page.
              </p>
            </div>
          </div>

          <div className="form-group mt-2">
            <label className="form-label">Short Description</label>
            <textarea
              name="short_description"
              className="form-control"
              rows="2"
              value={formData.short_description}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Full Description</label>
            <textarea
              name="description"
              className="form-control"
              rows="5"
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Toggles */}
          <div className="flex-row mt-2 mb-2">
            <label className="flex-row align-center">
              <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} />
              Active
            </label>
            <label className="flex-row align-center">
              <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} />
              Featured
            </label>
            <label className="flex-row align-center">
              <input type="checkbox" name="new_arrival" checked={formData.new_arrival} onChange={handleInputChange} />
              New Arrival
            </label>
          </div>

          <hr className="my-2" />

          {/* Submit */}
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
          </button>
        </form>
      </div>

      {/* Image Management */}
      <div className="admin-card mt-2">
        <h2>Product Images</h2>
        
        {!isEditing ? (
          <div className="alert alert--info mb-0 text-center">
            <p className="mb-0"><strong>Note:</strong> You must click "Create Product" above before you can upload images.</p>
          </div>
        ) : (
          <>
            <div className="image-upload-area">
              <label htmlFor="image-upload">
                <Upload size={32} className="mx-auto mb-1" />
                <span>{uploadingImage ? 'Uploading...' : 'Click here to select and upload multiple images'}</span>
              </label>
              <input 
                type="file" 
                id="image-upload" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }}
                disabled={uploadingImage}
              />
            </div>

            <div className="image-preview-grid">
              {images.map(img => (
                <div key={img.id} className={`image-preview-item ${img.is_primary ? 'is-primary' : ''}`}>
                  <img src={img.image_url} alt="Product" />
                  <div className="image-preview-actions">
                    {!img.is_primary && (
                      <button onClick={() => handleSetPrimaryImage(img.id)} title="Set as primary">
                        <Star size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDeleteImage(img)} title="Delete image">
                      <X size={16} color="var(--color-error)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductForm;
