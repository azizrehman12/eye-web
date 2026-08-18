import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { ChevronDown, ChevronUp } from 'lucide-react';
import WhatsAppButton from '../../components/shared/WhatsAppButton';
import '../../styles/home.css'; // For product-card
import '../../styles/products.css';

import ProductCard from '../../components/shared/ProductCard';

const Products = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [collapsedFilters, setCollapsedFilters] = useState({});

  const toggleFilter = (filterName) => {
    setCollapsedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catRes = await categoryService.getAllCategories();
        setCategories(catRes.raw);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch raw via Supabase client directly here for simplicity with images, 
        // or update productService to include images for lists.
        const { supabase } = await import('../../lib/supabase');
        
        let query = supabase
          .from('products')
          .select('*, categories(*), images:product_images(*)')
          .eq('active', true);

        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory);
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data } = await query;
        setProducts(data || []);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, selectedCategory]);

  return (
    <div className="products-page">
      <div className="main-content-layout">
        
        {/* Left Sidebar Filters */}
        <aside className="left-sidebar-filters">
          <div className="filter-header-main">
            <h2>Filters</h2>
          </div>

          <div className="filter-group">
            <div className="filter-group-header" onClick={() => toggleFilter('category')}>
              <h3>Category</h3>
              {collapsedFilters['category'] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
            {!collapsedFilters['category'] && (
              <div className="filter-list">
                <label className="filter-item">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={selectedCategory === ''} 
                    onChange={() => setSelectedCategory('')} 
                  />
                  All Categories
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="filter-item">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={selectedCategory === cat.id} 
                      onChange={() => setSelectedCategory(cat.id)} 
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="filter-group">
            <div className="filter-group-header" onClick={() => toggleFilter('price')}>
              <h3>Price Range</h3>
              {collapsedFilters['price'] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
            {!collapsedFilters['price'] && (
              <div className="filter-list">
                <label className="filter-item"><input type="checkbox" /> Under Rs. 5000</label>
                <label className="filter-item"><input type="checkbox" /> Rs. 5000 - Rs. 10000</label>
                <label className="filter-item"><input type="checkbox" /> Rs. 10000 - Rs. 20000</label>
                <label className="filter-item"><input type="checkbox" /> Over Rs. 20000</label>
              </div>
            )}
          </div>
          
          <div className="filter-group">
            <div className="filter-group-header" onClick={() => toggleFilter('frame')}>
              <h3>Frame Type</h3>
              {collapsedFilters['frame'] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
            {!collapsedFilters['frame'] && (
              <div className="filter-list">
                <label className="filter-item"><input type="checkbox" /> Full Rim</label>
                <label className="filter-item"><input type="checkbox" /> Half Rim</label>
                <label className="filter-item"><input type="checkbox" /> Rimless</label>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="right-content-area">
          <div className="products-header-top">
            <div className="products-breadcrumb">
              Home {'>'} All Products
            </div>
            <div className="products-title-row">
              <h1>{search ? `Search Results for "${search}"` : 'All Products'}</h1>
              <div className="products-count">{products.length} Products</div>
            </div>
          </div>

          {loading ? (
            <div className="products-empty">Loading products...</div>
          ) : products.length > 0 ? (
            <div className="products-grid-container">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="products-empty">
              <h3>No products found.</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Products;
