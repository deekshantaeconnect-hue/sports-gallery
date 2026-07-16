// src\utils\gst.ts

export const GST_RATE = 0.18;

// Price WITHOUT GST (base price)
export const removeGST = (price: number) => {
  if (!price) return 0;
  return Math.round(price / (1 + GST_RATE));
};

// GST amount from GST-INCLUSIVE price
export const getGSTAmount = (price: number) => {
  if (!price) return 0;
  const base = removeGST(price);
  return price - base;
};

// Price WITH GST (final)
export const addGST = (basePrice: number) => {
  if (!basePrice) return 0;
  return Math.round(basePrice * (1 + GST_RATE));
};