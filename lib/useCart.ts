import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Tipe data barang di keranjang
export interface CartItem {
  id: string; // Unik: combinasi productID + variantID
  productId: number;
  name: string;
  price: number;
  image: string;
  variantId: number;
  size: string;
  quantity: number;
  maxStock: number; // Biar gak bisa add lebih dari stok
  weight: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (data) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === data.id);

        if (existingItem) {
          // Kalau barang udah ada, tambah quantity aja
          // Cek stok dulu
          if (existingItem.quantity + 1 > existingItem.maxStock) return; 

          set({
            items: currentItems.map((item) =>
              item.id === data.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Barang baru, masukin ke array
          set({ items: [...get().items, { ...data, quantity: 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearCart: () => set({ items: [] }),
      
      totalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
    }),
    {
      name: "hurtsspace-cart", // Nama key di LocalStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);