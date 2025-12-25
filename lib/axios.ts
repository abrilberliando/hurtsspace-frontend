import axios from "axios";
import { useAuth } from "@/lib/useAuth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // 👇 Wajib FALSE biar gak konflik CSRF dengan Sanctum Token
  // Kita murni pake Token Bearer, gak butuh cookie session.
  withCredentials: false, 
});

// --- REQUEST INTERCEPTOR ---
// Tugas: Nyuntik Token Bearer ke setiap request keluar
api.interceptors.request.use((config) => {
  let token = null;

  // 1. Prioritas Utama: Cek auth-storage (Zustand Persist)
  const storageStr = localStorage.getItem("auth-storage");
  if (storageStr) {
    try {
      const storage = JSON.parse(storageStr);
      if (storage.state?.token) {
        token = storage.state.token;
      }
    } catch (e) {
      console.error("Axios: Gagal parsing auth-storage, mencoba fallback...", e);
    }
  }

  // 2. Fallback: Cek key 'token' biasa (Kalau lo pake useAuth lama)
  if (!token) {
     token = localStorage.getItem("token");
  }

  // 3. Kalau token ketemu, tempel ke Header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Debugging (Opsional, matikan di production biar gak spam console)
    // console.warn("Axios: Tidak ada token yang ditemukan di storage.");
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- RESPONSE INTERCEPTOR ---
// Tugas: Nangkep error global, terutama 401 (Token Expired/Invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Kalau server balikin 401 Unauthorized
    if (error.response && error.response.status === 401) {
      
      // Cek biar gak infinite loop kalau udah di halaman login
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        console.warn("Session Expired (401). Logging out...");
        
        // 1. Hapus state di Zustand (pake getState biar jalan di luar hook)
        useAuth.getState().logout();

        // 2. Hapus juga key manual kalau ada (Biar bersih total)
        localStorage.removeItem("token");
        
        // 3. Redirect paksa ke login dengan param error
        window.location.href = "/login?session_expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;