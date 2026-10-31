import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';

/** product id -> quantity */
export type CartItems = Record<string, number>;

interface CartState {
  items: CartItems;
  /** Number of different products in the cart. */
  count: number;
  setQty: (productId: string, qty: number) => void;
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);

/** The customer's cart, kept on their device per account so it survives page reloads. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const key = `ssvi-cart-${session?.user.id ?? 'guest'}`;
  const [items, setItems] = useState<CartItems>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active) return;
        try {
          setItems(raw ? (JSON.parse(raw) as CartItems) : {});
        } catch {
          setItems({});
        }
        setLoadedKey(key);
      })
      .catch(() => active && setLoadedKey(key));
    return () => {
      active = false;
    };
  }, [key]);

  // Save after every change, but never before this account's cart has been loaded.
  useEffect(() => {
    if (loadedKey !== key) return;
    AsyncStorage.setItem(key, JSON.stringify(items)).catch(() => {});
  }, [items, key, loadedKey]);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((c) => {
      const next = { ...c };
      if (!(qty > 0)) delete next[productId];
      else next[productId] = Math.round(qty * 1000) / 1000;
      return next;
    });
  }, []);

  const value = useMemo<CartState>(
    () => ({
      items,
      count: Object.keys(items).length,
      setQty,
      add: (productId, qty = 1) => setQty(productId, (items[productId] ?? 0) + qty),
      remove: (productId) => setQty(productId, 0),
      clear: () => setItems({}),
    }),
    [items, setQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart must be used inside CartProvider');
  return c;
}
