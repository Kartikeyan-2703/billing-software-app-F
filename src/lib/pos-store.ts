import { create } from "zustand";
import { type MenuItem } from "./menu-data";
import { apiFetch, getAuthToken } from "./api";

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
  id?: string;
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
  restaurantName: "My Restaurant",
  address: "",
  phone: "",
  gstNumber: "",
  footer: "Thank you! Visit again.",
  gstEnabled: false,
  gstPct: 0,
  acEnabled: false,
  acCharge: 0,
};

type Cart = Record<string, number>; // code -> qty

type PosStore = {
  menu: MenuItem[];
  cart: Cart;
  orders: Order[];
  settings: Settings;
  isReady: boolean;
  
  loadData: () => Promise<void>;
  addMenu: (m: MenuItem) => Promise<string | null>;
  updateMenu: (originalCode: string, m: MenuItem) => Promise<string | null>;
  deleteMenu: (code: string) => Promise<void>;
  setQty: (code: string, qty: number) => void;
  clearCart: () => void;
  submitOrder: (paymentMode: string, diningType: string, isAC: boolean, items: {code: string, quantity: number}[]) => Promise<Order>;
  updateSettings: (s: Partial<Settings>) => Promise<string | null>;
  updatePins: (menuPin: string, settingsPin: string) => Promise<string | null>;
};

export const usePos = create<PosStore>((set, get) => ({
  menu: [],
  cart: {},
  orders: [],
  settings: DEFAULT_SETTINGS,
  isReady: false,

  loadData: async () => {
    const token = await getAuthToken();
    if (!token) {
      set({ isReady: true });
      return;
    }

    try {
      const [menuData, settingsData, ordersData] = await Promise.allSettled([
        apiFetch("/menu"),
        apiFetch("/settings"),
        apiFetch("/orders")
      ]);

      set((state) => ({
        menu: menuData.status === "fulfilled" ? menuData.value : state.menu,
        settings: settingsData.status === "fulfilled" && settingsData.value ? settingsData.value : state.settings,
        orders: ordersData.status === "fulfilled" ? ordersData.value : state.orders,
      }));
    } catch (err) {
      console.error("Failed to fetch POS data", err);
    } finally {
      set({ isReady: true });
    }
  },

  addMenu: async (m) => {
    try {
      const newItem = await apiFetch("/menu", {
        method: "POST",
        body: JSON.stringify(m)
      });
      set((state) => ({
        menu: [...state.menu, newItem].sort((a, b) => a.code.localeCompare(b.code))
      }));
      return null;
    } catch (err: any) {
      return err.message || "Failed to add item";
    }
  },

  updateMenu: async (originalCode, m) => {
    try {
      const updatedItem = await apiFetch(`/menu/${originalCode}`, {
        method: "PUT",
        body: JSON.stringify(m)
      });
      set((state) => ({
        menu: state.menu
          .map((i) => (i.code === originalCode ? updatedItem : i))
          .sort((a, b) => a.code.localeCompare(b.code))
      }));
      return null;
    } catch (err: any) {
      return err.message || "Failed to update item";
    }
  },

  deleteMenu: async (code) => {
    try {
      await apiFetch(`/menu/${code}`, {
        method: "DELETE"
      });
      set((state) => ({
        menu: state.menu.filter((i) => i.code !== code)
      }));
    } catch (err: any) {
      console.error("Failed to delete item", err);
      throw err;
    }
  },

  setQty: (code, qty) => {
    set((state) => {
      const next = { ...state.cart };
      if (qty <= 0) delete next[code];
      else next[code] = qty;
      return { cart: next };
    });
  },

  clearCart: () => set({ cart: {} }),

  submitOrder: async (paymentMode, diningType, isAC, items) => {
    const newOrder = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ paymentMode, diningType, isAC, items })
    });
    set((state) => ({
      orders: [newOrder, ...state.orders]
    }));
    return newOrder;
  },

  updateSettings: async (s) => {
    try {
      const updated = await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify(s)
      });
      set((state) => ({
        settings: { ...state.settings, ...updated }
      }));
      return null;
    } catch (err: any) {
      return err.message || "Failed to update settings";
    }
  },

  updatePins: async (menuPin, settingsPin) => {
    try {
      await apiFetch("/auth/update-pins", {
        method: "POST",
        body: JSON.stringify({ menuPassword: menuPin, settingsPassword: settingsPin })
      });
      return null;
    } catch (err: any) {
      return err.message || "Failed to update PINs";
    }
  },
}));

export function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
