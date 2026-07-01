"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";

const CartCtx = createContext(null);

// thin wrapper over /api/cart; returns { ok, status, data }
async function api(method, body, query = "") {
  const res = await fetch("/api/cart" + query, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0); // increments to trigger badge pop

  const apply = (data) => Array.isArray(data?.items) && setItems(data.items);

  // pull the server cart (mount + whenever the tab regains focus — a login/logout
  // elsewhere means the merged/owned cart shows up on the next focus)
  const refresh = useCallback(async () => {
    const { ok, data } = await api("GET");
    if (ok) apply(data);
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    // visibilitychange fires on tab/app return even when `focus` doesn't (tab was
    // backgrounded, laptop slept) — so a still-valid server cart re-appears on return.
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // each mutation returns the fresh cart → set it straight from the response.
  // callers get { ok } or { error } (the stock/availability message).
  const add = useCallback(async (line) => {
    const { ok, data } = await api("POST", {
      id: line.id,
      color: line.color,
      size: line.size,
      qty: line.qty ?? 1,
    });
    if (ok) {
      apply(data);
      setBump((b) => b + 1);
      return { ok: true };
    }
    return { error: data?.error || "نشد. دوباره بزن." };
  }, []);

  const setQty = useCallback(async (key, qty) => {
    const { ok, data } = await api("PATCH", { key, qty });
    if (ok) apply(data);
    return ok ? { ok: true } : { error: data?.error || "نشد." };
  }, []);

  const setVariant = useCallback(async (key, patch) => {
    const { ok, data } = await api("PATCH", { key, ...patch });
    if (ok) apply(data);
    return ok ? { ok: true } : { error: data?.error || "ناموجود" };
  }, []);

  const remove = useCallback(async (key) => {
    const { ok, data } = await api("DELETE", { key });
    if (ok) apply(data);
    return { ok };
  }, []);

  const clear = useCallback(async () => {
    const { ok, data } = await api("DELETE", null, "?all=1");
    if (ok) apply(data);
    return { ok };
  }, []);

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
    add,
    setQty,
    setVariant,
    remove,
    clear,
    refresh,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
