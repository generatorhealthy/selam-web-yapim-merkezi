// İyzico checkoutform için ödeme talep yapısı
const requestBody = {
  locale: "tr",
  conversationId: conversationId, // Örneğin: "ORDER123456"
  price: packagePrice.toFixed(2),     // "2998.00"
  paidPrice: packagePrice.toFixed(2), // "2998.00"
  currency: "TRY",
  basketId: conversationId,
  paymentGroup: "PRODUCT",

  // Sadece kullanıcı yönlendirmesi için anasayfa
  callbackUrl: "https://doktorumol.com.tr",

  enabledInstallments: [1, 2, 3, 6, 9],

  buyer: {
    id: customerData.id || "BY789",
    name: customerData.name || "John",
    surname: customerData.surname || "Doe",
    identityNumber: customerData.tcNo
      ? customerData.tcNo.toString().padStart(11, "0")
      : "74300864791",
    email: customerData.email || "email@email.com",
    gsmNumber: customerData.phone
      ? customerData.phone.startsWith("+90")
        ? customerData.phone
        : `+90${customerData.phone.replace(/^0/, "")}`
      : "+905350000000",
    registrationDate: customerData.registrationDate || "2023-01-01 12:00:00",
    lastLoginDate: customerData.lastLoginDate || "2024-07-25 12:00:00",
    registrationAddress: customerData.address || "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
    city: customerData.city || "Istanbul",
    country: "Turkey",
    zipCode: customerData.zipCode || "34732",
    ip: getClientIP() || "194.59.166.153"
  },

  shippingAddress: {
    address: customerData.address || "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
    zipCode: customerData.zipCode || "34742",
    contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
    city: customerData.city || "Istanbul",
    country: "Turkey"
  },

  billingAddress: {
    address: customerData.address || "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
    zipCode: customerData.zipCode || "34742",
    contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
    city: customerData.city || "Istanbul",
    country: "Turkey"
  },

  basketItems: [
    {
      id: "BI101",
      name: `${packageType} Paketi`, // örnek: "Premium Paketi"
      category1: "Danışmanlık",
      category2: "Üyelik",
      itemType: "VIRTUAL",
      price: packagePrice.toFixed(2) // "2998.00"
    }
  ]
};
