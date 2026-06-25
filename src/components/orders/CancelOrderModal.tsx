// components/orders/CancelOrderModal.tsx
'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes?: string }) => Promise<void>;
  orderId: string;
  isLoading?: boolean;
}

const CANCEL_REASONS = [
  'Changed my mind',
  'Order placed by mistake',
  'Found better price elsewhere',
  'Delivery time too long',
  'Product no longer needed',
  'Other',
];

export function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  isLoading = false,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        reason: selectedReason,
        notes: notes.trim() || undefined,
      });
      // Reset form on success
      setSelectedReason('');
      setNotes('');
      toast.success('Order cancelled successfully');
    } catch (error) {
      // Error handled by parent
      console.error('Cancellation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isProcessing = isSubmitting || isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Cancel Order</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isProcessing}
            type="button"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
              required
              disabled={isProcessing}
            >
              <option value="">Select a reason</option>
              {CANCEL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-shadow"
              placeholder="Any additional information..."
              disabled={isProcessing}
            />
          </div>

          {/* Warning */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-semibold">Note:</p>
              <p>
                Cancelling this order will {orderId.includes('COD') ? 'remove it from processing' : 'initiate a refund'}.
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={isProcessing}
            >
              Keep Order
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedReason || isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Confirm Cancellation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}