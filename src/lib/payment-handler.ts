// src/lib/payment-handler.ts - Complete updated file

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { PaymentInitiateResponse } from "@/types/payment";
import * as Sentry from "@sentry/nextjs";

export const executePaymentFlow = (
  rawResponse: any,
  orderId: string,
  router: AppRouterInstance,
) => {
  
  if (!rawResponse) {
    Sentry.captureMessage("Empty payment response from server", {
      level: "error",
      extra: { orderId },
    });
    toast.error("Invalid payment response from server");
    return;
  }

  let res: PaymentInitiateResponse = rawResponse;

  // ============================================================
  // PAYU: Form submission
  // ============================================================
  if (rawResponse.provider === "PAYU" && rawResponse.formPayload) {
    res = {
      provider: "PAYU",
      flow: "FORM",
      url: rawResponse.formPayload.actionUrl,
      params: { ...rawResponse.formPayload },
    };
    if (res.params) {
      delete res.params.actionUrl;
    }
  }

  // ============================================================
  // RAZORPAY: SDK integration
  // ============================================================
  // src/lib/payment-handler.ts - Update the RAZORPAY_SDK case

  if (res.provider === "RAZORPAY" && res.params) {

    // Load Razorpay script if not already loaded
    if (typeof (window as any).Razorpay === "undefined") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        openRazorpayCheckout(res.params, orderId, router);
      };
      script.onerror = () => {
        toast.error("Failed to load Razorpay SDK");
      };
      document.body.appendChild(script);
    } else {
      openRazorpayCheckout(res.params, orderId, router);
    }
    return;
  }

  // ============================================================
  // Helper function to open Razorpay checkout
  // ============================================================
  function openRazorpayCheckout(
    params: any,
    orderId: string,
    router: AppRouterInstance,
  ) {
    try {
      // Make sure we have the key_id
      if (!params.key_id) {
        console.error("[DEBUG] Razorpay key_id missing in params:", params);
        toast.error("Payment gateway configuration error");
        return;
      }


      const options = {
        key: params.key_id, // Must be 'key' not 'key_id' for the SDK
        amount: params.amount,
        currency: params.currency,
        name: params.name || "AE Naturals",
        description: params.description || "",
        order_id: params.order_id,
        prefill: params.prefill || {},
        theme: params.theme || { color: "#217A6E" },
        handler: function (paymentResponse: any) {
          verifyPayment("RAZORPAY", orderId, paymentResponse, router);
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled");
            router.push("/checkout?error=payment_failed");
          },
        },
      };


      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("[DEBUG] Razorpay initialization error:", error);
      toast.error("Payment gateway failed to initialize");
    }
  }

  // ============================================================
  // Other flows (REDIRECT, FORM, NONE)
  // ============================================================
  switch (res.flow) {
    case "REDIRECT":
      if (!res.url) {
        Sentry.captureException(
          new Error("Redirect URL missing from provider"),
          { extra: { res, orderId } },
        );
        toast.error("Redirect URL missing from provider");
        return;
      }
      toast.loading(`Redirecting to ${res.provider}...`);
      window.location.href = res.url;
      break;

    case "FORM":
      if (!res.url || !res.params) {
        Sentry.captureException(new Error("Form configuration missing"), {
          extra: { res, orderId },
        });
        toast.error("Form configuration missing");
        return;
      }
      toast.loading(`Connecting to secure payment gateway...`);

      const form = document.createElement("form");
      form.method = res.method || "POST";
      form.action = res.url;
      form.target = "_self";

      Object.entries(res.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const hiddenField = document.createElement("input");
          hiddenField.type = "hidden";
          hiddenField.name = key;
          hiddenField.value = String(value);
          form.appendChild(hiddenField);
        }
      });

      document.body.appendChild(form);
      setTimeout(() => form.submit(), 100);
      break;

    case "NONE":
      toast.success("Order placed successfully!");
      router.push(`/order-success/${orderId}`);
      break;

    default:
      // Fallback: try to use URL if available
      if (res.url || rawResponse.checkoutUrl) {
        window.location.href = res.url || rawResponse.checkoutUrl;
      } else if (rawResponse.provider === "RAZORPAY") {
        // If Razorpay flow wasn't properly set, try SDK anyway
        const params = {
          key_id: rawResponse.key_id,
          amount: rawResponse.amount,
          currency: rawResponse.currency,
          order_id: rawResponse.providerOrderId,
          name: "AE Naturals",
          description: `Order #${orderId}`,
          handler: function (paymentResponse: any) {
            verifyPayment("RAZORPAY", orderId, paymentResponse, router);
          },
          modal: {
            ondismiss: function () {
              toast.info("Payment cancelled");
              router.push("/checkout?error=payment_failed");
            },
          },
        };

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const razorpay = new (window as any).Razorpay(params);
          razorpay.open();
        };
        script.onerror = () => {
          toast.error("Failed to load Razorpay SDK");
        };
        document.body.appendChild(script);
      } else {
        Sentry.captureMessage("Unknown Payment Gateway Payload", {
          level: "fatal",
          extra: { rawResponse, orderId },
        });
        console.error("Unknown payment flow:", res);
        toast.error("Payment routing failed. Please contact support.");
      }
  }
};

// ============================================================
// Payment Verification Helper
// ============================================================
// The verifyPayment function stays the same - it already calls /api/payments/verify
async function verifyPayment(
  provider: string,
  orderId: string,
  paymentData: any,
  router: AppRouterInstance,
) {
  try {
    const loadingToast = toast.loading("Verifying payment...");

    // ✅ This calls the Next.js API route
    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        orderId,
        paymentData,
      }),
    });

    toast.dismiss(loadingToast);

    const result = await response.json();

    if (result.success) {
      toast.success("Payment successful!");
      router.push(`/order-success/${result.orderId || orderId}`);
    } else {
      toast.error(result.message || "Payment verification failed");
      router.push(`/checkout?error=verification_failed`);
    }
  } catch (error: any) {
    console.error("[DEBUG] Verification error:", error);
    toast.error(error.message || "Payment verification failed");
    router.push(`/checkout?error=verification_failed`);
  }
}
