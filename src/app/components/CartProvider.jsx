"use client";

import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";

const CartCtx = createContext(null);
const KEY = "bad-cart-v1";

// each line is unique per product + size + color
const lineId = (p) => `${p.id}__${p.size}__${p.color}`;

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return action.items;
    case "add": {
      const id = lineId(action.line);
      const found = state.find((l) => l.key === id);
      if (found) {
        return state.map((l) =>
          l.key === id ? { ...l, qty: Math.min(l.qty + action.line.qty, 9) } : l
        );
      }
      return [...state, { ...action.line, key: id }];
    }
    case "qty":
      return state
        .map((l) => (l.key === action.key ? { ...l, qty: action.qty } : l))
        .filter((l) => l.qty > 0);
    case "remove":
      return state.filter((l) => l.key !== action.key);
    case "clear":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0); // increments to trigger badge pop
  const firstPersist = useRef(true); // skip the initial write so we don't clobber stored cart

  // hydrate from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) });
    } catch {}
  }, []);

  // persist (skip first run — that's the pre-hydration empty state)
  useEffect(() => {
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const count = items.reduce((n, l) => n + l.qty, 0);
  const subtotal = items.reduce((n, l) => n + l.qty * l.price, 0);

  const value = {
    items,
    count,
    subtotal,
    open,
    bump,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    add: (line) => {
      dispatch({ type: "add", line });
      setBump((b) => b + 1);
    },
    setQty: (key, qty) => dispatch({ type: "qty", key, qty }),
    remove: (key) => dispatch({ type: "remove", key }),
    clear: () => dispatch({ type: "clear" }),
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
