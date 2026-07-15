import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  image: string;
  variantId: number;
  size: string;
  quantity: number;
  maxStock: number;
  weight: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  decreaseItem: (id: string) => void; // 👇 FITUR BARU
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalWeight: () => number; // 👇 NEW FEATURE (For Shipping later)
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (data) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === data.id);

        if (existingItem) {
          if (existingItem.quantity + 1 > existingItem.maxStock) return; 
          set({
            items: currentItems.map((item) =>
              item.id === data.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...get().items, { ...data, quantity: 1 }] });
        }
      },

      // 👇 LOGIC KURANGI BARANG
      decreaseItem: (id) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === id);

        if (existingItem) {
            if (existingItem.quantity > 1) {
                // If qty > 1, subtract 1
                set({
                    items: currentItems.map((item) => 
                        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
                    )
                });
            } else {
                // If only 1 left and subtracted, just remove it
                set({ items: currentItems.filter((item) => item.id !== id) });
            }
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearCart: () => set({ items: [] }),
      
      totalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
      
      totalWeight: () => get().items.reduce((total, item) => total + (item.weight * item.quantity), 0),
    }),
    {
      name: "hurtsspace-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);