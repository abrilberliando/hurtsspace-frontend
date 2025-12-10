"use client";

import Script from "next/script"; // Wajib import dari Next.js
import { useMemo } from "react";

export default function MidtransScriptLoader() {

  // Ambil mode dari ENV (Nilai harus berupa STRING: 'true' atau 'false')
  // Ini yang menentukan apakah Midtrans pop-up lo jadi SANDBOX atau LIVE.
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

  // Pilih URL Snap berdasarkan mode produksi
  const snapUrl = useMemo(() => {
    return isProduction
      ? 'https://app.midtrans.com/snap/snap.js' // URL LIVE (Saat MIDTRANS_IS_PRODUCTION=true)
      : 'https://app.sandbox.midtrans.com/snap/snap.js'; // URL SANDBOX (TEST)
  }, [isProduction]);


  return (
    <>
      {/* Script ini akan me-load URL Snap yang dinamis.
          data-client-key harus sesuai dengan mode yang dipilih di Server Key Laravel lo.
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