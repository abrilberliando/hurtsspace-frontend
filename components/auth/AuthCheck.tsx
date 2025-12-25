"use client";

import { useEffect } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";

export default function AuthCheck() {
  const { token, logout } = useAuth();

  useEffect(() => {
    // Kalau ada token di storage, coba tes validitasnya ke backend
    if (token) {
        api.get('/user')
           .then(() => {
               // Token Valid, lanjut
           })
           .catch((err) => {
               // Kalau error (401), interceptor axios di atas sebenernya udah handle,
               // tapi kita bisa double down di sini buat memastikan.
               if (err.response?.status === 401) {
                   logout();
               }
           });
    }
  }, [token, logout]);

  return null; // Komponen ini gak ngerender apa-apa, cuma logic
}