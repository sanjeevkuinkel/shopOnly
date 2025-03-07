export const categorizeProducts = (products, threshold = 30) => {
  return products.map((product) => {
    const marginCategory =
      product.profitMargin > threshold ? "High-Margin" : "Low-Margin";

    return {
      ...product,
      marginCategory, // Add marginCategory without overwriting category
    };
  });
};
