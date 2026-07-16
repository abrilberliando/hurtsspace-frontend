"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface FlyingItem {
  id: number;
  src: string;
  startRect: DOMRect;
  endRect: DOMRect;
}

interface CartAnimationContextType {
  triggerFlyAnimation: (buttonElement: HTMLElement, imageSrc: string) => void;
}

const CartAnimationContext = createContext<CartAnimationContextType | undefined>(undefined);

export function CartAnimationProvider({ children }: { children: React.ReactNode }) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  // 👇 FIX HERE: We don't save target in state to trigger, but find it directly
  const triggerFlyAnimation = useCallback((buttonElement: HTMLElement, imageSrc: string) => {
    // 1. Find the target element (Cart) directly in the DOM
    const cartElement = document.getElementById("cart-icon-target");
    
    if (!cartElement) {
        console.warn("Target cart icon not found (pastikan ID 'cart-icon-target' ada di navbar)");
        return;
    }

    // 2. Ambil koordinat saat ini juga
    const endRect = cartElement.getBoundingClientRect();
    const startRect = buttonElement.getBoundingClientRect();
    const id = Date.now();

    // 3. Masukin ke antrian terbang
    setFlyingItems((prev) => [...prev, { id, src: imageSrc, startRect, endRect }]);

    // 4. Remove after 1 second (animation finished)
    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== id));
    }, 1000);
  }, []);

  return (
    <CartAnimationContext.Provider value={{ triggerFlyAnimation }}>
      {children}
      {/* Portal ke Body */}
      {flyingItems.length > 0 && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {flyingItems.map((item) => (
            <FlyingElement key={item.id} item={item} />
          ))}
        </div>,
        document.body
      )}
    </CartAnimationContext.Provider>
  );
}

// Komponen Bulatan Terbang
function FlyingElement({ item }: { item: FlyingItem }) {
    const [isFlying, setIsFlying] = useState(false);

    useEffect(() => {
       // Kasih delay super kecil biar browser sadar posisi awal dulu
       const timer = requestAnimationFrame(() => {
           setIsFlying(true);
       });
       return () => cancelAnimationFrame(timer);
    }, []);

    // Style Posisi Awal (Di Tombol)
    const initialStyle: React.CSSProperties = {
        position: 'fixed',
        top: item.startRect.top,
        left: item.startRect.left,
        width: Math.min(item.startRect.width, 50), // Maksimal 50px biar gak kegedean
        height: Math.min(item.startRect.height, 50),
        backgroundImage: `url(${item.src})`,
        backgroundColor: '#fff', // Fallback white color if image fails to load
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '50%',
        opacity: 1,
        transform: 'scale(1)',
        transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        border: '2px solid white' // Border biar keliatan jelas
    };
    
    // Final Position Style (In Cart)
    const flyingStyle: React.CSSProperties = {
        ...initialStyle,
        top: item.endRect.top + (item.endRect.height / 2) - 10, // Tengah-tengah icon
        left: item.endRect.left + (item.endRect.width / 2) - 10,
        width: 20, // Mengecil jadi titik
        height: 20,
        opacity: 0, // Menghilang
        transform: 'scale(0.2) rotate(360deg)', // Muter
    };

    return <div style={isFlying ? flyingStyle : initialStyle} />;
}

export const useCartAnimation = () => {
  const context = useContext(CartAnimationContext);
  if (!context) {
    throw new Error("useCartAnimation must be used within a CartAnimationProvider");
  }
  return context;
};