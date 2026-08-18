import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/admin-dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    totalCategories: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch products count
        const { count: totalProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        const { count: activeProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);

        const { count: outOfStock } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('stock_quantity', 0);

        // Fetch categories count
        const { count: totalCategories } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          outOfStock: outOfStock || 0,
          totalCategories: totalCategories || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-card__title">Total Products</span>
          <span className="stat-card__value">{stats.totalProducts}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__title">Active Products</span>
          <span className="stat-card__value">{stats.activeProducts}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__title">Out of Stock</span>
          <span className={`stat-card__value ${stats.outOfStock > 0 ? 'text-error' : ''}`}>
            {stats.outOfStock}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card__title">Categories</span>
          <span className="stat-card__value">{stats.totalCategories}</span>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="admin-card">
          <h2>Recent Products</h2>
          <p className="text-muted">Coming soon...</p>
        </div>
        <div className="admin-card">
          <h2>Recent Orders</h2>
          <p className="text-muted">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
