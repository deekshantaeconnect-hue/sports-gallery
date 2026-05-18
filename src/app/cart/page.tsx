import { Suspense } from "react";
import CartPageClient from "./CartPageClient";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          Loading checkout...
        </div>
      }
    >
      <CartPageClient />
    </Suspense>
  );
}