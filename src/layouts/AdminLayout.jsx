import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin-sidebar.css';
import '../styles/admin.css';

const AdminLayout = () => {
  const { logout, user } = useAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header" style={{ padding: '20px' }}>
          <img src="/logo.jpeg" alt="APlusOptics" style={{ height: '75px', width: 'auto', display: 'block', margin: '-10px 0' }} />
        </div>
        <nav className="admin-sidebar__nav">
          <Link to="/admin" className="admin-sidebar__link">Dashboard</Link>
          <Link to="/admin/products" className="admin-sidebar__link">Products</Link>
          <Link to="/admin/categories" className="admin-sidebar__link">Categories</Link>
          <Link to="/admin/lenses" className="admin-sidebar__link">Lens Options</Link>
          <Link to="/admin/orders" className="admin-sidebar__link">Orders</Link>
          <Link to="/admin/settings" className="admin-sidebar__link">Settings</Link>
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            {user?.email}
          </div>
          <button onClick={logout} className="btn btn--outline btn--full">Logout</button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
