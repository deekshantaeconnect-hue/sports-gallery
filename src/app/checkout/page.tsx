// src/app/checkout/page.tsx

import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}