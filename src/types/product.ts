export interface APlusBlock {
  type: 'banner' | 'split' | 'image_grid'; // Added grid for WOW style callouts
  imageUrl?: string;
  images?: string[]; // For grids
  title?: string;
  text?: string;
  align?: 'left' | 'right';
  link?: string;
}

export interface HomepageConfig {
  sectionsOrder: Array<{
    id: string;
    type: 'HERO' | 'CATEGORIES' | 'FEATURED_PRODUCTS' | 'BUNDLE_BUILDER' | 'TRUST_BADGES';
    settings: any;
  }>;
}



export interface ProductExtra {
  safetyInfo?: string;
  ingredients?: string;
  directions?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  aPlusContent?: APlusBlock[];
}




// src/types/product.ts




export interface SelectedVariant {
  variant: ProductVariant;
  quantity: number;
}


// src/types/product.ts (ADD THIS TYPE)
export interface ProductVariant {
  id: string;
  productId: string;
  storeId: string;
  sku: string;
  name: string;
  optionType?: string;
  optionValue?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  shippingWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// This is the full Product type from your schema
export interface Product {
  id: string;
  storeId: string;
  name: string;
  subtitle?: string;
  slug: string;
  description?: string;
  images: string[];
  isCodEnabled: boolean;
  ingredients?: string;
  careInstructions: string[];
  deliveryInfo: string[];
  categoryId?: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  variants: ProductVariant[];
  highlights: any[];
  attributes: any[];
  seoTitle?: string;
  seoDescription?: string;
}

// NEW: Type for modal product (subset of Product)
export interface ModalProduct {
  id: string;
  name: string;
  subtitle?: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  isCodEnabled: boolean;
  variants?: ProductVariant[];
}