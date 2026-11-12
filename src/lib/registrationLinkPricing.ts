export const registrationLinkPricing = {
  price: 5000,
  originalPrice: 8500,
};

export const registrationLinkDiscountPercent = Math.round(
  (1 - registrationLinkPricing.price / registrationLinkPricing.originalPrice) * 100,
);