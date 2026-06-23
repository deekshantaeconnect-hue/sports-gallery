// components/orders/RefundStatusCard.tsx
'use client';

import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { RefundStatusResponse } from '@/services/order.service';

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
    return null;
  }

  const { refundDetails, messages, refundStatus: status, orderStatus } = refundStatus;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'APPROVED':
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'PENDING':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'APPROVED':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusProgress = (status: string): number => {
    switch (status) {
      case 'NOT_APPLICABLE': return 0;
      case 'PENDING': return 25;
      case 'APPROVED': return 50;
      case 'PROCESSED': return 100;
      case 'REJECTED': return 0;
      case 'FAILED': return 0;
      default: return 0;
    }
  };

  const statusDisplay = refundDetails?.statusDisplay || status || 'Unknown';
  const progress = getStatusProgress(status);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          Refund Status
        </h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
          {statusDisplay}
        </span>
      </div>

      {/* Progress Bar */}
      {status !== 'NOT_APPLICABLE' && status !== 'REJECTED' && status !== 'FAILED' && (
        <div className="mb-4">
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
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
              {refundDetails.amountDisplay}
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

          {refundDetails.processedBy && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Processed By</span>
              <span className="text-gray-700 capitalize">
                {refundDetails.processedBy === 'system' ? 'System' : refundDetails.processedBy}
              </span>
            </div>
          )}

          {refundDetails.createdAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Request Date</span>
              <span className="text-gray-700">
                {new Date(refundDetails.createdAt).toLocaleDateString('en-IN', {
                  dateStyle: 'medium',
                })}
              </span>
            </div>
          )}

          {refundDetails.updatedAt && status === 'PROCESSED' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Processed Date</span>
              <span className="text-gray-700">
                {new Date(refundDetails.updatedAt).toLocaleDateString('en-IN', {
                  dateStyle: 'medium',
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
              {getStatusIcon(status)}
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Order status note */}
      {orderStatus === 'CANCELLED' && status === 'NOT_APPLICABLE' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            This order was cancelled. Refund status: Not Applicable.
          </p>
        </div>
      )}

      {/* Action link for pending refunds */}
      {status === 'PENDING' && (
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
    </div>
  );
}