import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import UserActivityLog from "../models/user.activity.model.js   ";
import { analyzeCustomerSales } from "./analyzeCustomerSales.js";
import { analyzeTopCustomerSegments } from "./analyzeTopCustomerSegments.js";

const generateSalesReport = async (userId) => {
  const orders = await Order.find({ userId, status: "completed" }).populate(
    "items.productId",
    "name price"
  );

  let totalRevenue = 0;
  let totalProductsSold = 0;
  const productBreakdown = {};

  for (const order of orders) {
    for (const item of order.items) {
      const product = item.productId;
      const productId = product._id.toString();
      const quantity = item.quantity;
      const revenue = item.price * quantity;

      totalRevenue += revenue;
      totalProductsSold += quantity;

      if (!productBreakdown[productId]) {
        productBreakdown[productId] = {
          name: product.name,
          quantitySold: 0,
          revenue: 0,
        };
      }
      productBreakdown[productId].quantitySold += quantity;
      productBreakdown[productId].revenue += revenue;
    }
  }

  return {
    totalRevenue,
    totalProductsSold,
    productBreakdown,
  };
};

const generateInventoryReport = async (userId) => {
  const products = await Product.find({ sellerId: userId });

  const inventorySummary = products.map((product) => ({
    name: product.name,
    quantity: product.quantity,
    lowStock: product.quantity < 10,
  }));

  return {
    totalProducts: products.length,
    inventorySummary,
  };
};

const generateUserActivityReport = async (userId) => {
  const activityLogs = await UserActivityLog.find({ userId }).sort({
    timestamp: -1,
  });

  const recentActivities = activityLogs.slice(0, 10).map((log) => ({
    action: log.action,
    timestamp: log.timestamp,
  }));

  return {
    totalActivities: activityLogs.length,
    recentActivities,
  };
};

export const generateReport = async (userId, reportType) => {
  switch (reportType) {
    case "sales":
      return await generateSalesReport(userId);
    case "inventory":
      return await generateInventoryReport(userId);
    case "userActivity":
      return await generateUserActivityReport(userId);
    case "customerAnalysis":
      const customerSales = await analyzeCustomerSales(userId);
      const topSegments = await analyzeTopCustomerSegments(userId);
      return { customerSales, topSegments };
    default:
      throw new Error("Invalid report type.");
  }
};
