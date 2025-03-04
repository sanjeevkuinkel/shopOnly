import { Product } from "../models/product.model.js";

export const calculateProductSales = async (orders, sellerId) => {
  const productBreakdown = {};

  for (const order of orders) {
    for (const item of order.items) {
      // Skip items that don't belong to the seller (if sellerId is provided)
      const product = await Product.findById(item.productId);
      if (sellerId && product.sellerId.toString() !== sellerId.toString()) {
        continue;
      }

      // Use the populated product name
      const productName = product?.name || "Unknown Product";

      if (!productBreakdown[productName]) {
        productBreakdown[productName] = {
          quantity: 0,
          revenue: 0,
          unitPrice: item.price,
        };
      }
      productBreakdown[productName].quantity += item.quantity;
      productBreakdown[productName].revenue += item.price * item.quantity;
    }
  }

  return productBreakdown;
};
