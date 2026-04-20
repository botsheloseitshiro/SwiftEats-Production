import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, EyeOff, MapPin, Search, Star, Truck } from 'lucide-react';
import restaurantService from '../services/restaurant.service';
import PaginationControls from '../components/PaginationControls';
import { CardSkeletonList, EmptyState, ErrorState } from '../components/ListState';

const DEFAULT_PAGE_SIZE = 8;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: DEFAULT_PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [sort, setSort] = useState('name,asc');

  const loadRestaurants = useCallback(async (page = 0, overrides = {}) => {
    try {
      setLoading(true);
      setError('');
      const data = await restaurantService.getAllRestaurantsForAdmin({
        page,
        size: pageState.size || DEFAULT_PAGE_SIZE,
        sort: overrides.sort ?? sort,
        search: overrides.search ?? (appliedSearch || undefined),
        active: resolveActiveFilter(overrides.active ?? filterActive),
      });
      setPageState((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurants.');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, filterActive, pageState.size, sort]);

  useEffect(() => {
    loadRestaurants(0, { search: appliedSearch, active: filterActive, sort });
  }, [appliedSearch, filterActive, loadRestaurants, sort]);

  const handleToggleActive = async (restaurantId, currentActive) => {
    try {
      const response = await restaurantService.toggleRestaurantActive(restaurantId, !currentActive);
      setPageState((prev) => ({
        ...prev,
        content: prev.content.map((restaurant) => (
          restaurant.id === restaurantId ? response : restaurant
        )),
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update restaurant status.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Restaurant Management</h1>
        <p style={styles.subtitle}>Search, sort, and manage restaurants without loading the full table at once.</p>
      </div>

      <div style={styles.controlPanel}>
        <form
          style={styles.searchWrap}
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(searchTerm.trim());
          }}
        >
          <Search size={16} style={styles.searchIcon} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, category, or address"
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>Apply</button>
        </form>

        <div style={styles.filterRow}>
          <select value={filterActive} onChange={(event) => setFilterActive(event.target.value)} style={styles.select}>
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} style={styles.select}>
            <option value="name,asc">Name A-Z</option>
            <option value="name,desc">Name Z-A</option>
            <option value="category,asc">Category A-Z</option>
            <option value="rating,desc">Top rated</option>
          </select>
        </div>
      </div>

      {!loading && !error && (
        <p style={styles.summaryText}>
          Showing {pageState.content.length} of {pageState.totalElements} restaurants
        </p>
      )}

      {loading && <CardSkeletonList count={5} />}

      {!loading && error && (
        <ErrorState
          title="Restaurants could not be loaded"
          message={error}
          onRetry={() => loadRestaurants(pageState.currentPage)}
        />
      )}

      {!loading && !error && pageState.content.length === 0 && (
        <EmptyState
          title="No restaurants match this view"
          message="Try a different search term or status filter."
        />
      )}

      {!loading && !error && pageState.content.length > 0 && (
        <>
          <div style={styles.restaurantsList}>
            {pageState.content.map((restaurant) => (
              <div key={restaurant.id} style={styles.restaurantCard}>
                <div style={styles.cardLeft}>
                  <img
                    src={restaurant.imageUrl || FALLBACK_IMAGE}
                    alt={restaurant.name}
                    style={styles.restaurantImage}
                    onError={(event) => {
                      event.target.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                <div style={styles.cardContent}>
                  <div style={styles.cardTitleRow}>
                    <h3 style={styles.restaurantName}>{restaurant.name}</h3>
                    <span style={restaurant.active ? styles.statusActive : styles.statusInactive}>
                      {restaurant.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p style={styles.restaurantCategory}>{restaurant.category}</p>
                  <p style={styles.restaurantDescription}>{restaurant.description}</p>

                  <div style={styles.restaurantMeta}>
                    <span style={styles.metaItem}><MapPin size={12} /> {restaurant.address}</span>
                    <span style={styles.metaItem}><Truck size={12} /> R{restaurant.deliveryFee.toFixed(2)}</span>
                    {restaurant.rating !== null && restaurant.rating !== undefined && (
                      <span style={styles.metaItem}><Star size={12} /> {restaurant.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>

                <div style={styles.cardRight}>
                  <button
                    onClick={() => handleToggleActive(restaurant.id, restaurant.active)}
                    style={{
                      ...styles.toggleBtn,
                      ...(restaurant.active ? styles.toggleBtnActive : styles.toggleBtnInactive),
                    }}
                  >
                    {restaurant.active ? <Eye size={18} /> : <EyeOff size={18} />}
                    {restaurant.active ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    onClick={() => navigate(`/admin/restaurant/${restaurant.id}`)}
                    style={styles.viewBtn}
                  >
                    View Details
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={pageState.currentPage}
            totalPages={pageState.totalPages}
            onPageChange={(nextPage) => loadRestaurants(nextPage)}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}

function resolveActiveFilter(value) {
  if (value === 'active') {
    return true;
  }
  if (value === 'inactive') {
    return false;
  }
  return undefined;
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'var(--space-xl)',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  controlPanel: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px',
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
  },
  select: {
    minWidth: '160px',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  summaryText: {
    marginBottom: '18px',
    color: 'var(--text-secondary)',
  },
  restaurantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  restaurantCard: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  cardLeft: {
    flex: '0 0 140px',
  },
  restaurantImage: {
    width: '140px',
    height: '140px',
    objectFit: 'cover',
    borderRadius: '10px',
    background: 'var(--bg-secondary)',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  restaurantName: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 6px 0',
  },
  statusActive: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  statusInactive: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  restaurantCategory: {
    fontSize: '13px',
    color: 'var(--primary)',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  restaurantDescription: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: '0 0 12px 0',
    lineHeight: 1.5,
  },
  restaurantMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  cardRight: {
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  toggleBtn: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  toggleBtnActive: {
    background: '#fee2e2',
    color: '#991b1b',
  },
  toggleBtnInactive: {
    background: '#dcfce7',
    color: '#15803d',
  },
  viewBtn: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'white',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: 'var(--primary)',
  },
};
