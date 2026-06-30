// src/types/errors.ts
export class CartError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly metadata?: Record<string, any>;
  public readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    metadata?: Record<string, any>,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'CartError';
    this.code = code;
    this.userMessage = userMessage;
    this.metadata = metadata;
    this.retryable = retryable;
  }
}

export class VariantError extends CartError {
  constructor(message: string, userMessage: string, metadata?: Record<string, any>) {
    super('VARIANT_ERROR', message, userMessage, metadata, false);
    this.name = 'VariantError';
  }
}

export class InventoryError extends CartError {
  constructor(
    message: string,
    userMessage: string,
    public readonly availableStock: number,
    public readonly requestedQuantity: number,
    metadata?: Record<string, any>
  ) {
    super('INVENTORY_ERROR', message, userMessage, metadata, false);
    this.name = 'InventoryError';
  }
}

export class NetworkError extends CartError {
  constructor(message: string = 'Network error occurred') {
    super('NETWORK_ERROR', message, 'Network connection issue. Please try again.', undefined, true);
    this.name = 'NetworkError';
  }
}