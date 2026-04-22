import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Clock, RotateCcw } from 'lucide-react';
import orderService from '../services/order.service';
import reviewService from '../services/review.service';
import PaginationControls from '../components/PaginationControls';
import SortSelect from '../components/SortSelect';
import { CardSkeletonList, EmptyState, ErrorState } from '../components/ListState';
import { useCart } from '../context/CartContext';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the Way' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const sortOptions = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'createdAt,asc', label: 'Oldest first' },
  { value: 'totalAmount,desc', label: 'Highest total' },
  { value: 'totalAmount,asc', label: 'Lowest total' },
];

export default function OrderHistoryPage() {
  const { addToCart } = useCart();
  const [pageState, setPageState] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 6,
  });
  const [sort, setSort] = useState('createdAt,desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [submittedReviews, setSubmittedReviews] = useState({});

  const loadOrders = useCallback(async (page = 0, nextSort = sort) => {
    try {
      setLoading(true);
      setError('');
      const data = await orderService.getMyOrdersPage({
        page,
        size: pageState.size,
        sort: nextSort,
      });
      setPageState((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  }, [pageState.size, sort]);

  useEffect(() => {
    loadOrders(0, sort);
  }, [loadOrders, sort]);

  const formatDate = (dateString) => {
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleOrder = async (order) => {
    const isClosing = expandedOrder === order.id;
    setExpandedOrder(isClosing ? null : order.id);
    if (isClosing || order.status !== 'DELIVERED' || submittedReviews[order.id]) {
      return;
    }

    try {
      const reviews = await reviewService.getMyOrderReviews(order.id);
      const restaurantReview = reviews.find((review) => review.restaurantId === order.restaurantId && !review.menuItemId);
      const itemReviewIds = reviews.filter((review) => review.menuItemId).map((review) => review.menuItemId);
      setSubmittedReviews((current) => ({
        ...current,
        [order.id]: {
          restaurant: Boolean(restaurantReview),
          itemIds: itemReviewIds,
        },
      }));
    } catch (err) {
      // Keep the form visible if the lookup fails.
    }
  };

  const handleReorder = (order) => {
    order.items?.forEach((item) => {
      addToCart(
        {
          id: item.menuItemId,
          name: item.itemName,
          price: item.unitPrice,
          imageUrl: '',
        },
        order.restaurantId,
        order.restaurantName,
        order.deliveryFee
      );
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '64px' }}>
      <div className="container" style={{ paddingTop: '32px' }}>
        <div style={headerRow}>
          <div>
            <h1 style={pageTitle}>My Orders</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
              {pageState.totalElements === 0
                ? 'No orders yet'
                : `${pageState.totalElements} order${pageState.totalElements !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <SortSelect label="Sort Orders" value={sort} options={sortOptions} onChange={setSort} />
        </div>

        {loading && <CardSkeletonList count={4} />}
        {!loading && error && <ErrorState title="Orders could not be loaded" message={error} onRetry={() => loadOrders(pageState.currentPage, sort)} />}
        {!loading && !error && pageState.content.length === 0 && (
          <EmptyState
            title="No orders yet"
            message="Place your first order and it will show up here with live status updates."
            action={<Link to="/" className="btn btn-primary">Browse Restaurants</Link>}
          />
        )}

        {!loading && !error && pageState.content.length > 0 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pageState.content.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedOrder === order.id}
                  onToggle={() => handleToggleOrder(order)}
                  formatDate={formatDate}
                  submittedState={submittedReviews[order.id] || { restaurant: false, itemIds: [] }}
                  onReviewsChange={(nextState) => setSubmittedReviews((current) => ({ ...current, [order.id]: nextState }))}
                  onReorder={() => handleReorder(order)}
                />
              ))}
            </div>
            <PaginationControls
              page={pageState.currentPage}
              totalPages={pageState.totalPages}
              onPageChange={(nextPage) => loadOrders(nextPage, sort)}
              disabled={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, expanded, onToggle, formatDate, submittedState, onReviewsChange, onReorder }) {
  const currentStep = STATUS_ORDER.indexOf(order.status);
  const [restaurantReview, setRestaurantReview] = useState({ rating: 5, comment: '' });
  const [itemReviews, setItemReviews] = useState({});
  const [reviewMessage, setReviewMessage] = useState('');

  const submittedItemIds = submittedState.itemIds || [];

  const submitRestaurantReview = async () => {
    try {
      await reviewService.createRestaurantReview(order.restaurantId, {
        orderId: order.id,
        rating: Number(restaurantReview.rating),
        comment: restaurantReview.comment,
      });
      onReviewsChange({
        ...submittedState,
        restaurant: true,
      });
      setReviewMessage('Restaurant review submitted.');
    } catch (err) {
      setReviewMessage(err.response?.data?.message || 'Failed to submit restaurant review.');
    }
  };

  const submitItemReview = async (item) => {
    const payload = itemReviews[item.menuItemId] || { rating: 5, comment: '' };
    try {
      await reviewService.createMenuItemReview(item.menuItemId, {
        orderId: order.id,
        rating: Number(payload.rating),
        comment: payload.comment,
      });
      onReviewsChange({
        ...submittedState,
        itemIds: [...new Set([...(submittedState.itemIds || []), item.menuItemId])],
      });
      setReviewMessage(`Review submitted for ${item.itemName}.`);
    } catch (err) {
      setReviewMessage(err.response?.data?.message || `Failed to submit review for ${item.itemName}.`);
    }
  };

  return (
    <div style={orderCardStyle}>
      <div style={orderHeader} onClick={onToggle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem' }}>
              {order.restaurantName}
            </span>
            <span className={`badge status-${order.status}`}>{order.status.replace('_', ' ')}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{formatDate(order.createdAt)}</span>
            <span>Order #{order.id}</span>
            {order.scheduledFor && <span>Scheduled: {formatDate(order.scheduledFor)}</span>}
            {order.driverName && <span>Driver: {order.driverName}</span>}
            {order.driverDetailsVisible && order.driverLicensePlate && (
              <span>
                Vehicle: {order.driverVehicleType || 'Vehicle'} · Plate {order.driverLicensePlate}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {order.status === 'DELIVERED' && (
            <button type="button" className="btn btn-secondary" onClick={(event) => {
              event.stopPropagation();
              onReorder();
            }}>
              <RotateCcw size={16} />
              Reorder
            </button>
          )}
          <span style={totalDisplay}>R{order.totalAmount?.toFixed(2)}</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div style={orderDetail}>
          {order.status !== 'CANCELLED' && (
            <div style={trackerWrap}>
              {STATUS_STEPS.map((step, index) => {
                const isDone = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <React.Fragment key={step.key}>
                    <div style={trackerStep}>
                      <div style={{ ...trackerCircle, background: isDone ? 'var(--primary)' : 'var(--surface-2)', color: isDone ? 'white' : 'var(--text-secondary)', border: isCurrent ? '2px solid var(--primary)' : '2px solid transparent' }}>
                        {index + 1}
                      </div>
                      <span style={{ fontSize: '0.7rem', marginTop: '4px', textAlign: 'center' }}>{step.label}</span>
                    </div>
                    {index < STATUS_STEPS.length - 1 && <div style={{ ...trackerLine, background: index < currentStep ? 'var(--primary)' : 'var(--border)' }} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {order.status === 'CANCELLED' && <div style={errorBox}>This order was cancelled.</div>}

          <h4 style={{ fontWeight: 600, marginBottom: '10px', fontSize: '0.9375rem' }}>Items Ordered</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {order.items?.map((item) => (
              <div key={item.id} style={itemRowStyle}>
                <span style={{ color: 'var(--primary)', fontWeight: 600, minWidth: '24px' }}>{item.quantity}x</span>
                <span style={{ flex: 1 }}>{item.itemName}</span>
                <span style={{ fontWeight: 600 }}>R{item.subtotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={priceSummary}>
            <div style={priceRow}>
              <span style={{ color: 'var(--text-secondary)' }}>Delivery fee</span>
              <span>R{order.deliveryFee?.toFixed(2)}</span>
            </div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
            <div style={{ ...priceRow, fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)', fontSize: '1.125rem' }}>R{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          {order.deliveryAddress && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '12px' }}>Delivery address: {order.deliveryAddress}</p>}
          {order.notes && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Notes: {order.notes}</p>}

          {order.status === 'DELIVERED' && (
            <div style={reviewSection}>
              <h4 style={reviewTitle}>Leave a review</h4>
              {reviewMessage && <div style={reviewMessageStyle}>{reviewMessage}</div>}

              <div style={reviewCard}>
                <h5 style={reviewHeading}>Restaurant Review</h5>
                {submittedState.restaurant ? (
                  <div style={submittedNotice}>Restaurant review has been submitted.</div>
                ) : (
                  <div style={reviewControls}>
                    <select value={restaurantReview.rating} onChange={(event) => setRestaurantReview((prev) => ({ ...prev, rating: event.target.value }))} style={reviewSelect}>
                      {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value !== 1 ? 's' : ''}</option>)}
                    </select>
                    <textarea
                      rows={2}
                      className="form-input"
                      value={restaurantReview.comment}
                      onChange={(event) => setRestaurantReview((prev) => ({ ...prev, comment: event.target.value }))}
                      placeholder="How was the overall restaurant experience?"
                    />
                    <button type="button" className="btn btn-primary" onClick={submitRestaurantReview}>Submit Restaurant Review</button>
                  </div>
                )}
              </div>

              {order.items?.map((item) => (
                <div key={`review-${item.id}`} style={reviewCard}>
                  <h5 style={reviewHeading}>Review {item.itemName}</h5>
                  {submittedItemIds.includes(item.menuItemId) ? (
                    <div style={submittedNotice}>Item review has been submitted.</div>
                  ) : (
                    <div style={reviewControls}>
                      <select
                        value={itemReviews[item.menuItemId]?.rating || 5}
                        onChange={(event) => setItemReviews((prev) => ({
                          ...prev,
                          [item.menuItemId]: { ...(prev[item.menuItemId] || {}), rating: event.target.value },
                        }))}
                        style={reviewSelect}
                      >
                        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value !== 1 ? 's' : ''}</option>)}
                      </select>
                      <textarea
                        rows={2}
                        className="form-input"
                        value={itemReviews[item.menuItemId]?.comment || ''}
                        onChange={(event) => setItemReviews((prev) => ({
                          ...prev,
                          [item.menuItemId]: { ...(prev[item.menuItemId] || {}), comment: event.target.value },
                        }))}
                        placeholder={`What did you think about ${item.itemName}?`}
                      />
                      <button type="button" className="btn btn-primary" onClick={() => submitItemReview(item)}>Submit Item Review</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' };
const pageTitle = { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '4px' };
const orderCardStyle = { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' };
const orderHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', cursor: 'pointer' };
const totalDisplay = { fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700 };
const orderDetail = { padding: '20px', borderTop: '1px solid var(--border)' };
const trackerWrap = { display: 'flex', alignItems: 'flex-start', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' };
const trackerStep = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, width: '70px' };
const trackerCircle = { width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 };
const trackerLine = { flex: 1, height: '2px', marginTop: '19px', minWidth: '20px' };
const itemRowStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' };
const priceSummary = { background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '14px 16px' };
const priceRow = { display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' };
const errorBox = { background: 'var(--error-bg)', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.875rem', color: 'var(--error)', marginBottom: '16px' };
const reviewSection = { marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' };
const reviewTitle = { margin: 0, fontSize: '1.05rem', fontWeight: 700 };
const reviewCard = { border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', background: 'var(--surface-2)' };
const reviewHeading = { margin: '0 0 10px', fontSize: '0.95rem' };
const reviewControls = { display: 'flex', flexDirection: 'column', gap: '10px' };
const reviewSelect = { maxWidth: '180px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)' };
const reviewMessageStyle = { color: 'var(--text-secondary)', fontSize: '0.85rem' };
const submittedNotice = { background: 'rgba(16, 185, 129, 0.12)', color: '#047857', borderRadius: '12px', padding: '10px 12px', fontWeight: 600 };
