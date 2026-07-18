import { create } from "zustand";
import { type MenuItem } from "./menu-data";
export { type MenuItem };
import { apiFetch, getAuthToken, clearAuthToken } from "./api";
import * as SecureStore from 'expo-secure-store';
import { connectPrinter } from './printer-utils';
import { router } from 'expo-router';

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
  trends: any;
  ordersPage: number;
  hasMoreOrders: boolean;
  ordersSearchQuery: string;
  isFetchingOrders: boolean;
  settings: Settings;
  isReady: boolean;
  
  connectedPrinterAddress: string | null;
  connectedPrinterName: string | null;
  isConnectingPrinter: boolean;
  
  initPrinter: () => Promise<void>;
  connectToPrinter: (address: string, name: string | null) => Promise<void>;
  disconnectPrinter: () => Promise<void>;
  
  loadData: () => Promise<void>;
  addMenu: (m: MenuItem) => Promise<string | null>;
  updateMenu: (originalCode: string, m: MenuItem) => Promise<string | null>;
  deleteMenu: (code: string) => Promise<void>;
  setQty: (code: string, qty: number) => void;
  clearCart: () => void;
  submitOrder: (paymentMode: string, diningType: string, isAC: boolean, items: {code: string, quantity: number}[]) => Promise<Order>;
  updateSettings: (s: Partial<Settings>) => Promise<string | null>;
  updatePins: (menuPin: string, settingsPin: string, trendsPin: string) => Promise<string | null>;
  fetchNextOrdersPage: () => Promise<void>;
  searchOrders: (query: string) => Promise<void>;
};

export const usePos = create<PosStore>((set, get) => ({
  menu: [],
  cart: {},
  orders: [],
  trends: null,
  ordersPage: 1,
  hasMoreOrders: true,
  ordersSearchQuery: "",
  isFetchingOrders: false,
  settings: DEFAULT_SETTINGS,
  isReady: false,
  
  connectedPrinterAddress: null,
  connectedPrinterName: null,
  isConnectingPrinter: false,

  initPrinter: async () => {
    try {
      const savedAddress = await SecureStore.getItemAsync('printer_address');
      const savedName = await SecureStore.getItemAsync('printer_name');
      if (savedAddress) {
        set({ isConnectingPrinter: true });
        await connectPrinter(savedAddress);
        set({ connectedPrinterAddress: savedAddress, connectedPrinterName: savedName });
      }
    } catch (e) {
      console.log("Failed to auto-connect printer", e);
    } finally {
      set({ isConnectingPrinter: false });
    }
  },

  connectToPrinter: async (address, name) => {
    set({ isConnectingPrinter: true });
    try {
      await connectPrinter(address);
      await SecureStore.setItemAsync('printer_address', address);
      if (name) await SecureStore.setItemAsync('printer_name', name);
      set({ connectedPrinterAddress: address, connectedPrinterName: name });
    } finally {
      set({ isConnectingPrinter: false });
    }
  },

  disconnectPrinter: async () => {
    await SecureStore.deleteItemAsync('printer_address');
    await SecureStore.deleteItemAsync('printer_name');
    set({ connectedPrinterAddress: null, connectedPrinterName: null });
  },

  loadData: async () => {
    const token = await getAuthToken();
    if (!token) {
      set({ isReady: true });
      return;
    }

    // Clear previous user's data before fetching new data
      set({
        menu: [],
        orders: [],
        trends: null,
        ordersPage: 1,
        hasMoreOrders: true,
        ordersSearchQuery: "",
        cart: {},
        settings: {
          restaurantName: "My Restaurant",
          address: "",
          phone: "",
          gstNumber: "",
          footer: "Thank you! Visit again.",
          gstEnabled: false,
          gstPct: 0,
          acEnabled: false,
          acCharge: 0,
        },
      });

      try {
        const [menuData, settingsData, ordersData, trendsData] = await Promise.allSettled([
        apiFetch("/menu"),
        apiFetch("/settings"),
        apiFetch("/orders?page=1&limit=20"),
        apiFetch("/trends")
      ]);

      set((state) => ({
        menu: menuData.status === "fulfilled" ? menuData.value : state.menu,
        settings: settingsData.status === "fulfilled" && settingsData.value ? settingsData.value : state.settings,
        orders: ordersData.status === "fulfilled" ? ordersData.value.data : state.orders,
        hasMoreOrders: ordersData.status === "fulfilled" ? ordersData.value.hasMore : state.hasMoreOrders,
        trends: trendsData.status === "fulfilled" ? trendsData.value : state.trends,
      }));
      
      // If any request failed due to invalid token, clear it so user is logged out
      if (
        (menuData.status === "rejected" && menuData.reason?.message?.includes("Unauthorized")) ||
        (settingsData.status === "rejected" && settingsData.reason?.message?.includes("Unauthorized")) ||
        (ordersData.status === "rejected" && ordersData.reason?.message?.includes("Unauthorized")) ||
        (trendsData.status === "rejected" && trendsData.reason?.message?.includes("Unauthorized"))
      ) {
        await clearAuthToken();
        router.replace('/login');
      }
    } catch (err) {
      console.error("Failed to fetch POS data", err);
    } finally {
      set({ isReady: true });
    }
  },

  fetchNextOrdersPage: async () => {
    const state = get();
    if (state.isFetchingOrders || !state.hasMoreOrders) return;
    
    set({ isFetchingOrders: true });
    try {
      const nextPage = state.ordersPage + 1;
      const q = encodeURIComponent(state.ordersSearchQuery);
      const res = await apiFetch(`/orders?page=${nextPage}&limit=20&query=${q}`);
      set({
        orders: [...state.orders, ...res.data],
        ordersPage: nextPage,
        hasMoreOrders: res.hasMore
      });
    } catch (err) {
      console.error("Failed to fetch next orders page", err);
    } finally {
      set({ isFetchingOrders: false });
    }
  },

  searchOrders: async (query: string) => {
    set({ ordersSearchQuery: query, isFetchingOrders: true });
    try {
      const q = encodeURIComponent(query);
      const res = await apiFetch(`/orders?page=1&limit=20&query=${q}`);
      set({
        orders: res.data,
        ordersPage: 1,
        hasMoreOrders: res.hasMore
      });
    } catch (err) {
      console.error("Failed to search orders", err);
    } finally {
      set({ isFetchingOrders: false });
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

  updatePins: async (menuPin, settingsPin, trendsPin) => {
    try {
      await apiFetch("/auth/update-pins", {
        method: "POST",
        body: JSON.stringify({ menuPassword: menuPin, settingsPassword: settingsPin, trendsPassword: trendsPin }),
      });
      return null;
    } catch (err: any) {
      return err.message || "Failed to update PINs";
    }
  },
}));

export function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
