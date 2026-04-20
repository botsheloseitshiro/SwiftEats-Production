import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import userService from '../services/user.service';
import menuService from '../services/menu.service';
import orderService from '../services/order.service';
import PaginationControls from '../components/PaginationControls';
import { CardSkeletonList, EmptyState, ErrorState } from '../components/ListState';

const menuSortOptions = [
  { value: 'name,asc', label: 'Name A-Z' },
  { value: 'name,desc', label: 'Name Z-A' },
  { value: 'price,asc', label: 'Lowest price' },
  { value: 'price,desc', label: 'Highest price' },
  { value: 'available,desc', label: 'Available first' },
  { value: 'available,asc', label: 'Unavailable first' },
];

const orderSortOptions = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'createdAt,asc', label: 'Oldest first' },
  { value: 'totalAmount,desc', label: 'Highest total' },
  { value: 'totalAmount,asc', label: 'Lowest total' },
];

export default function RestaurantAdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuPage, setMenuPage] = useState({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 8 });
  const [orderPage, setOrderPage] = useState({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 8 });
  const [statusFilter, setStatusFilter] = useState('');
  const [orderSort, setOrderSort] = useState('createdAt,desc');
  const [menuSort, setMenuSort] = useState('name,asc');
  const [menuSearch, setMenuSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    discountPercentage: '0',
    available: true,
  });

  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const profileData = await userService.getProfile();
      const managedRestaurants = profileData.managedRestaurants || [];
      setRestaurants(managedRestaurants);
      setSelectedRestaurant((current) => current || managedRestaurants[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurant admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMenuItems = useCallback(async (restaurantId, page = menuPage.currentPage, nextSearch = menuSearch, nextSort = menuSort) => {
    if (!restaurantId) {
      return;
    }

    try {
      setMenuLoading(true);
      const items = await menuService.getAllMenuItemsPageForAdmin(restaurantId, {
        page,
        size: menuPage.size,
        sort: nextSort,
        search: nextSearch || undefined,
      });
      setMenuPage((prev) => ({ ...prev, ...items }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load menu items.');
    } finally {
      setMenuLoading(false);
    }
  }, [menuPage.currentPage, menuPage.size, menuSearch, menuSort]);

  const loadOrders = useCallback(async (page = orderPage.currentPage, nextStatus = statusFilter, nextSort = orderSort) => {
    if (!selectedRestaurant) {
      return;
    }

    try {
      setOrderLoading(true);
      const orders = await orderService.getManagedRestaurantOrdersPage({
        page,
        size: orderPage.size,
        restaurantId: selectedRestaurant.id,
        status: nextStatus || undefined,
        sort: nextSort,
      });
      setOrderPage((prev) => ({ ...prev, ...orders }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurant orders.');
    } finally {
      setOrderLoading(false);
    }
  }, [orderPage.currentPage, orderPage.size, orderSort, selectedRestaurant, statusFilter]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (!selectedRestaurant) {
      return;
    }
    loadMenuItems(selectedRestaurant.id, 0, menuSearch, menuSort);
  }, [selectedRestaurant, menuSearch, menuSort, loadMenuItems]);

  useEffect(() => {
    if (!selectedRestaurant) {
      return;
    }
    loadOrders(0, statusFilter, orderSort);
  }, [selectedRestaurant, statusFilter, orderSort, loadOrders]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      imageUrl: '',
      discountPercentage: '0',
      available: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        discountPercentage: parseFloat(formData.discountPercentage || 0),
        restaurantId: selectedRestaurant.id,
      };

      if (editingId) {
        await menuService.updateMenuItem(editingId, itemData);
      } else {
        await menuService.createMenuItem(itemData);
      }

      resetForm();
      await loadMenuItems(selectedRestaurant.id, menuPage.currentPage, menuSearch, menuSort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save menu item.');
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await orderService.updateManagedRestaurantOrderStatus(orderId, status);
      await loadOrders(orderPage.currentPage, statusFilter, orderSort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    try {
      await menuService.deleteMenuItem(itemId);
      await loadMenuItems(selectedRestaurant.id, menuPage.currentPage, menuSearch, menuSort);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive menu item.');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <CardSkeletonList count={4} />
      </div>
    );
  }

  if (error && !selectedRestaurant) {
    return (
      <div style={styles.container}>
        <ErrorState title="Dashboard unavailable" message={error} onRetry={loadRestaurants} />
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div style={styles.container}>
        <EmptyState title="No managed restaurant yet" message="Ask an admin to assign your restaurant account." />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Restaurant Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage menu items and incoming orders for your restaurant.</p>
        </div>
        {restaurants.length > 1 && (
          <select
            value={selectedRestaurant.id}
            onChange={(event) => {
              const restaurant = restaurants.find((item) => String(item.id) === event.target.value);
              setSelectedRestaurant(restaurant || null);
            }}
            style={styles.select}
          >
            {restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
          </select>
        )}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Restaurant Menu Items</h2>
            <p style={styles.sectionSubtitle}>{selectedRestaurant.name}</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={styles.primaryBtn}>
            <Plus size={16} />
            Add Menu Item
          </button>
        </div>

        {showForm && (
          <div style={styles.formContainer}>
            <input className="form-input" placeholder="Item name" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
            <textarea className="form-input" rows={2} placeholder="Description" value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} />
            <div style={styles.formRow}>
              <input className="form-input" type="number" step="0.01" placeholder="Price" value={formData.price} onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))} />
              <input className="form-input" placeholder="Category" value={formData.category} onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))} />
            </div>
            <input className="form-input" type="number" min="0" max="100" step="0.01" placeholder="Promotion discount %" value={formData.discountPercentage} onChange={(event) => setFormData((prev) => ({ ...prev, discountPercentage: event.target.value }))} />
            <input className="form-input" placeholder="Image URL" value={formData.imageUrl} onChange={(event) => setFormData((prev) => ({ ...prev, imageUrl: event.target.value }))} />
            <label style={styles.checkbox}>
              <input type="checkbox" checked={formData.available} onChange={(event) => setFormData((prev) => ({ ...prev, available: event.target.checked }))} />
              <span>Item is available</span>
            </label>
            <div style={styles.actionRow}>
              <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {editingId ? 'Update Item' : 'Create Item'}</button>
              <button className="btn btn-secondary" onClick={resetForm}><X size={16} /> Cancel</button>
            </div>
          </div>
        )}

        <div style={styles.controlPanel}>
          <form
            style={styles.searchWrap}
            onSubmit={(event) => {
              event.preventDefault();
              setMenuSearch(searchTerm.trim());
            }}
          >
            <Search size={16} style={styles.searchIcon} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by item name or category"
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>Apply</button>
          </form>

          <div style={styles.filterRow}>
            <select value={menuSort} onChange={(event) => setMenuSort(event.target.value)} style={styles.select}>
              {menuSortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {menuLoading ? <CardSkeletonList count={3} /> : menuPage.content.length === 0 ? (
          <EmptyState title="No menu items yet" message="Add your first menu item to start selling." />
        ) : (
          <>
            <div style={styles.menuGrid}>
              {menuPage.content.map((item) => (
                <div key={item.id} style={styles.menuCard}>
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=500&q=80'}
                    alt={item.name}
                    style={styles.menuImage}
                  />
                  <div style={styles.menuContent}>
                    <div>
                      <h3 style={styles.menuName}>{item.name}</h3>
                      <p style={styles.menuMeta}>{item.category || 'Uncategorised'} . R{item.price.toFixed(2)}</p>
                      {item.onPromotion && <p style={styles.promoMeta}>Promotion active . {Number(item.discountPercentage).toFixed(0)}% off . Now R{item.discountedPrice.toFixed(2)}</p>}
                      <p style={styles.menuMeta}>{item.available ? 'Available' : 'Unavailable'} . {item.reviewCount || 0} review{item.reviewCount === 1 ? '' : 's'} . {item.rating?.toFixed(1) || '0.0'} stars</p>
                    </div>
                    <div style={styles.menuActions}>
                      <button className="btn btn-secondary" onClick={() => { setEditingId(item.id); setFormData({ ...item, price: String(item.price), discountPercentage: String(item.discountPercentage || 0) }); setShowForm(true); }}><Edit2 size={16} /> Edit</button>
                      <button className="btn btn-secondary" onClick={() => handleDeleteMenuItem(item.id)}><Trash2 size={16} /> Archive</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={menuPage.currentPage}
              totalPages={menuPage.totalPages}
              onPageChange={(page) => loadMenuItems(selectedRestaurant.id, page, menuSearch, menuSort)}
              disabled={menuLoading}
            />
          </>
        )}
      </div>

      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Order Queue</h2>
            <p style={styles.sectionSubtitle}>Confirm and prepare orders from your restaurant.</p>
          </div>
        </div>

        <div style={styles.controlPanel}>
          <div style={styles.filterRow}>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={styles.select}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select value={orderSort} onChange={(event) => setOrderSort(event.target.value)} style={styles.select}>
              {orderSortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {orderLoading ? <CardSkeletonList count={3} /> : orderPage.content.length === 0 ? (
          <EmptyState title="No orders in this view" message="Incoming orders will appear here as customers place them." />
        ) : (
          <>
            <div style={styles.orderList}>
              {orderPage.content.map((order) => (
                <div key={order.id} style={styles.orderCard}>
                  <div>
                    <h3 style={styles.orderTitle}>Order #{order.id}</h3>
                    <p style={styles.orderMeta}>{order.status.replace('_', ' ')} . {new Date(order.createdAt).toLocaleString()}</p>
                    <p style={styles.orderMeta}>Fulfillment: {order.fulfillmentType === 'COLLECTION' ? 'Collection' : 'Delivery'} . Payment: {order.paymentMethod === 'CARD' ? 'Card' : 'Cash on delivery'}</p>
                    <p style={styles.orderMeta}>{order.fulfillmentType === 'COLLECTION' ? 'Customer will collect in store' : `Deliver to: ${order.deliveryAddress}`}</p>
                    <p style={styles.orderMeta}>Items: {order.items?.map((item) => `${item.quantity}x ${item.itemName}`).join(', ')}</p>
                  </div>
                  <div style={styles.orderActions}>
                    {order.status === 'PENDING' && <button className="btn btn-primary" onClick={() => handleOrderStatus(order.id, 'CONFIRMED')}>Confirm</button>}
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && <button className="btn btn-secondary" onClick={() => handleOrderStatus(order.id, 'PREPARING')}>Mark Preparing</button>}
                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && <button className="btn btn-secondary" onClick={() => handleOrderStatus(order.id, 'CANCELLED')}>Cancel</button>}
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls page={orderPage.currentPage} totalPages={orderPage.totalPages} onPageChange={(page) => loadOrders(page, statusFilter, orderSort)} disabled={orderLoading} />
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: 'calc(100vh - var(--navbar-height))', padding: '32px 16px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' },
  title: { fontSize: '2rem', fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', margin: '8px 0 0' },
  sectionCard: { maxWidth: '1200px', width: '100%', margin: '0 auto', background: 'var(--surface)', borderRadius: '18px', padding: '24px', border: '1px solid var(--border)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' },
  sectionTitle: { margin: 0, fontSize: '1.3rem' },
  sectionSubtitle: { margin: '6px 0 0', color: 'var(--text-secondary)' },
  select: { minWidth: '180px', padding: '11px 14px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' },
  errorBox: { maxWidth: '1200px', width: '100%', margin: '0 auto', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 14px' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', background: 'var(--surface-2)', borderRadius: '14px', padding: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '8px' },
  actionRow: { display: 'flex', gap: '12px' },
  controlPanel: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 1 360px',
    minWidth: '280px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '6px 8px',
  },
  searchIcon: {
    color: 'var(--text-secondary)',
    marginLeft: '6px',
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    flex: 1,
    padding: '10px 6px',
  },
  searchButton: {
    border: 'none',
    borderRadius: '10px',
    background: 'var(--primary)',
    color: 'white',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  menuGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
  menuCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: '16px',
    boxShadow: 'var(--shadow-sm)',
  },
  menuImage: {
    width: '110px',
    height: '110px',
    objectFit: 'cover',
    display: 'block',
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
  },
  menuContent: { flex: 1, display: 'flex', justifyContent: 'space-between', gap: '16px' },
  menuName: { margin: 0, fontSize: '1rem' },
  menuMeta: { margin: '6px 0 0', color: 'var(--text-secondary)' },
  menuActions: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '110px' },
  promoMeta: { margin: '6px 0 0', color: '#B91C1C', fontWeight: 700 },
  orderList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderCard: { border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px' },
  orderTitle: { margin: 0, fontSize: '1rem' },
  orderMeta: { margin: '6px 0 0', color: 'var(--text-secondary)' },
  orderActions: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' },
};
