import React, { useState, useEffect, useRef } from 'react';
import { categoryService } from '../../services/categoryService';
import { storageService } from '../../services/storageService';
import { Plus, Edit2, Trash2, Image as ImageIcon, Upload, X } from 'lucide-react';
import '../../styles/admin-forms.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', slug: '', description: '', active: true, image_url: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAllCategories();
      setCategories(res.raw); // using flat list for simple management
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-generate slug from name if creating a new one
    if (name === 'name' && !isEditing) {
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
      let finalImageUrl = formData.image_url;

      // If we are creating a new category, we need its ID before uploading the image
      let categoryId = formData.id;
      let categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        active: formData.active,
        image_url: finalImageUrl
      };

      if (!isEditing) {
        const newCat = await categoryService.createCategory(categoryData);
        categoryId = newCat.id;
      }

      if (imageFile) {
        const { image_url } = await storageService.uploadCategoryImage(imageFile, categoryId);
        finalImageUrl = image_url;
      }

      if (isEditing) {
        categoryData.image_url = finalImageUrl;
        await categoryService.updateCategory(categoryId, categoryData);
      } else if (imageFile) {
        // We created it, then uploaded the image, now we must update it with the new URL
        await categoryService.updateCategory(categoryId, { image_url: finalImageUrl });
      }

      // Reset form and refresh
      handleCancelEdit();
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      id: category.id,
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      active: category.active !== false,
      image_url: category.image_url || ''
    });
    setIsEditing(true);
    setIsFormOpen(true);
    setImageFile(null);
    setImagePreview(category.image_url || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await categoryService.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      if (err.message && err.message.includes("foreign key constraint")) {
        alert("Cannot delete this category because there are products inside it. Please reassign or delete those products first.");
      } else {
        setError(err.message);
        alert("Error deleting category: " + err.message);
      }
    }
  };

  const handleCancelEdit = () => {
    setFormData({ id: null, name: '', slug: '', description: '', active: true, image_url: '' });
    setIsEditing(false);
    setIsFormOpen(false);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="header-actions" style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Categories</h1>
        {!isFormOpen && (
          <button className="btn btn--primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add New Category
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert--error mb-2">
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Toggleable Form Area */}
        {isFormOpen && (
          <div className="admin-card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={handleCancelEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
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
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="2"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="form-group flex-row align-center" style={{ marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                />
                <label className="form-label mb-0 ml-1">Active (Visible on Store)</label>
              </div>

              <div className="form-group">
                <label className="form-label">Category Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#94a3b8' }}>
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="image-upload-area" style={{ padding: '8px 12px', margin: 0 }}>
                    <label htmlFor="category-image-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
                      <Upload size={14} />
                      <span>Upload</span>
                    </label>
                    <input
                      type="file"
                      id="category-image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-row" style={{ marginTop: '1.5rem', gap: '1rem' }}>
                <button type="submit" className="btn btn--primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
                </button>
                <button type="button" className="btn btn--outline" onClick={handleCancelEdit} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List Area */}
        <div className="admin-card">
          <h2 style={{ margin: '0 0 1rem 0' }}>Existing Categories</h2>
          {loading ? (
            <p>Loading categories...</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Image</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-2">No categories found. Create one!</td>
                    </tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.id}>
                        <td>
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </td>
                        <td><strong>{cat.name}</strong></td>
                        <td><span className="text-muted">{cat.slug}</span></td>
                        <td>
                          {cat.active ? (
                            <span className="badge badge--success">Active</span>
                          ) : (
                            <span className="badge badge--error">Inactive</span>
                          )}
                        </td>
                        <td>
                          <div className="flex-row" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn-icon" onClick={() => handleEdit(cat)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-icon text-error" onClick={() => handleDelete(cat.id)} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
