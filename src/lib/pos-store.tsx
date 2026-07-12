import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_MENU, type MenuItem } from "./menu-data";

export type OrderType = "Dine-In" | "Take Away";
export type PaymentMode = "Cash" | "UPI";
export type AcMode = "AC" | "Non-AC";

export type OrderLine = {
  code: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  billNo: string;
  date: string; // ISO
  items: OrderLine[];
  subtotal: number;
  gstPct: number;
  gstAmount: number;
  acCharge: number;
  total: number;
  paymentMode: PaymentMode;
  orderType: OrderType;
  acMode?: AcMode;
};

export type Settings = {
  restaurantName: string;
  address: string;
  phone: string;
  gstNumber: string;
  footer: string;
  gstEnabled: boolean;
  gstPct: number;
  acEnabled: boolean;
  acCharge: number;
};

const DEFAULT_SETTINGS: Settings = {
  restaurantName: "Veda Kitchen",
  address: "12, Anna Salai, Chennai 600002",
  phone: "+91 98765 43210",
  gstNumber: "33ABCDE1234F1Z5",
  footer: "Thank you! Visit again.",
  gstEnabled: true,
  gstPct: 5,
  acEnabled: true,
  acCharge: 30,
};

type Cart = Record<string, number>; // code -> qty

type Ctx = {
  menu: MenuItem[];
  addMenu: (m: MenuItem) => string | null;
  updateMenu: (originalCode: string, m: MenuItem) => string | null;
  deleteMenu: (code: string) => void;
  cart: Cart;
  setQty: (code: string, qty: number) => void;
  clearCart: () => void;
  orders: Order[];
  addOrder: (o: Order) => void;
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
  isReady: boolean;
};

const PosCtx = createContext<Ctx | null>(null);

function usePersistedState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) setState(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to load state", key, e);
      }
      setLoaded(true);
    })();
  }, [key]);

  const setPersistedState = (v: T | ((p: T) => T)) => {
    setState((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      AsyncStorage.setItem(key, JSON.stringify(next)).catch((e) =>
        console.error("Failed to save state", key, e)
      );
      return next;
    });
  };

  return [state, setPersistedState, loaded];
}

export function PosProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu, menuLoaded] = usePersistedState<MenuItem[]>("pos.menu", DEFAULT_MENU);
  const [cart, setCart] = useState<Cart>({});
  const [orders, setOrders, ordersLoaded] = usePersistedState<Order[]>("pos.orders", []);
  const [settings, setSettings, settingsLoaded] = usePersistedState<Settings>("pos.settings", DEFAULT_SETTINGS);

  const isReady = menuLoaded && ordersLoaded && settingsLoaded;

  const value = useMemo<Ctx>(
    () => ({
      menu,
      addMenu: (m) => {
        if (!/^\d{3}$/.test(m.code)) return "Item code must be exactly 3 digits";
        if (menu.some((i) => i.code === m.code)) return "Item code already exists";
        setMenu((prev) => [...prev, m].sort((a, b) => a.code.localeCompare(b.code)));
        return null;
      },
      updateMenu: (originalCode, m) => {
        if (!/^\d{3}$/.test(m.code)) return "Item code must be exactly 3 digits";
        if (m.code !== originalCode && menu.some((i) => i.code === m.code))
          return "Item code already exists";
        setMenu((prev) =>
          prev
            .map((i) => (i.code === originalCode ? m : i))
            .sort((a, b) => a.code.localeCompare(b.code)),
        );
        return null;
      },
      deleteMenu: (code) => setMenu((prev) => prev.filter((i) => i.code !== code)),
      cart,
      setQty: (code, qty) =>
        setCart((prev) => {
          const next = { ...prev };
          if (qty <= 0) delete next[code];
          else next[code] = qty;
          return next;
        }),
      clearCart: () => setCart({}),
      orders,
      addOrder: (o) => setOrders((prev) => [o, ...prev]),
      settings,
      updateSettings: (s) => setSettings((prev) => ({ ...prev, ...s })),
      isReady,
    }),
    [menu, cart, orders, settings, setMenu, setOrders, setSettings, isReady],
  );

  return <PosCtx.Provider value={value}>{children}</PosCtx.Provider>;
}

export function usePos() {
  const v = useContext(PosCtx);
  if (!v) throw new Error("usePos must be used within PosProvider");
  return v;
}

export function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
