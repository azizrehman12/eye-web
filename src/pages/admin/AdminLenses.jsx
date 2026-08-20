import React, { useState, useEffect } from 'react';
import { lensService } from '../../services/lensService';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import '../../styles/admin-forms.css';

const AdminLenses = () => {
  const [lenses, setLenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', price: 0, features: '', active: true, category_ids: [] });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchLenses();
  }, []);

  const fetchLenses = async () => {
    try {
      setLoading(true);
      const [lensesData, categoriesData] = await Promise.all([
        lensService.getAllLenses(),
        categoryService.getAllCategories()
      ]);
      setLenses(lensesData || []);
      setCategories(categoriesData?.raw || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => {
      const isSelected = prev.category_ids.includes(categoryId);
      if (isSelected) {
        return { ...prev, category_ids: prev.category_ids.filter(id => id !== categoryId) };
      } else {
        return { ...prev, category_ids: [...prev.category_ids, categoryId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Convert text area features (newline separated) to JSON array
      const featuresArray = formData.features
        ? formData.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : [];

      const lensData = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        features: featuresArray,
        active: formData.active,
        category_ids: formData.category_ids
      };

      if (isEditing) {
        await lensService.updateLens(formData.id, lensData);
      } else {
        await lensService.createLens(lensData);
      }

      handleCancelEdit();
      await fetchLenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lens) => {
    setFormData({
      id: lens.id,
      name: lens.name || '',
      price: lens.price || 0,
      features: Array.isArray(lens.features) ? lens.features.join('\n') : '',
      active: lens.active !== false,
      category_ids: Array.isArray(lens.category_ids) ? lens.category_ids : []
    });
    setIsEditing(true);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lens option?")) return;
    try {
      await lensService.deleteLens(id);
      await fetchLenses();
    } catch (err) {
      setError(err.message);
      alert("Error deleting lens: " + err.message);
    }
  };

  const handleCancelEdit = () => {
    setFormData({ id: null, name: '', price: 0, features: '', active: true, category_ids: [] });
    setIsEditing(false);
    setIsFormOpen(false);
  };

  return (
    <div>
      <div className="header-actions" style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Lens Options</h1>
        {!isFormOpen && (
          <button className="btn btn--primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add New Lens
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
              <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Lens' : 'Add New Lens'}</h2>
              <button onClick={handleCancelEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Lens Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Transition Anti Glare"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
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
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Features (Bullet points)</label>
                <textarea
                  name="features"
                  className="form-control"
                  rows="4"
                  value={formData.features}
                  onChange={handleInputChange}
                  placeholder="Turn dark grey in sunlight&#10;Fine Quality&#10;Standard Thickness"
                ></textarea>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Enter each feature on a new line. They will be displayed as bullet points.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Assign to Categories</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc' }}>
                  {categories.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={formData.category_ids.includes(cat.id)}
                        onChange={() => handleCategoryChange(cat.id)}
                      />
                      {cat.name}
                    </label>
                  ))}
                  {categories.length === 0 && <span style={{ fontSize: 13, color: '#64748b' }}>No categories found.</span>}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  This lens will only show up on products belonging to the selected categories. If none are selected, it won't show anywhere.
                </p>
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

              <div className="flex-row" style={{ marginTop: '1.5rem', gap: '1rem' }}>
                <button type="submit" className="btn btn--primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving...' : (isEditing ? 'Update Lens' : 'Create Lens')}
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
          <h2 style={{ margin: '0 0 1rem 0' }}>Existing Lens Options</h2>
          {loading ? (
            <p>Loading lenses...</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Categories</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lenses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-2">No lens options found. Create one!</td>
                    </tr>
                  ) : (
                    lenses.map(lens => (
                      <tr key={lens.id}>
                        <td><strong>{lens.name}</strong></td>
                        <td>Rs. {lens.price}</td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>
                          {Array.isArray(lens.category_ids) && lens.category_ids.length > 0 
                            ? lens.category_ids.map(id => categories.find(c => c.id === id)?.name || 'Unknown').join(', ')
                            : 'None'
                          }
                        </td>
                        <td>
                          {lens.active ? (
                            <span className="badge badge--success">Active</span>
                          ) : (
                            <span className="badge badge--error">Inactive</span>
                          )}
                        </td>
                        <td>
                          <div className="flex-row" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn-icon" onClick={() => handleEdit(lens)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-icon text-error" onClick={() => handleDelete(lens.id)} title="Delete">
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

export default AdminLenses;
