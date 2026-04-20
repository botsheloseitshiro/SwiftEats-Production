import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

const CartContext = createContext(undefined);

const initialState = {
  groups: [],
};

function upsertRestaurantGroup(groups, restaurantId, restaurantName, deliveryFee) {
  const existing = groups.find((group) => group.restaurantId === restaurantId);
  if (existing) {
    return groups.map((group) => (
      group.restaurantId === restaurantId
        ? { ...group, restaurantName, deliveryFee }
        : group
    ));
  }

  return [
    ...groups,
    {
      restaurantId,
      restaurantName,
      deliveryFee: deliveryFee || 0,
      items: [],
    },
  ];
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, restaurantId, restaurantName, deliveryFee } = action.payload;
      const groups = upsertRestaurantGroup(state.groups, restaurantId, restaurantName, deliveryFee)
        .map((group) => {
          if (group.restaurantId !== restaurantId) {
            return group;
          }

          const existingItem = group.items.find((current) => current.id === item.id);
          if (existingItem) {
            return {
              ...group,
              items: group.items.map((current) => (
                current.id === item.id
                  ? { ...current, quantity: current.quantity + 1 }
                  : current
              )),
            };
          }

          return {
            ...group,
            items: [...group.items, { ...item, quantity: 1 }],
          };
        });

      return { ...state, groups };
    }

    case 'REMOVE_ITEM': {
      const { restaurantId, itemId } = action.payload;
      return {
        ...state,
        groups: state.groups
          .map((group) => (
            group.restaurantId === restaurantId
              ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
              : group
          ))
          .filter((group) => group.items.length > 0),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { restaurantId, itemId, quantity } = action.payload;
      return {
        ...state,
        groups: state.groups
          .map((group) => {
            if (group.restaurantId !== restaurantId) {
              return group;
            }

            const items = quantity <= 0
              ? group.items.filter((item) => item.id !== itemId)
              : group.items.map((item) => (
                item.id === itemId ? { ...item, quantity } : item
              ));

            return { ...group, items };
          })
          .filter((group) => group.items.length > 0),
      };
    }

    case 'REMOVE_ITEMS_FROM_RESTAURANT': {
      const { restaurantId, itemIds } = action.payload;
      return {
        ...state,
        groups: state.groups
          .map((group) => (
            group.restaurantId === restaurantId
              ? { ...group, items: group.items.filter((item) => !itemIds.includes(item.id)) }
              : group
          ))
          .filter((group) => group.items.length > 0),
      };
    }

    case 'CLEAR_RESTAURANT_CART':
      return {
        ...state,
        groups: state.groups.filter((group) => group.restaurantId !== action.payload.restaurantId),
      };

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = useCallback((item, restaurantId, restaurantName, deliveryFee) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { item, restaurantId, restaurantName, deliveryFee },
    });
  }, []);

  const removeFromCart = useCallback((restaurantId, itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { restaurantId, itemId } });
  }, []);

  const updateQuantity = useCallback((restaurantId, itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { restaurantId, itemId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const clearRestaurantCart = useCallback((restaurantId) => {
    dispatch({ type: 'CLEAR_RESTAURANT_CART', payload: { restaurantId } });
  }, []);

  const removeItemsFromRestaurant = useCallback((restaurantId, itemIds) => {
    dispatch({ type: 'REMOVE_ITEMS_FROM_RESTAURANT', payload: { restaurantId, itemIds } });
  }, []);

  const getRestaurantCart = useCallback((restaurantId) => (
    cart.groups.find((group) => group.restaurantId === restaurantId) || null
  ), [cart.groups]);

  const itemCount = useMemo(() => (
    cart.groups.reduce((sum, group) => (
      sum + group.items.reduce((groupSum, item) => groupSum + item.quantity, 0)
    ), 0)
  ), [cart.groups]);

  const subtotal = useMemo(() => (
    cart.groups.reduce((sum, group) => (
      sum + group.items.reduce((groupSum, item) => groupSum + (item.price * item.quantity), 0)
    ), 0)
  ), [cart.groups]);

  const total = useMemo(() => (
    cart.groups.reduce((sum, group) => {
      const groupSubtotal = group.items.reduce((groupSum, item) => groupSum + (item.price * item.quantity), 0);
      return sum + groupSubtotal + (group.deliveryFee || 0);
    }, 0)
  ), [cart.groups]);

  const value = {
    cart,
    itemCount,
    subtotal,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearRestaurantCart,
    removeItemsFromRestaurant,
    getRestaurantCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
