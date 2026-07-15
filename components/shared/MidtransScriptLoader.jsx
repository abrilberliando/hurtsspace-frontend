"use client";

import Script from "next/script"; // Wajib import dari Next.js
import { useMemo } from "react";

export default function MidtransScriptLoader() {

  // Ambil mode dari ENV (Nilai harus berupa STRING: 'true' atau 'false')
  // This determines if your Midtrans pop-up is SANDBOX or LIVE.
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

  // Select Snap URL based on production mode
  const snapUrl = useMemo(() => {
    return isProduction
      ? 'https://app.midtrans.com/snap/snap.js' // URL LIVE (Saat MIDTRANS_IS_PRODUCTION=true)
      : 'https://app.sandbox.midtrans.com/snap/snap.js'; // URL SANDBOX (TEST)
  }, [isProduction]);


  return (
    <>
      {/* This script will load the dynamic Snap URL.
          data-client-key must match the mode selected in your Laravel Server Key.
      */}
      <Script 
        src={snapUrl}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload" // Load setelah semua resource utama di-load
        id="midtrans-snap-script" // Tambahkan ID biar gampang di-debug
      />
    </>
  );
}