export const calculateProfitability = (products) => {
  return products.map((product) => {
    const grossProfit = product.price - product.costPrice;
    const profitMargin = (grossProfit / product.price) * 100;

    return {
      ...product.toObject(), // Include all product fields
      grossProfit,
      profitMargin,
    };
  });
};
