import axios from "axios";
import { useAuth } from "@/lib/useAuth"; // Pastikan path import store auth lo bener

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Penting buat Sanctum cookie-based (kalau pake)
});

// Request Interceptor: Tempel Token Otomatis
api.interceptors.request.use((config) => {
  // Ambil token langsung dari storage (cara paling aman di luar component react)
  // Sesuaikan key storage lo, biasanya 'auth-storage' kalau pake persist zustand
  const storageStr = localStorage.getItem("auth-storage");
  
  if (storageStr) {
    const storage = JSON.parse(storageStr);
    const token = storage.state?.token; // Sesuaikan struktur state lo
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 👇 RESPONSE INTERCEPTOR (INI SOLUSI AUTO LOGOUT-NYA)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Cek apakah errornya 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      
      // Cek apakah kita sedang TIDAK di halaman login (biar gak loop)
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        
        // 1. Hapus Data Auth di Zustand (Pake getState biar jalan di luar React Component)
        useAuth.getState().logout();
        
        // 2. Redirect Paksa ke Login
        // Kita pake window.location biar refresh bersih
        window.location.href = "/login?session_expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;