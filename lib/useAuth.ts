import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
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
    uid?: string; // Tambahan buat Firebase UID
}

interface AuthStore {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuth = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            
            login: (user, token) => {
                // Kita gak perlu manual localStorage.setItem("token") lagi
                // karena 'persist' middleware udah otomatis nyimpen state (user & token) ke localStorage
                set({ user, token });
            },

            logout: () => {
                set({ user: null, token: null });
                // Redirect ke login biar user sadar sesinya abis
                // Kita pake window.location biar state bener-bener fresh (hard reload)
                if (typeof window !== 'undefined') {
                    window.location.href = "/login";
                }
            },
        }),
        {
            // 👇 PENTING: Nama key ini harus sama dengan yang kita pake di lib/axios.ts
            name: 'auth-storage', 
            storage: createJSONStorage(() => localStorage),
        }
    )
);