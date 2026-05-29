// src/components/orders/OrderTrackingView.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Truck, Package, Clock, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface TrackingPayload {
  orderStatus: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
  shipmentDetails: {
    courier: string | null;
    awbCode: string | null;
    trackingUrl: string | null;
    status: string;
  } | null;
  liveTracking: any | null;
  message?: string;
}

interface OrderTrackingViewProps {
  orderId: string;
}

export default function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingData = async (isRefreshedCall = false) => {
    if (isRefreshedCall) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get(`/orders/${orderId}/tracking`);
      setData(res.data);
    } catch (err: any) {
      console.error("Tracking details retrieval failed:", err);
      setError(err?.response?.data?.message || "Unable to fetch live tracing metrics for this order instance.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <RefreshCw className="animate-spin text-[#217A6E] mx-auto w-8 h-8" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">Syncing logistics and ledger systems...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
        <AlertTriangle className="text-red-500 w-10 h-10 mx-auto" />
        <h3 className="font-bold text-red-800 text-lg">System Evaluation Failure</h3>
        <p className="text-sm text-red-600 max-w-md mx-auto">{error || "No response tracking data model found."}</p>
        <button 
          onClick={() => fetchTrackingData()} 
          className="mt-2 bg-white px-4 py-2 text-xs font-semibold border rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
        >
          Retry Engine Sync
        </button>
      </div>
    );
  }

  const isManualBypass = !data.liveTracking || !data.liveTracking?.tracking_data?.shipment_track;
  
  // Maps standard system state matrices directly to localized index trackers
  const statusMap = { PENDING: 0, PAID: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3 };
  const currentStep = statusMap[data.orderStatus as keyof typeof statusMap] ?? 0;
  const isTerminated = data.orderStatus === "CANCELLED" || data.orderStatus === "RETURNED";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl border border-gray-100 shadow-sm relative">
      
      {/* HEADER CONTROLS SECTION */}
      <div className="border-b pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Order Instance Status</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
              isTerminated ? "bg-red-100 text-red-700" : "bg-[#217A6E]/10 text-[#217A6E]"
            }`}>
              {data.orderStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{data.message || "Awaiting structural update loops from transit carriers."}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {data.shipmentDetails?.courier && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-left sm:text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Carrier Assignment</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{data.shipmentDetails.courier}</p>
              {data.shipmentDetails.awbCode && (
                <p className="text-xs text-gray-500 font-mono mt-1 bg-white px-1.5 py-0.5 border rounded inline-block">
                  AWB: {data.shipmentDetails.awbCode}
                </p>
              )}
            </div>
          )}
          <button 
            disabled={refreshing}
            onClick={() => fetchTrackingData(true)}
            className="p-2 border rounded-lg hover:bg-gray-50 transition-colors bg-white disabled:opacity-40"
            title="Force refresh ledger metrics"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* CORE TIMELINE PROGRESS BLOCK */}
      {!isTerminated ? (
        <div className="relative flex justify-between items-center mb-10 px-4 pt-4">
          <div className="absolute left-10 right-10 top-[38px] h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
          <div 
            className="absolute left-10 top-[38px] h-1 bg-[#217A6E] -z-10 -translate-y-1/2 transition-all duration-500 ease-out" 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>

          <StepItem icon={<Clock className="w-4 h-4" />} label="Placed" active={currentStep >= 0} />
          <StepItem icon={<Package className="w-4 h-4" />} label="Packaging" active={currentStep >= 1} />
          <StepItem icon={<Truck className="w-4 h-4" />} label="Transit" active={currentStep >= 2} />
          <StepItem icon={<CheckCircle2 className="w-4 h-4" />} label="Delivered" active={currentStep >= 3} />
        </div>
      ) : (
        <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>This lifecycle process has terminated. The current database classification records state: <strong>{data.orderStatus}</strong>.</span>
        </div>
      )}

      {/* RENDER FORK: API TIMELINE VS ROUTING BYPASS */}
      {!isManualBypass ? (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider mb-4">Carrier Tracking Activity History</h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {data.liveTracking.tracking_data.shipment_track.map((track: any, idx: number) => (
              <div key={idx} className="flex gap-4 text-sm border-l-2 border-[#217A6E]/30 pl-4 ml-2 relative group pb-1">
                <div className="absolute w-2 h-2 rounded-full bg-gray-300 -left-[5px] top-1.5 group-first:bg-[#217A6E] transition-colors"></div>
                <div className="min-w-[140px] text-gray-400 text-xs font-medium pt-0.5">
                  {track.date ? new Date(track.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "N/A"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{track.activity || "Checkpoint scan processed"}</p>
                  {track.location && <p className="text-gray-500 text-xs mt-0.5">Hub Destination: {track.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center max-w-xl mx-auto">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 text-base">Direct Enterprise Fulfilment Network</h4>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            This order bypasses the multi-courier API aggregators and is handled directly by our internal delivery fleet or direct manual scheduling layers.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Status updates route via transactional logs instantly to the ledger stepper timeline above.
          </p>
          
          {data.shipmentDetails?.trackingUrl && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <a 
                href={data.shipmentDetails.trackingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-sm text-[#217A6E] font-semibold hover:text-[#004d3d] hover:underline transition-all"
              >
                Access Vendor Manifest Link <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Internal Stepper Sub-component
function StepItem({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center bg-white z-10 px-2">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 mb-2 shadow-sm transition-all duration-300 ${
        active 
          ? "border-[#217A6E] bg-[#217A6E] text-white" 
          : "border-gray-200 bg-gray-50 text-gray-400"
      }`}>
        {icon}
      </div>
      <span className={`text-xs font-bold transition-colors duration-300 ${active ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}