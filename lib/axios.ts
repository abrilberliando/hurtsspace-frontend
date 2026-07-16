import axios from "axios";
import { useAuth } from "@/lib/useAuth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // 👇 Wajib FALSE biar gak konflik CSRF dengan Sanctum Token
  withCredentials: false, 
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use((config) => {
  // 👇 UPDATE: Get directly from the independent 'token' key
  // Gak perlu parsing JSON auth-storage lagi. Simpel & Kenceng!
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server returns 401 Unauthorized
    if (error.response && error.response.status === 401) {
      
      // Check to avoid infinite loop if already on login page
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        console.warn("Session Expired (401). Logging out...");
        
        // 1. Clear Zustand state
        useAuth.getState().logout();
        
        // 2. Also remove manual key (Double check to be clean)
        localStorage.removeItem("token");
        
        // 3. Redirect paksa ke login dengan param error
        window.location.href = "/login?session_expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;