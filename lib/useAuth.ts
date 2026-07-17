import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  points: number;
  phone?: string;
  address_detail?: string;
  city_id?: string;
  province_id?: string;
  uid?: string; 
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthModalOpen: false,

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      login: (user, token) => {
        // 👇 UPDATE: Save raw token to 'token' key for easy access
        if (typeof window !== 'undefined') {
            localStorage.setItem("token", token);
        }
        set({ user, token, isAuthModalOpen: false });
      },

      logout: () => {
        set({ user: null, token: null });
        
        // 👇 UPDATE: Remove 'token' key on logout
        if (typeof window !== 'undefined') {
           localStorage.removeItem("token");
           window.location.href = "/login";
        }
      },
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);