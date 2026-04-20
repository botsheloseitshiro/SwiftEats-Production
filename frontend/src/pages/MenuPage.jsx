import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, ShoppingCart, Star, Tag, Truck, X } from 'lucide-react';
import restaurantService, { menuService } from '../services/restaurant.service';
import reviewService from '../services/review.service';
import { MenuItemCard } from '../components/ProtectedRoute';
import SortSelect from '../components/SortSelect';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const reviewSortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'ratingDesc', label: 'Highest rated' },
  { value: 'ratingAsc', label: 'Lowest rated' },
];

export default function MenuPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, updateQuantity, getRestaurantCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [reviewSort, setReviewSort] = useState('newest');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemReviews, setSelectedItemReviews] = useState([]);
  const [selectedItemSort, setSelectedItemSort] = useState('newest');
  const [itemReviewLoading, setItemReviewLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [restaurantData, menuData, reviewData] = await Promise.all([
          restaurantService.getById(restaurantId),
          menuService.getByRestaurant(restaurantId),
          reviewService.getRestaurantReviews(restaurantId),
        ]);
        setRestaurant(restaurantData);
        setMenuItems(menuData);
        setReviews(reviewData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [restaurantId]);

  const restaurantCart = getRestaurantCart(Number(restaurantId));
  const currentItemCount = restaurantCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const currentTotal = (restaurantCart?.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)
    + (restaurantCart?.deliveryFee || 0);

  const canOrder = isAuthenticated && user?.role === 'CUSTOMER';
  const showGuestAdd = !isAuthenticated;
  const categories = ['All', 'Promotions', ...new Set(menuItems.map((item) => item.category).filter(Boolean))];
  const promotionItems = menuItems.filter((item) => item.onPromotion);
  const displayedItems = activeCategory === 'All'
    ? menuItems
    : activeCategory === 'Promotions'
      ? promotionItems
      : menuItems.filter((item) => item.category === activeCategory);
  const groupedHours = buildGroupedHours(restaurant);

  const sortedRestaurantReviews = useMemo(
    () => sortReviews(reviews, reviewSort),
    [reviews, reviewSort]
  );

  const sortedSelectedItemReviews = useMemo(
    () => sortReviews(selectedItemReviews, selectedItemSort),
    [selectedItemReviews, selectedItemSort]
  );

  const getCartQty = (itemId) => restaurantCart?.items.find((item) => item.id === itemId)?.quantity || 0;

  const redirectToLogin = () => {
    navigate('/login', {
      state: {
        from: location,
        reason: 'auth_required',
      },
    });
  };

  const handleAddToCart = (item) => {
    if (showGuestAdd) {
      redirectToLogin();
      return;
    }

    if (!canOrder) {
      return;
    }

    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.discountedPrice ?? item.price,
        imageUrl: item.imageUrl,
        originalPrice: item.price,
        onPromotion: item.onPromotion,
      },
      parseInt(restaurantId, 10),
      restaurant?.name,
      restaurant?.deliveryFee
    );
  };

  const handleIncrement = (itemId) => {
    if (!canOrder) {
      return;
    }
    updateQuantity(parseInt(restaurantId, 10), itemId, getCartQty(itemId) + 1);
  };

  const handleDecrement = (itemId) => {
    if (!canOrder) {
      return;
    }
    updateQuantity(parseInt(restaurantId, 10), itemId, getCartQty(itemId) - 1);
  };

  const openItemDetails = async (item) => {
    setSelectedItem(item);
    setSelectedItemSort('newest');
    setItemReviewLoading(true);
    try {
      const itemReviews = await reviewService.getMenuItemReviews(item.id);
      setSelectedItemReviews(itemReviews);
    } catch (err) {
      setSelectedItemReviews([]);
    } finally {
      setItemReviewLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><p style={{ color: 'var(--text-secondary)' }}>Loading menu...</p></div>;
  }

  if (error) {
    return <div className="empty-state"><h3>Could not load menu</h3><p>{error}</p><button className="btn btn-ghost" onClick={() => navigate('/')}>Back to restaurants</button></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: currentItemCount > 0 ? '100px' : '48px' }}>
      <div style={bannerStyle(restaurant?.imageUrl)}>
        <div style={bannerOverlay}>
          <div style={{ width: '100%', paddingLeft: '100px', paddingRight: '24px' }}>
            <button style={backBtn} onClick={() => navigate('/')}><ArrowLeft size={18} /> Restaurants</button>
            <div style={{ marginTop: '20px' }}>
              <div style={heroPills}>
                <span style={categoryPill}>{restaurant?.category}</span>
                <span style={{ ...statusPill, background: restaurant?.openNow ? 'rgba(21,128,61,0.85)' : 'rgba(153,27,27,0.85)' }}>
                  {restaurant?.openNow ? 'Open now' : 'Closed now'}
                </span>
                {!!restaurant?.promotionCount && (
                  <span style={{ ...statusPill, background: 'rgba(185,28,28,0.85)' }}>
                    {restaurant.promotionCount} promotion{restaurant.promotionCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <h1 style={restaurantTitle}>{restaurant?.name}</h1>
              <p style={restaurantDesc}>{restaurant?.description}</p>
              <div style={metaRow}>
                <span style={metaPill}><Star size={13} /> {restaurant?.rating?.toFixed(1)} ({restaurant?.reviewCount || 0} reviews)</span>
                <span style={metaPill}><Clock3 size={13} /> {restaurant?.deliveryTimeMinutes} min</span>
                <span style={metaPill}><Truck size={13} />{restaurant?.deliveryFee === 0 ? ' Free delivery' : ` R${restaurant?.deliveryFee?.toFixed(0)} delivery`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container" style={{ paddingTop: '28px' }}>
        <section style={hoursCard}>
          <div style={hoursHeader}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Operating Hours</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>
                {restaurant?.openNow ? 'Restaurant is currently open.' : 'Restaurant is currently closed.'}
              </p>
            </div>
          </div>
          <div style={hoursGrid}>
            {groupedHours.map((entry) => (
              <div key={entry.label} style={hoursRow}>
                <span>{entry.label}</span>
                <strong>{entry.hours}</strong>
              </div>
            ))}
          </div>
        </section>

        {categories.length > 1 && (
          <div style={tabsRow}>
            {categories.map((cat) => (
              <button key={cat} style={{ ...tabBtn, ...(activeCategory === cat ? tabBtnActive : {}) }} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        )}

        <div style={sectionHeader}>
          <div>
            <h2 style={sectionTitle}>{activeCategory === 'All' ? 'Full Menu' : activeCategory}</h2>
            <p style={sectionText}>{displayedItems.length} items</p>
          </div>
        </div>

        {displayedItems.length === 0 ? (
          <div className="empty-state"><h3>No items in this category</h3></div>
        ) : (
          <div className="grid-menu animate-fade-in">
            {displayedItems.map((item) => (
              <div key={item.id}>
                <MenuItemCard
                  item={item}
                  onAdd={() => handleAddToCart(item)}
                  cartQuantity={getCartQty(item.id)}
                  onIncrement={() => handleIncrement(item.id)}
                  onDecrement={() => handleDecrement(item.id)}
                  onSelect={() => openItemDetails(item)}
                  canAddToCart={showGuestAdd || canOrder}
                  addLabel={showGuestAdd ? 'Sign in to add' : '+ Add'}
                  footerNote=""
                />
                <div style={itemRatingRow}>
                  <span><Star size={12} /> {item.rating?.toFixed(1) || '0.0'}</span>
                  <span>{item.reviewCount || 0} reviews</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <section style={reviewSection}>
          <div style={reviewHeader}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0 }}>Recent Reviews</h2>
              <span style={{ color: 'var(--text-secondary)' }}>{reviews.length} visible</span>
            </div>
            <SortSelect
              label="Review Sort"
              value={reviewSort}
              options={reviewSortOptions}
              onChange={setReviewSort}
              minWidth="190px"
            />
          </div>
          {sortedRestaurantReviews.length === 0 ? (
            <div className="empty-state"><h3>No reviews yet</h3><p>Completed customer reviews will appear here.</p></div>
          ) : (
            <div style={reviewList}>
              {sortedRestaurantReviews.slice(0, 12).map((review) => (
                <div key={review.id} style={reviewCard}>
                  <div style={reviewTop}>
                    <strong>{review.reviewerName}</strong>
                    <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} /> {review.rating}</span>
                  </div>
                  <p style={reviewComment}>{review.comment || 'Customer left a rating without a written comment.'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {currentItemCount > 0 && canOrder && (
        <div style={cartBar}>
          <div style={cartBarInner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShoppingCart size={20} /><span style={{ fontWeight: 600 }}>{currentItemCount} item{currentItemCount !== 1 ? 's' : ''}</span></div>
            <button className="btn" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, padding: '10px 24px' }} onClick={() => navigate('/cart')}>
              View Cart . R{currentTotal.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {selectedItem && (
        <div style={modalBackdrop} onClick={() => setSelectedItem(null)}>
          <div className="modal-scroll-hidden" style={modalCard} onClick={(event) => event.stopPropagation()}>
            <button type="button" style={closeBtn} onClick={() => setSelectedItem(null)}>
              <X size={18} />
            </button>
            <img
              src={selectedItem.imageUrl || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80'}
              alt={selectedItem.name}
              style={modalImage}
            />
            <div style={modalBody}>
              <div style={modalTitleRow}>
                <div>
                  <h3 style={modalTitle}>{selectedItem.name}</h3>
                  <p style={sectionText}>{selectedItem.category || 'Menu item'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={modalPrice}>R{(selectedItem.discountedPrice ?? selectedItem.price)?.toFixed(2)}</span>
                  {selectedItem.onPromotion && <div style={modalOriginalPrice}>R{selectedItem.price?.toFixed(2)}</div>}
                </div>
              </div>
              {selectedItem.onPromotion && (
                <div style={modalPromo}>
                  <Tag size={14} /> Save {Number(selectedItem.discountPercentage).toFixed(0)}% on this item.
                </div>
              )}
              <p style={modalDescription}>{selectedItem.description || 'No description available.'}</p>
              <div style={itemReviewHeader}>
                <div style={sectionText}>{selectedItem.reviewCount || 0} review{selectedItem.reviewCount === 1 ? '' : 's'}</div>
                <SortSelect
                  label="Item Reviews"
                  value={selectedItemSort}
                  options={reviewSortOptions}
                  onChange={setSelectedItemSort}
                  minWidth="180px"
                />
              </div>
              {itemReviewLoading ? (
                <p style={sectionText}>Loading item reviews...</p>
              ) : sortedSelectedItemReviews.length === 0 ? (
                <div className="empty-state"><h3>No item reviews yet</h3><p>Reviews for this menu item will appear here.</p></div>
              ) : (
                <div style={reviewList}>
                  {sortedSelectedItemReviews.map((review) => (
                    <div key={review.id} style={reviewCard}>
                      <div style={reviewTop}>
                        <strong>{review.reviewerName}</strong>
                        <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} /> {review.rating}</span>
                      </div>
                      <p style={reviewComment}>{review.comment || 'Customer left a rating without a written comment.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sortReviews(items, mode) {
  const sorted = [...items];
  switch (mode) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'ratingDesc':
      return sorted.sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt));
    case 'ratingAsc':
      return sorted.sort((a, b) => a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function buildGroupedHours(restaurant) {
  if (!restaurant) {
    return [];
  }
  const weekdayHours = restaurant.mondayHours;
  const allWeekdaysSame = ['mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours']
    .every((field) => restaurant[field] === weekdayHours);
  const weekendHours = restaurant.saturdayHours;
  const weekendSame = restaurant.saturdayHours === restaurant.sundayHours;

  const groups = [];
  if (allWeekdaysSame) {
    groups.push({ label: 'Mon - Fri', hours: weekdayHours || 'Closed' });
  } else {
    groups.push(
      { label: 'Monday', hours: restaurant.mondayHours || 'Closed' },
      { label: 'Tuesday', hours: restaurant.tuesdayHours || 'Closed' },
      { label: 'Wednesday', hours: restaurant.wednesdayHours || 'Closed' },
      { label: 'Thursday', hours: restaurant.thursdayHours || 'Closed' },
      { label: 'Friday', hours: restaurant.fridayHours || 'Closed' },
    );
  }

  if (weekendSame) {
    groups.push({ label: 'Sat - Sun', hours: weekendHours || 'Closed' });
  } else {
    groups.push(
      { label: 'Saturday', hours: restaurant.saturdayHours || 'Closed' },
      { label: 'Sunday', hours: restaurant.sundayHours || 'Closed' },
    );
  }

  return groups;
}

const bannerStyle = (imgUrl) => ({ backgroundImage: `url(${imgUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '260px' });
const bannerOverlay = { background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)', minHeight: '260px', display: 'flex', alignItems: 'flex-end', paddingBottom: '28px' };
const backBtn = { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 'var(--radius-full)', padding: '7px 14px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, backdropFilter: 'blur(4px)', marginTop: '16px' };
const heroPills = { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' };
const categoryPill = { background: 'var(--primary)', color: 'white', padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' };
const statusPill = { color: 'white', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 };
const restaurantTitle = { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: 'white', margin: '8px 0 4px' };
const restaurantDesc = { color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', maxWidth: '500px' };
const metaRow = { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' };
const metaPill = { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' };
const hoursCard = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '20px', marginBottom: '24px' };
const hoursHeader = { display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' };
const hoursGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' };
const hoursRow = { display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text-secondary)' };
const tabsRow = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' };
const tabBtn = { padding: '8px 20px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' };
const tabBtnActive = { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' };
const sectionHeader = { display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' };
const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 };
const sectionText = { color: 'var(--text-secondary)', fontSize: '0.875rem' };
const itemRatingRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px 0', color: 'var(--text-secondary)', fontSize: '0.8rem' };
const reviewSection = { marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' };
const reviewHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' };
const reviewList = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' };
const reviewCard = { border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', background: 'var(--surface)' };
const reviewTop = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' };
const reviewComment = { margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 };
const cartBar = { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--primary)', zIndex: 100, padding: '12px 24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' };
const cartBarInner = { maxWidth: 'var(--container-max)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 };
const modalCard = { width: 'min(560px, 100%)', maxHeight: '74vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: '18px', boxShadow: 'var(--shadow-lg)', position: 'relative' };
const closeBtn = { position: 'absolute', top: '18px', right: '18px', width: '40px', height: '40px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.45)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 };
const modalImage = { width: '100%', height: '170px', objectFit: 'cover' };
const modalBody = { padding: '16px 18px 18px' };
const modalTitleRow = { display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '12px' };
const modalTitle = { margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem' };
const modalPrice = { fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' };
const modalOriginalPrice = { fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'line-through' };
const modalPromo = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEE2E2', color: '#B91C1C', padding: '8px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' };
const modalDescription = { margin: '0 0 14px', color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' };
const itemReviewHeader = { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-end', marginBottom: '14px', flexWrap: 'wrap' };
