// components/orders/ReturnRequestModal.tsx
'use client';

import { useState } from 'react';
import { X, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; comments?: string }) => Promise<void>;
  orderId: string;
  isLoading?: boolean;
}

const RETURN_REASONS = [
  'Product damaged',
  'Wrong item received',
  'Product not as described',
  'Size/color not suitable',
  'Defective product',
  'Changed my mind',
  'Other',
];

export function ReturnRequestModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  isLoading = false,
}: ReturnRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      toast.error('Please select a reason for return');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        reason: selectedReason,
        comments: comments.trim() || undefined,
      });
      // Reset form on success
      setSelectedReason('');
      setComments('');
      toast.success('Return request submitted successfully');
    } catch (error) {
      // Error handled by parent
      console.error('Return request failed:', error);
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
          <h2 className="text-lg font-bold text-gray-900">Request Return</h2>
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
              Return Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              required
              disabled={isProcessing}
            >
              <option value="">Select a reason</option>
              {RETURN_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
              placeholder="Describe any issues or provide additional details..."
              disabled={isProcessing}
            />
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">Note:</p>
              <p>
                Your return request will be reviewed by our team. You'll receive a refund 
                once the return is approved and processed.
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
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedReason || isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Return Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}