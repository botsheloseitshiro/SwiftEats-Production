import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Minus, Plus, Trash2, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/order.service';
import restaurantService from '../services/restaurant.service';
import userService from '../services/user.service';

const SUPPORTED_CARD_TYPES = ['Visa', 'Mastercard'];
const TIP_OPTIONS = [0, 10, 20, 30];

export default function CartPage() {
  const {
    cart,
    itemCount,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearRestaurantCart,
    removeItemsFromRestaurant,
  } = useCart();
  const { user } = useAuth();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [tipAmount, setTipAmount] = useState(0);
  const [saveCard, setSaveCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
  });
  const [selectedRestaurantStatus, setSelectedRestaurantStatus] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getProfile();
        const addresses = user?.role === 'CUSTOMER' ? (profile.savedAddresses || []) : [];
        const cards = user?.role === 'CUSTOMER' ? (profile.savedCards || []) : [];
        setSavedAddresses(addresses);
        setSavedCards(cards);

        const defaultAddress = addresses.find((address) => address.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setDeliveryAddress(defaultAddress.addressLine);
        } else {
          setDeliveryAddress(profile.address || '');
        }

        const defaultCard = cards.find((card) => card.isDefault);
        if (defaultCard) {
          setSelectedCardId(String(defaultCard.id));
        }

        setCardForm((current) => ({ ...current, cardHolderName: profile.fullName || '' }));
      } catch (err) {
        setError('');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.role]);

  useEffect(() => {
    const availableKeys = cart.groups.flatMap((group) => group.items.map((item) => `${group.restaurantId}:${item.id}`));
    setSelectedKeys((current) => {
      const preserved = current.filter((key) => availableKeys.includes(key));
      return preserved.length > 0 ? preserved : availableKeys;
    });
  }, [cart.groups]);

  useEffect(() => {
    if (fulfillmentType === 'COLLECTION') {
      setPaymentMethod('CARD');
      setTipAmount(0);
    }
  }, [fulfillmentType]);

  useEffect(() => {
    const loadRestaurantStatus = async () => {
      const currentSelectedItems = cart.groups.flatMap((group) => group.items
        .filter((item) => selectedKeys.includes(`${group.restaurantId}:${item.id}`))
        .map((item) => ({ ...item, restaurantId: group.restaurantId })));
      const currentRestaurantIds = [...new Set(currentSelectedItems.map((item) => item.restaurantId))];
      const currentRestaurantId = currentRestaurantIds.length === 1 ? currentRestaurantIds[0] : null;

      if (!currentRestaurantId) {
        setSelectedRestaurantStatus(null);
        return;
      }
      try {
        const restaurant = await restaurantService.getById(currentRestaurantId);
        setSelectedRestaurantStatus(restaurant);
      } catch (err) {
        setSelectedRestaurantStatus(null);
      }
    };

    loadRestaurantStatus();
  }, [cart.groups, selectedKeys]);

  const selectedItems = useMemo(() => (
    cart.groups.flatMap((group) => group.items
      .filter((item) => selectedKeys.includes(`${group.restaurantId}:${item.id}`))
      .map((item) => ({
        ...item,
        restaurantId: group.restaurantId,
        restaurantName: group.restaurantName,
        deliveryFee: group.deliveryFee,
      })))
  ), [cart.groups, selectedKeys]);

  const selectedRestaurantIds = [...new Set(selectedItems.map((item) => item.restaurantId))];
  const selectedRestaurantId = selectedRestaurantIds.length === 1 ? selectedRestaurantIds[0] : null;
  const selectedGroup = cart.groups.find((group) => group.restaurantId === selectedRestaurantId) || null;
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = fulfillmentType === 'DELIVERY' ? (selectedGroup?.deliveryFee || 0) : 0;
  const selectedTotal = selectedSubtotal + deliveryFee + tipAmount;

  const toggleSelected = (restaurantId, itemId) => {
    const key = `${restaurantId}:${itemId}`;
    setSelectedKeys((current) => (
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key]
    ));
  };

  const validateCardForm = () => {
    const sanitized = cardForm.cardNumber.replace(/\s+/g, '');
    if (!cardForm.cardHolderName.trim()) {
      return 'Card holder name is required.';
    }
    if (!/^\d{16}$/.test(sanitized)) {
      return 'Card number must contain 16 digits.';
    }
    if (!['4', '5'].includes(sanitized.charAt(0))) {
      return 'Only Visa and Mastercard are supported.';
    }
    if (!cardForm.expiryMonth || Number(cardForm.expiryMonth) < 1 || Number(cardForm.expiryMonth) > 12) {
      return 'Enter a valid expiry month.';
    }
    if (!cardForm.expiryYear || Number(cardForm.expiryYear) < new Date().getFullYear()) {
      return 'Enter a valid expiry year.';
    }
    return '';
  };

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0) {
      setError('Select at least one item to place an order.');
      return;
    }

    if (selectedRestaurantIds.length !== 1) {
      setError('You cannot place one order with items from different restaurants. Select items from a single restaurant.');
      return;
    }

    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (selectedRestaurantStatus && !selectedRestaurantStatus.openNow) {
      setError('This restaurant is closed and the order cannot be processed right now.');
      return;
    }

    if (paymentMethod === 'CARD' && !selectedCardId) {
      const cardError = validateCardForm();
      if (cardError) {
        setError(cardError);
        return;
      }
    }

    setPlacing(true);
    setError('');

    try {
      await orderService.placeOrder({
        restaurantId: selectedRestaurantId,
        fulfillmentType,
        paymentMethod,
        deliveryAddress: fulfillmentType === 'DELIVERY' ? deliveryAddress.trim() : null,
        notes: notes.trim() || null,
        tipAmount: fulfillmentType === 'DELIVERY' ? tipAmount : 0,
        savedCardId: selectedCardId ? Number(selectedCardId) : null,
        saveCard: paymentMethod === 'CARD' && !selectedCardId ? saveCard : false,
        card: paymentMethod === 'CARD' && !selectedCardId ? {
          cardHolderName: cardForm.cardHolderName.trim(),
          cardNumber: cardForm.cardNumber.replace(/\s+/g, ''),
          expiryMonth: Number(cardForm.expiryMonth),
          expiryYear: Number(cardForm.expiryYear),
        } : null,
        items: selectedItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      });

      removeItemsFromRestaurant(selectedRestaurantId, selectedItems.map((item) => item.id));
      setSelectedKeys((current) => current.filter((key) => !key.startsWith(`${selectedRestaurantId}:`)));
      setNotes('');
      setTipAmount(0);
      setSaveCard(false);
      setSelectedCardId('');
      setCardForm((current) => ({ ...current, cardNumber: '', expiryMonth: '', expiryYear: '' }));

      const profile = await userService.getProfile();
      setSavedCards(profile.savedCards || []);
      setSuccessMessage('Order confirmed. You can view it in Orders.');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', background: 'var(--bg)' }}>
        <div className="container" style={{ paddingTop: '48px' }}>
          <div className="empty-state">
            <div className="empty-state-icon">Cart</div>
            <h3>Your cart is empty</h3>
            <p>Add items from any restaurant to get started.</p>
            <Link to="/" className="btn btn-primary">Browse Restaurants</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '64px' }}>
      <div className="container" style={{ paddingTop: '32px' }}>
        <h1 style={pageTitle}>Your Cart</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {cart.groups.length} restaurant{cart.groups.length !== 1 ? 's' : ''} . {itemCount} item{itemCount !== 1 ? 's' : ''}
        </p>

        {cart.groups.length > 1 && (
          <div style={infoBanner}>
            You can keep items from different restaurants in your cart, but each checkout must contain items from only one restaurant.
          </div>
        )}
        {successMessage && <div style={successPopup}>{successMessage}</div>}

        <div style={layout}>
          <div style={cartSection}>
            {cart.groups.map((group) => {
              const groupSelectedCount = group.items.filter((item) => selectedKeys.includes(`${group.restaurantId}:${item.id}`)).length;
              const groupSubtotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

              return (
                <div key={group.restaurantId} style={sectionCard}>
                  <div style={restaurantHeader}>
                    <div>
                      <h2 style={sectionTitle}>{group.restaurantName}</h2>
                      <p style={restaurantMeta}>
                        {group.items.length} line item{group.items.length !== 1 ? 's' : ''} . Delivery fee {group.deliveryFee === 0 ? 'FREE' : `R${group.deliveryFee.toFixed(2)}`}
                      </p>
                    </div>
                    <div style={restaurantHeaderActions}>
                      <span style={selectedBadge}>{groupSelectedCount} selected</span>
                      <button style={clearCartBtn} onClick={() => clearRestaurantCart(group.restaurantId)}>
                        Clear restaurant
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {group.items.map((item) => (
                      <div key={item.id} style={cartItemRow}>
                        <label style={checkboxWrap}>
                          <input
                            type="checkbox"
                            checked={selectedKeys.includes(`${group.restaurantId}:${item.id}`)}
                            onChange={() => toggleSelected(group.restaurantId, item.id)}
                          />
                        </label>

                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={itemImg}
                            onError={(event) => { event.target.style.display = 'none'; }}
                          />
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            R{item.price?.toFixed(2)} each
                          </div>
                        </div>

                        <div style={qtyControls}>
                          <button style={qtyBtn} onClick={() => updateQuantity(group.restaurantId, item.id, item.quantity - 1)}><Minus size={14} /></button>
                          <span style={qtyDisplay}>{item.quantity}</span>
                          <button style={qtyBtn} onClick={() => updateQuantity(group.restaurantId, item.id, item.quantity + 1)}><Plus size={14} /></button>
                        </div>

                        <div style={lineTotal}>R{(item.price * item.quantity).toFixed(2)}</div>

                        <button style={removeBtn} onClick={() => removeFromCart(group.restaurantId, item.id)} title="Remove item">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={groupFooter}>
                    <span>Restaurant subtotal</span>
                    <strong>R{groupSubtotal.toFixed(2)}</strong>
                  </div>
                </div>
              );
            })}

            <div style={sectionCard}>
              <h2 style={sectionTitle}>Checkout Preferences</h2>
              {selectedRestaurantStatus && !selectedRestaurantStatus.openNow && (
                <div style={errorAlert}>This restaurant is closed. Order can&apos;t be processed until it opens again.</div>
              )}
              <div style={optionGrid}>
                <button
                  type="button"
                  style={{ ...optionCard, ...(fulfillmentType === 'DELIVERY' ? optionCardActive : {}) }}
                  onClick={() => setFulfillmentType('DELIVERY')}
                >
                  <Truck size={18} />
                  <div>
                    <strong>Delivery</strong>
                    <div style={smallText}>Send the order to your address</div>
                  </div>
                </button>
                <button
                  type="button"
                  style={{ ...optionCard, ...(fulfillmentType === 'COLLECTION' ? optionCardActive : {}) }}
                  onClick={() => setFulfillmentType('COLLECTION')}
                >
                  <CreditCard size={18} />
                  <div>
                    <strong>Collect at store</strong>
                    <div style={smallText}>Pick up from the restaurant yourself</div>
                  </div>
                </button>
              </div>

              {fulfillmentType === 'DELIVERY' && (
                <>
                  {savedAddresses.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Saved Addresses</label>
                      <select
                        className="form-input"
                        value={selectedAddressId}
                        onChange={(event) => {
                          const nextId = event.target.value;
                          setSelectedAddressId(nextId);
                          const selected = savedAddresses.find((address) => String(address.id) === nextId);
                          setDeliveryAddress(selected ? selected.addressLine : '');
                          setError('');
                        }}
                        disabled={loadingProfile}
                      >
                        <option value="">Use Primary Delivery Address</option>
                        {savedAddresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.label}{address.isDefault ? ' (Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Delivery Address *</label>
                    <textarea
                      className={`form-input ${error && !deliveryAddress ? 'error' : ''}`}
                      placeholder="Enter your full delivery address"
                      value={deliveryAddress}
                      onChange={(event) => {
                        setDeliveryAddress(event.target.value);
                        setSelectedAddressId('');
                        setError('');
                      }}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tip your driver</label>
                    <div style={tipRow}>
                      {TIP_OPTIONS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          style={{ ...tipButton, ...(tipAmount === amount ? tipButtonActive : {}) }}
                          onClick={() => setTipAmount(amount)}
                        >
                          {amount === 0 ? 'No tip' : `R${amount}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <div style={optionGrid}>
                  <button
                    type="button"
                    style={{ ...optionCard, ...(paymentMethod === 'CARD' ? optionCardActive : {}) }}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <CreditCard size={18} />
                    <div>
                      <strong>Card payment</strong>
                      <div style={smallText}>Supported: {SUPPORTED_CARD_TYPES.join(', ')}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    style={{
                      ...optionCard,
                      ...(paymentMethod === 'CASH_ON_DELIVERY' ? optionCardActive : {}),
                      opacity: fulfillmentType === 'DELIVERY' ? 1 : 0.5,
                    }}
                    onClick={() => {
                      if (fulfillmentType === 'DELIVERY') {
                        setPaymentMethod('CASH_ON_DELIVERY');
                      }
                    }}
                  >
                    <Truck size={18} />
                    <div>
                      <strong>Cash on delivery</strong>
                      <div style={smallText}>Only available for delivery orders</div>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'CARD' && (
                <div style={paymentPanel}>
                  {savedCards.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Saved Card</label>
                      <select
                        className="form-input"
                        value={selectedCardId}
                        onChange={(event) => setSelectedCardId(event.target.value)}
                      >
                        <option value="">Use a new card</option>
                        {savedCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.cardType} . {card.maskedCardNumber} . {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!selectedCardId && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Card Holder Name *</label>
                        <input
                          className="form-input"
                          value={cardForm.cardHolderName}
                          onChange={(event) => setCardForm((prev) => ({ ...prev, cardHolderName: event.target.value }))}
                          placeholder="Name on card"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Card Number *</label>
                        <input
                          className="form-input"
                          value={cardForm.cardNumber}
                          onChange={(event) => setCardForm((prev) => ({ ...prev, cardNumber: event.target.value.replace(/[^\d\s]/g, '') }))}
                          placeholder="Visa or Mastercard only"
                        />
                      </div>
                      <div style={formRow}>
                        <div className="form-group">
                          <label className="form-label">Expiry Month *</label>
                          <input
                            className="form-input"
                            type="number"
                            min="1"
                            max="12"
                            value={cardForm.expiryMonth}
                            onChange={(event) => setCardForm((prev) => ({ ...prev, expiryMonth: event.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Expiry Year *</label>
                          <input
                            className="form-input"
                            type="number"
                            min={new Date().getFullYear()}
                            value={cardForm.expiryYear}
                            onChange={(event) => setCardForm((prev) => ({ ...prev, expiryYear: event.target.value }))}
                          />
                        </div>
                      </div>
                      <label style={checkbox}>
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(event) => setSaveCard(event.target.checked)}
                        />
                        <span>Save this card for future use</span>
                      </label>
                    </>
                  )}
                </div>
              )}

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label">Order Notes <span style={{ color: 'var(--text-disabled)' }}>(optional)</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. No onions, ring the buzzer, leave at door"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              {error && <div style={errorAlert}>{error}</div>}
            </div>
          </div>

          <div style={summarySection}>
            <div style={{ ...sectionCard, position: 'sticky', top: 'calc(var(--navbar-height) + 16px)' }}>
              <h2 style={sectionTitle}>Selected Order Summary</h2>
              {selectedItems.length === 0 ? (
                <p style={summaryHint}>Select items from one restaurant to place an order.</p>
              ) : selectedRestaurantIds.length > 1 ? (
                <p style={summaryHint}>Select items from a single restaurant. Mixed-restaurant selections cannot be checked out together.</p>
              ) : (
                <>
                  <div style={summaryRows}>
                    <div style={summaryRow}>
                      <span>Restaurant</span>
                      <span>{selectedGroup?.restaurantName}</span>
                    </div>
                    <div style={summaryRow}>
                      <span>Fulfillment</span>
                      <span>{fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Collect at store'}</span>
                    </div>
                    <div style={summaryRow}>
                      <span>Payment</span>
                      <span>{paymentMethod === 'CARD' ? 'Card' : 'Cash on delivery'}</span>
                    </div>
                    <div style={summaryRow}>
                      <span>Items selected</span>
                      <span>{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div style={summaryRow}>
                      <span>Subtotal</span>
                      <span>R{selectedSubtotal.toFixed(2)}</span>
                    </div>
                    <div style={summaryRow}>
                      <span>{fulfillmentType === 'DELIVERY' ? 'Delivery fee' : 'Collection fee'}</span>
                      <span>{deliveryFee === 0 ? 'FREE' : `R${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    {fulfillmentType === 'DELIVERY' && (
                      <div style={summaryRow}>
                        <span>Driver tip</span>
                        <span>{tipAmount === 0 ? 'R0.00' : `R${tipAmount.toFixed(2)}`}</span>
                      </div>
                    )}
                    <div style={summaryDivider} />
                    <div style={{ ...summaryRow, fontWeight: 700, fontSize: '1.125rem' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--primary)' }}>R{selectedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={etaBox}>
                    {fulfillmentType === 'DELIVERY' ? 'Estimated delivery: 25-45 minutes' : 'Estimated collection: 15-25 minutes'}
                  </div>
                </>
              )}

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handlePlaceOrder}
                disabled={placing || selectedItems.length === 0 || selectedRestaurantIds.length !== 1 || (selectedRestaurantStatus && !selectedRestaurantStatus.openNow)}
                style={{ marginTop: '16px' }}
              >
                {placing ? 'Processing payment...' : <>Proceed to Payment <ArrowRight size={18} /></>}
              </button>

              <button className="btn btn-secondary btn-full" onClick={clearCart} style={{ marginTop: '10px' }}>
                Clear entire cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageTitle = { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '4px' };
const layout = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' };
const cartSection = { display: 'flex', flexDirection: 'column', gap: '20px' };
const summarySection = {};
const sectionCard = {
  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
  padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
};
const sectionTitle = {
  fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px',
};
const restaurantHeader = { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap' };
const restaurantHeaderActions = { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' };
const restaurantMeta = { color: 'var(--text-secondary)', margin: 0 };
const selectedBadge = { padding: '6px 10px', borderRadius: '999px', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 };
const cartItemRow = {
  display: 'flex', alignItems: 'center', gap: '14px',
  paddingBottom: '16px', borderBottom: '1px solid var(--border)',
};
const checkboxWrap = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
const itemImg = { width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' };
const qtyControls = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '4px',
};
const qtyBtn = {
  width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
  border: 'none', background: 'white', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: 'var(--shadow-sm)', color: 'var(--primary)',
};
const qtyDisplay = { fontWeight: 700, minWidth: '24px', textAlign: 'center' };
const lineTotal = { fontWeight: 700, minWidth: '80px', textAlign: 'right' };
const removeBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--error)', padding: '6px', borderRadius: 'var(--radius-sm)',
};
const clearCartBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--error)', fontSize: '0.875rem', fontWeight: 600, padding: 0,
};
const groupFooter = { display: 'flex', justifyContent: 'space-between', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border)' };
const optionGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px', marginBottom: '18px' };
const optionCard = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  borderRadius: '14px',
  padding: '14px',
  cursor: 'pointer',
  textAlign: 'left',
};
const optionCardActive = { borderColor: 'var(--primary)', boxShadow: 'var(--shadow-primary)' };
const paymentPanel = { border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', background: 'var(--surface-2)' };
const smallText = { color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' };
const formRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const checkbox = { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginTop: '8px' };
const tipRow = { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' };
const tipButton = {
  border: '1px solid var(--border)',
  borderRadius: '999px',
  background: 'var(--surface)',
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 600,
};
const tipButtonActive = { borderColor: 'var(--primary)', color: 'var(--primary)' };
const errorAlert = {
  background: 'var(--error-bg)', border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)', padding: '10px 14px',
  fontSize: '0.875rem', color: 'var(--error)', marginTop: '14px',
};
const summaryRows = { display: 'flex', flexDirection: 'column', gap: '12px' };
const summaryRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  fontSize: '0.9375rem', color: 'var(--text-secondary)', gap: '12px',
};
const summaryDivider = { height: '1px', background: 'var(--border)', margin: '4px 0' };
const etaBox = {
  background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
  padding: '10px 14px', fontSize: '0.875rem', color: 'var(--text-secondary)',
  marginTop: '16px', textAlign: 'center',
};
const summaryHint = { color: 'var(--text-secondary)', lineHeight: 1.6 };
const infoBanner = {
  marginBottom: '20px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '14px 16px',
  color: 'var(--text-secondary)',
  boxShadow: 'var(--shadow-sm)',
};
const successPopup = {
  position: 'fixed',
  top: 'calc(var(--navbar-height) + 20px)',
  right: '24px',
  zIndex: 1000,
  background: 'var(--success-bg)',
  color: 'var(--success)',
  border: '1px solid #BBF7D0',
  borderRadius: '14px',
  padding: '12px 16px',
  boxShadow: 'var(--shadow-lg)',
};
