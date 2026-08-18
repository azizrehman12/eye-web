import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import '../../styles/admin-utils.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts({ page, search });
      setProducts(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(id);
        loadProducts(); // Refresh list
      } catch (error) {
        alert("Failed to delete product: " + error.message);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await productService.updateProduct(id, { active: !currentStatus });
      loadProducts();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  return (
    <div>
      <div className="header-actions">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn btn--primary">
          <Plus size={18} /> Add Product
        </Link>
      </div>

      <div className="admin-card">
        <form onSubmit={handleSearch} className="form-group flex-row max-w-md">
          <input
            type="text"
            className="form-control"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn--outline">
            <Search size={18} /> Search
          </button>
        </form>

        {loading ? (
          <div>Loading products...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No products found.</td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.categories?.name || '-'}</td>
                      <td>{product.sku || '-'}</td>
                      <td>PKR {product.price}</td>
                      <td>
                        <span className={product.stock_quantity === 0 ? 'text-error' : ''}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`badge ${product.active ? 'badge--success' : 'badge--error'}`}
                          onClick={() => handleToggleActive(product.id, product.active)}
                        >
                          {product.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <Link to={`/products/${product.slug}`} target="_blank" className="btn btn--outline btn-icon">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/admin/products/edit/${product.id}`} className="btn btn--outline btn-icon">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className="btn btn--outline btn-icon-danger">
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

        {/* Basic Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn btn--outline" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn btn--outline" 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
