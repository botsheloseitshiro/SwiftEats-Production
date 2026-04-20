import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Clock3, MapPin, Star, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MENU_ITEM_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80';
const RESTAURANT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location, reason: 'auth_required' }} />;
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/" replace state={{ reason: 'forbidden' }} />;
  }

  return children;
}

export function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const fee = restaurant.deliveryFee === 0
    ? 'Free delivery'
    : `R${restaurant.deliveryFee?.toFixed(0)} delivery`;
  const todayHours = getTodayHours(restaurant);

  return (
    <div style={cardStyles.card} onClick={() => navigate(`/menu/${restaurant.id}`)}>
      <div style={cardStyles.imgWrap}>
        <img
          src={restaurant.imageUrl || RESTAURANT_FALLBACK_IMAGE}
          alt={restaurant.name}
          style={cardStyles.img}
          onError={(event) => {
            event.target.src = RESTAURANT_FALLBACK_IMAGE;
          }}
        />
        <span style={cardStyles.categoryBadge}>{restaurant.category}</span>
        <span style={{
          ...cardStyles.statusBadge,
          background: restaurant.openNow ? 'rgba(21,128,61,0.92)' : 'rgba(153,27,27,0.92)',
        }}>
          {restaurant.openNow ? 'Open' : 'Closed'}
        </span>
      </div>

      <div style={cardStyles.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={cardStyles.name}>{restaurant.name}</h3>
          <div style={cardStyles.rating}>
            <Star size={13} /> {restaurant.rating?.toFixed(1)} ({restaurant.reviewCount || 0})
          </div>
        </div>

        <p style={cardStyles.description}>{restaurant.description}</p>

        <div style={cardStyles.meta}>
          <span style={cardStyles.metaItem}><Clock3 size={13} /> {restaurant.deliveryTimeMinutes} min</span>
          <span style={cardStyles.metaDot}>.</span>
          <Truck size={13} />
          <span style={cardStyles.metaItem}>{fee}</span>
        </div>
        <div style={cardStyles.metaSecondary}>
          <span style={cardStyles.locationText}>
            <MapPin size={12} />
            {restaurant.city || restaurant.locationLabel || restaurant.address || 'Location unavailable'}
          </span>
          <span>{todayHours ? `Today: ${todayHours}` : 'Hours unavailable'}</span>
          {!!restaurant.promotionCount && <span>{restaurant.promotionCount} promo{restaurant.promotionCount === 1 ? '' : 's'}</span>}
        </div>
      </div>
    </div>
  );
}

const cardStyles = {
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    boxShadow: 'var(--shadow-sm)',
  },
  imgWrap: {
    position: 'relative',
    height: '185px',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: '10px',
    left: '12px',
    background: 'rgba(255,255,255,0.92)',
    color: 'var(--primary)',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  statusBadge: {
    position: 'absolute',
    top: '10px',
    right: '12px',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  body: { padding: '16px' },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  description: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  rating: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    marginLeft: '8px',
  },
  meta: { display: 'flex', alignItems: 'center', gap: '6px' },
  metaItem: { fontSize: '0.8125rem', color: 'var(--text-secondary)' },
  metaDot: { color: 'var(--border)', fontWeight: 300 },
  metaSecondary: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    flexWrap: 'wrap',
  },
  locationText: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
};

export function MenuItemCard({
  item,
  onAdd,
  cartQuantity,
  onIncrement,
  onDecrement,
  onSelect,
  canAddToCart = true,
  addLabel = '+ Add',
  footerNote = '',
}) {
  return (
    <div style={menuCardStyles.card}>
      {item.imageUrl && (
        <div style={{ ...menuCardStyles.imgWrap, cursor: onSelect ? 'pointer' : 'default' }} onClick={onSelect}>
          <img
            src={item.imageUrl}
            alt={item.name}
            style={menuCardStyles.img}
            onError={(event) => {
              if (event.target.src !== MENU_ITEM_FALLBACK_IMAGE) {
                event.target.src = MENU_ITEM_FALLBACK_IMAGE;
                return;
              }
              event.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div style={menuCardStyles.info}>
        <button type="button" style={menuCardStyles.infoButton} onClick={onSelect}>
          <h4 style={menuCardStyles.name}>{item.name}</h4>
          {item.description && <p style={menuCardStyles.description}>{item.description}</p>}
          {item.category && <span style={menuCardStyles.category}>{item.category}</span>}
          {item.onPromotion && (
            <span style={menuCardStyles.promoBadge}>
              {Number(item.discountPercentage).toFixed(0)}% off
            </span>
          )}
        </button>

        <div style={menuCardStyles.footer}>
          <div style={menuCardStyles.priceWrap}>
            <span style={menuCardStyles.price}>R{(item.discountedPrice ?? item.price)?.toFixed(2)}</span>
            {item.onPromotion && <span style={menuCardStyles.originalPrice}>R{item.price?.toFixed(2)}</span>}
          </div>

          {canAddToCart && cartQuantity > 0 ? (
            <div style={menuCardStyles.stepper}>
              <button style={menuCardStyles.stepBtn} onClick={onDecrement}>-</button>
              <span style={menuCardStyles.qty}>{cartQuantity}</span>
              <button style={menuCardStyles.stepBtn} onClick={onIncrement}>+</button>
            </div>
          ) : canAddToCart ? (
            <button style={menuCardStyles.addBtn} onClick={onAdd}>
              {addLabel}
            </button>
          ) : (
            <span style={menuCardStyles.footerNote}>{footerNote}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function getTodayHours(restaurant) {
  const fields = [
    'sundayHours',
    'mondayHours',
    'tuesdayHours',
    'wednesdayHours',
    'thursdayHours',
    'fridayHours',
    'saturdayHours',
  ];
  return restaurant?.[fields[new Date().getDay()]] || '';
}

const menuCardStyles = {
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '16px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'box-shadow 0.2s',
    minHeight: '172px',
    height: '100%',
    alignItems: 'stretch',
  },
  imgWrap: {
    width: '132px',
    height: '132px',
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  info: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  infoButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
  },
  name: { fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' },
  description: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  category: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--primary)',
    opacity: 0.8,
  },
  promoBadge: {
    padding: '4px 8px',
    borderRadius: '999px',
    background: '#FEE2E2',
    color: '#B91C1C',
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  priceWrap: { display: 'flex', flexDirection: 'column', gap: '2px' },
  price: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' },
  originalPrice: { fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'line-through' },
  addBtn: {
    padding: '7px 18px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius-md)',
    padding: '4px 8px',
  },
  stepBtn: {
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'white',
    boxShadow: 'var(--shadow-sm)',
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)',
  },
  qty: { fontWeight: 700, fontSize: '1rem', minWidth: '20px', textAlign: 'center' },
  footerNote: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
};
