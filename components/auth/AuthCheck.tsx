"use client";

import { useEffect } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";

export default function AuthCheck() {
  const { token, logout } = useAuth();

  useEffect(() => {
    // If there is a token in storage, try to test its validity to the backend
    if (token) {
        api.get('/user')
           .then(() => {
               // Token Valid, continue
           })
           .catch((err) => {
               // If error (401), axios interceptor above actually already handled it,
               // but we can double down here to make sure.
               if (err.response?.status === 401) {
                   logout();
               }
           });
    }
  }, [token, logout]);

  return null; // Komponen ini gak ngerender apa-apa, cuma logic
}