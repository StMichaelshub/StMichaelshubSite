import { createContext, startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { inferPublicSiteFromPath, PUBLIC_SITE_KEYS } from "@/lib/publicSite";

export const CartContext = createContext({});
const CART_STORAGE_KEY = "cart";

function createEmptyCartState() {
  return {
    [PUBLIC_SITE_KEYS.STORE]: [],
    [PUBLIC_SITE_KEYS.HOTEL]: [],
  };
}

function normalizeCartState(value) {
  if (Array.isArray(value)) {
    return {
      ...createEmptyCartState(),
      [PUBLIC_SITE_KEYS.STORE]: value,
    };
  }

  if (!value || typeof value !== "object") {
    return createEmptyCartState();
  }

  return {
    [PUBLIC_SITE_KEYS.STORE]: Array.isArray(value[PUBLIC_SITE_KEYS.STORE])
      ? value[PUBLIC_SITE_KEYS.STORE]
      : [],
    [PUBLIC_SITE_KEYS.HOTEL]: Array.isArray(value[PUBLIC_SITE_KEYS.HOTEL])
      ? value[PUBLIC_SITE_KEYS.HOTEL]
      : [],
  };
}

function normalizeMaxQuantity(maxQuantity) {
  return Number.isFinite(maxQuantity) ? Math.max(0, maxQuantity) : Number.POSITIVE_INFINITY;
}

export default function CartProvider({ children }) {
  const router = useRouter();
  const activeSiteKey = inferPublicSiteFromPath(router.pathname) || PUBLIC_SITE_KEYS.STORE;
  const [cartState, setCartState] = useState(createEmptyCartState);

  const cartProducts = useMemo(
    () => cartState[activeSiteKey] || [],
    [activeSiteKey, cartState]
  );

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        startTransition(() => {
          setCartState(normalizeCartState(parsedCart));
        });
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    }
  }, [cartState]);

  function setCartProducts(value) {
    setCartState((previousState) => {
      const previousCart = previousState[activeSiteKey] || [];
      const nextCart = typeof value === "function" ? value(previousCart) : value;

      return {
        ...previousState,
        [activeSiteKey]: Array.isArray(nextCart) ? nextCart : previousCart,
      };
    });
  }

  function addProductToCart(productId, options = {}) {
    const maxQuantity = normalizeMaxQuantity(options.maxQuantity);

    setCartProducts((prev) => {
      const existing = prev.find((p) => p.id === productId);

      if (maxQuantity === 0) {
        return prev;
      }

      if (existing) {
        const nextQuantity = Math.min(existing.qty + 1, maxQuantity);
        if (nextQuantity === existing.qty) {
          return prev;
        }

        return prev.map((p) =>
          p.id === productId ? { ...p, qty: nextQuantity } : p
        );
      }
      return [...prev, { id: productId, qty: 1 }];
    });
  }

  function updateProductQuantity(productId, quantity, options = {}) {
    const maxQuantity = normalizeMaxQuantity(options.maxQuantity);

    setCartProducts((prev) =>
      prev
        .map((product) =>
          product.id === productId
            ? {
                ...product,
                qty: Math.min(Math.max(0, Number(quantity) || 0), maxQuantity),
              }
            : product
        )
        .filter((product) => product.qty > 0)
    );
  }

  function removeProductFromCart(productId) {
    setCartProducts((prev) => prev.filter((product) => product.id !== productId));
  }

  function clearCart() {
    setCartProducts([]);
  }

  const cartCount = cartProducts.reduce(
    (runningTotal, product) => runningTotal + (product.qty || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartProducts,
        cartCount,
        setCartProducts,
        addProductToCart,
        updateProductQuantity,
        removeProductFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
