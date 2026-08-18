import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/categoryService';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import '../../styles/admin-forms.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ id: null, name: '', slug: '', description: '', active: true });
  const [isEditing, setIsEditing] = useState(false);

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
      if (isEditing) {
        await categoryService.updateCategory(formData.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          active: formData.active
        });
      } else {
        await categoryService.createCategory({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          active: formData.active
        });
      }
      
      // Reset form and refresh
      setFormData({ id: null, name: '', slug: '', description: '', active: true });
      setIsEditing(false);
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setFormData(category);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category? Products linked to it might be affected.")) return;
    try {
      await categoryService.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setFormData({ id: null, name: '', slug: '', description: '', active: true });
    setIsEditing(false);
  };

  return (
    <div>
      <div className="header-actions">
        <h1>Categories</h1>
      </div>

      {error && (
        <div className="alert alert--error mb-2">
          {error}
        </div>
      )}

      <div className="admin-grid">
        {/* Left Col: Form */}
        <div className="admin-card" style={{ alignSelf: 'start' }}>
          <h2>{isEditing ? 'Edit Category' : 'Add New Category'}</h2>
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="form-group">
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
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={formData.description || ''}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="form-group flex-row align-center">
              <input 
                type="checkbox" 
                name="active" 
                checked={formData.active} 
                onChange={handleInputChange} 
              />
              <label className="form-label mb-0 ml-1">Active (Visible on Store)</label>
            </div>

            <div className="flex-row mt-2">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
              </button>
              {isEditing && (
                <button type="button" className="btn btn--outline" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Col: List */}
        <div className="admin-card">
          <h2>Existing Categories</h2>
          {loading ? (
            <p className="mt-2">Loading categories...</p>
          ) : (
            <div className="table-responsive mt-2">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-2">No categories found. Create one!</td>
                    </tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.id}>
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
                          <div className="flex-row" style={{ gap: '0.5rem' }}>
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
