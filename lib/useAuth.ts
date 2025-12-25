import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  points: number;
  avatar?: string;
  phone?: string;
  address_detail?: string;
  city_id?: string;
  province_id?: string; // Kita pake buat simpen nama kota
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

      login: (userData, authToken) => {
        // Simpan token ke LocalStorage (biar Axios bisa baca)
        localStorage.setItem("token", authToken);
        set({ user: userData, token: authToken });
      },

      logout: () => {
        // Hapus jejak
        localStorage.removeItem("token");
        set({ user: null, token: null });
        window.location.href = "/login"; // Tendang ke login
      },
    }),
    {
      name: "hurtsspace-auth", // Nama key di storage
      storage: createJSONStorage(() => localStorage),
    }
  )
);