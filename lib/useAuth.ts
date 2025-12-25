import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  points: number;
  avatar?: string;
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
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user, token) => {
        // 👇 UPDATE: Simpan token mentah ke key 'token' biar gampang diakses
        if (typeof window !== 'undefined') {
            localStorage.setItem("token", token);
        }
        set({ user, token });
      },

      logout: () => {
        set({ user: null, token: null });
        
        // 👇 UPDATE: Hapus key 'token' saat logout
        if (typeof window !== 'undefined') {
           localStorage.removeItem("token");
           window.location.href = "/login";
        }
      },
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);