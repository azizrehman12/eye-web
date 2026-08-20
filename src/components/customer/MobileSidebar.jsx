import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import '../../styles/mobile-sidebar.css';

const MobileSidebar = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAllCategories();
        setCategories(res.tree); // Using the hierarchical tree structure
      } catch (error) {
        console.error("Failed to load categories for sidebar", error);
      }
    };
    fetchCategories();
  }, []);

  const toggleExpand = (id, e) => {
    e.preventDefault();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onClose();
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <div 
        className={`mobile-sidebar-overlay ${isOpen ? 'is-open' : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`mobile-sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="mobile-sidebar__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
          <img src="/logo.jpeg" alt="APlusOptics" style={{ height: '60px', width: 'auto', display: 'block', margin: '-10px 0' }} />
          <button onClick={onClose} className="mobile-sidebar__close" aria-label="Close menu" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={24} />
          </button>
        </div>

        <div className="mobile-sidebar__search">
          <form onSubmit={handleSearch} className="form-group mb-0">
            <div className="flex-row">
              <input
                type="text"
                className="form-control"
                placeholder="Search Products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn--primary btn-icon">
                <Search size={20} />
              </button>
            </div>
          </form>
        </div>

        <div className="mobile-sidebar__content">
          <nav className="mobile-sidebar__nav">
            <ul>
              <li>
                <Link to="/" onClick={onClose} className="mobile-sidebar__link">Home</Link>
              </li>
              <li>
                <Link to="/products" onClick={onClose} className="mobile-sidebar__link">Shop All</Link>
              </li>
              
              {/* Dynamic Categories */}
              {categories.map(cat => (
                <li key={cat.id}>
                  <div className="mobile-sidebar__link">
                    <Link to={`/category/${cat.slug}`} onClick={onClose} className="mobile-sidebar__cat-link">
                      {cat.name}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <button 
                        onClick={(e) => toggleExpand(cat.id, e)} 
                        className="btn-icon"
                      >
                        {expanded[cat.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    )}
                  </div>
                  
                  {cat.children && cat.children.length > 0 && (
                    <div className={`mobile-sidebar__subnav ${expanded[cat.id] ? 'is-open' : ''}`}>
                      {cat.children.map(subcat => (
                        <Link 
                          key={subcat.id} 
                          to={`/category/${subcat.slug}`} 
                          onClick={onClose}
                          className="mobile-sidebar__sublink"
                        >
                          {subcat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}

              <li>
                <Link to="/about" onClick={onClose} className="mobile-sidebar__link">About Us</Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
