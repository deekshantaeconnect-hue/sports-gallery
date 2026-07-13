// app/account/orders/[id]/page.tsx
"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { orderService } from "@/services/order.service";
import {
  Package,
  XCircle,
  MapPin,
  Loader2,
  Calendar,
  CreditCard,
  Truck,
  AlertCircle,
} from "lucide-react";
import { resolveFirstProductImage } from "@/utils/media-normalization";
import { CancelOrderModal } from "@/components/orders/CancelOrderModal";
import { ReturnRequestModal } from "@/components/orders/ReturnRequestModal";
import { RefundStatusCard } from "@/components/orders/RefundStatusCard";
import {
  getOrderAction,
  getStatusDisplayInfo,
  getReturnStatusInfo,
} from "@/utils/order-actions";
import { toast } from "sonner";

const fetcher = async (url: string) => {
  try {
    const res = await apiClient.get(url);
    return res?.data?.data || res?.data || res;
  } catch (error) {
    console.error(`SWR Fetch Error for ${url}:`, error);
    throw error;
  }
};

export default function UserOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams?.id;

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const {
    data: order,
    error,
    isLoading,
    mutate: mutateOrder,
  } = useSWR(orderId ? `/orders/${orderId}/summary` : null, fetcher);

  const {
    data: refundData,
    error: refundError,
    isLoading: refundLoading,
    mutate: mutateRefund,
  } = useSWR(orderId ? `/orders/${orderId}/refund-status` : null, fetcher);

  useEffect(() => {
    if (order) {
      console.log("[DEBUG] User Order Data Fetched:", order);
    }
    if (refundData) {
      console.log("[DEBUG] Refund Data:", refundData);
    }
  }, [order, refundData]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">
          Failed to load order
        </h2>
        <p className="text-sm text-gray-500">
          Please check your network connection or try again later.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Loading your order details...</p>
      </div>
    );
  }

  if (!order || !order.id) {
    return (
      <div className="p-10 text-center max-w-md mx-auto mt-12 border border-dashed rounded-2xl">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-gray-500 mt-2 text-sm">
          We couldn't locate this order history configuration in your account.
        </p>
      </div>
    );
  }

  const currentStatus = order?.status
    ? String(order.status).toUpperCase()
    : "PENDING";
  const orderAction = getOrderAction(currentStatus);

  // ✅ Determine the correct status to display
  let statusDisplay = getStatusDisplayInfo(currentStatus);

  // Get return and refund status from refundData
  const returnStatus = refundData?.returnStatus;
  const refundStatus = refundData?.refundStatus;
  const hasRefund = refundData?.hasRefund;
  const isRefundCompleted =
    refundStatus === "COMPLETED" || refundStatus === "PROCESSED";
  const isReturnClosed = returnStatus === "CLOSED";

  // ✅ Priority 1: If refund is completed, show "Refund Completed"
  if (hasRefund && isRefundCompleted) {
    statusDisplay = {
      label: "Refund Completed",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    };
  }
  // ✅ Priority 2: If refund is in progress, show refund status
  else if (hasRefund && refundStatus && refundStatus !== "NOT_APPLICABLE") {
    const refundStatusMap: Record<
      string,
      { label: string; color: string; bgColor: string; borderColor: string }
    > = {
      NOT_STARTED: {
        label: "Refund Ready",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      INITIATED: {
        label: "Refund Initiated",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
      },
      PROCESSING: {
        label: "Refund Processing",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      },
      PENDING: {
        label: "Refund Pending",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      },
      APPROVED: {
        label: "Refund Approved",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      FAILED: {
        label: "Refund Failed",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      },
      CANCELLED: {
        label: "Refund Cancelled",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      },
    };

    if (refundStatusMap[refundStatus]) {
      statusDisplay = refundStatusMap[refundStatus];
    }
  }
  // ✅ Priority 3: If return is closed but no refund started, show "Return Closed"
  else if (currentStatus === "RETURNED" && isReturnClosed) {
    statusDisplay = {
      label: "Return Closed",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    };
  }
  // ✅ Priority 4: If order is RETURNED with specific return status
  else if (currentStatus === "RETURNED" && returnStatus) {
    statusDisplay = getReturnStatusInfo(returnStatus);
  }
  // ✅ Priority 5: If order is RETURNED but no specific status
  else if (currentStatus === "RETURNED") {
    statusDisplay = {
      label: "Return in Progress",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    };
  }

  const hasAddress = order.addressSnapshot && order.addressSnapshot.name;
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        dateStyle: "long",
      })
    : null;

  const totalAmount = Number(order.totalAmount) || 0;
  const shippingCost = Number(order.shippingCost) || 0;
  const subtotal = Math.max(0, totalAmount - shippingCost);

  // Action handlers
  const handleCancelOrder = async (data: {
    reason: string;
    notes?: string;
  }) => {
    setIsActionLoading(true);
    try {
      const response = await orderService.cancelOrder(order.id, data);
      toast.success("Order cancelled successfully");
      setIsCancelModalOpen(false);

      await Promise.all([mutateOrder(), mutateRefund()]);
    } catch (error: any) {
      toast.error(
        "Cancellation Failed",
        error.response?.data?.message ||
          "Failed to cancel order. Please try again.",
      );
      throw error;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReturnRequest = async (data: {
    reason: string;
    comments?: string;
  }) => {
    setIsActionLoading(true);
    try {
      const response = await orderService.requestReturn(order.id, data);
      toast.success("Return Request Submitted");
      setIsReturnModalOpen(false);

      await Promise.all([mutateOrder(), mutateRefund()]);
    } catch (error: any) {
      toast.error("Return Request Failed");
      throw error;
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto py-8 px-4 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Order Details
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span>
              ID:{" "}
              <span className="font-mono text-gray-700 font-semibold">
                {order.id.toUpperCase()}
              </span>
            </span>
            {formattedDate && (
              <>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {formattedDate}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* ✅ Status Badge - Shows correct status based on refund/return state */}
          <span
            className={`px-4 py-1.5 text-sm font-bold border rounded-full ${statusDisplay.bgColor} ${statusDisplay.borderColor} ${statusDisplay.color}`}
          >
            {statusDisplay.label}
          </span>

          {/* Action Buttons */}
          {orderAction === "cancel" && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-full hover:bg-red-50 transition-colors"
              disabled={isActionLoading}
            >
              Cancel Order
            </button>
          )}

          {orderAction === "return" && (
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-4 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50 transition-colors"
              disabled={isActionLoading}
            >
              Request Return
            </button>
          )}
        </div>
      </div>

      {/* CORE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {hasAddress ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 mb-3.5 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" /> Delivery Address
              </h3>
              <address className="not-italic text-sm text-gray-600 space-y-1 leading-relaxed">
                <p className="font-semibold text-gray-900 text-sm">
                  {order.addressSnapshot?.name}
                </p>
                <p>{order.addressSnapshot?.addressLine}</p>
                <p>
                  {order.addressSnapshot?.city}, {order.addressSnapshot?.state}{" "}
                  —{" "}
                  <span className="font-semibold">
                    {order.addressSnapshot?.pincode}
                  </span>
                </p>
                <p className="pt-2 text-xs text-gray-500">
                  Contact Number: {order.addressSnapshot?.phone}
                </p>
              </address>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center text-gray-500 text-xs">
              <MapPin className="h-5 w-5 mx-auto mb-2 text-gray-400" />
              Digital delivery or no shipment address snapshot was captured.
            </div>
          )}

          {order.paymentProvider && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-400" /> Payment Info
              </h3>
              <p className="text-sm font-medium text-gray-700 capitalize">
                {order.paymentProvider.toLowerCase()} Gateway
              </p>
              {order.paymentProviderId && (
                <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                  Ref: {order.paymentProviderId}
                </p>
              )}
            </div>
          )}

          {/* Refund Status Card */}
          <RefundStatusCard
            refundStatus={refundData}
            isLoading={refundLoading}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 bg-gray-50/70">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" /> Your Package
                Elements
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items && Array.isArray(order.items) ? (
                order.items.map((item: any) => (
                  <div
                    key={item.id || `${item.product?.id}-${item.quantity}`}
                    className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="h-16 w-16 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                      {resolveFirstProductImage(item?.product?.images) ? (
                        <img
                          src={
                            resolveFirstProductImage(item?.product?.images) ||
                            "/placeholder-product.png"
                          }
                          alt={item.product?.name || "product"}
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {item?.product?.name || "Product Item"}
                      </h4>
                      {item?.variant?.name && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          Variant: {item.variant.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        Price per unit: ₹
                        {Number(item?.price || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">
                        ₹
                        {(
                          Number(item?.price || 0) * (item?.quantity || 1)
                        ).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        Qty: {item?.quantity || 1}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No items were packaged with this confirmation ID.
                </div>
              )}
            </div>
          </div>

          {/* Pricing Ledger Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Financial Breakdown
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span className="font-medium text-gray-900">
                  {shippingCost > 0
                    ? `₹${shippingCost.toLocaleString("en-IN")}`
                    : "₹0 (Free)"}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Paid</span>
                <span className="text-xl font-black text-blue-600">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        orderId={order.id}
        isLoading={isActionLoading}
      />

      <ReturnRequestModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleReturnRequest}
        orderId={order.id}
        isLoading={isActionLoading}
      />
    </div>
  );
}
