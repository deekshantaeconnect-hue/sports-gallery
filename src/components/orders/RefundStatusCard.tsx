// components/orders/RefundStatusCard.tsx
'use client';

import type { ReactNode } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  CreditCard,
  ArrowRight,
  Loader2,
  Ban,
  PlayCircle,
  Circle,
  CheckCheck,
  Truck,
  PackageCheck
} from 'lucide-react';
import { RefundStatusResponse } from '@/services/order.service';

interface RefundTimelineStep {
  label: string;
  completed: boolean;
  date?: string;
}

interface RefundStatusCardProps {
  refundStatus: RefundStatusResponse | null;
  isLoading?: boolean;
}

export function RefundStatusCard({ refundStatus, isLoading = false }: RefundStatusCardProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse bg-white rounded-2xl border border-gray-200 p-6">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!refundStatus || !refundStatus.hasRefund) {
    // Check if there's a return in progress
    if (refundStatus?.hasReturn) {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-400" />
              Return Status
            </h3>
            <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-blue-50 border-blue-200 text-blue-700">
              {refundStatus.returnStatusDisplay || 'In Progress'}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Your return is being processed.</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Return #{refundStatus.returnNumber?.slice(-6).toUpperCase() || 'N/A'}
            </p>
            {refundStatus.messages && refundStatus.messages.length > 0 && (
              <div className="mt-3 space-y-1">
                {refundStatus.messages.map((msg, idx) => (
                  <p key={idx} className="text-sm text-gray-600">{msg}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // No refund and no return
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            Refund Status
          </h3>
          <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-gray-50 border-gray-200 text-gray-600">
            Not Applicable
          </span>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">No refund is applicable for this order.</p>
        </div>
      </div>
    );
  }

  const { refundDetails, messages, refundStatus: status, orderStatus, timeline, returnStatus, returnStatusDisplay } = refundStatus as RefundStatusResponse & {
    timeline?: RefundTimelineStep[];
  };

  // Map status to display info
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { icon: React.ReactNode; color: string; label: string; progress: number }> = {
      'NOT_APPLICABLE': {
        icon: <Ban className="h-5 w-5 text-gray-500" />,
        color: 'bg-gray-50 border-gray-200 text-gray-700',
        label: 'Not Applicable',
        progress: 0,
      },
      'NOT_STARTED': {
        icon: <Circle className="h-5 w-5 text-gray-400" />,
        color: 'bg-gray-50 border-gray-200 text-gray-600',
        label: 'Ready for Refund',
        progress: 0,
      },
      'INITIATED': {
        icon: <PlayCircle className="h-5 w-5 text-blue-600" />,
        color: 'bg-blue-50 border-blue-200 text-blue-700',
        label: 'Initiated',
        progress: 33,
      },
      'PROCESSING': {
        icon: <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />,
        color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        label: 'Processing',
        progress: 66,
      },
      'PENDING': {
        icon: <Clock className="h-5 w-5 text-amber-600" />,
        color: 'bg-amber-50 border-amber-200 text-amber-700',
        label: 'Pending Review',
        progress: 33,
      },
      'APPROVED': {
        icon: <CheckCircle className="h-5 w-5 text-blue-600" />,
        color: 'bg-blue-50 border-blue-200 text-blue-700',
        label: 'Approved',
        progress: 50,
      },
      'PROCESSED': {
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        label: 'Processed',
        progress: 100,
      },
      'COMPLETED': {
        icon: <CheckCheck className="h-5 w-5 text-emerald-600" />,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        label: 'Completed',
        progress: 100,
      },
      'REJECTED': {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        color: 'bg-red-50 border-red-200 text-red-700',
        label: 'Rejected',
        progress: 0,
      },
      'FAILED': {
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        color: 'bg-red-50 border-red-200 text-red-700',
        label: 'Failed',
        progress: 0,
      },
      'CANCELLED': {
        icon: <Ban className="h-5 w-5 text-gray-500" />,
        color: 'bg-gray-50 border-gray-200 text-gray-600',
        label: 'Cancelled',
        progress: 0,
      },
    };

    return statusMap[status] || statusMap['NOT_APPLICABLE'];
  };

  const statusInfo = getStatusInfo(status);
  const statusDisplay = refundDetails?.statusDisplay || statusInfo.label;

  // Calculate progress based on timeline
  const progress = timeline ? Math.min((timeline.filter((t: RefundTimelineStep) => t.completed).length / Math.max(timeline.length, 1)) * 100, 100) : statusInfo.progress;

  // Check if return is closed and refund is ready
  const isReturnClosed = returnStatus === 'CLOSED';
  const isRefundReady = status === 'NOT_STARTED' || status === 'PENDING';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          {isReturnClosed && isRefundReady ? 'Refund Ready' : 'Refund Status'}
        </h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusInfo.color}`}>
          {statusDisplay}
        </span>
      </div>

      {/* Show Return Closed banner */}
      {isReturnClosed && isRefundReady && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-700">
              Return completed successfully! Refund is ready to be initiated.
            </p>
          </div>
        </div>
      )}

      {/* Show Return Status banner if return is in progress */}
      {returnStatus && returnStatus !== 'CLOSED' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              Return Status: <span className="font-semibold">{returnStatusDisplay}</span>
            </p>
          </div>
        </div>
      )}

      {/* Timeline Steps */}
      {timeline && timeline.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            {timeline.map((step, index) => (
              <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
                <div className="relative">
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300" />
                  )}
                  {index < timeline.length - 1 && (
                    <div className={`absolute top-4 left-1/2 -ml-px h-4 w-0.5 ${step.completed ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
                <span className={`text-sm ${step.completed ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.label}
                  {step.date && step.completed && (
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar - Show for active refund statuses */}
      {!['NOT_APPLICABLE', 'NOT_STARTED', 'REJECTED', 'FAILED', 'CANCELLED'].includes(status) && progress > 0 && (
        <div className="mb-4">
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Initiated</span>
            <span>Processing</span>
            <span>Completed</span>
          </div>
        </div>
      )}

      {/* Refund Details */}
      {refundDetails && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Refund Amount</span>
            <span className="font-bold text-gray-900">
              {refundDetails.amountDisplay || `₹${refundDetails.amount?.toFixed(2) || '0.00'}`}
            </span>
          </div>

          {refundDetails.gatewayRefundId && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Reference Number</span>
              <span className="font-mono text-xs text-gray-700">
                {refundDetails.gatewayRefundId}
              </span>
            </div>
          )}

          {refundDetails.createdAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Request Date</span>
              <span className="text-gray-700">
                {new Date(refundDetails.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {['COMPLETED', 'PROCESSED'].includes(status) && refundDetails.updatedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Completed Date</span>
              <span className="text-gray-700">
                {new Date(refundDetails.updatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {messages && messages.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          {messages.map((message, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
              {statusInfo.icon}
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action link for pending/active refunds */}
      {['PENDING', 'INITIATED', 'APPROVED', 'PROCESSING', 'NOT_STARTED'].includes(status) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            onClick={() => window.location.href = '/support'}
          >
            Need help? Contact Support
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Failed refund state */}
      {status === 'FAILED' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">
              Your refund could not be processed. Our support team has been notified and will assist you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}