// utils/order-actions.ts
export const ORDER_ACTIONS = {
  CANCEL: 'cancel',
  RETURN: 'return',
  NONE: 'none',
} as const;

export type OrderAction = typeof ORDER_ACTIONS[keyof typeof ORDER_ACTIONS];

export function getOrderAction(status: string): OrderAction {
  const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
  const returnableStatuses = ['DELIVERED'];
  
  if (cancellableStatuses.includes(status)) {
    return ORDER_ACTIONS.CANCEL;
  }
  
  if (returnableStatuses.includes(status)) {
    return ORDER_ACTIONS.RETURN;
  }
  
  return ORDER_ACTIONS.NONE;
}

export function canCancel(status: string): boolean {
  return ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(status);
}

export function canReturn(status: string): boolean {
  return status === 'DELIVERED';
}

export function isOrderTerminal(status: string): boolean {
  return ['CANCELLED', 'RETURNED'].includes(status);
}

export function getStatusDisplayInfo(status: string): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  const statusMap: Record<string, any> = {
    PENDING: {
      label: 'Pending',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    CONFIRMED: {
      label: 'Confirmed',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    PROCESSING: {
      label: 'Processing',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    SHIPPED: {
      label: 'Shipped',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    DELIVERED: {
      label: 'Delivered',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    RETURNED: {
      label: 'Returned',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
  };

  return statusMap[status] || {
    label: status,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  };
}