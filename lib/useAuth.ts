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
  uid?: string; // UID dari Firebase/Google
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

      // Login: Simpan user & token ke state (otomatis masuk localStorage via persist)
      login: (user, token) => {
        set({ user, token });
      },

      // Logout: Hapus state & redirect ke login
      logout: () => {
        set({ user: null, token: null });
        
        // Hapus juga key manual (kalau dulu pernah pake) biar bersih total
        if (typeof window !== 'undefined') {
           localStorage.removeItem("token");
           // Pake window.location biar state aplikasi bersih total (hard refresh)
           window.location.href = "/login";
        }
      },
    }),
    {
      name: 'auth-storage', // Key di LocalStorage (Dicocokin sama axios.ts)
      storage: createJSONStorage(() => localStorage),
    }
  )
);