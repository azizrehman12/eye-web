import React, { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { orderService } from '../../services/orderService';
import '../../styles/admin-orders.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_confirmation', label: 'Pending Confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_UPDATE_OPTIONS = [
  'pending_confirmation',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const formatDate = (d) => d ? new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const shortId = (id) => id ? id.split('-')[0].toUpperCase() : '—';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [expandedRow, setExpandedRow] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.getAdminOrders({ page, status: statusFilter, search });
      setOrders(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.count || 0);
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

  const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
  const pendingCount = orders.filter(o => o.status === 'pending_confirmation').length;

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1 className="admin-orders__title">Orders</h1>
        <button
          onClick={fetchOrders}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="admin-orders__stats">
        <div className="admin-orders__stat">
          <span className="admin-orders__stat-label">Total</span>
          <span className="admin-orders__stat-value">{totalCount}</span>
        </div>
        <div className="admin-orders__stat">
          <span className="admin-orders__stat-label">Confirmed</span>
          <span className="admin-orders__stat-value confirmed">{confirmedCount}</span>
        </div>
        <div className="admin-orders__stat">
          <span className="admin-orders__stat-label">Pending</span>
          <span className="admin-orders__stat-value pending">{pendingCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-orders__filters">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            className="admin-orders__search"
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
            <Search size={16} />
          </button>
        </form>
        <select
          className="admin-orders__status-filter"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="admin-orders__table-wrapper">
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="admin-orders__empty">
            <h3>No orders found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="admin-orders__table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Order ID</th>
                <th style={{ width: '21%' }}>Customer</th>
                <th style={{ width: '14%' }}>Product</th>
                <th style={{ width: '4%', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '8%' }}>Total</th>
                <th style={{ width: '8%' }}>Status</th>
                <th style={{ width: '11%' }}>Created</th>
                <th style={{ width: '11%' }}>Confirmed</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const item = order.order_items?.[0];
                const isExpanded = expandedRow === order.id;
                return (
                  <React.Fragment key={order.id}>
                    <tr className={`row-${order.status}`}>
                      <td>
                        <span className="order-id-cell">#{shortId(order.id)}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.customer_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>{order.customer_email}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{order.customer_phone}</div>
                      </td>
                      <td>
                        {item ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{item.product_name_snapshot}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>SKU: {item.product_sku_snapshot || '—'}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item?.quantity || '—'}</td>
                      <td style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                        Rs. {parseFloat(order.total).toLocaleString()}
                      </td>
                      <td>
                        <span className={`order-status-badge ${order.status}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(order.confirmed_at)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            className="status-select"
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingStatus[order.id]}
                          >
                            {STATUS_UPDATE_OPTIONS.map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => toggleRow(order.id)}
                            style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title={isExpanded ? 'Collapse' : 'View Details'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="order-detail-row">
                        <td colSpan={9}>
                          <div className="order-detail-panel">
                            <div className="order-detail-section">
                              <h4>Customer Details</h4>
                              <div className="order-detail-row-item"><span className="label">Name</span><span className="value">{order.customer_name}</span></div>
                              <div className="order-detail-row-item"><span className="label">Email</span><span className="value">{order.customer_email}</span></div>
                              <div className="order-detail-row-item"><span className="label">Phone</span><span className="value">{order.customer_phone}</span></div>
                              <div className="order-detail-row-item"><span className="label">Address</span><span className="value">{order.address}</span></div>
                              <div className="order-detail-row-item"><span className="label">City</span><span className="value">{order.city}</span></div>
                              {order.notes && <div className="order-detail-row-item"><span className="label">Notes</span><span className="value">{order.notes}</span></div>}
                            </div>

                            {item && (
                              <div className="order-detail-section">
                                <h4>Order Details</h4>
                                <div className="order-detail-row-item"><span className="label">Order ID</span><span className="value">#{shortId(order.id)}</span></div>
                                <div className="order-detail-row-item"><span className="label">Product</span><span className="value">{item.product_name_snapshot}</span></div>
                                <div className="order-detail-row-item"><span className="label">SKU</span><span className="value">{item.product_sku_snapshot || '—'}</span></div>
                                <div className="order-detail-row-item"><span className="label">Category</span><span className="value">{item.product_category_snapshot || '—'}</span></div>
                                <div className="order-detail-row-item"><span className="label">Unit Price</span><span className="value">Rs. {parseFloat(item.unit_price_snapshot).toLocaleString()}</span></div>
                                <div className="order-detail-row-item"><span className="label">Quantity</span><span className="value">{item.quantity}</span></div>
                                {order.lens_details && (
                                  <div className="order-detail-row-item">
                                    <span className="label">Lens Option</span>
                                    <span className="value" style={{ color: '#dc2626', fontWeight: 600 }}>
                                      {order.lens_details.name} (+ Rs. {parseFloat(order.lens_details.price).toLocaleString()})
                                    </span>
                                  </div>
                                )}
                                <div className="order-detail-row-item"><span className="label">Total</span><span className="value" style={{ fontWeight: 700, color: '#2563EB' }}>Rs. {parseFloat(order.total).toLocaleString()}</span></div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-orders__pagination">
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
